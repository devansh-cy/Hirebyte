"""
Cognitive Pattern & Weakness Detection Engine

Analyzes session history to find repeated weakness patterns:
- Topic-level weakness scores
- Repeated mistakes detection
- Strong/Weak/Risk topic classification
"""


def calculate_weakness_scores(session_data: dict) -> dict:
    """
    Calculate per-topic weakness scores from a single session.
    
    Uses: answer_scores, hint_usage, question_timestamps, logical_errors, question_topics
    from the InterviewState object.
    
    Returns:
        {
            "topic_scores": {
                "DSA": {"accuracy": 7, "time_avg": 45.2, "hint_dependency": 0.3, "error_count": 1, "weakness_score": 35},
                ...
            }
        }
    """
    state = session_data.get("interview_state")
    if not state:
        return {"topic_scores": {}}
    
    topic_data = {}  # {topic: {accuracies: [], times: [], hints: int, errors: int, questions: int}}
    
    # Aggregate per-topic data
    for i, score_entry in enumerate(state.answer_scores):
        topic = state.question_topics.get(i, "GENERAL")
        
        if topic not in topic_data:
            topic_data[topic] = {
                "accuracies": [],
                "depths": [],
                "times": [],
                "hint_count": 0,
                "error_count": 0,
                "question_count": 0
            }
        
        td = topic_data[topic]
        td["accuracies"].append(score_entry.get("accuracy", 5))
        td["depths"].append(score_entry.get("depth", 5))
        td["question_count"] += 1
        
        # Time taken
        time_taken = state.get_time_taken(i)
        if time_taken > 0:
            td["times"].append(time_taken)
        
        # Hints used
        hints_for_q = state.hint_usage.get(i, [])
        td["hint_count"] += len(hints_for_q)
    
    # Count logical errors per topic
    for error in state.logical_errors:
        q_idx = error.get("question_index", 0)
        topic = state.question_topics.get(q_idx, "GENERAL")
        if topic in topic_data:
            topic_data[topic]["error_count"] += 1
    
    # Calculate weakness scores
    topic_scores = {}
    for topic, td in topic_data.items():
        avg_accuracy = sum(td["accuracies"]) / len(td["accuracies"]) if td["accuracies"] else 5
        avg_depth = sum(td["depths"]) / len(td["depths"]) if td["depths"] else 5
        avg_time = sum(td["times"]) / len(td["times"]) if td["times"] else 0
        hint_dependency = td["hint_count"] / max(1, td["question_count"])
        
        # Weakness score: 0 (strong) to 100 (very weak)
        # Components: low accuracy, high hint dependency, many errors
        weakness = 0
        weakness += max(0, (5 - avg_accuracy)) * 10  # Up to 50 for low accuracy
        weakness += min(30, hint_dependency * 20)      # Up to 30 for hint dependency
        weakness += min(20, td["error_count"] * 10)    # Up to 20 for logical errors
        weakness = min(100, max(0, weakness))
        
        topic_scores[topic] = {
            "accuracy_avg": round(avg_accuracy, 1),
            "depth_avg": round(avg_depth, 1),
            "time_avg": round(avg_time, 1),
            "hint_dependency": round(hint_dependency, 2),
            "error_count": td["error_count"],
            "question_count": td["question_count"],
            "weakness_score": round(weakness)
        }
    
    return {"topic_scores": topic_scores}


def detect_repeated_patterns(sessions: list) -> list:
    """
    Analyze multiple session histories to find repeated weakness patterns.
    
    Args:
        sessions: List of session weakness data (from calculate_weakness_scores)
    
    Returns:
        List of pattern dicts:
        [
            {"pattern": "Always slow in DP", "topic": "DSA", "frequency": 3, "severity": "high"},
            ...
        ]
    """
    if len(sessions) < 2:
        return []
    
    patterns = []
    topic_history = {}  # {topic: [{session_scores}]}
    
    # Aggregate across sessions
    for session in sessions:
        for topic, scores in session.get("topic_scores", {}).items():
            if topic not in topic_history:
                topic_history[topic] = []
            topic_history[topic].append(scores)
    
    # Detect patterns
    for topic, history in topic_history.items():
        if len(history) < 2:
            continue
        
        # Pattern: Consistently low accuracy
        low_accuracy_count = sum(1 for h in history if h["accuracy_avg"] < 5)
        if low_accuracy_count >= 2:
            patterns.append({
                "pattern": f"Consistently low accuracy in {topic}",
                "topic": topic,
                "frequency": low_accuracy_count,
                "severity": "high" if low_accuracy_count >= 3 else "medium"
            })
        
        # Pattern: High hint dependency
        high_hint_count = sum(1 for h in history if h["hint_dependency"] > 0.5)
        if high_hint_count >= 2:
            patterns.append({
                "pattern": f"Always uses heavy hints in {topic}",
                "topic": topic,
                "frequency": high_hint_count,
                "severity": "high" if high_hint_count >= 3 else "medium"
            })
        
        # Pattern: Slow response time
        slow_count = sum(1 for h in history if h["time_avg"] > 60)
        if slow_count >= 2:
            patterns.append({
                "pattern": f"Always slow in {topic}",
                "topic": topic,
                "frequency": slow_count,
                "severity": "medium"
            })
        
        # Pattern: Repeated logical errors
        error_count = sum(1 for h in history if h["error_count"] > 0)
        if error_count >= 2:
            patterns.append({
                "pattern": f"Repeated logical errors in {topic}",
                "topic": topic,
                "frequency": error_count,
                "severity": "high"
            })
    
    return sorted(patterns, key=lambda p: p["frequency"], reverse=True)


def classify_topics(topic_scores: dict) -> dict:
    """
    Classify topics into strong, weak, and risk categories.
    
    Args:
        topic_scores: Per-topic scores from calculate_weakness_scores
    
    Returns:
        {"strong": [...], "weak": [...], "risk": [...]}
    """
    strong = []
    weak = []
    risk = []
    
    for topic, scores in topic_scores.items():
        ws = scores["weakness_score"]
        
        if ws <= 20:
            strong.append({"topic": topic, "score": ws, **scores})
        elif ws >= 60:
            weak.append({"topic": topic, "score": ws, **scores})
        else:
            risk.append({"topic": topic, "score": ws, **scores})
    
    # Sort: strong by lowest weakness, weak by highest weakness
    strong.sort(key=lambda x: x["score"])
    weak.sort(key=lambda x: x["score"], reverse=True)
    risk.sort(key=lambda x: x["score"], reverse=True)
    
    return {
        "strong": strong,
        "weak": weak,
        "risk": risk
    }
