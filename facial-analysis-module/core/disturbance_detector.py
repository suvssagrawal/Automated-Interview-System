import cv2
import numpy as np

class DisturbanceDetector:
    def check_brightness(self, face_roi):
        """Check brightness level of the face region"""
        gray = cv2.cvtColor(face_roi, cv2.COLOR_BGR2GRAY)
        return np.mean(gray)
    
    def check_background_movement(self, prev_frame, current_frame):
        """Check for significant background movement (simplified)"""
        if prev_frame is None:
            return 0
        
        # Calculate frame difference
        diff = cv2.absdiff(prev_frame, current_frame)
        non_zero_count = np.count_nonzero(diff)
        total_pixels = diff.shape[0] * diff.shape[1]
        
        return non_zero_count / total_pixels    