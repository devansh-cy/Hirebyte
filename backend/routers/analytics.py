import time
import base64
import logging
import traceback
from typing import List, Dict
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from config.state import session_data
from config.limiter import limiter
from services.interview_services import InterviewService
from services.pdf_service import generate_interview_pdf
from services.llm_service import generate_interview_feedback, generate_study_roadmap

from services.report_generator import generate_report
from services.weakness_engine import calculate_weakness_scores, classify_topics

logger = logging.getLogger("hirebyte")

router = APIRouter()

# ── Helper functions for analytics generation ──
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
        return "Neutral"
    from collections import Counter
    counts = Counter(emotions)
    return counts.most_common(1)[0][0]

async def generate_analytics_response(metrics, transcript, scores_summary=None, candidate_summary="", job_description=""):
    """Helper to generate analytics response structure from raw data"""
    if metrics:
        avg_focus = sum(m["focus"] for m in metrics) / len(metrics)
        avg_emotion = sum(m["emotion"] for m in metrics) / len(metrics)
        avg_confidence = sum(m["confidence"] for m in metrics) / len(metrics)
        avg_stress = sum(m.get("stress", 0) for m in metrics) / len(metrics)
    else:
        avg_focus = avg_emotion = avg_confidence = 0
        avg_stress = 50
    
    per_question_metrics = []
    if metrics:
        segment_size = max(1, len(metrics) // 5)
        for i in range(0, len(metrics), segment_size):
            segment = metrics[i:i+segment_size]
            if segment:
                per_question_metrics.append({
                    "question_index": len(per_question_metrics) + 1,
                    "eye_contact_percentage": sum(m["focus"] for m in segment) / len(segment),
                    "confidence": sum(m["confidence"] for m in segment) / len(segment)
                })
    
    sentiment_trend = []
    for entry in transcript:
        if entry["role"] == "user":
            text = entry["content"].lower()
            positive_words = ["good", "great", "excellent", "love", "happy", "excited", "confident"]
            negative_words = ["bad", "difficult", "hard", "nervous", "worried", "afraid", "confused"]
            pos_count = sum(1 for w in positive_words if w in text)
            neg_count = sum(1 for w in negative_words if w in text)
            sentiment = (pos_count - neg_count) / max(1, pos_count + neg_count + 1)
            sentiment_trend.append(sentiment)
    
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
    
    user_messages = sum(1 for t in transcript if t["role"] == "user")
    ai_messages = sum(1 for t in transcript if t["role"] == "ai")
    talk_ratio = user_messages / max(1, ai_messages)
    
    if scores_summary and scores_summary.get("total_questions", 0) > 0:
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

# ── Endpoints ──
@router.get("/report")
async def get_report_data():
    """Returns the accumulated session data for the report page."""
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

@router.get("/api/session/download-pdf")
async def download_session_pdf():
    """Generates and downloads PDF from current session data without saving to DB"""
    try:
        temp_user_id = "session_user"
        report = generate_report(session_data, temp_user_id)
        report_data = report.model_dump()
        pdf_buffer = generate_interview_pdf(report_data)
        
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=interview_report.pdf"}
        )
    except Exception as e:
        logger.error(f"Error generating PDF: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate PDF report. Please try again.")

@router.get("/api/analytics")
async def get_analytics():
    """Returns analytics for current active session"""
    try:
        if "cached_analytics" in session_data and session_data["cached_analytics"]:
            print("[INFO] Returning cached analytics")
            return session_data["cached_analytics"]

        state = session_data.get("interview_state")
        scores_summary = state.get_scores_summary() if state else None
        
        analytics_res = await generate_analytics_response(
            session_data.get("video_metrics", []),
            session_data.get("transcript", []),
            scores_summary,
            session_data.get("candidate_summary", ""),
            session_data.get("job_description", "")
        )
        
        session_data["cached_analytics"] = analytics_res
        return analytics_res
    except Exception as e:
        print(f"Analytics Generation Error: {e}")
        traceback.print_exc()
        return {
            "feedback": {"strengths": "N/A", "gaps": "N/A", "advice": "No data available."},
            "radar_chart_data": {"technical_accuracy": 0, "communication": 0, "confidence": 0, "focus": 0, "emotional_intelligence": 0},
            "vision_analytics": {"overall_eye_contact_percentage": 0, "overall_steadiness_percentage": 0, "per_question_metrics": []},
            "nlp_report": {"total_filler_count": 0, "filler_rate": 0, "talk_to_listen_ratio": 0, "most_common_fillers": [], "sentiment_trend": []},
            "scoring_summary": {"average_score": 0, "scores_over_time": []},
            "answer_evaluation": None
        }

@router.get("/api/interview/{interview_id}/analytics")
async def get_historical_analytics(interview_id: str):
    """Returns analytics for a specific past interview"""
    interview = await InterviewService.get_interview_by_id(interview_id)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
        
    metrics = interview.video_metrics or []
    transcript = interview.transcript or []
    
    scores_summary = None
    if interview.questions_answers:
        scores = [qa.semantic_score for qa in interview.questions_answers]
        avg_score = sum(scores) / len(scores) if scores else 0
        scores_summary = {
            "total_questions": len(interview.questions_answers),
            "overall_accuracy": avg_score / 10,
            "overall_clarity": avg_score / 10,
            "overall_depth": avg_score / 10
        }
        
    return await generate_analytics_response(metrics, transcript, scores_summary)

class RoadmapRequest(BaseModel):
    focus_area: str
    weak_topics: list = []

@router.post("/api/roadmap")
@limiter.limit("60/minute")
async def get_roadmap(request: Request, roadmap_request: RoadmapRequest):
    """Generate a 7-day study roadmap based on weak areas."""
    roadmap = await generate_study_roadmap(roadmap_request.focus_area, roadmap_request.weak_topics)
    return roadmap



@router.get("/api/user/{user_id}/analytics")
async def get_user_analytics(user_id: str):
    """Get comprehensive analytics"""
    analytics = await InterviewService.get_analytics_summary(user_id)
    if not analytics:
        raise HTTPException(status_code=404, detail="No interviews found")
    return analytics

@router.get("/api/comparison/{user_id}/{job_role}")
async def get_comparison(user_id: str, job_role: str):
    """Compare performance with others"""
    comparison = await InterviewService.get_comparison_stats(user_id, job_role)
    if not comparison:
        raise HTTPException(status_code=404, detail="No data available")
    return comparison

@router.get("/api/interview/{interview_id}/download")
async def download_interview_pdf(interview_id: str):
    """Generate and download PDF report for an interview"""
    interview = await InterviewService.get_interview_by_id(interview_id)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
        
    report_data = interview.model_dump()
    pdf_buffer = generate_interview_pdf(report_data)
    filename = f"Interview_Report_{interview_id[:8]}.pdf"
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/api/session/weakness-analysis")
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

@router.post("/api/session/save")
@limiter.limit("60/minute")
async def save_current_session(request: Request, save_request: SaveSessionRequest):
    """Generates a full report from the current in-memory session and saves it to the database."""
    if not session_data.get("transcript"):
         raise HTTPException(status_code=400, detail="No active session data to save")
         
    try:
        report = generate_report(session_data, save_request.user_id)
        interview_id = await InterviewService.save_interview(report)
        return {"interview_id": interview_id, "message": "Session saved successfully"}
    except Exception as e:
        logger.error(f"Error saving session: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to save session. Please try again.")

@router.get("/api/session/hint-status")
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
