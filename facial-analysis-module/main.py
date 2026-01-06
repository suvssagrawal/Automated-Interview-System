import numpy as np 
import cv2
import time
from core.camera_handler import CameraHandler
from core.face_detector import FaceDetector
from core.emotion_analyzer import EmotionAnalyzer
from core.gaze_tracker import GazeTracker
from core.disturbance_detector import DisturbanceDetector
from core.alert_system import AlertSystem
from core.report_generator import ReportGenerator
from utils.helpers import current_timestamp

class FacialAnalysisModule:
    def __init__(self):
        self.camera = CameraHandler()
        self.face_detector = FaceDetector()
        self.emotion_analyzer = EmotionAnalyzer()
        self.gaze_tracker = GazeTracker()
        self.disturbance_detector = DisturbanceDetector()
        self.alert_system = AlertSystem()
        self.report_generator = ReportGenerator()
        
        self.interview_data = {
            "start_time": current_timestamp(),
            "emotions": [],
            "attention_scores": [],
            "disturbances": [],
            "cheating_attempts": [],
            "brightness_levels": [],
            "frames_analyzed": 0
        }
    def display_alerts(self, frame):
        """Display recent alerts on the camera frame"""
        # Safety check - ensure alert system has the required attribute
        if not hasattr(self.alert_system, 'last_alert_time'):
            return frame  # Return unchanged frame if attribute doesn't exist
        
        # Get recent alerts (last 5 seconds)
        recent_alerts = []
        current_time = time.time()
        
        for alert_type, alert_time in self.alert_system.last_alert_time.items():
            if current_time - alert_time < 5:  # Show alerts from last 5 seconds
                recent_alerts.append(alert_type)
        
        # Display alerts on frame
        y_offset = 300
        for i, alert_type in enumerate(recent_alerts[:3]):  # Show max 3 alerts
            alert_text = f"ALERT: {alert_type.replace('_', ' ').title()}"
            cv2.putText(frame, alert_text, (10, y_offset), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
            y_offset += 25
        
        return frame  # Return the modified frame    
        
    def run_interview_analysis(self, duration_minutes=30):
        """Main method to run facial analysis during interview"""
        print("Starting facial analysis for interview...")
        print("Press 'q' to end interview early")
        
        start_time = time.time()
        end_time = start_time + (duration_minutes * 60)
        
        try:
            while time.time() < end_time:
                # Capture frame
                ret, frame = self.camera.capture_frame()
                if not ret:
                    print("Failed to capture frame")
                    continue
                
                # Analyze frame
                analysis_results = self.analyze_frame(frame)
                
                # Display results (optional)
                self.display_results(frame, analysis_results)
                
                # Check for early termination
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    print("Interview terminated early by user")
                    break
                    
        except KeyboardInterrupt:
            print("Interview interrupted")
        finally:
            self.camera.release()
            cv2.destroyAllWindows()
            
            # Generate final report
            report_path = self.report_generator.generate_report(self.interview_data)
            print(f"Interview report saved to: {report_path}")
            
    def analyze_frame(self, frame):
        """Analyze a single frame for facial metrics"""
        results = {}
        
        # Detect faces
        faces = self.face_detector.detect_faces(frame)
        results['face_count'] = len(faces)
        
        if len(faces) == 0:
            self.alert_system.no_face_alert()
            self.interview_data['disturbances'].append({
                'type': 'no_face',
                'timestamp': current_timestamp()
            })
            return results
        
        # Process each face
        for i, (x, y, w, h) in enumerate(faces):
            face_roi = frame[y:y+h, x:x+w]
            
            # Check for multiple faces
            if len(faces) > 1:
                self.alert_system.multiple_faces_alert(len(faces))
                self.interview_data['disturbances'].append({
                    'type': 'multiple_faces',
                    'count': len(faces),
                    'timestamp': current_timestamp()
                })
            
            # Check brightness
            brightness = self.disturbance_detector.check_brightness(face_roi)
            if brightness < 100:  # Threshold
                self.alert_system.low_brightness_alert(brightness)
                self.interview_data['brightness_levels'].append({
                    'value': brightness,
                    'timestamp': current_timestamp()
                })
            
            # Analyze emotions
            emotions = self.emotion_analyzer.analyze_emotions(face_roi)
            if emotions:
                results[f'face_{i}_emotions'] = emotions
                self.interview_data['emotions'].append({
                    'emotions': emotions,
                    'timestamp': current_timestamp()
                })
            
            # Track gaze/attention
            attention_score = self.gaze_tracker.estimate_attention(face_roi)
            results[f'face_{i}_attention'] = attention_score
            self.interview_data['attention_scores'].append({
                'score': attention_score,
                'timestamp': current_timestamp()
            })
            
            # Check for cheating (looking away)
            if attention_score < 0.7:  # Threshold
                self.alert_system.poor_attention_alert(attention_score)
                self.interview_data['cheating_attempts'].append({
                    'score': attention_score,
                    'timestamp': current_timestamp()
                })
        
        self.interview_data['frames_analyzed'] += 1
        return results
    
    def display_results(self, frame, results):
        """Display analysis results on the frame"""
        display_frame = frame.copy()
        
        # Draw face bounding boxes
        faces = self.face_detector.detect_faces(frame)
        for (x, y, w, h) in faces:
            cv2.rectangle(display_frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
        
        # Display metrics
        y_offset = 30
        for key, value in results.items():
            if 'emotions' in key and value:
                dominant_emotion = max(value.items(), key=lambda x: x[1])[0]
                cv2.putText(display_frame, f"Emotion: {dominant_emotion}", 
                        (10, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                y_offset += 30
            elif 'attention' in key:
                cv2.putText(display_frame, f"Attention: {value:.2f}", 
                        (10, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                y_offset += 30
        
        # Display recent alerts on screen
        self.display_alerts(display_frame)
        
        cv2.imshow('Interview Analysis', display_frame)

if __name__ == "__main__":
    analyzer = FacialAnalysisModule()
    analyzer.run_interview_analysis(duration_minutes=30)