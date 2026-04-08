def analyze_speech_confidence(text: str, duration_seconds: float, 
                               silence_duration: float = 0.0) -> dict:
    """
    Analyze speech confidence from transcribed text and timing data.
    
    Args:
        text: Transcribed text from user's speech
        duration_seconds: Total duration of the audio recording (speaking time)
        silence_duration: Time gap before user started speaking (hesitation)
    
    Returns:
        {
            "wpm": float,           # Words per minute
            "filler_rate": float,   # Percentage of words that are fillers
            "filler_count": int,    # Total filler words found
            "pace": str,            # "too_slow"|"slow"|"normal"|"fast"|"too_fast"
            "confidence_level": str, # "low"|"medium"|"high"
            "long_silence": bool,    # True if silence > 3 seconds
            "feedback": str          # Human-readable feedback message
        }
    """
    words = text.split()
    word_count = len(words)
    
    # Calculate WPM
    if duration_seconds > 0:
        wpm = (word_count / duration_seconds) * 60
    else:
        wpm = 0
    
    # Filler word detection
    filler_words = ["um", "uh", "like", "you know", "basically", "actually", 
                    "literally", "so", "well", "right", "okay", "I mean",
                    "kind of", "sort of", "you see"]
    
    text_lower = text.lower()
    filler_count = 0
    for filler in filler_words:
        filler_count += text_lower.count(filler)
    
    filler_rate = (filler_count / max(1, word_count)) * 100
    
    # Pace classification
    if wpm < 80:
        pace = "too_slow"
    elif wpm < 110:
        pace = "slow"
    elif wpm <= 160:
        pace = "normal"
    elif wpm <= 190:
        pace = "fast"
    else:
        pace = "too_fast"
    
    # Silence detection
    long_silence = silence_duration > 3.0
    
    # Overall confidence scoring
    confidence_score = 100
    
    # Deductions for pace issues
    if pace == "too_slow":
        confidence_score -= 30
    elif pace == "slow":
        confidence_score -= 15
    elif pace == "fast":
        confidence_score -= 10
    elif pace == "too_fast":
        confidence_score -= 25
    
    # Deductions for fillers
    if filler_rate > 15:
        confidence_score -= 25
    elif filler_rate > 8:
        confidence_score -= 15
    elif filler_rate > 4:
        confidence_score -= 5
    
    # Deductions for long silence
    if long_silence:
        confidence_score -= 20
    
    # Deductions for very short answers (possibly unsure)
    if word_count < 10 and duration_seconds > 3:
        confidence_score -= 15
    
    confidence_score = max(0, min(100, confidence_score))
    
    if confidence_score >= 70:
        confidence_level = "high"
    elif confidence_score >= 40:
        confidence_level = "medium"
    else:
        confidence_level = "low"
    
    # Generate feedback
    feedback = _generate_feedback(pace, filler_rate, long_silence, 
                                   silence_duration, confidence_level, wpm)
    
    return {
        "wpm": round(wpm, 1),
        "filler_rate": round(filler_rate, 1),
        "filler_count": filler_count,
        "pace": pace,
        "confidence_level": confidence_level,
        "confidence_score": confidence_score,
        "long_silence": long_silence,
        "silence_duration": round(silence_duration, 1),
        "feedback": feedback
    }


def _generate_feedback(pace: str, filler_rate: float, long_silence: bool,
                        silence_duration: float, confidence_level: str, 
                        wpm: float) -> str:
    """
    Generate encouraging, contextual feedback about speaking confidence.
    Prioritizes the most impactful issue.
    """
    # Priority 1: Long silence
    if long_silence and silence_duration > 5:
        return f"You paused for {silence_duration:.0f} seconds before answering. It's okay to take a moment to think, but try forming your thoughts a bit faster."
    
    if long_silence:
        return "You seem unsure about this one. Take a breath and explain what you do know — partial answers are perfectly fine."
    
    # Priority 2: Very high filler rate
    if filler_rate > 15:
        return "You're using a lot of filler words. Try pausing briefly instead of saying 'um' — it actually makes you sound more confident."
    
    # Priority 3: Pace issues
    if pace == "too_slow":
        return f"You're speaking quite slowly ({wpm:.0f} WPM). Try to maintain a slightly faster, more natural pace to keep the interviewer engaged."
    
    if pace == "too_fast":
        return f"You're speaking very fast ({wpm:.0f} WPM). Slow down a bit — clear articulation is more impactful than speed."
    
    # Priority 4: Medium filler rate
    if filler_rate > 8:
        return "Watch out for filler words like 'um' and 'like'. Brief pauses between ideas sound much more polished."
    
    # Priority 5: Pace slightly off
    if pace == "slow":
        return "Try to pick up your pace slightly — confident speakers typically talk at 120-150 WPM."
    
    if pace == "fast":
        return "Good energy! Just make sure to slow down for key technical points so they land clearly."
    
    # All good
    if confidence_level == "high":
        return "Great delivery! You sound confident and well-paced."
    
    return "Good pace and clarity. Keep it up!"
