import cv2
import numpy as np
import base64
import time
import os
import random

# --- Configuration ---
# Loading cascades directly from cv2 data
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')
smile_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_smile.xml')
profile_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_profileface.xml')

class Stabilizer:
    def __init__(self):
        # LK Params for Optical Flow
        self.lk_params = dict(winSize=(21, 21), maxLevel=3,
                              criteria=(cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 15, 0.01))
        self.feature_params = dict(maxCorners=80, qualityLevel=0.2, minDistance=5, blockSize=7)
        
        self.prev_gray = None
        self.p0 = None
        self.is_steady = False
        
        # Smoothing buffers - improved starting values for better accuracy
        self.ui_focus = 75.0
        self.ui_emotion = 55.0
        self.confidence_score = 65.0
        self.focus_score = 75.0
        self.emotion_score = 55.0
        
        # Internal high-precision float values
        self.internal_focus = 70.0
        self.internal_emotion = 50.0
        
        # Hint stabilization - prevent rapid changes
        self.current_hint = "Look at the camera and relax."
        self.hint_last_changed = time.time()
        self.hint_cooldown = 3.0  # Minimum seconds between hint changes
        
        # Eye detection history for blink detection
        self.eyes_history = []  # Store last N detections
        self.eyes_history_size = 8  # Increased buffer for better blink differentiation
        
        # CLAHE for histogram equalization in low-light conditions
        self.clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))

    def check_stability(self, gray, face_roi):
        """
        Returns True if the face is physically steady (ignoring sensor noise).
        """
        if self.p0 is None:
            if face_roi:
                (x, y, w, h) = face_roi
                mask = np.zeros_like(gray)
                mask[y:y+h, x:x+w] = 255
                self.p0 = cv2.goodFeaturesToTrack(gray, mask=mask, **self.feature_params)
            self.prev_gray = gray.copy()
            return False

        if self.prev_gray is None: return False

        # Calculate Flow
        p1, st, err = cv2.calcOpticalFlowPyrLK(self.prev_gray, gray, self.p0, None, **self.lk_params)
        
        steady = False
        if p1 is not None and len(p1) > 5:
            # Calculate average movement magnitude
            good_new = p1[st==1]
            good_old = self.p0[st==1]
            
            dists = []
            for new, old in zip(good_new, good_old):
                dist = np.linalg.norm(new - old)
                dists.append(dist)
            
            avg_dist = np.mean(dists) if dists else 0
            
            # Threshold: If avg movement < 0.6 pixels, we are "Rock Steady"
            if avg_dist < 0.6:
                steady = True
            
            self.p0 = good_new.reshape(-1, 1, 2)
        else:
            self.p0 = None # Re-init next frame
            
        self.prev_gray = gray.copy()
        self.is_steady = steady
        return steady

    def smooth(self, current_val, target_val, alpha=0.15):
        """
        Adaptive smoothing with faster response for drops, slower for rises.
        This makes drops (like closing eyes) more responsive.
        """
        if target_val < current_val:
            # Faster response for decreases (more accurate)
            effective_alpha = alpha * 2.0
        else:
            # Slower response for increases (less jittery)
            effective_alpha = alpha
        
        if self.is_steady:
            # Slower drift if steady, but still responsive
            effective_alpha *= 0.5
        
        return current_val * (1.0 - effective_alpha) + target_val * effective_alpha

    def get_ui_value(self, internal_val, last_displayed):
        """
        Hysteresis: Only update UI if change is > 1% for smoother updates.
        """
        diff = abs(internal_val - last_displayed)
        if diff > 1.0: 
            return internal_val
        return last_displayed
    
    def update_eyes_history(self, num_eyes):
        """Track eye detection history for blink vs closed eyes differentiation"""
        self.eyes_history.append(num_eyes)
        if len(self.eyes_history) > self.eyes_history_size:
            self.eyes_history.pop(0)
    
    def get_average_eyes(self):
        """Get average number of eyes detected recently"""
        if not self.eyes_history:
            return 0
        return sum(self.eyes_history) / len(self.eyes_history)
    
    def update_hint(self, focus, emotion, confidence):
        """
        Update hint with cooldown to prevent rapid changes.
        Only changes hint if cooldown has passed.
        """
        current_time = time.time()
        
        # Check if cooldown has passed
        if current_time - self.hint_last_changed < self.hint_cooldown:
            return self.current_hint
        
        # Determine appropriate hint based on current state
        if focus < 40:
            new_hint = "Open your eyes and look at the camera."
        elif focus < 60:
            new_hint = "Maintain eye contact with the lens."
        elif emotion < 30:
            new_hint = "Try to relax and smile naturally."
        elif confidence < 50:
            new_hint = "Take a deep breath and stay calm."
        elif focus >= 80 and emotion >= 60 and confidence >= 70:
            new_hint = "Excellent! You're doing great."
        elif focus >= 70:
            new_hint = "Good eye contact. Keep it up!"
        else:
            new_hint = "You're doing well. Stay focused."
        
        # Only update if hint actually changed
        if new_hint != self.current_hint:
            self.current_hint = new_hint
            self.hint_last_changed = current_time
        
        return self.current_hint


# Helper to process a base64 image
def process_video_frame(base64_image, stabilizer: Stabilizer):
    try:
        # Decode base64 image
        if ',' in base64_image:
            base64_image = base64_image.split(',')[1]
        
        image_bytes = base64.b64decode(base64_image)
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return None

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Apply CLAHE for better contrast normalization (helps in low-light)
        gray = stabilizer.clahe.apply(gray)
        
        # 1. Detection - Ultra-Stable Parameters
        # High minNeighbors to eliminate almost all false positive flicker
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=7, minSize=(80, 80))
        profiles = profile_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=6, minSize=(70, 70)) if len(faces) == 0 else []
        
        target_focus = 0.0
        target_emo = 0.0
        face_roi = None
        num_eyes = 0
        
        if len(faces) > 0:
            # Pick the largest face (most likely the primary subject)
            faces = sorted(faces, key=lambda f: f[2]*f[3], reverse=True)
            (x, y, w, h) = faces[0]
            face_roi = (x, y, w, h)
            roi_gray = gray[y:y+h, x:x+w]
            
            # Eyes detection - Strict
            roi_gray = stabilizer.clahe.apply(roi_gray)
            eyes = eye_cascade.detectMultiScale(roi_gray, scaleFactor=1.1, minNeighbors=6, minSize=(20, 20))
            num_eyes = len(eyes)
            stabilizer.update_eyes_history(num_eyes)
            avg_eyes = stabilizer.get_average_eyes()
            
            # Focus score based on eye detection - Harder thresholds for "90+" scores
            if avg_eyes >= 1.95:  # Perfectly steady eye contact
                target_focus = 98.0
            elif avg_eyes >= 1.5:  # Good eye contact
                target_focus = 85.0
            elif avg_eyes >= 1.0:  # Fair contact
                target_focus = 60.0
            elif avg_eyes >= 0.3:  # Frequent blinking or looking away
                target_focus = 35.0
            else:  # Eyes closed or looking down
                target_focus = 10.0
            
            # Smile detection - Very Strict
            smiles = smile_cascade.detectMultiScale(roi_gray, scaleFactor=1.2, minNeighbors=25, minSize=(30, 30))
            if len(smiles) > 0: 
                target_emo = 90.0
            else: 
                target_emo = 40.0  # Neutral baseline
            
        elif len(profiles) > 0:
            target_focus = 20.0  # Profile view = low focus
            target_emo = 30.0
            (x,y,w,h) = profiles[0]
            face_roi = (x,y,w,h)
            stabilizer.update_eyes_history(0)
        else:
            target_focus = 5.0  # No face detected
            target_emo = 5.0
            stabilizer.update_eyes_history(0)

        # 2. Stability Check (Optical Flow)
        stabilizer.check_stability(gray, face_roi)
        
        # 3. Smooth with tuned response curves - VERY STABLE (Low Alpha)
        stabilizer.internal_focus = stabilizer.smooth(stabilizer.internal_focus, target_focus, alpha=0.1)
        stabilizer.internal_emotion = stabilizer.smooth(stabilizer.internal_emotion, target_emo, alpha=0.08)
        
        # Update Displayed State
        stabilizer.focus_score = stabilizer.get_ui_value(stabilizer.internal_focus, stabilizer.focus_score)
        stabilizer.emotion_score = stabilizer.get_ui_value(stabilizer.internal_emotion, stabilizer.emotion_score)
        
        # Confidence calculation - Higher weight on eye contact (focus)
        # Focus weight: 75%, Emotion: 15%, Steadiness: 10%
        steady_bonus = 8 if stabilizer.is_steady else 0
        conf_target = (stabilizer.focus_score * 0.75) + (stabilizer.emotion_score * 0.15) + steady_bonus
        conf_target = min(100, max(0, conf_target))
        
        # Apply smoothing to confidence - Stable
        if conf_target < stabilizer.confidence_score:
            stabilizer.confidence_score = stabilizer.confidence_score * 0.8 + conf_target * 0.2
        else:
            stabilizer.confidence_score = stabilizer.confidence_score * 0.98 + conf_target * 0.02
        
        # Stress - inverse of confidence
        stress = max(5, min(95, 100 - stabilizer.confidence_score))

        # Get stabilized hint (with cooldown)
        hint = stabilizer.update_hint(stabilizer.focus_score, stabilizer.emotion_score, stabilizer.confidence_score)
        
        return {
            "focus": int(stabilizer.focus_score),
            "emotion": int(stabilizer.emotion_score),
            "confidence": int(stabilizer.confidence_score),
            "stress": int(stress),
            "hint": hint,
            "is_steady": stabilizer.is_steady
        }

    except Exception as e:
        print(f"Error processing frame: {e}")
        return None
