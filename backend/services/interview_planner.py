import os
import json
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

PLAN_PROMPT = """You are an interview planning expert. Given a candidate profile and job description, create a structured interview plan.

Return ONLY valid JSON with this exact structure:

{
  "total_questions": 10,
  "estimated_duration_minutes": 25,
  "difficulty_baseline": "easy|medium|hard",
  "categories": [
    {
      "name": "category_name",
      "count": 2,
      "difficulty": "easy|medium|hard",
      "topics": ["specific topic 1", "specific topic 2"],
      "purpose": "why we're asking this"
    }
  ]
}

Category rules:
1. "introduction" (1 question) — Always first. Interviewer introduces themselves, asks candidate to introduce.
2. "technical_skills" (2-3 questions) — Based on skills listed. Focus on skills relevant to the job.
3. "project_deep_dive" (2 questions) — Pick the most relevant project(s). Ask about architecture decisions, challenges, outcomes.
4. "gap_probing" (1-2 questions) — Target missing_skills and probing_areas from the profile. Verify weak claims.
5. "behavioral" (1-2 questions) — Situational questions about teamwork, conflict, leadership. Match to experience level.
6. "closing" (1 question) — Always last. Ask if candidate has questions, wrap up professionally.

Rules:
- difficulty_baseline should match experience_level: junior→easy, mid→medium, senior→hard
- Total questions should be 8-12
- Topics must be SPECIFIC (not "ask about Python" but "ask about Python decorators and their use in the candidate's Flask project")
- Reference actual skills/projects from the candidate profile
- Return ONLY the JSON, no explanation"""


async def generate_interview_plan(profile: dict, job_description: str) -> dict:
    """
    Generate a fixed interview plan based on the candidate's profile.
    This runs ONCE at the start of the interview session.
    
    Args:
        profile: Structured profile from resume_analyzer
        job_description: The job description text
    
    Returns:
        A structured interview plan dict
    """
    # Build a compact profile representation for the planning prompt 
    profile_text = json.dumps(profile, indent=2)
    
    try:
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": PLAN_PROMPT},
                {
                    "role": "user", 
                    "content": f"CANDIDATE PROFILE:\n{profile_text}\n\nJOB DESCRIPTION:\n{job_description}"
                }
            ],
            temperature=0.4,
            max_tokens=1000
        )
        
        raw = response.choices[0].message.content.strip()
        
        # Strip markdown fences if present
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1]
            if raw.endswith("```"):
                raw = raw[:-3]
            raw = raw.strip()
        
        plan = json.loads(raw)
        
        # Validate and fix the plan structure
        plan = _validate_plan(plan, profile)
        
        return plan
        
    except json.JSONDecodeError as e:
        print(f"Interview plan JSON parse error: {e}")
        return _fallback_plan(profile)
    except Exception as e:
        print(f"Interview plan generation error: {e}")
        return _fallback_plan(profile)


def _validate_plan(plan: dict, profile: dict) -> dict:
    """Ensure the plan has all required fields and valid structure."""
    
    plan.setdefault("total_questions", 10)
    plan.setdefault("estimated_duration_minutes", 25)
    plan.setdefault("difficulty_baseline", "medium")
    
    categories = plan.get("categories", [])
    if not categories:
        return _fallback_plan(profile)
    
    # Ensure each category has required fields
    for cat in categories:
        cat.setdefault("name", "general")
        cat.setdefault("count", 1)
        cat.setdefault("difficulty", plan["difficulty_baseline"])
        cat.setdefault("topics", ["general discussion"])
        cat.setdefault("purpose", "evaluate candidate")
    
    # Ensure introduction is first and closing is last
    cat_names = [c["name"] for c in categories]
    if cat_names[0] != "introduction":
        categories.insert(0, {
            "name": "introduction",
            "count": 1,
            "difficulty": "easy",
            "topics": ["candidate background and motivation"],
            "purpose": "warm up and establish rapport"
        })
    
    if cat_names[-1] != "closing":
        categories.append({
            "name": "closing",
            "count": 1,
            "difficulty": "easy",
            "topics": ["candidate questions and wrap-up"],
            "purpose": "close the interview professionally"
        })
    
    plan["categories"] = categories
    plan["total_questions"] = sum(c["count"] for c in categories)
    
    return plan


def _fallback_plan(profile: dict) -> dict:
    """Generate a basic interview plan when LLM planning fails."""
    
    skills = list(profile.get("skills", {}).keys())[:3]
    projects = [p.get("name", "project") for p in profile.get("projects", [])[:2]]
    missing = profile.get("gap_analysis", {}).get("missing_skills", [])[:2]
    level = profile.get("experience_level", "mid")
    
    difficulty = {"junior": "easy", "mid": "medium", "senior": "hard"}.get(level, "medium")
    
    categories = [
        {
            "name": "introduction",
            "count": 1,
            "difficulty": "easy",
            "topics": ["candidate background"],
            "purpose": "warm up"
        },
        {
            "name": "technical_skills",
            "count": 3,
            "difficulty": difficulty,
            "topics": skills if skills else ["general technical knowledge"],
            "purpose": "assess technical depth"
        },
    ]
    
    if projects:
        categories.append({
            "name": "project_deep_dive",
            "count": 2,
            "difficulty": difficulty,
            "topics": projects,
            "purpose": "understand practical experience"
        })
    
    if missing:
        categories.append({
            "name": "gap_probing",
            "count": 1,
            "difficulty": difficulty,
            "topics": missing,
            "purpose": "assess awareness of gaps"
        })
    
    categories.extend([
        {
            "name": "behavioral",
            "count": 1,
            "difficulty": "medium",
            "topics": ["teamwork and problem solving"],
            "purpose": "evaluate soft skills"
        },
        {
            "name": "closing",
            "count": 1,
            "difficulty": "easy",
            "topics": ["candidate questions"],
            "purpose": "wrap up"
        }
    ])
    
    return {
        "total_questions": sum(c["count"] for c in categories),
        "estimated_duration_minutes": 25,
        "difficulty_baseline": difficulty,
        "categories": categories
    }


def generate_topic_plan(topic: str, difficulty: str = "medium") -> dict:
    """
    Generate a fixed interview plan for a specific topic (no resume needed).
    Used when the user selects topic-based practice instead of uploading a resume.
    
    Args:
        topic: One of AI_ML, DSA, WEB_DEV
        difficulty: easy, medium, or hard
    
    Returns:
        A structured interview plan dict
    """
    topic_configs = {
        "AI_ML": {
            "label": "AI / Machine Learning",
            "categories": [
                {
                    "name": "introduction",
                    "count": 1,
                    "difficulty": "easy",
                    "topics": ["candidate background in AI/ML"],
                    "purpose": "warm up and understand AI/ML experience"
                },
                {
                    "name": "technical_skills",
                    "count": 3,
                    "difficulty": difficulty,
                    "topics": [
                        "supervised vs unsupervised learning and when to use each",
                        "neural network architectures (CNNs, RNNs, Transformers)",
                        "model evaluation metrics (precision, recall, F1, AUC-ROC)"
                    ],
                    "purpose": "assess core ML knowledge"
                },
                {
                    "name": "project_deep_dive",
                    "count": 2,
                    "difficulty": difficulty,
                    "topics": [
                        "end-to-end ML pipeline design (data collection, preprocessing, training, deployment)",
                        "handling overfitting, data imbalance, and feature engineering"
                    ],
                    "purpose": "evaluate practical ML experience"
                },
                {
                    "name": "gap_probing",
                    "count": 2,
                    "difficulty": difficulty,
                    "topics": [
                        "MLOps and model deployment in production",
                        "ethical AI, bias detection, and responsible ML practices"
                    ],
                    "purpose": "probe advanced AI/ML concepts"
                },
                {
                    "name": "closing",
                    "count": 1,
                    "difficulty": "easy",
                    "topics": ["wrap up and candidate questions"],
                    "purpose": "close the interview"
                }
            ]
        },
        "DSA": {
            "label": "Data Structures & Algorithms",
            "categories": [
                {
                    "name": "introduction",
                    "count": 1,
                    "difficulty": "easy",
                    "topics": ["candidate background in programming and problem solving"],
                    "purpose": "warm up"
                },
                {
                    "name": "technical_skills",
                    "count": 3,
                    "difficulty": difficulty,
                    "topics": [
                        "arrays, linked lists, stacks, and queues — operations and time complexity",
                        "trees and graphs — traversal algorithms (BFS, DFS), binary search trees",
                        "hash maps, heaps, and their real-world applications"
                    ],
                    "purpose": "assess data structure fundamentals"
                },
                {
                    "name": "project_deep_dive",
                    "count": 2,
                    "difficulty": difficulty,
                    "topics": [
                        "sorting and searching algorithms — trade-offs between merge sort, quick sort, binary search",
                        "dynamic programming — identifying subproblems, memoization vs tabulation"
                    ],
                    "purpose": "evaluate algorithmic thinking"
                },
                {
                    "name": "gap_probing",
                    "count": 2,
                    "difficulty": difficulty,
                    "topics": [
                        "time and space complexity analysis (Big-O notation)",
                        "greedy algorithms vs dynamic programming — when to use which"
                    ],
                    "purpose": "probe problem-solving depth"
                },
                {
                    "name": "closing",
                    "count": 1,
                    "difficulty": "easy",
                    "topics": ["wrap up and candidate questions"],
                    "purpose": "close the interview"
                }
            ]
        },
        "WEB_DEV": {
            "label": "Web Development",
            "categories": [
                {
                    "name": "introduction",
                    "count": 1,
                    "difficulty": "easy",
                    "topics": ["candidate background in web development"],
                    "purpose": "warm up"
                },
                {
                    "name": "technical_skills",
                    "count": 3,
                    "difficulty": difficulty,
                    "topics": [
                        "HTML/CSS fundamentals — semantic HTML, Flexbox, Grid, responsive design",
                        "JavaScript core — closures, promises, async/await, event loop",
                        "frontend frameworks — React component lifecycle, state management, hooks"
                    ],
                    "purpose": "assess frontend knowledge"
                },
                {
                    "name": "project_deep_dive",
                    "count": 2,
                    "difficulty": difficulty,
                    "topics": [
                        "backend development — REST APIs, authentication, database design",
                        "full-stack architecture — client-server communication, deployment, CI/CD"
                    ],
                    "purpose": "evaluate full-stack understanding"
                },
                {
                    "name": "gap_probing",
                    "count": 2,
                    "difficulty": difficulty,
                    "topics": [
                        "web performance optimization — lazy loading, caching, CDNs, bundle optimization",
                        "web security — XSS, CSRF, CORS, authentication best practices"
                    ],
                    "purpose": "probe advanced web concepts"
                },
                {
                    "name": "closing",
                    "count": 1,
                    "difficulty": "easy",
                    "topics": ["wrap up and candidate questions"],
                    "purpose": "close the interview"
                }
            ]
        }
    }
    
    config = topic_configs.get(topic, topic_configs["DSA"])
    categories = config["categories"]
    
    return {
        "total_questions": sum(c["count"] for c in categories),
        "estimated_duration_minutes": 25,
        "difficulty_baseline": difficulty,
        "interview_topic": topic,
        "topic_label": config["label"],
        "categories": categories
    }
