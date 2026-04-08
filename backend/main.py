from fastapi import FastAPI, HTTPException, UploadFile, File, Form, WebSocket
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pydantic import BaseModel
from config.database import init_db, close_db
from services.interview_services import InterviewService
from models.interview_schema import InterviewReport
from services.pdf_service import extract_text_from_pdf, generate_interview_pdf
from services.llm_service import get_ai_response, get_hint, evaluate_answer, generate_interview_feedback, generate_study_roadmap
from services.tts_service import generate_audio
from services.video_service import process_video_frame, Stabilizer
from services.resume_analyzer import analyze_resume, build_compact_summary
from services.interview_planner import generate_interview_plan, generate_topic_plan
from services.tts_service import generate_audio as generate_tts_audio # Rename to avoid conflict if needed
from services.interview_state import InterviewState
from services.report_generator import generate_report
from services.logic_validator import validate_logic
from services.speech_analyzer import analyze_speech_confidence
from services.weakness_engine import calculate_weakness_scores, detect_repeated_patterns, classify_topics
import asyncio
import threading
import json
import base64
import time
import traceback
import os
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Lifespan context manager with error handling
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize database
    try:
        print("[...] Initializing database...")
        await init_db()
        print("[OK] Database initialized successfully")
    except Exception as e:
        print(f"[ERROR] Database initialization failed: {e}")
        print(f"Error details: {type(e).__name__}")
        import traceback
        traceback.print_exc()
    
    yield
    
    # Shutdown: Close database connections
    try:
        print("[...] Closing database connections...")
        await close_db()
        print("[OK] Database connections closed")
    except Exception as e:
        print(f"[WARN] Error closing database: {e}")

# Initialize FastAPI with lifespan
app = FastAPI(
    title="HireByte API",
    description="Mock Interview Platform API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:9000", "http://127.0.0.1:5173", "http://127.0.0.1:3000", "http://127.0.0.1:9000"],  # Update for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global camera state
camera = None
camera_lock = threading.Lock()
camera_active = False

session_data = {
    "resume_text": "",           # Raw text (kept for hints)
    "job_description": "",
    "candidate_profile": None,   # Structured profile from resume_analyzer
    "candidate_summary": "",     # Compact summary for LLM prompts
    "interview_plan": None,      # Fixed plan from interview_planner
    "interview_state": None,     # InterviewState tracker instance
    "transcript": [],            # Stores {"role": "user"|"ai", "content": "..."}
    "video_metrics": [],         # Stores {"timestamp": float, "focus": int, "emotion": int, "confidence": int}
    "answer_scores": []          # Stores per-answer evaluation scores
}

class HintRequest(BaseModel):
    question: str
    level: str = "medium"  # small, medium, or full

class TopicInterviewRequest(BaseModel):
    topic: str  # AI_ML, DSA, or WEB_DEV
    difficulty: str = "medium"  # easy, medium, or hard

# Health check endpoints
@app.get("/")
async def root():
    return {
        "message": "HireByte API is running!",
        "status": "healthy",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "ok", "database": "connected"}

@app.post("/get-hint")
async def get_interview_hint(request: HintRequest):
    if not session_data["resume_text"]:
        return {"hint": "Please upload a resume first."}
    
    state = session_data.get("interview_state")
    q_index = state.total_questions_asked if state else 0
    
    # Feature 1: Progressive hint enforcement
    if state:
        available_level = state.get_available_hint_level(q_index)
        if available_level is None:
            return {
                "hint": "You've used all hint levels for this question. Try your best!",
                "level_used": "exhausted",
                "available_level": None,
                "topic": state.question_topics.get(q_index, "GENERAL")
            }
        # Use the progressive level instead of requested level
        level = available_level
    else:
        level = request.level
    
    # Feature 1: Detect question topic
    # Use the topic from the interview state (which comes from the plan)
    if state and q_index in state.question_topics:
        topic = state.question_topics[q_index]
    else:
        topic = "General"
    
    if state:
        state.question_topics[q_index] = topic
    
    hint = await get_hint(request.question, session_data["resume_text"], 
                          session_data["job_description"], level, topic)
    
    # Record hint usage
    if state:
        state.record_hint_used(q_index, level)
    
    # Calculate next available level
    next_level = state.get_available_hint_level(q_index) if state else None
    
    return {
        "hint": hint, 
        "level_used": level,
        "available_level": next_level,
        "topic": topic
    }

@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...), job_description: str = Form(...)):
    pdf_bytes = await file.read()
    text = extract_text_from_pdf(pdf_bytes)
    session_data["resume_text"] = text
    session_data["job_description"] = job_description
    session_data["transcript"] = []
    session_data["video_metrics"] = []
    session_data["answer_scores"] = []
    
    # Structured resume analysis (runs once at upload)
    profile = await analyze_resume(text, job_description)
    session_data["candidate_profile"] = profile
    session_data["candidate_summary"] = build_compact_summary(profile)
    
    # Generate interview plan
    plan = await generate_interview_plan(profile, job_description)
    session_data["interview_plan"] = plan
    session_data["interview_state"] = None  # Will be created at WebSocket connect
    
    print(f"[Resume Analyzer] Profile: {json.dumps(profile, indent=2)[:500]}")
    print(f"[Interview Planner] Plan: {json.dumps(plan, indent=2)[:500]}")
    
    return {
        "message": "Data processed successfully!",
        "profile_summary": session_data["candidate_summary"],
        "interview_plan": {
            "total_questions": plan.get("total_questions", 10),
            "categories": [c["name"] for c in plan.get("categories", [])],
            "difficulty": plan.get("difficulty_baseline", "medium")
        }
    }

@app.post("/start-topic-interview")
async def start_topic_interview(request: TopicInterviewRequest):
    """Start a topic-based interview (no resume needed)."""
    valid_topics = ["AI_ML", "DSA", "WEB_DEV"]
    if request.topic not in valid_topics:
        raise HTTPException(status_code=400, detail=f"Invalid topic. Must be one of: {valid_topics}")
    
    difficulty = request.difficulty if request.difficulty in ("easy", "medium", "hard") else "medium"
    
    # Reset session for topic mode
    session_data["resume_text"] = ""
    session_data["job_description"] = ""
    session_data["difficulty"] = difficulty
    session_data["interview_topic"] = request.topic
    session_data["candidate_profile"] = None
    session_data["candidate_summary"] = ""
    session_data["transcript"] = []
    session_data["video_metrics"] = []
    session_data["answer_scores"] = []
    
    # Generate topic-specific plan (no LLM call needed)
    plan = generate_topic_plan(request.topic, difficulty)
    session_data["interview_plan"] = plan
    session_data["interview_state"] = None  # Will be created at WebSocket connect
    
    topic_labels = {"AI_ML": "AI / Machine Learning", "DSA": "Data Structures & Algorithms", "WEB_DEV": "Web Development"}
    
    print(f"[Topic Interview] Topic: {request.topic}, Difficulty: {difficulty}")
    print(f"[Interview Planner] Plan: {json.dumps(plan, indent=2)[:500]}")
    
    return {
        "message": f"{topic_labels[request.topic]} interview ready!",
        "interview_plan": {
            "total_questions": plan.get("total_questions", 9),
            "categories": [c["name"] for c in plan.get("categories", [])],
            "difficulty": difficulty,
            "topic": request.topic,
            "topic_label": topic_labels[request.topic]
        }
    }

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    temp_path = "temp_voice.wav"
    with open(temp_path, "wb") as buffer:
        buffer.write(await file.read())
    
    try:
        with open(temp_path, "rb") as audio_file:
            transcript = await client.audio.transcriptions.create(
                model="whisper-1", 
                file=audio_file,
                language="en", # Forces English to stop the Korean hallucinations
                prompt="Technical interview conversation about software development." # Contextual hint
            )
        
        # Filter out "hallucinations" (very short or nonsense noise)
        text = transcript.text.strip()
        if len(text) < 2: 
            return {"text": ""} # Return empty so the AI doesn't reply to a 'noise' message
            
        return {"text": text}
        
    except Exception as e:
        print(f"Transcription error: {e}")
        return {"text": ""}
        
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.websocket("/ws/interview")
async def interview_websocket(websocket: WebSocket):
    await websocket.accept()
    
    chat_history = []
    
    # Initialize interview state from the plan
    plan = session_data.get("interview_plan")
    if plan:
        state = InterviewState(plan)
        session_data["interview_state"] = state
    else:
        state = None
    
    # 1. Opening — use the structured plan for the first question
    # Works in both resume mode (candidate_summary set) and topic mode (interview_topic set)
    if session_data["candidate_summary"] or session_data.get("interview_topic"):
        interview_context = state.to_context_string() if state else ""
        
        response_text = await get_ai_response(
            session_data["candidate_summary"],
            session_data["job_description"],
            chat_history,
            interview_context,
            session_data.get("interview_topic", "")
        )
        
        # Track the question for evaluation later
        if state:
            state.current_question_text = response_text
            # Feature 3: Mark question timing
            state.mark_question_asked(state.total_questions_asked)
            # Feature 1: Use topic from the plan
            step = state.get_current_step()
            topic = step["topic"] if step else "General"
            state.question_topics[state.total_questions_asked] = topic
        
        chat_history.append({"role": "assistant", "content": response_text})
        session_data["transcript"].append({"role": "ai", "content": response_text})
        
        audio_bytes = generate_audio(response_text)
        audio_b64 = base64.b64encode(audio_bytes).decode('utf-8') if audio_bytes else None
        
        await websocket.send_json({
            "type": "ai_turn",
            "text": response_text,
            "audio": audio_b64
        })

    # 2. Conversation Loop with plan tracking + answer evaluation
    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            
            if msg["type"] == "user_turn":
                try:
                    user_text = msg["text"]
                    
                    # Feature 4: Extract speech timing from client
                    speech_duration = msg.get("duration", 0)  # seconds of speaking
                    silence_duration = msg.get("silence_duration", 0)  # pause before speaking
                    
                    chat_history.append({"role": "user", "content": user_text})
                    session_data["transcript"].append({"role": "user", "content": user_text})
                    
                    # Feature 3: Mark answer time
                    if state:
                        state.mark_question_answered(state.total_questions_asked)
                    
                    # Feature 1: Get topic for next question from plan
                    step = state.get_current_step()
                    current_topic = state.question_topics.get(state.total_questions_asked, "GENERAL")
                    
                    # Generate next question context
                    interview_context = state.to_context_string() if state else ""
                    
                    # Create tasks for parallel execution
                    eval_task = None
                    logic_task = None
                    ai_response_task = asyncio.create_task(get_ai_response(
                        session_data["candidate_summary"],
                        session_data["job_description"],
                        chat_history,
                        interview_context,
                        session_data.get("interview_topic", "")
                    ))
                    
                    if state and state.current_question_text and not state.is_complete:
                        if step:
                            # Feature 2: Logic validation & Evaluation
                            eval_task = asyncio.create_task(evaluate_answer(
                                question=state.current_question_text,
                                answer=user_text,
                                category=step["category_name"],
                                topic=step["topic"],
                                candidate_summary=session_data["candidate_summary"],
                                job_desc=session_data["job_description"]
                            ))
                            logic_task = asyncio.create_task(validate_logic(
                                question=state.current_question_text,
                                answer=user_text,
                                topic=current_topic,
                                chat_history=chat_history
                            ))

                    # Wait for AI response first to reduce latency
                    try:
                        ai_reply = await ai_response_task
                    except Exception as e:
                        print(f"AI Generation Error: {e}")
                        ai_reply = "I'm having trouble thinking of a response. Let's continue."

                    # Send AI response immediately
                    chat_history.append({"role": "assistant", "content": ai_reply})
                    session_data["transcript"].append({"role": "ai", "content": ai_reply})
                    
                    audio_bytes = generate_audio(ai_reply)
                    audio_b64 = base64.b64encode(audio_bytes).decode('utf-8') if audio_bytes else None
                    
                    await websocket.send_json({
                        "type": "ai_turn",
                        "text": ai_reply,
                        "audio": audio_b64
                    })

                    # Process evaluation results in background (or await them now without blocking UI)
                    if eval_task and logic_task:
                        try:
                            scores, logic_result = await asyncio.gather(eval_task, logic_task)
                            
                            # Record the score
                            state.record_score(
                                question=state.current_question_text,
                                answer=user_text,
                                category=step["category_name"],
                                topic=step["topic"],
                                accuracy=scores["accuracy"],
                                depth=scores["depth"],
                                clarity=scores["clarity"]
                            )
                            session_data["answer_scores"].append({
                                "question": state.current_question_text,
                                "answer": user_text,
                                "category": step["category_name"],
                                "scores": scores
                            })
                            print(f"[Evaluation] Q{state.total_questions_asked}: accuracy={scores['accuracy']}, depth={scores['depth']}, clarity={scores['clarity']}")
                            
                            # Send logic feedback if issue found
                            if logic_result and logic_result.get("has_issue"):
                                state.record_logical_error(
                                    question_index=state.total_questions_asked,
                                    issue_type=logic_result["issue_type"],
                                    feedback=logic_result["feedback"],
                                    severity=logic_result["severity"]
                                )
                                # Send logic feedback asynchronously
                                await websocket.send_json({
                                    "type": "logic_feedback",
                                    "issue_type": logic_result["issue_type"],
                                    "feedback": logic_result["feedback"],
                                    "severity": logic_result["severity"]
                                })
                                print(f"[Logic Validator] {logic_result['severity'].upper()}: {logic_result['feedback']}")
                                
                            # Advance the plan
                            state.advance()
                            
                        except Exception as e:
                            print(f"Evaluation Error: {e}")

                    # Feature 4: Speech confidence analysis
                    try:
                        speech_analysis = analyze_speech_confidence(
                            text=user_text,
                            duration_seconds=speech_duration,
                            silence_duration=silence_duration
                        )
                        
                        if speech_analysis["confidence_level"] != "high" or speech_analysis["long_silence"]:
                            await websocket.send_json({
                                "type": "speech_feedback",
                                "wpm": speech_analysis["wpm"],
                                "pace": speech_analysis["pace"],
                                "filler_count": speech_analysis["filler_count"],
                                "confidence_level": speech_analysis["confidence_level"],
                                "long_silence": speech_analysis["long_silence"],
                                "feedback": speech_analysis["feedback"]
                            })
                            print(f"[Speech Analyzer] {speech_analysis['confidence_level']}: {speech_analysis['feedback']}")
                    except Exception as e:
                        print(f"Speech Analysis Error: {e}")
                    
                    # Track this question for next evaluation
                    if state:
                        state.current_question_text = ai_reply
                        state.mark_question_asked(state.total_questions_asked)
                        next_step = state.get_current_step()
                        next_topic = next_step["topic"] if next_step else "General"
                        state.question_topics[state.total_questions_asked] = next_topic

                except Exception as processing_error:
                    print(f"Error processing message: {processing_error}")
                    traceback.print_exc()
                    # Send a fallback message to keep the UI alive
                    await websocket.send_json({
                        "type": "ai_turn",
                        "text": "I'm having a little trouble processing that. Could you say it again?",
                        "audio": None
                    })

    except Exception as e:
        print(f"WebSocket closed or error: {e}")
        traceback.print_exc()

@app.websocket("/ws/video")
async def video_websocket(websocket: WebSocket):
    await websocket.accept()
    stabilizer = Stabilizer()
    
    try:
        while True:
            data = await websocket.receive_text()
            # data is expected to be a base64 string
            result = process_video_frame(data, stabilizer)
            if result:
                # Store metric with timestamp
                metric_entry = {
                    "timestamp": time.time(),
                    "focus": result["focus"],
                    "emotion": result["emotion"],
                    "confidence": result["confidence"],
                    "stress": result["stress"]
                }
                session_data["video_metrics"].append(metric_entry)
                
                await websocket.send_json(result)
    except Exception as e:
        print(f"Video WebSocket error: {e}")

@app.post("/api/stop-camera")
async def stop_camera():
    """Stop camera - handled client-side via WebRTC, this is a no-op acknowledgment"""
    return {"status": "ok", "message": "Camera stop acknowledged"}

@app.get("/report")
async def get_report_data():
    """
    Returns the accumulated session data for the report page.
    Now includes per-answer evaluation scores from the interview state.
    """
    # Get scores summary from interview state
    state = session_data.get("interview_state")
    scores_summary = state.get_scores_summary() if state else {"total_questions": 0, "per_question": [], "per_category": {}}
    
    return {
        "transcript": session_data["transcript"],
        "video_metrics": session_data["video_metrics"],
        "job_description": session_data["job_description"],
        "answer_evaluation": scores_summary,
        "interview_plan": session_data.get("interview_plan"),
        "candidate_profile": session_data.get("candidate_profile")
    }

# Database endpoints
# History endpoints removed per user request

@app.get("/api/session/download-pdf")
async def download_session_pdf():
    """Generates and downloads PDF from current session data without saving to DB"""
    try:
        # Use a temporary user ID for the report generation
        temp_user_id = "session_user"
        
        # Generate the report object from current session data
        report = generate_report(session_data, temp_user_id)
        
        # Convert report to dict for PDF service
        # Matches original behavior: returns objects (datetime, etc.) rather than serialized JSON
        report_data = report.model_dump()
        
        # Generate PDF bytes
        pdf_buffer = generate_interview_pdf(report_data)
        
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=interview_report.pdf"}
        )
    except Exception as e:
        print(f"Error generating PDF: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))



def calculate_percentile(score: float, all_scores: List[float]) -> float:
    """Calculate percentile rank"""
    if not all_scores:
        return 0
    below = sum(1 for s in all_scores if s < score)
    return (below / len(all_scores)) * 100

def get_most_common_emotion(interviews: List[Dict]) -> str:
    """Get most common emotion across interviews"""
    emotions = []
    for interview in interviews:
        emotions.append(interview["vision_metrics"]["average_emotion"])
    if not emotions:
        return "neutral"
    return max(set(emotions), key=emotions.count)

async def generate_analytics_response(metrics, transcript, scores_summary=None, candidate_summary="", job_description=""):
    """Helper to generate analytics response structure from raw data"""
    # Calculate averages from video metrics
    if metrics:
        avg_focus = sum(m["focus"] for m in metrics) / len(metrics)
        avg_emotion = sum(m["emotion"] for m in metrics) / len(metrics)
        avg_confidence = sum(m["confidence"] for m in metrics) / len(metrics)
        avg_stress = sum(m.get("stress", 0) for m in metrics) / len(metrics)
    else:
        avg_focus = avg_emotion = avg_confidence = 0
        avg_stress = 50
    
    # Calculate per-question metrics (group by 30-second windows)
    per_question_metrics = []
    if metrics:
        # Group metrics into question-like segments
        segment_size = max(1, len(metrics) // 5)  # Divide into ~5 segments
        for i in range(0, len(metrics), segment_size):
            segment = metrics[i:i+segment_size]
            if segment:
                per_question_metrics.append({
                    "question_index": len(per_question_metrics) + 1,
                    "eye_contact_percentage": sum(m["focus"] for m in segment) / len(segment),
                    "confidence": sum(m["confidence"] for m in segment) / len(segment)
                })
    
    # Sentiment trend from transcript (simplified)
    sentiment_trend = []
    for entry in transcript:
        if entry["role"] == "user":
            # Basic sentiment: positive words = +, negative words = -
            text = entry["content"].lower()
            positive_words = ["good", "great", "excellent", "love", "happy", "excited", "confident"]
            negative_words = ["bad", "difficult", "hard", "nervous", "worried", "afraid", "confused"]
            pos_count = sum(1 for w in positive_words if w in text)
            neg_count = sum(1 for w in negative_words if w in text)
            sentiment = (pos_count - neg_count) / max(1, pos_count + neg_count + 1)
            sentiment_trend.append(sentiment)
    
    # Filler word detection
    filler_words = ["um", "uh", "like", "you know", "basically", "actually", "literally"]
    total_fillers = 0
    filler_counts = {}
    total_words = 0
    
    for entry in transcript:
        if entry["role"] == "user":
            words = entry["content"].lower().split()
            total_words += len(words)
            for filler in filler_words:
                count = entry["content"].lower().count(filler)
                total_fillers += count
                filler_counts[filler] = filler_counts.get(filler, 0) + count
    
    most_common_fillers = sorted(filler_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    filler_rate = (total_fillers / max(1, total_words)) * 100
    
    # Talk-to-listen ratio
    user_messages = sum(1 for t in transcript if t["role"] == "user")
    ai_messages = sum(1 for t in transcript if t["role"] == "ai")
    talk_ratio = user_messages / max(1, ai_messages)
    
    # Use answer evaluation to enhance technical_accuracy if available
    if scores_summary and scores_summary.get("total_questions", 0) > 0:
        # Scale LLM-evaluated accuracy (1-10) to 0-100 for the radar chart
        technical_accuracy = scores_summary["overall_accuracy"] * 10
        communication_score = scores_summary["overall_clarity"] * 10
    else:
        technical_accuracy = min(100, avg_confidence + 15)
        communication_score = min(100, avg_emotion + 20)
    
    return {
        "feedback": await generate_interview_feedback(transcript, scores_summary, candidate_summary, job_description),
        "radar_chart_data": {
            "technical_accuracy": technical_accuracy,
            "communication": communication_score,
            "confidence": avg_confidence,
            "focus": avg_focus,
            "emotional_intelligence": avg_emotion
        },
        "vision_analytics": {
            "overall_eye_contact_percentage": avg_focus,
            "overall_steadiness_percentage": 100 - avg_stress,
            "per_question_metrics": per_question_metrics
        },
        "nlp_report": {
            "total_filler_count": total_fillers,
            "filler_rate": filler_rate,
            "talk_to_listen_ratio": talk_ratio,
            "most_common_fillers": most_common_fillers,
            "sentiment_trend": sentiment_trend
        },
        "scoring_summary": {
            "average_score": (avg_focus + avg_emotion + avg_confidence) / 3,
            "scores_over_time": [m["confidence"] for m in metrics[-10:]] if metrics else []
        },
        "answer_evaluation": scores_summary
    }

@app.get("/api/analytics")
async def get_analytics():
    """Returns analytics for current active session"""
    try:
        state = session_data.get("interview_state")
        scores_summary = state.get_scores_summary() if state else None
        
        return await generate_analytics_response(
            session_data.get("video_metrics", []),
            session_data.get("transcript", []),
            scores_summary,
            session_data.get("candidate_summary", ""),
            session_data.get("job_description", "")
        )
    except Exception as e:
        print(f"Analytics Generation Error: {e}")
        traceback.print_exc()
        # Return a safe empty structure so the frontend doesn't show "Start New Interview" contextless page
        return {
            "feedback": {"strengths": "N/A", "gaps": "N/A", "advice": "No data available."},
            "radar_chart_data": {"technical_accuracy": 0, "communication": 0, "confidence": 0, "focus": 0, "emotional_intelligence": 0},
            "vision_analytics": {"overall_eye_contact_percentage": 0, "overall_steadiness_percentage": 0, "per_question_metrics": []},
            "nlp_report": {"total_filler_count": 0, "filler_rate": 0, "talk_to_listen_ratio": 0, "most_common_fillers": [], "sentiment_trend": []},
            "scoring_summary": {"average_score": 0, "scores_over_time": []},
            "answer_evaluation": None
        }

@app.get("/api/interview/{interview_id}/analytics")
async def get_historical_analytics(interview_id: str):
    """Returns analytics for a specific past interview"""
    interview = await InterviewService.get_interview_by_id(interview_id)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
        
    # Extract data from stored report
    metrics = interview.video_metrics or []
    transcript = interview.transcript or []
    
    # Construct scores summary if possible, or derive
    scores_summary = None
    if interview.questions_answers:
        scores = [qa.semantic_score for qa in interview.questions_answers]
        avg_score = sum(scores) / len(scores) if scores else 0
        scores_summary = {
            "total_questions": len(interview.questions_answers),
            "overall_accuracy": avg_score / 10, # Converting back to 1-10 scale approximation
            "overall_clarity": avg_score / 10,  # Approximation
            "overall_depth": avg_score / 10     # Approximation
        }
        
    return generate_analytics_response(metrics, transcript, scores_summary)

def generate_analytics_response(metrics, transcript, scores_summary=None):
    """Helper to generate analytics response structure from raw data"""
    # Calculate averages from video metrics
    if metrics:
        avg_focus = sum(m["focus"] for m in metrics) / len(metrics)
        avg_emotion = sum(m["emotion"] for m in metrics) / len(metrics)
        avg_confidence = sum(m["confidence"] for m in metrics) / len(metrics)
        avg_stress = sum(m.get("stress", 0) for m in metrics) / len(metrics)
    else:
        avg_focus = avg_emotion = avg_confidence = 0
        avg_stress = 50
    
    # Calculate per-question metrics (group by 30-second windows)
    per_question_metrics = []
    if metrics:
        # Group metrics into question-like segments
        segment_size = max(1, len(metrics) // 5)  # Divide into ~5 segments
        for i in range(0, len(metrics), segment_size):
            segment = metrics[i:i+segment_size]
            if segment:
                per_question_metrics.append({
                    "question_index": len(per_question_metrics) + 1,
                    "eye_contact_percentage": sum(m["focus"] for m in segment) / len(segment),
                    "confidence": sum(m["confidence"] for m in segment) / len(segment)
                })
    
    # Sentiment trend from transcript (simplified)
    sentiment_trend = []
    for entry in transcript:
        if entry["role"] == "user":
            # Basic sentiment: positive words = +, negative words = -
            text = entry["content"].lower()
            positive_words = ["good", "great", "excellent", "love", "happy", "excited", "confident"]
            negative_words = ["bad", "difficult", "hard", "nervous", "worried", "afraid", "confused"]
            pos_count = sum(1 for w in positive_words if w in text)
            neg_count = sum(1 for w in negative_words if w in text)
            sentiment = (pos_count - neg_count) / max(1, pos_count + neg_count + 1)
            sentiment_trend.append(sentiment)
    
    # Filler word detection
    filler_words = ["um", "uh", "like", "you know", "basically", "actually", "literally"]
    total_fillers = 0
    filler_counts = {}
    total_words = 0
    
    for entry in transcript:
        if entry["role"] == "user":
            words = entry["content"].lower().split()
            total_words += len(words)
            for filler in filler_words:
                count = entry["content"].lower().count(filler)
                total_fillers += count
                filler_counts[filler] = filler_counts.get(filler, 0) + count
    
    most_common_fillers = sorted(filler_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    filler_rate = (total_fillers / max(1, total_words)) * 100
    
    # Talk-to-listen ratio
    user_messages = sum(1 for t in transcript if t["role"] == "user")
    ai_messages = sum(1 for t in transcript if t["role"] == "ai")
    talk_ratio = user_messages / max(1, ai_messages)
    
    # Use answer evaluation to enhance technical_accuracy if available
    if scores_summary and scores_summary.get("total_questions", 0) > 0:
        # Scale LLM-evaluated accuracy (1-10) to 0-100 for the radar chart
        technical_accuracy = scores_summary["overall_accuracy"] * 10
        communication_score = scores_summary["overall_clarity"] * 10
    else:
        technical_accuracy = min(100, avg_confidence + 15)
        communication_score = min(100, avg_emotion + 20)
    
    return {
        "radar_chart_data": {
            "technical_accuracy": technical_accuracy,
            "communication": communication_score,
            "confidence": avg_confidence,
            "focus": avg_focus,
            "emotional_intelligence": avg_emotion
        },
        "vision_analytics": {
            "overall_eye_contact_percentage": avg_focus,
            "overall_steadiness_percentage": 100 - avg_stress,
            "per_question_metrics": per_question_metrics
        },
        "nlp_report": {
            "total_filler_count": total_fillers,
            "filler_rate": filler_rate,
            "talk_to_listen_ratio": talk_ratio,
            "most_common_fillers": most_common_fillers,
            "sentiment_trend": sentiment_trend
        },
        "scoring_summary": {
            "average_score": (avg_focus + avg_emotion + avg_confidence) / 3,
            "scores_over_time": [m["confidence"] for m in metrics[-10:]] if metrics else []
        },
        "answer_evaluation": scores_summary
    }


class RoadmapRequest(BaseModel):
    focus_area: str
    weak_topics: list = []

@app.post("/api/roadmap")
async def get_roadmap(request: RoadmapRequest):
    """Generate a 7-day study roadmap based on weak areas."""
    roadmap = await generate_study_roadmap(request.focus_area, request.weak_topics)
    return roadmap

class AudioBriefRequest(BaseModel):
    text: str

@app.post("/api/audio-brief")
async def get_audio_brief(request: AudioBriefRequest):
    """Generate audio briefing from text."""
    if not request.text:
        raise HTTPException(status_code=400, detail="Text is required")
        
    audio_bytes = generate_tts_audio(request.text)
    if not audio_bytes:
        raise HTTPException(status_code=500, detail="Audio generation failed")
    
    # Return as base64 for easy frontend playback
    audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')
    return {"audio_base64": audio_b64}


@app.get("/api/analytics")
async def get_analytics():
    """Returns analytics for current active session"""
    state = session_data.get("interview_state")
    scores_summary = state.get_scores_summary() if state else None
    
    return generate_analytics_response(
        session_data["video_metrics"],
        session_data["transcript"],
        scores_summary
    )

@app.get("/api/interview/{interview_id}/analytics")
async def get_historical_analytics(interview_id: str):
    """Returns analytics for a specific past interview"""
    interview = await InterviewService.get_interview_by_id(interview_id)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
        
    # Extract data from stored report
    metrics = interview.video_metrics or []
    transcript = interview.transcript or []
    
    # Construct scores summary if possible, or derive
    scores_summary = None
    if interview.questions_answers:
        scores = [qa.semantic_score for qa in interview.questions_answers]
        avg_score = sum(scores) / len(scores) if scores else 0
        scores_summary = {
            "total_questions": len(interview.questions_answers),
            "overall_accuracy": avg_score / 10, # Converting back to 1-10 scale approximation
            "overall_clarity": avg_score / 10,  # Approximation
            "overall_depth": avg_score / 10     # Approximation
        }
        
    return generate_analytics_response(metrics, transcript, scores_summary)

@app.get("/api/user/{user_id}/analytics")
async def get_user_analytics(user_id: str):
    """Get comprehensive analytics"""
    analytics = await InterviewService.get_analytics_summary(user_id)
    if not analytics:
        raise HTTPException(status_code=404, detail="No interviews found")
    return analytics

@app.get("/api/comparison/{user_id}/{job_role}")
async def get_comparison(user_id: str, job_role: str):
    """Compare performance with others"""
    comparison = await InterviewService.get_comparison_stats(user_id, job_role)
    if not comparison:
        raise HTTPException(status_code=404, detail="No data available")
    return comparison

from services.pdf_service import generate_interview_pdf

@app.get("/api/interview/{interview_id}/download")
async def download_interview_pdf(interview_id: str):
    """Generate and download PDF report for an interview"""
    interview = await InterviewService.get_interview_by_id(interview_id)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
        
    # Convert Pydantic model to dict
    report_data = interview.model_dump()
    
    # Generate PDF
    pdf_buffer = generate_interview_pdf(report_data)
    
    filename = f"Interview_Report_{interview_id[:8]}.pdf"
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

from services.report_generator import generate_report

@app.get("/api/session/weakness-analysis")
async def get_session_weakness():
    """Get weakness analysis for the current session"""
    state = session_data.get("interview_state")
    if not state:
        return {"topic_scores": {}, "classification": {"strong": [], "weak": [], "risk": []}, "patterns": []}
    
    scores = calculate_weakness_scores(session_data)
    classification = classify_topics(scores.get("topic_scores", {}))
    
    return {
        "topic_scores": scores["topic_scores"],
        "classification": classification,
        "hint_usage": state.hint_usage,
        "logical_errors": state.logical_errors,
        "question_topics": state.question_topics
    }

class SaveSessionRequest(BaseModel):
    user_id: str

@app.post("/api/session/save")
async def save_current_session(request: SaveSessionRequest):
    """
    Generates a full report from the current in-memory session 
    and saves it to the database for the given user_id.
    """
    if not session_data.get("transcript"):
         raise HTTPException(status_code=400, detail="No active session data to save")
         
    try:
        # Generate the report object
        report = generate_report(session_data, request.user_id)
        
        # Save to DB
        interview_id = await InterviewService.save_interview(report)
        
        return {"interview_id": interview_id, "message": "Session saved successfully"}
    except Exception as e:
        print(f"Error saving session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/session/hint-status")
async def get_hint_status():
    """Get current hint availability for progressive hint UI"""
    state = session_data.get("interview_state")
    if not state:
        return {"available_level": "small", "used_levels": [], "question_index": 0}
    
    q_index = state.total_questions_asked
    available = state.get_available_hint_level(q_index)
    used = state.hint_usage.get(q_index, [])
    topic = state.question_topics.get(q_index, "GENERAL")
    
    return {
        "available_level": available,
        "used_levels": used,
        "question_index": q_index,
        "topic": topic
    }

if __name__ == "__main__":
    import uvicorn
    print("Starting HireByte Backend Server...")
    print("Server: http://127.0.0.1:9000")
    print("API Docs: http://127.0.0.1:9000/docs")
    print("Press CTRL+C to stop\n")
    
    # FIXED: Changed "main:app" to app
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=9000,
        log_level="info",
        reload=True
    )
