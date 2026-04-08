from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime

class EmotionData(BaseModel):
    timestamp: float
    emotion: str
    confidence: float

class VisionMetrics(BaseModel):
    eye_contact_percentage: float
    steadiness_score: float
    emotions: List[EmotionData]
    average_emotion: str

class QuestionAnswer(BaseModel):
    question_number: int
    question: str
    expected_answer: str
    user_answer: str
    semantic_score: float
    feedback: str
    timestamp: datetime

class NLPMetrics(BaseModel):
    filler_word_count: int
    average_response_length: int
    vocabulary_richness: float
    coherence_score: float

class InterviewReport(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    id: Optional[str] = Field(alias="_id", default=None)
    user_id: str
    interview_date: datetime = Field(default_factory=datetime.utcnow)
    
    # Interview metadata
    job_role: str
    company: Optional[str] = None
    interview_duration: int  # in seconds
    
    # Resume data
    resume_filename: Optional[str] = None
    job_description: Optional[str] = None
    
    # Q&A data
    questions_answers: List[QuestionAnswer]
    total_questions: int
    
    # Scoring
    overall_semantic_score: float
    vision_metrics: VisionMetrics
    nlp_metrics: NLPMetrics
    
    # Analytics
    confidence_timeline: List[Dict[str, Any]] = []
    emotion_timeline: List[Dict[str, Any]] = []
    transcript: List[Dict[str, str]] = []  # Full chat history
    video_metrics: List[Dict[str, Any]] = [] # Raw video metrics for replay/charts
    
    # AI Feedback
    strengths: List[str]
    areas_for_improvement: List[str]
    overall_feedback: str
    
    # Progress tracking
    interview_number: int  # User's nth interview
    previous_score: Optional[float] = None
    improvement_percentage: Optional[float] = None
    
    # Feature 1/3: Hint tracking
    hint_usage: Optional[Dict[str, List[str]]] = None  # {question_index: [levels_used]}
    
    # Feature 3: Per-question timing
    time_per_question: Optional[Dict[str, float]] = None  # {question_index: seconds}
    
    # Feature 2/3: Logical errors
    logical_errors: Optional[List[Dict[str, Any]]] = None  # [{question_index, issue_type, feedback, severity}]
    
    # Feature 1: Topic classifications (Renamed to match report_generator usage)
    question_topics: Optional[Dict[str, str]] = None  # {question_index: "DSA"|"OS"|...}
    
    # Feature 3: Per-question timing (Renamed to match usage if needed, or matched in generator)
    # report_generator uses: report.time_per_question = state.question_timestamps
    # BUT state keys might be integers, Pydantic dictates Dict keys as str usually for JSON
    time_per_question: Optional[Dict[str, float]] = None