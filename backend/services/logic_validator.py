import os
import json
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


async def validate_logic(question: str, answer: str, topic: str, 
                          chat_history: list = None) -> dict:
    """
    Validate the logical consistency of a candidate's answer in real-time.
    
    Detects:
    - Wrong time/space complexity claims
    - Missing edge cases (recursion base case, null checks, boundary conditions)
    - Contradictions with previous statements
    - Incorrect technical claims
    
    Returns:
        {
            "has_issue": bool,
            "issue_type": str,  # "complexity_error"|"missing_edge_case"|"contradiction"|"incorrect_claim"|"none"
            "feedback": str,    # Human-readable feedback message
            "severity": str     # "info"|"warning"|"error"
        }
    """
    # Build context from recent chat history
    context = ""
    if chat_history:
        recent = chat_history[-6:]  # Last 3 exchanges
        context = "\n".join(f"{m['role']}: {m['content']}" for m in recent)
    
    validation_prompt = f"""You are a technical interview logic validator. Analyze the candidate's answer for logical errors.

TOPIC: {topic}
QUESTION: {question}
CANDIDATE'S ANSWER: {answer}

RECENT CONVERSATION CONTEXT:
{context}

Check for these issues (in order of severity):
1. COMPLEXITY_ERROR: Wrong time/space complexity claim (e.g., saying binary search is O(n), or merge sort is O(n))
2. MISSING_EDGE_CASE: Missing recursion base case, null/empty checks, off-by-one errors, boundary conditions
3. CONTRADICTION: Statement that contradicts something they said earlier in the conversation
4. INCORRECT_CLAIM: Factually wrong technical statement (wrong definition, wrong behavior of algorithm/data structure)

If NO issues found, return: {{"has_issue": false, "issue_type": "none", "feedback": "", "severity": "info"}}

If an issue IS found, return:
{{"has_issue": true, "issue_type": "<type>", "feedback": "<brief, encouraging feedback>", "severity": "<info|warning|error>"}}

Rules for feedback:
- Be brief (1-2 sentences max)
- Be encouraging, not accusatory (you are a mentor, not a judge)
- For warnings: phrase as "You might want to reconsider..." or "Think about..."
- For errors: phrase as "There seems to be an issue with..." or "Double-check your..."
- ONLY flag clear, definite errors — do NOT flag subjective or debatable points

Return ONLY valid JSON, no explanation."""

    try:
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "system", "content": validation_prompt}],
            temperature=0.1,
            max_tokens=150
        )
        
        raw = response.choices[0].message.content.strip()
        
        # Strip markdown fences if present
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1]
            if raw.endswith("```"):
                raw = raw[:-3]
            raw = raw.strip()
        
        result = json.loads(raw)
        
        # Validate structure
        result.setdefault("has_issue", False)
        result.setdefault("issue_type", "none")
        result.setdefault("feedback", "")
        result.setdefault("severity", "info")
        
        # Validate severity
        if result["severity"] not in ("info", "warning", "error"):
            result["severity"] = "warning"
        
        return result
        
    except Exception as e:
        print(f"Logic validation error: {e}")
        return {
            "has_issue": False,
            "issue_type": "none",
            "feedback": "",
            "severity": "info"
        }
