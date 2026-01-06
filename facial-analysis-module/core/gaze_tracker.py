import cv2
import numpy as np

class GazeTracker:
    def __init__(self):
        # Load eye cascade
        self.eye_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_eye.xml'
        )
    
    def estimate_attention(self, face_roi):
        """Estimate attention level based on eye position"""
        gray_face = cv2.cvtColor(face_roi, cv2.COLOR_BGR2GRAY)
        
        # Detect eyes
        eyes = self.eye_cascade.detectMultiScale(
            gray_face,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(20, 20)
        )
        
        if len(eyes) < 2:
            return 0.3  # Low attention if eyes not clearly visible
        
        # Simple attention estimation based on eye position
        # For a more accurate solution, consider using mediapipe or dlib
        height, width = face_roi.shape[:2]
        attention_score = 0.7  # Base score
        
        # Adjust based on eye positions
        for (ex, ey, ew, eh) in eyes:
            eye_center_x = ex + ew/2
            # If eyes are near the center of the face, increase attention score
            if 0.4 * width < eye_center_x < 0.6 * width:
                attention_score += 0.1
            else:
                attention_score -= 0.1
        
        # Ensure score is between 0 and 1
        return max(0.1, min(1.0, attention_score))