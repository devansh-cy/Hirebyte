from datetime import datetime
from typing import List, Optional, Dict
from config.database import supabase
from models.interview_schema import InterviewReport
import json

class InterviewService:
    
    @staticmethod
    async def save_interview(report: InterviewReport) -> str:
        """Save interview report to Supabase"""
        if not supabase:
            raise Exception("Supabase not configured")

        report_dict = report.model_dump(by_alias=True, exclude={"id"}, mode='json')
        
        # Map to Supabase table schema
        # feedback_json stores the COMPLETE structured report for full fidelity
        data = {
            "user_id": report.user_id,
            "role_title": report.job_role,
            "job_description": report.job_description or "",
            "resume_text": "", # report doesn't enforce this field, assuming empty or handled elsewhere
            "status": "completed",
            "performance_score": report.overall_semantic_score,
            "feedback_json": report_dict,
            "created_at": report.interview_date.isoformat()
        }
        
        # Determine if resume_text can be extracted or looked up
        # For now, we store the full report in feedback_json which contains everything needed for the UI
        
        response = supabase.table("interviews").insert(data).execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]["id"]
        raise Exception("Failed to save interview to Supabase")

    @staticmethod
    async def delete_interview(interview_id: str) -> bool:
        """Delete interview by ID"""
        if not supabase:
            return False
            
        try:
            response = supabase.table("interviews").delete().eq("id", interview_id).execute()
            # Supabase delete returns the deleted rows. If successful, data should not be empty (if we ask for it)
            # or simply check no error. 
            # Note: delete() usually returns the deleted records if 'returning=minimal' isn't set, 
            # but getting a response implies success if no error was raised.
            return True
        except Exception as e:
            print(f"Error deleting interview: {e}")
            return False
    
    @staticmethod
    async def get_interview_by_id(interview_id: str) -> Optional[InterviewReport]:
        """Get interview by ID"""
        if not supabase:
            return None

        response = supabase.table("interviews").select("*").eq("id", interview_id).execute()
        
        if response.data and len(response.data) > 0:
            record = response.data[0]
            # Content is stored in feedback_json
            report_data = record["feedback_json"]
            # Ensure ID matches the Supabase ID
            report_data["_id"] = record["id"]
            return InterviewReport(**report_data)
        return None
    
    # History methods removed per user request

def calculate_percentile(score: float, all_scores: List[float]) -> float:
    """Calculate percentile rank"""
    if not all_scores:
        return 0
    below = sum(1 for s in all_scores if s < score)
    return (below / len(all_scores)) * 100
