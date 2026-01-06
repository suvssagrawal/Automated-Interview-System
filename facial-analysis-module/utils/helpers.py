import time
from datetime import datetime

def current_timestamp():
    """Get current timestamp in ISO format"""
    return datetime.now().isoformat()

def format_duration(seconds):
    """Format duration in seconds to human readable format"""
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    seconds = seconds % 60
    return f"{hours:02d}:{minutes:02d}:{seconds:02d}"