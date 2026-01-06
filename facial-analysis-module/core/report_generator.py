import json
import os
import numpy as np
from datetime import datetime
from collections import Counter

class ReportGenerator:
    def __init__(self, output_dir="outputs"):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
    
    def generate_report(self, interview_data):
        """Generate a comprehensive JSON report from interview data"""
        # Create a copy that converts numpy types to Python native types
        report_data = self._convert_to_serializable(interview_data.copy())
        
        # Calculate summary statistics
        if report_data['attention_scores']:
            attention_scores = [item['score'] for item in report_data['attention_scores']]
            avg_attention = sum(attention_scores) / len(attention_scores)
        else:
            avg_attention = 0
        
        if report_data['emotions']:
            emotions = []
            for item in report_data['emotions']:
                if item['emotions']:
                    dominant_emotion = max(item['emotions'].items(), key=lambda x: x[1])[0]
                    emotions.append(dominant_emotion)
            
            emotion_counts = Counter(emotions)
            dominant_emotion = emotion_counts.most_common(1)[0][0] if emotion_counts else "unknown"
        else:
            dominant_emotion = "unknown"
        
        # Create report
        report = {
            "metadata": {
                "generated_at": datetime.now().isoformat(),
                "analysis_duration": report_data.get('duration', 'unknown'),
                "total_frames_analyzed": report_data['frames_analyzed']
            },
            "summary": {
                "average_attention_score": float(avg_attention),
                "dominant_emotion": dominant_emotion,
                "disturbance_count": len(report_data['disturbances']),
                "cheating_attempt_count": len(report_data['cheating_attempts'])
            },
            "detailed_analysis": report_data
        }
        
        # Save to file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"interview_report_{timestamp}.json"
        filepath = os.path.join(self.output_dir, filename)
        
        with open(filepath, 'w') as f:
            json.dump(report, f, indent=2)
        
        return filepath

    def _convert_to_serializable(self, data):
        """Convert numpy data types to Python native types for JSON serialization"""
        if isinstance(data, dict):
            return {k: self._convert_to_serializable(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [self._convert_to_serializable(item) for item in data]
        elif isinstance(data, (np.float32, np.float64)):
            return float(data)
        elif isinstance(data, (np.int32, np.int64)):
            return int(data)
        else:
            return data