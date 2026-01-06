from deepface import DeepFace
import cv2
import numpy as np

class EmotionAnalyzer:
    def __init__(self):
        self.available_emotions = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral']
    
    def analyze_emotions(self, face_roi):
        """Analyze emotions in the face region"""
        try:
            # Convert to RGB (DeepFace expects RGB)
            rgb_face = cv2.cvtColor(face_roi, cv2.COLOR_BGR2RGB)
            
            # Analyze emotions
            analysis = DeepFace.analyze(rgb_face, actions=['emotion'], enforce_detection=False)
            
            if analysis and isinstance(analysis, list):
                return analysis[0]['emotion']
            
        except Exception as e:
            print(f"Emotion analysis error: {e}")
        
        return None