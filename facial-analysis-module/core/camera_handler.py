import cv2

class CameraHandler:
    def __init__(self, camera_index=0):
        self.camera_index = camera_index
        self.cap = None
        self.setup_camera()
    
    def setup_camera(self):
        """Initialize camera with optimal settings"""
        self.cap = cv2.VideoCapture(self.camera_index)
        
        # Set camera properties for better face analysis
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
        self.cap.set(cv2.CAP_PROP_FPS, 30)
        self.cap.set(cv2.CAP_PROP_AUTOFOCUS, 1)
        self.cap.set(cv2.CAP_PROP_BRIGHTNESS, 0.5)
        
        if not self.cap.isOpened():
            raise Exception(f"Could not open camera with index {self.camera_index}")
    
    def capture_frame(self):
        """Capture a frame from the camera"""
        ret, frame = self.cap.read()
        return ret, frame
    
    def release(self):
        """Release camera resources"""
        if self.cap:
            self.cap.release()