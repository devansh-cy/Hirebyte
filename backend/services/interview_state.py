import time

class InterviewState:
    """
    Tracks interview progress through the predefined plan.
    Prevents question repetition and stores answer evaluations.
    """
    
    def __init__(self, plan: dict):
        self.plan = plan
        self.current_category_idx = 0
        self.current_question_in_category = 0
        self.total_questions_asked = 0
        self.asked_topics = set()
        self.answer_scores = []  # [{question, category, accuracy, depth, clarity, topic}, ...]
        self.is_complete = False
        self.current_question_text = ""  # Track the last question asked
        
        # Feature 1: Progressive hint tracking
        self.hint_usage = {}  # {question_index: [levels_used]}
        
        # Feature 3: Per-question timing
        self.question_timestamps = {}  # {question_index: {"asked_at": float, "answered_at": float}}
        
        # Feature 2/3: Logical error tracking
        self.logical_errors = []  # [{question_index, issue_type, feedback, severity}, ...]
        
        # Feature 1: Topic classification per question
        self.question_topics = {}  # {question_index: "DSA"|"OS"|...}
    
    def get_current_step(self) -> dict | None:
        """
        Get the current interview step (category + topic to ask about).
        Returns None if the interview is complete.
        """
        categories = self.plan.get("categories", [])
        
        if self.current_category_idx >= len(categories):
            self.is_complete = True
            return None
        
        category = categories[self.current_category_idx]
        topics = category.get("topics", [])
        
        # Pick the topic for this question within the category
        topic_idx = self.current_question_in_category % len(topics) if topics else 0
        topic = topics[topic_idx] if topics else "general"
        
        return {
            "category_name": category["name"],
            "category_purpose": category.get("purpose", ""),
            "difficulty": category.get("difficulty", "medium"),
            "topic": topic,
            "question_number": self.total_questions_asked + 1,
            "total_questions": self.plan.get("total_questions", 10),
            "is_first": self.total_questions_asked == 0,
            "is_last_category": self.current_category_idx == len(categories) - 1
        }
    
    def advance(self):
        """
        Move to the next question/category after an answer is received.
        """
        categories = self.plan.get("categories", [])
        if self.current_category_idx >= len(categories):
            self.is_complete = True
            return
        
        current_category = categories[self.current_category_idx]
        self.current_question_in_category += 1
        self.total_questions_asked += 1
        
        # If we've asked enough questions for this category, move to next
        if self.current_question_in_category >= current_category.get("count", 1):
            self.current_category_idx += 1
            self.current_question_in_category = 0
        
        # Check if interview is complete
        if self.current_category_idx >= len(categories):
            self.is_complete = True
    
    def record_score(self, question: str, answer: str, category: str, topic: str, 
                     accuracy: int, depth: int, clarity: int):
        """Record an answer evaluation score."""
        self.answer_scores.append({
            "question": question,
            "answer": answer,
            "category": category,
            "topic": topic,
            "accuracy": accuracy,
            "depth": depth,
            "clarity": clarity,
            "average": round((accuracy + depth + clarity) / 3, 1)
        })
        self.asked_topics.add(topic.lower())
    
    # --- Feature 1: Hint progression ---
    
    def get_available_hint_level(self, question_index: int) -> str:
        """
        Returns the next allowed hint level for a given question.
        Enforces progression: small → medium → full.
        Returns None if all levels have been used.
        """
        used = self.hint_usage.get(question_index, [])
        if "small" not in used:
            return "small"
        elif "medium" not in used:
            return "medium"
        elif "full" not in used:
            return "full"
        return None  # All hints exhausted
    
    def record_hint_used(self, question_index: int, level: str):
        """Record that a hint was used for a question."""
        if question_index not in self.hint_usage:
            self.hint_usage[question_index] = []
        if level not in self.hint_usage[question_index]:
            self.hint_usage[question_index].append(level)
    
    def get_hint_count(self) -> int:
        """Total hints used across all questions."""
        return sum(len(levels) for levels in self.hint_usage.values())
    
    # --- Feature 3: Timing ---
    
    def mark_question_asked(self, question_index: int):
        """Record when a question was asked."""
        self.question_timestamps[question_index] = {
            "asked_at": time.time(),
            "answered_at": None
        }
    
    def mark_question_answered(self, question_index: int):
        """Record when a question was answered."""
        if question_index in self.question_timestamps:
            self.question_timestamps[question_index]["answered_at"] = time.time()
    
    def get_time_taken(self, question_index: int) -> float:
        """Get time taken for a question in seconds."""
        ts = self.question_timestamps.get(question_index)
        if ts and ts["asked_at"] and ts["answered_at"]:
            return round(ts["answered_at"] - ts["asked_at"], 1)
        return 0.0
    
    # --- Feature 2/3: Logical errors ---
    
    def record_logical_error(self, question_index: int, issue_type: str, 
                              feedback: str, severity: str):
        """Record a logical error detected in an answer."""
        self.logical_errors.append({
            "question_index": question_index,
            "issue_type": issue_type,
            "feedback": feedback,
            "severity": severity
        })
    
    def get_scores_summary(self) -> dict:
        """Get aggregate scores for the report."""
        if not self.answer_scores:
            return {
                "total_questions": 0,
                "overall_accuracy": 0,
                "overall_depth": 0, 
                "overall_clarity": 0,
                "overall_average": 0,
                "per_question": [],
                "per_category": {}
            }
        
        scores = self.answer_scores
        n = len(scores)
        
        overall_accuracy = sum(s["accuracy"] for s in scores) / n
        overall_depth = sum(s["depth"] for s in scores) / n
        overall_clarity = sum(s["clarity"] for s in scores) / n
        overall_avg = sum(s["average"] for s in scores) / n
        
        # Group by category
        per_category = {}
        for s in scores:
            cat = s["category"]
            if cat not in per_category:
                per_category[cat] = []
            per_category[cat].append(s["average"])
        
        per_category_avg = {
            cat: round(sum(vals) / len(vals), 1) 
            for cat, vals in per_category.items()
        }
        
        return {
            "total_questions": n,
            "overall_accuracy": round(overall_accuracy, 1),
            "overall_depth": round(overall_depth, 1),
            "overall_clarity": round(overall_clarity, 1),
            "overall_average": round(overall_avg, 1),
            "per_question": scores,
            "per_category": per_category_avg
        }
    
    def to_context_string(self) -> str:
        """
        Build a compact context string for the LLM about interview progress.
        Keeps the model aware of what's been covered without long history.
        """
        step = self.get_current_step()
        if not step:
            return "Interview is complete. Wrap up professionally."
        
        lines = [
            f"Progress: Question {step['question_number']}/{step['total_questions']}",
            f"Current category: {step['category_name']} ({step['category_purpose']})",
            f"Topic to ask about: {step['topic']}",
            f"Difficulty: {step['difficulty']}",
        ]
        
        if self.asked_topics:
            lines.append(f"Already covered: {', '.join(list(self.asked_topics)[-5:])}")
        
        if self.answer_scores:
            last = self.answer_scores[-1]
            lines.append(f"Last answer scored: accuracy={last['accuracy']}/10, depth={last['depth']}/10, clarity={last['clarity']}/10")
        
        return "\n".join(lines)
