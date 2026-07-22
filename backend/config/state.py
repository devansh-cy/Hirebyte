# Global session state to share data across routers
session_data = {
    "resume_text": "",           # Raw text (kept for hints)
    "job_description": "",
    "candidate_profile": None,   # Structured profile from resume_analyzer
    "candidate_summary": "",     # Compact summary for LLM prompts
    "interview_plan": None,      # Fixed plan from interview_planner
    "interview_state": None,     # InterviewState tracker instance
    "transcript": [],            # Stores {"role": "user"|"ai", "content": "..."}
    "video_metrics": [],         # Stores {"timestamp": float, "focus": int, "emotion": int, "confidence": int}
    "answer_scores": [],         # Stores per-answer evaluation scores
    "cached_analytics": None     # Cached analytics response to speed up page loads/refreshes
}
