import time

class AlertSystem:
    def __init__(self):
        self.last_alert_time = {}
    
    def _can_alert(self, alert_type, cooldown=10):
        """Check if we can send this alert type (prevent spamming)"""
        current_time = time.time()
        if alert_type not in self.last_alert_time:
            self.last_alert_time[alert_type] = current_time
            return True
        
        if current_time - self.last_alert_time[alert_type] > cooldown:
            self.last_alert_time[alert_type] = current_time
            return True
        
        return False
    
    def no_face_alert(self):
        """Alert when no face is detected"""
        if self._can_alert("no_face"):
            print("ALERT: No face detected in frame. Please position yourself correctly.")
    
    def multiple_faces_alert(self, count):
        """Alert when multiple faces are detected"""
        if self._can_alert("multiple_faces"):
            print(f"ALERT: {count} faces detected. Please ensure you're alone during the interview.")
    
    def low_brightness_alert(self, brightness):
        """Alert when lighting is poor"""
        if self._can_alert("low_brightness"):
            print(f"ALERT: Low lighting detected (brightness: {brightness:.1f}). Please improve your lighting.")
    
    def poor_attention_alert(self, attention_score):
        """Alert when attention is low"""
        if self._can_alert("poor_attention"):
            print(f"ALERT: Low attention detected (score: {attention_score:.2f}). Please focus on the interview.")