import os
import json
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

ANALYSIS_PROMPT = """Analyze this resume against the job description. Return ONLY valid JSON with this exact structure:

{
  "skills": {"skill_name": "proficiency_level", ...},
  "projects": [{"name": "...", "technologies": ["..."], "impact": "one-line summary"}],
  "experience_level": "junior|mid|senior",
  "years_of_experience": 0,
  "education": "highest degree and field",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "gap_analysis": {
    "missing_skills": ["skill the job needs but resume lacks"],
    "weak_skills": ["skill mentioned but not demonstrated deeply"],
    "probing_areas": ["claims that need verification via questions"]
  }
}

Rules:
- proficiency_level must be one of: "beginner", "intermediate", "advanced"
- experience_level is based on total years and depth of work
- strengths/weaknesses are relative to the JOB DESCRIPTION
- probing_areas are things the candidate claims but hasn't demonstrated (e.g., "says ML but no ML projects shown")
- Be honest and critical — this drives interview question quality
- Return ONLY the JSON, no markdown fences, no explanation"""


async def analyze_resume(resume_text: str, job_description: str) -> dict:
    """
    Analyze a resume against a job description and return structured data.
    This runs ONCE at upload time, not every turn.
    
    Returns a structured dict with skills, projects, experience level,
    strengths, weaknesses, and gap analysis.
    """
    try:
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": ANALYSIS_PROMPT
                },
                {
                    "role": "user",
                    "content": f"RESUME:\n{resume_text}\n\nJOB DESCRIPTION:\n{job_description}"
                }
            ],
            temperature=0.3,  # Low temperature for consistent structured output
            max_tokens=1000
        )
        
        raw = response.choices[0].message.content.strip()
        
        # Strip markdown fences if the model wraps output anyway
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1]  # Remove first line
            if raw.endswith("```"):
                raw = raw[:-3]
            raw = raw.strip()
        
        profile = json.loads(raw)
        
        # Validate required keys exist
        required_keys = ["skills", "projects", "experience_level", "strengths", 
                        "weaknesses", "gap_analysis"]
        for key in required_keys:
            if key not in profile:
                profile[key] = [] if key in ["projects", "strengths", "weaknesses"] else {}
        
        # Ensure gap_analysis has required sub-keys
        gap = profile.get("gap_analysis", {})
        gap.setdefault("missing_skills", [])
        gap.setdefault("weak_skills", [])
        gap.setdefault("probing_areas", [])
        profile["gap_analysis"] = gap
        
        return profile
        
    except json.JSONDecodeError as e:
        print(f"Resume analysis JSON parse error: {e}")
        # Return a minimal valid structure so the interview can still proceed
        return _fallback_profile(resume_text)
    except Exception as e:
        print(f"Resume analysis error: {e}")
        return _fallback_profile(resume_text)


def _fallback_profile(resume_text: str) -> dict:
    """
    Generate a minimal profile from raw text when LLM analysis fails.
    Extracts basic keywords so the interview can still function.
    """
    # Simple keyword extraction as fallback
    common_skills = [
        "python", "java", "javascript", "react", "node", "sql", "aws", "docker",
        "kubernetes", "git", "html", "css", "typescript", "mongodb", "postgresql",
        "flask", "django", "fastapi", "machine learning", "deep learning", "tensorflow",
        "pytorch", "pandas", "numpy", "linux", "c++", "c#", "go", "rust", "swift"
    ]
    
    text_lower = resume_text.lower()
    found_skills = {skill: "intermediate" for skill in common_skills if skill in text_lower}
    
    return {
        "skills": found_skills if found_skills else {"general": "unknown"},
        "projects": [],
        "experience_level": "mid",
        "years_of_experience": 0,
        "education": "unknown",
        "strengths": ["Resume uploaded successfully"],
        "weaknesses": ["Could not perform detailed analysis"],
        "gap_analysis": {
            "missing_skills": [],
            "weak_skills": [],
            "probing_areas": ["Verify all claimed skills during interview"]
        }
    }


def build_compact_summary(profile: dict) -> str:
    """
    Build a compact text summary from the structured profile.
    This is what gets passed to the LLM each turn instead of the full resume.
    Typically ~200 tokens vs ~2000+ tokens for the raw resume.
    """
    lines = []
    
    # Experience level
    level = profile.get("experience_level", "unknown")
    years = profile.get("years_of_experience", "?")
    edu = profile.get("education", "unknown")
    lines.append(f"Level: {level} ({years} yrs) | Education: {edu}")
    
    # Skills (compact)
    skills = profile.get("skills", {})
    if skills:
        skill_str = ", ".join(f"{k}({v[0]})" for k, v in skills.items())  # python(a), react(i)
        lines.append(f"Skills: {skill_str}")
    
    # Projects (names + tech only)
    projects = profile.get("projects", [])
    if projects:
        proj_strs = []
        for p in projects[:4]:  # Max 4 projects
            name = p.get("name", "unnamed")
            tech = ", ".join(p.get("technologies", [])[:3])
            proj_strs.append(f"{name} [{tech}]")
        lines.append(f"Projects: {'; '.join(proj_strs)}")
    
    # Strengths/Weaknesses (compact)
    strengths = profile.get("strengths", [])
    if strengths:
        lines.append(f"Strengths: {', '.join(strengths[:3])}")
    
    weaknesses = profile.get("weaknesses", [])
    if weaknesses:
        lines.append(f"Weaknesses: {', '.join(weaknesses[:2])}")
    
    # Gap analysis
    gap = profile.get("gap_analysis", {})
    missing = gap.get("missing_skills", [])
    probing = gap.get("probing_areas", [])
    if missing:
        lines.append(f"Missing for role: {', '.join(missing[:4])}")
    if probing:
        lines.append(f"Probe: {', '.join(probing[:3])}")
    
    return "\n".join(lines)
