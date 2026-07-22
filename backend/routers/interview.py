import os
import json
import base64
import asyncio
import logging
import traceback
from fastapi import APIRouter, WebSocket, Request, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, Field
from openai import AsyncOpenAI

from config.state import session_data
from config.limiter import limiter
from services.interview_state import InterviewState
from services.pdf_service import extract_text_from_pdf
from services.llm_service import get_ai_response, get_hint, evaluate_answer
from services.tts_service import generate_audio
from services.speech_analyzer import analyze_speech_confidence
from services.logic_validator import validate_logic
from services.resume_analyzer import analyze_resume, build_compact_summary
from services.interview_planner import generate_interview_plan, generate_topic_plan

logger = logging.getLogger("hirebyte")

# OpenAI client for transcriptions
_openai_key = os.getenv("OPENAI_API_KEY")
client = AsyncOpenAI(api_key=_openai_key)

# Constants for file uploads
MAX_UPLOAD_SIZE_MB = 10
MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024
ALLOWED_UPLOAD_MIMES = {"application/pdf"}

class HintRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=5000)
    level: str = Field(default="medium", pattern="^(small|medium|full)$")

class TopicInterviewRequest(BaseModel):
    topic: str  # AI_ML, DSA, or WEB_DEV
    difficulty: str = "medium"

def sanitize_llm_input(text: str, max_length: int = 10000) -> str:
    """Strip known prompt-injection patterns and enforce length limits."""
    if not text:
        return ""
    text = text[:max_length]
    injection_patterns = [
        r"ignore\s+(all\s+)?(previous|above|prior)\s+(instructions|prompts|rules)",
        r"you\s+are\s+now\s+(a|an|the)",
        r"system\s*:\s*",
        r"<\|.*?\|>",
    ]
    import re
    for pattern in injection_patterns:
        text = re.sub(pattern, "[filtered]", text, flags=re.IGNORECASE)
    return text.strip()

router = APIRouter()

@router.post("/get-hint")
@limiter.limit("60/minute")
async def get_interview_hint(request: Request, hint_request: HintRequest):
    if not session_data["resume_text"]:
        return {"hint": "Please upload a resume first."}
    
    state = session_data.get("interview_state")
    q_index = state.total_questions_asked if state else 0
    
    if state:
        available_level = state.get_available_hint_level(q_index)
        if available_level is None:
            return {
                "hint": "You've used all hint levels for this question. Try your best!",
                "level_used": "exhausted",
                "available_level": None,
                "topic": state.question_topics.get(q_index, "GENERAL")
            }
        level = available_level
    else:
        level = hint_request.level
    
    if state and q_index in state.question_topics:
        topic = state.question_topics[q_index]
    else:
        topic = "General"
    
    if state:
        state.question_topics[q_index] = topic
    
    hint = await get_hint(hint_request.question, session_data["resume_text"], 
                          session_data["job_description"], level, topic)
    
    if state:
        state.record_hint_used(q_index, level)
    
    next_level = state.get_available_hint_level(q_index) if state else None
    
    return {
        "hint": hint, 
        "level_used": level,
        "available_level": next_level,
        "topic": topic
    }

@router.post("/upload-resume")
@limiter.limit("30/minute")
async def upload_resume(request: Request, file: UploadFile = File(...), job_description: str = Form(...)):
    if file.content_type not in ALLOWED_UPLOAD_MIMES:
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File must have a .pdf extension.")
    
    pdf_bytes = await file.read()
    
    if len(pdf_bytes) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(status_code=400, detail=f"File too large. Maximum size is {MAX_UPLOAD_SIZE_MB}MB.")
    
    job_description = sanitize_llm_input(job_description, max_length=3000)
    
    text = extract_text_from_pdf(pdf_bytes)
    session_data["resume_text"] = text
    session_data["job_description"] = job_description
    session_data["transcript"] = []
    session_data["video_metrics"] = []
    session_data["answer_scores"] = []
    session_data["cached_analytics"] = None
    
    profile = await analyze_resume(text, job_description)
    session_data["candidate_profile"] = profile
    session_data["candidate_summary"] = build_compact_summary(profile)
    
    plan = await generate_interview_plan(profile, job_description)
    session_data["interview_plan"] = plan
    session_data["interview_state"] = None
    
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

@router.post("/start-topic-interview")
@limiter.limit("60/minute")
async def start_topic_interview(request: Request, topic_request: TopicInterviewRequest):
    valid_topics = ["AI_ML", "DSA", "WEB_DEV"]
    if topic_request.topic not in valid_topics:
        raise HTTPException(status_code=400, detail=f"Invalid topic. Must be one of: {valid_topics}")
    
    difficulty = topic_request.difficulty if topic_request.difficulty in ("easy", "medium", "hard") else "medium"
    
    session_data["resume_text"] = ""
    session_data["job_description"] = ""
    session_data["difficulty"] = difficulty
    session_data["interview_topic"] = topic_request.topic
    session_data["candidate_profile"] = None
    session_data["candidate_summary"] = ""
    session_data["transcript"] = []
    session_data["video_metrics"] = []
    session_data["answer_scores"] = []
    session_data["cached_analytics"] = None
    
    plan = generate_topic_plan(topic_request.topic, difficulty)
    session_data["interview_plan"] = plan
    session_data["interview_state"] = None
    
    topic_labels = {"AI_ML": "AI / Machine Learning", "DSA": "Data Structures & Algorithms", "WEB_DEV": "Web Development"}
    
    print(f"[Topic Interview] Topic: {topic_request.topic}, Difficulty: {difficulty}")
    print(f"[Interview Planner] Plan: {json.dumps(plan, indent=2)[:500]}")
    
    return {
        "message": f"{topic_labels[topic_request.topic]} interview ready!",
        "interview_plan": {
            "total_questions": plan.get("total_questions", 9),
            "categories": [c["name"] for c in plan.get("categories", [])],
            "difficulty": difficulty,
            "topic": topic_request.topic,
            "topic_label": topic_labels[topic_request.topic]
        }
    }

@router.post("/transcribe")
@limiter.limit("60/minute")
async def transcribe_audio(request: Request, file: UploadFile = File(...)):
    temp_path = "temp_voice.wav"
    with open(temp_path, "wb") as buffer:
        buffer.write(await file.read())
    
    try:
        with open(temp_path, "rb") as audio_file:
            transcript = await client.audio.transcriptions.create(
                model="whisper-1", 
                file=audio_file,
                language="en",
                prompt="Technical interview conversation about software development. Um, well, I think we should, uh, basically discuss the solution, you know?"
            )
        
        text = transcript.text.strip()
        if len(text) < 2: 
            return {"text": ""}
            
        return {"text": text}
        
    except Exception as e:
        print(f"Transcription error: {e}")
        return {"text": ""}
        
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@router.websocket("/ws/interview")
async def interview_websocket(websocket: WebSocket):
    await websocket.accept()
    
    websocket_lock = asyncio.Lock()
    
    async def safe_send(msg_dict):
        try:
            async with websocket_lock:
                await websocket.send_json(msg_dict)
        except Exception as send_err:
            logger.error(f"Error sending WebSocket message: {send_err}")

    chat_history = []
    
    plan = session_data.get("interview_plan")
    if plan:
        state = InterviewState(plan)
        session_data["interview_state"] = state
    else:
        state = None
    
    if session_data["candidate_summary"] or session_data.get("interview_topic"):
        interview_context = state.to_context_string() if state else ""
        
        response_text = await get_ai_response(
            session_data["candidate_summary"],
            session_data["job_description"],
            chat_history,
            interview_context,
            session_data.get("interview_topic", "")
        )
        
        if state:
            state.current_question_text = response_text
            state.mark_question_asked(state.total_questions_asked)
            step = state.get_current_step()
            topic = step["topic"] if step else "General"
            state.question_topics[state.total_questions_asked] = topic
        
        chat_history.append({"role": "assistant", "content": response_text})
        session_data["transcript"].append({"role": "ai", "content": response_text})
        
        # Generate TTS audio first to sync playback with text pop-up
        try:
            audio_bytes = await generate_audio(response_text)
            audio_b64 = base64.b64encode(audio_bytes).decode('utf-8') if audio_bytes else None
        except Exception as tts_err:
            logger.error(f"Error generating intro audio: {tts_err}")
            audio_b64 = None

        await safe_send({
            "type": "ai_turn",
            "text": response_text,
            "audio": audio_b64
        })

    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            
            if msg["type"] == "user_turn":
                try:
                    user_text = msg["text"]
                    
                    speech_duration = msg.get("duration", 0)
                    silence_duration = msg.get("silence_duration", 0)
                    
                    chat_history.append({"role": "user", "content": user_text})
                    session_data["transcript"].append({"role": "user", "content": user_text})
                    
                    if state:
                        state.mark_question_answered(state.total_questions_asked)
                    
                    step = state.get_current_step()
                    current_topic = state.question_topics.get(state.total_questions_asked, "GENERAL")
                    
                    interview_context = state.to_context_string() if state else ""
                    
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

                    try:
                        ai_reply = await ai_response_task
                    except Exception as e:
                        print(f"AI Generation Error: {e}")
                        ai_reply = "I'm having trouble thinking of a response. Let's continue."

                    chat_history.append({"role": "assistant", "content": ai_reply})
                    session_data["transcript"].append({"role": "ai", "content": ai_reply})
                    
                    # Generate TTS audio first to sync playback with text pop-up
                    try:
                        audio_bytes = await generate_audio(ai_reply)
                        audio_b64 = base64.b64encode(audio_bytes).decode('utf-8') if audio_bytes else None
                    except Exception as tts_err:
                        logger.error(f"Error generating turn audio: {tts_err}")
                        audio_b64 = None

                    await safe_send({
                        "type": "ai_turn",
                        "text": ai_reply,
                        "audio": audio_b64
                    })

                    if eval_task and logic_task:
                        try:
                            scores, logic_result = await asyncio.gather(eval_task, logic_task)
                            
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
                            
                            if logic_result and logic_result.get("has_issue"):
                                state.record_logical_error(
                                    question_index=state.total_questions_asked,
                                    issue_type=logic_result["issue_type"],
                                    feedback=logic_result["feedback"],
                                    severity=logic_result["severity"]
                                )
                                await safe_send({
                                    "type": "logic_feedback",
                                    "issue_type": logic_result["issue_type"],
                                    "feedback": logic_result["feedback"],
                                    "severity": logic_result["severity"]
                                })
                                print(f"[Logic Validator] {logic_result['severity'].upper()}: {logic_result['feedback']}")
                                
                            state.advance()
                            
                        except Exception as e:
                            print(f"Evaluation Error: {e}")

                    try:
                        speech_analysis = analyze_speech_confidence(
                            text=user_text,
                            duration_seconds=speech_duration,
                            silence_duration=silence_duration
                        )
                        
                        if speech_analysis["confidence_level"] != "high" or speech_analysis["long_silence"]:
                            await safe_send({
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
                    
                    if state:
                        state.current_question_text = ai_reply
                        state.mark_question_asked(state.total_questions_asked)
                        next_step = state.get_current_step()
                        next_topic = next_step["topic"] if next_step else "General"
                        state.question_topics[state.total_questions_asked] = next_topic

                except Exception as processing_error:
                    print(f"Error processing message: {processing_error}")
                    traceback.print_exc()
                    await safe_send({
                        "type": "ai_turn",
                        "text": "I'm having a little trouble processing that. Could you say it again?",
                        "audio": None
                    })

    except Exception as e:
        print(f"WebSocket session closed or encountered error: {e}")
