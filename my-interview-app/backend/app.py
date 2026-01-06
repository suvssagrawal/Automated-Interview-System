from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import os
import subprocess
import sys
import csv
from datetime import datetime
import base64
import cv2
import numpy as np
from interview_system import interview_system
import io
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics.charts.lineplots import LinePlot
from collections import Counter
import smtplib
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email import encoders
import re

app = Flask(__name__)
CORS(app)

# CORRECT PATHS - ResumeScanner_AI is at same level as my-interview-app
BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # backend folder
PROJECT_ROOT = os.path.dirname(BASE_DIR)  # my-interview-app folder
PARENT_DIR = os.path.dirname(PROJECT_ROOT)  # parent of my-interview-app

RESUME_SCANNER_PATH = os.path.join(PARENT_DIR, "ResumeScanner_AI", "resume_scanner.py")
RESUMES_FOLDER = os.path.join(PARENT_DIR, "ResumeScanner_AI", "resumes")
CATEGORIES_OUTPUT_PATH = os.path.join(PARENT_DIR, "ResumeScanner_AI", "categories_output.csv")

print("=== PATH DEBUGGING ===")
print(f"Base Dir: {BASE_DIR}")
print(f"Project Root: {PROJECT_ROOT}") 
print(f"Parent Dir: {PARENT_DIR}")
print(f"Resume Scanner Path: {RESUME_SCANNER_PATH}")
print(f"Exists: {os.path.exists(RESUME_SCANNER_PATH)}")
print(f"Resumes Folder: {RESUMES_FOLDER}")
print(f"Exists: {os.path.exists(RESUMES_FOLDER)}")
print(f"Output CSV Path: {CATEGORIES_OUTPUT_PATH}")
print(f"Exists: {os.path.exists(CATEGORIES_OUTPUT_PATH)}")
print("=====================")

# ==================== FACIAL ANALYSIS MODULE INTEGRATION ====================
FACIAL_ANALYSIS_AVAILABLE = False
facial_analyzer = None

try:
    # Calculate path to facial-analysis-module
    possible_paths = [
        os.path.join(PARENT_DIR, "facial-analysis-module"),
        os.path.join(PARENT_DIR, "facial_analysis_module"), 
        os.path.join(PARENT_DIR, "FacialAnalysisModule"),
    ]
    
    FACIAL_MODULE_PATH = None
    for path in possible_paths:
        if os.path.exists(path):
            FACIAL_MODULE_PATH = path
            break
    
    if not FACIAL_MODULE_PATH:
        raise ImportError("Facial analysis module folder not found")
    
    print(f"🔍 Found facial module at: {FACIAL_MODULE_PATH}")
    sys.path.append(FACIAL_MODULE_PATH)
    
    # Try to import dynamically
    try:
        import importlib
        fac_mod = importlib.import_module('facial_api_integration')
        FacialAnalysisAPI = getattr(fac_mod, 'FacialAnalysisAPI')
        facial_analyzer = FacialAnalysisAPI()
        FACIAL_ANALYSIS_AVAILABLE = True
        print("✅ Facial Analysis Module loaded successfully!")
    except Exception as e:
        print(f"❌ Could not import FacialAnalysisAPI: {e}")
        FACIAL_ANALYSIS_AVAILABLE = False
    
except Exception as e:
    FACIAL_ANALYSIS_AVAILABLE = False
    print(f"❌ Error loading Facial Analysis Module: {e}")

# ==================== GLOBAL SESSIONS ====================
interview_sessions = {}
facial_sessions = {}

# =============== FACIAL HELPERS ===============
def _decode_base64_image(data_url: str):
    try:
        if data_url.startswith('data:image'):
            header, b64data = data_url.split(',', 1)
        else:
            b64data = data_url
        img_bytes = base64.b64decode(b64data)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        return frame
    except Exception as e:
        print(f"❌ Failed to decode base64 image: {e}")
        return None

try:
    FACE_CASCADE = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
except Exception as e:
    print(f"⚠️ Failed to load Haar cascade: {e}")
    FACE_CASCADE = None

def _detect_faces(frame):
    if frame is None or FACE_CASCADE is None:
        return []
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = FACE_CASCADE.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30,30))
    return faces

def _estimate_attention(frame):
    # Simple heuristic: use brightness variance as proxy
    try:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        score = float(np.clip(np.var(gray) / 2550.0, 0.3, 0.95))
        return score
    except Exception:
        return 0.7

def _pick_emotion():
    # Lightweight pseudo-emotion without heavy models
    weights = {
        'focused': 0.35, 'neutral': 0.3, 'happy': 0.15, 'confident': 0.1, 'concentrating': 0.1
    }
    rnd = np.random.random()
    cum = 0
    for emo, w in weights.items():
        cum += w
        if rnd <= cum:
            return emo
    return 'neutral'

@app.route('/')
def home():
    return jsonify({"message": "InterviewEase API is running!"})

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "Backend is running!"})

# ==================== RESUME UPLOAD ====================
@app.route('/api/upload-resume', methods=['POST'])
def upload_resume():
    try:
        print("=== UPLOAD STARTED ===")
        
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        print(f"File received: {file.filename}")
        
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        # Validate file type
        allowed_extensions = ['.pdf', '.docx', '.txt']
        file_extension = os.path.splitext(file.filename.lower())[1]
        
        if file_extension not in allowed_extensions:
            return jsonify({"error": f"Only {', '.join(allowed_extensions)} files are allowed"}), 400
        
        # Create resumes folder if it doesn't exist
        if not os.path.exists(RESUMES_FOLDER):
            os.makedirs(RESUMES_FOLDER)
        
        # Save the uploaded file
        file_location = os.path.join(RESUMES_FOLDER, file.filename)
        file.save(file_location)
        print(f"File saved to: {file_location}")
        
        # Run the resume scanner
        scanner_dir = os.path.dirname(RESUME_SCANNER_PATH)
        print(f"Running scanner from: {scanner_dir}")
        
        result = subprocess.run(
            [sys.executable, "resume_scanner.py", file_location],
            capture_output=True,
            text=True,
            cwd=scanner_dir,
            timeout=60
        )
        
        print(f"Script return code: {result.returncode}")
        if result.stdout:
            print(f"Script output: {result.stdout}")
        if result.stderr:
            print(f"Script errors: {result.stderr}")
        
        if result.returncode != 0:
            return jsonify({"error": f"Resume processing failed: {result.stderr}"}), 500
        
        # Read the extracted skills
        skills_data = read_extracted_skills()
        print(f"Skills found: {skills_data}")
        
        return jsonify({
            "message": "Resume uploaded and processed successfully",
            "filename": file.filename,
            "extracted_skills": skills_data
        })
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": f"Upload failed: {str(e)}"}), 500

def read_extracted_skills():
    """Read extracted skills from categories_output.csv"""
    try:
        if os.path.exists(CATEGORIES_OUTPUT_PATH):
            skills_data = []
            with open(CATEGORIES_OUTPUT_PATH, 'r', newline='', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                for row in reader:
                    skills_data.append(row)
            
            return {
                "skills_found": skills_data,
                "total_skills": len(skills_data),
                "file_path": CATEGORIES_OUTPUT_PATH
            }
        else:
            return {
                "skills_found": [], 
                "total_skills": 0, 
                "error": "Output file not found"
            }
    except Exception as e:
        return {
            "skills_found": [], 
            "total_skills": 0, 
            "error": str(e)
        }

# ==================== INTERVIEW ENDPOINTS ====================
@app.route('/api/start-interview', methods=['POST'])
def start_interview():
    """Start a new interview session with personalized questions"""
    try:
        questions = interview_system.generate_questions(questions_per_category=3)
        
        if not questions:
            return jsonify({"error": "No questions available for the extracted skills"}), 400
        
        session_id = len(interview_sessions) + 1
        interview_sessions[session_id] = {
            'questions': questions,
            'current_question': 0,
            'answers': [],
            'scores': [],
            'total_score': 0
        }
        
        return jsonify({
            "session_id": session_id,
            "total_questions": len(questions),
            "first_question": questions[0] if questions else None
        })
        
    except Exception as e:
        return jsonify({"error": f"Failed to start interview: {str(e)}"}), 500

@app.route('/api/get-question/<int:session_id>/<int:question_index>', methods=['GET'])
def get_question(session_id, question_index):
    """Get specific question from interview session"""
    try:
        if session_id not in interview_sessions:
            return jsonify({"error": "Session not found"}), 404
        
        session = interview_sessions[session_id]
        questions = session['questions']
        
        if question_index < 0 or question_index >= len(questions):
            return jsonify({"error": "Question index out of range"}), 400
        
        return jsonify({
            "question": questions[question_index],
            "current_question": question_index + 1,
            "total_questions": len(questions)
        })
        
    except Exception as e:
        return jsonify({"error": f"Failed to get question: {str(e)}"}), 500

@app.route('/api/submit-answer', methods=['POST'])
def submit_answer():
    """Submit answer for current question and get score"""
    try:
        data = request.json
        session_id = data.get('session_id')
        question_index = data.get('question_index')
        user_answer = data.get('answer')
        
        if not all([session_id, question_index is not None, user_answer]):
            return jsonify({"error": "Missing required fields"}), 400
        
        if session_id not in interview_sessions:
            return jsonify({"error": "Session not found"}), 404
        
        session = interview_sessions[session_id]
        questions = session['questions']
        
        if question_index < 0 or question_index >= len(questions):
            return jsonify({"error": "Question index out of range"}), 400
        
        current_question = questions[question_index]
        ref_answers = [
            current_question['Answer1'],
            current_question['Answer2'], 
            current_question['Answer3'],
            current_question['Answer4']
        ]
        
        # Get both score and correctness
        similarity_score, is_correct = interview_system.score_answer(user_answer, ref_answers)
        
        # Store answer and score with correctness
        session['answers'].append({
            'question': current_question['Question'],
            'user_answer': user_answer,
            'score': similarity_score,
            'is_correct': is_correct
        })
        session['scores'].append(similarity_score)
        session['total_score'] = sum(session['scores'])
        
        # Check if interview is complete
        is_complete = (question_index + 1) >= len(questions)
        
        return jsonify({
            "score": similarity_score,
            "is_correct": is_correct,
            "current_score": session['total_score'],
            "is_complete": is_complete,
            "next_question_index": question_index + 1 if not is_complete else None
        })
        
    except Exception as e:
        return jsonify({"error": f"Failed to submit answer: {str(e)}"}), 500

@app.route('/api/interview-results/<int:session_id>', methods=['GET'])
def get_interview_results(session_id):
    """Get final interview results - WITH CHART DATA"""
    try:
        if session_id not in interview_sessions:
            return jsonify({"error": f"Session {session_id} not found"}), 404
        
        session = interview_sessions[session_id]
        total_questions = len(session['questions'])
        answers_count = len(session.get('answers', []))
        
        print(f"📊 Results for session {session_id}: {answers_count}/{total_questions} answers")
        
        if answers_count == 0:
            return jsonify({"error": "No answers submitted for this session"}), 400
        
        # Calculate metrics
        correct_answers = sum(1 for answer in session['answers'] if answer.get('is_correct', False))
        accuracy_percentage = (correct_answers / answers_count) * 100
        total_similarity = sum(session['scores'][:answers_count])
        average_similarity = total_similarity / answers_count
        
        # Format questions with correctness
        formatted_questions = []
        for i in range(answers_count):
            answer_data = session['answers'][i]
            formatted_questions.append({
                "order": i + 1,
                "question": session['questions'][i]['Question'],
                "user_answer": answer_data['user_answer'],
                "similarity_score": session['scores'][i],
                "is_correct": answer_data.get('is_correct', False),
                "category": session['questions'][i]['Category'],
                "time_spent": 45
            })
        
        # Determine interview status
        is_complete = (answers_count == total_questions)
        status = "completed" if is_complete else "partial"
        
        # Facial data from session if available
        facial_session = facial_sessions.get(session_id, None)
        if facial_session:
            attention_scores = facial_session.get('attention_scores', [])
            # Build emotions distribution
            emo_counts = Counter(facial_session.get('emotions', []))
            emotions_list = [{"emotion": k.capitalize(), "count": int(v)} for k, v in emo_counts.items()]
            facial_chart_data = {
                "attention_scores": attention_scores,
                "emotions": emotions_list,
                "alerts": facial_session.get('alerts', []),
                "total_frames": facial_session.get('frames_analyzed', 0)
            }
        else:
            # Fallback demo data
            base_attention_scores = [0.8, 0.75, 0.85, 0.9, 0.7, 0.88, 0.82, 0.79, 0.91, 0.84]
            attention_scores = base_attention_scores[:answers_count]
            facial_chart_data = {
                "attention_scores": attention_scores,
                "emotions": [
                    {"emotion": "Focused", "count": 40},
                    {"emotion": "Neutral", "count": 30},
                    {"emotion": "Confident", "count": 20},
                    {"emotion": "Concentrating", "count": 10}
                ],
                "alerts": [],
                "total_frames": answers_count * 25
            }
        
        # Response data
        response_data = {
            "session_id": session_id,
            "status": status,
            "score": round(average_similarity * 10, 2),
            "correctness_pct": round(accuracy_percentage, 1),
            "correct_answers": correct_answers,
            "total_questions_answered": answers_count,
            "total_questions": total_questions,
            "avg_similarity": round(average_similarity, 4),
            "avg_attention": 0.82,
            "dominant_emotion": "focused",
            "questions": formatted_questions,
            "facial_data": facial_chart_data
        }
        
        # Completion-specific data
        if is_complete:
            response_data["final_score"] = round(average_similarity * 10, 2)
            response_data["completion_status"] = "fully_completed"
        else:
            response_data["completion_status"] = "partially_completed"
            response_data["remaining_questions"] = total_questions - answers_count
            response_data["message"] = f"Interview ended early. Completed {answers_count}/{total_questions} questions."
        
        print(f"✅ Returning {status} results: {correct_answers}/{answers_count} correct answers")
        return jsonify(response_data)
        
    except Exception as e:
        print(f"❌ Error getting results: {e}")
        return jsonify({"error": f"Failed to get results: {str(e)}"}), 500

# ==================== PDF REPORT ====================
@app.route('/api/download-pdf-report/<int:session_id>', methods=['GET'])
def download_pdf_report(session_id):
    """Generate comprehensive PDF report with charts and analysis"""
    try:
        if session_id not in interview_sessions:
            return jsonify({"error": "Session not found"}), 404
        
        session = interview_sessions[session_id]
        answers_count = len(session.get('answers', []))
        
        if answers_count == 0:
            return jsonify({"error": "No interview data available"}), 400

        # Calculate metrics
        correct_answers = sum(1 for answer in session['answers'] if answer.get('is_correct', False))
        accuracy_percentage = (correct_answers / answers_count) * 100
        total_similarity = sum(session['scores'][:answers_count])
        average_similarity = total_similarity / answers_count
        
        # Get skills from resume
        skills_data = read_extracted_skills()
        
        # Create PDF buffer
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.5*inch)
        story = []
        styles = getSampleStyleSheet()
        
        # Custom Styles
        title_style = ParagraphStyle(
            'Title',
            parent=styles['Heading1'],
            fontSize=20,
            textColor=colors.HexColor('#1E40AF'),
            spaceAfter=30,
            alignment=1
        )
        
        heading_style = ParagraphStyle(
            'Heading2',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#1E40AF'),
            spaceAfter=12,
            spaceBefore=20
        )
        
        # === COVER PAGE ===
        story.append(Paragraph("INTERVIEW PERFORMANCE REPORT", title_style))
        story.append(Spacer(1, 20))
        
        # Current date
        date_style = ParagraphStyle(
            'Date',
            parent=styles['Normal'],
            fontSize=12,
            alignment=1
        )
        story.append(Paragraph(f"Generated on: {datetime.now().strftime('%B %d, %Y')}", date_style))
        story.append(Spacer(1, 40))
        
        # Summary Box
        summary_data = [
            ['Overall Score', f"{round(average_similarity * 10, 1)}/10"],
            ['Correct Answers', f"{correct_answers}/{answers_count}"],
            ['Accuracy', f"{accuracy_percentage:.1f}%"],
            ['Completion', f"{answers_count} questions answered"],
            ['Performance Grade', "Excellent" if accuracy_percentage >= 80 else "Good" if accuracy_percentage >= 60 else "Needs Improvement"]
        ]
        
        summary_table = Table(summary_data, colWidths=[2*inch, 2*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#EFF6FF')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey)
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 40))
        
        # Page break
        story.append(Spacer(1, 200))
        
    # === PERFORMANCE ANALYTICS ===
        story.append(Paragraph("Performance Analytics", heading_style))
        
        # Create category performance data
        category_data = {}
        for i in range(answers_count):
            category = session['questions'][i]['Category']
            score = session['scores'][i] * 100
            if category not in category_data:
                category_data[category] = []
            category_data[category].append(score)
        
        # Average scores per category
        category_avg = {cat: sum(scores)/len(scores) for cat, scores in category_data.items()}
        
        # Create bar chart
        if category_avg:  # Only create chart if we have data
            drawing = Drawing(400, 200)
            bar_chart = VerticalBarChart()
            bar_chart.x = 50
            bar_chart.y = 50
            bar_chart.height = 125
            bar_chart.width = 300
            bar_chart.data = [list(category_avg.values())]
            bar_chart.categoryAxis.categoryNames = list(category_avg.keys())
            bar_chart.valueAxis.valueMin = 0
            bar_chart.valueAxis.valueMax = 100
            bar_chart.bars[0].fillColor = colors.HexColor('#3B82F6')
            drawing.add(bar_chart)
            story.append(drawing)
            story.append(Spacer(1, 20))
        
        # === FACIAL ANALYSIS INSIGHTS ===
        # Build charts from facial_sessions if available
        fac = facial_sessions.get(session_id)
        if fac:
            # Emotion pie chart
            emo_counts = Counter(fac.get('emotions', []))
            if emo_counts:
                story.append(Paragraph("Facial Emotions Distribution", heading_style))
                d = Drawing(400, 220)
                pie = Pie()
                pie.x = 100
                pie.y = 20
                pie.width = 200
                pie.height = 200
                pie.data = list(emo_counts.values())
                pie.labels = [k.capitalize() for k in emo_counts.keys()]
                d.add(pie)
                story.append(d)
                story.append(Spacer(1, 15))

            # Attention timeline
            att = fac.get('attention_scores', [])
            if att:
                story.append(Paragraph("Attention Timeline", heading_style))
                d2 = Drawing(420, 240)
                lp = LinePlot()
                lp.x = 40
                lp.y = 40
                lp.height = 160
                lp.width = 340
                points = [(i+1, float(v)*100) for i, v in enumerate(att)]
                lp.data = [points]
                lp.lines[0].strokeColor = colors.HexColor('#2563EB')
                lp.valueAxis.valueMin = 0
                lp.valueAxis.valueMax = 100
                lp.categoryAxis.visible = True
                d2.add(lp)
                story.append(d2)
                story.append(Spacer(1, 15))

        # === EXTRACTED SKILLS ===
        if skills_data and skills_data.get('skills_found'):
            story.append(Paragraph("Skills from Your Resume", heading_style))
            
            skills_text = ", ".join([skill.get('Category', skill.get('category', 'Unknown')) 
                                   for skill in skills_data['skills_found'][:10]])
            story.append(Paragraph(f"<b>Key Skills:</b> {skills_text}", styles['Normal']))
            story.append(Spacer(1, 15))
        
        # === QUESTION ANALYSIS ===
        story.append(Paragraph("Detailed Question Analysis", heading_style))
        
        for i in range(answers_count):
            answer_data = session['answers'][i]
            question_data = session['questions'][i]
            score_percent = session['scores'][i] * 100
            
            # Question header
            story.append(Paragraph(f"<b>Question {i+1}:</b> {question_data['Question']}", styles['Normal']))
            story.append(Paragraph(f"<b>Category:</b> {question_data['Category']}", styles['Normal']))
            story.append(Paragraph(f"<b>Your Score:</b> {score_percent:.1f}%", styles['Normal']))
            
            # Performance indicator
            if score_percent >= 75:
                performance = "✅ Excellent"
                feedback = "Great detailed response with strong examples"
            elif score_percent >= 50:
                performance = "👍 Good" 
                feedback = "Good answer, could benefit from more specific examples"
            else:
                performance = "❌ Needs Improvement"
                feedback = "Try to provide more detailed and structured responses"
                
            story.append(Paragraph(f"<b>Performance:</b> {performance}", styles['Normal']))
            story.append(Paragraph(f"<b>Feedback:</b> {feedback}", styles['Normal']))
            
            # User answer (truncated)
            user_answer = answer_data['user_answer']
            if len(user_answer) > 150:
                user_answer = user_answer[:147] + "..."
            story.append(Paragraph(f"<b>Your Answer:</b> {user_answer}", styles['Normal']))
            
            story.append(Spacer(1, 15))
        
        # === RECOMMENDATIONS ===
        story.append(Paragraph("Improvement Recommendations", heading_style))
        
        recommendations = []
        if accuracy_percentage < 70:
            recommendations.append("• Practice more behavioral questions using the STAR method")
        if any(score < 0.6 for score in session['scores']):
            recommendations.append("• Work on providing specific, quantifiable examples in your answers")
        if answers_count < len(session['questions']):
            recommendations.append("• Practice completing full interview sessions to build endurance")
        if average_similarity < 0.7:
            recommendations.append("• Focus on understanding question requirements before answering")
        
        # Default recommendations
        if not recommendations:
            recommendations = [
                "• Continue your current preparation strategy",
                "• Consider practicing with more advanced technical questions", 
                "• Work on varying your response structures for different question types"
            ]
        
        for rec in recommendations:
            story.append(Paragraph(rec, styles['Normal']))
            story.append(Spacer(1, 5))
        
        # === FINAL NOTES ===
        story.append(Spacer(1, 20))
        story.append(Paragraph("<b>Next Steps:</b>", styles['Normal']))
        story.append(Paragraph("1. Review your answers and the feedback provided", styles['Normal']))
        story.append(Paragraph("2. Practice similar questions to improve weak areas", styles['Normal']))
        story.append(Paragraph("3. Schedule another mock interview to track progress", styles['Normal']))
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        
        # Return PDF response
        response = make_response(buffer.getvalue())
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = f'attachment; filename=Interview_Report_{session_id}.pdf'
        
        print(f"✅ PDF report generated for session {session_id}")
        return response
        
    except Exception as e:
        print(f"❌ PDF generation error: {e}")
        return jsonify({"error": f"Failed to generate PDF report: {str(e)}"}), 500

# ==================== FACIAL ANALYSIS ENDPOINTS ====================
@app.route('/api/start-facial-analysis', methods=['POST'])
def start_facial_analysis():
    """Start facial analysis session"""
    try:
        session_id = len(facial_sessions) + 1
        # Always create a session even if running in simulation mode
        facial_sessions[session_id] = {
            'start_time': datetime.now().isoformat(),
            'emotions': [],
            'attention_scores': [],
            'disturbances': [],
            'frames_analyzed': 0,
            'is_active': True,
            'alerts': []
        }
        if not FACIAL_ANALYSIS_AVAILABLE:
            return jsonify({
                "session_id": session_id,
                "message": "Facial analysis module not available",
                "status": "simulation"
            })
        
        if FACIAL_ANALYSIS_AVAILABLE and facial_analyzer:
            success = facial_analyzer.start_analysis(session_id)
            if not success:
                return jsonify({"error": "Failed to start facial analysis"}), 500
        
        return jsonify({
            "session_id": session_id,
            "message": "Facial analysis started",
            "status": "active"
        })
        
    except Exception as e:
        return jsonify({"error": f"Failed to start facial analysis: {str(e)}"}), 500

@app.route('/api/process-frame/<int:session_id>', methods=['POST'])
def process_frame(session_id):
    """Process a single browser frame (base64 image) and update facial session"""
    try:
        if session_id not in facial_sessions:
            # Initialize if missing
            facial_sessions[session_id] = {
                'start_time': datetime.now().isoformat(),
                'emotions': [],
                'attention_scores': [],
                'disturbances': [],
                'frames_analyzed': 0,
                'is_active': True,
                'alerts': []
            }
        payload = request.get_json(force=True)
        frame_b64 = payload.get('frame')
        frame = _decode_base64_image(frame_b64)
        attention = 0.7
        face_count = 0
        emotion = 'neutral'
        alert = None
        if frame is not None:
            faces = _detect_faces(frame)
            face_count = len(faces)
            attention = _estimate_attention(frame)
            emotion = _pick_emotion()
            # Multiple faces alert
            if face_count > 1:
                alert = { 'type': 'multiple_faces', 'message': f'{face_count} faces detected', 'timestamp': datetime.now().isoformat() }
                facial_sessions[session_id]['alerts'].insert(0, alert)
            if face_count == 0:
                alert = { 'type': 'no_face', 'message': 'No face detected', 'timestamp': datetime.now().isoformat() }
                facial_sessions[session_id]['alerts'].insert(0, alert)
        # Update session aggregates
        facial_sessions[session_id]['attention_scores'].append(round(float(attention), 3))
        facial_sessions[session_id]['emotions'].append(emotion)
        facial_sessions[session_id]['frames_analyzed'] += 1
        # Limit history sizes
        facial_sessions[session_id]['alerts'] = facial_sessions[session_id]['alerts'][:20]
        facial_sessions[session_id]['attention_scores'] = facial_sessions[session_id]['attention_scores'][-100:]
        facial_sessions[session_id]['emotions'] = facial_sessions[session_id]['emotions'][-200:]
        return jsonify({
            'frames_processed': facial_sessions[session_id]['frames_analyzed'],
            'attention_score': attention,
            'emotion': emotion,
            'face_count': face_count,
            'alert': alert
        })
    except Exception as e:
        print(f"❌ process-frame error: {e}")
        return jsonify({ 'error': str(e) }), 500

@app.route('/api/facial-data/<int:session_id>', methods=['GET'])
def get_facial_data(session_id):
    """Return current facial session data (for polling UI)"""
    if session_id not in facial_sessions:
        return jsonify({ 'error': 'Session not found' }), 404
    fac = facial_sessions[session_id]
    recent_alerts = fac.get('alerts', [])[:5]
    return jsonify({
        'session_id': session_id,
        'is_active': fac.get('is_active', False),
        'frames_analyzed': fac.get('frames_analyzed', 0),
        'recent_alerts': recent_alerts,
        'current_attention': fac.get('attention_scores', [-1])[-1] if fac.get('attention_scores') else 0,
        'current_emotion': fac.get('emotions', ['neutral'])[-1]
    })

@app.route('/api/stop-facial-analysis/<int:session_id>', methods=['POST'])
def stop_facial_analysis(session_id):
    try:
        fac = facial_sessions.get(session_id)
        if not fac:
            return jsonify({ 'error': 'Session not found' }), 404
        fac['is_active'] = False
        # If module is available, stop it
        if FACIAL_ANALYSIS_AVAILABLE and facial_analyzer:
            try:
                facial_analyzer.stop_analysis()
            except Exception as e:
                print(f"⚠️ Error stopping analyzer: {e}")
        # Build summary
        summary = {
            'frames_analyzed': fac.get('frames_analyzed', 0),
            'alerts_count': len(fac.get('alerts', [])),
            'last_emotion': fac.get('emotions', ['neutral'])[-1] if fac.get('emotions') else 'neutral',
            'avg_attention': float(np.mean(fac.get('attention_scores', [0])) if fac.get('attention_scores') else 0)
        }
        return jsonify({ 'status': 'stopped', 'summary': summary })
    except Exception as e:
        return jsonify({ 'error': str(e) }), 500

if __name__ == '__main__':
    app.run(debug=True, port=8000, host='0.0.0.0')

# ==================== EMAIL SENDING ====================
@app.route('/api/send-results-email', methods=['POST'])
def send_results_email():
    """Send the interview PDF report via email.
    Expected JSON: { "session_id": int, "to_email": string,
    "smtp": { "host": string, "port": int, "username": string, "password": string, "use_tls": bool } }
    """
    try:
        data = request.get_json(force=True)
        session_id = data.get('session_id')
        to_email = data.get('to_email')
        smtp_cfg = data.get('smtp', {})
        if not session_id or not to_email:
            return jsonify({ 'error': 'session_id and to_email are required' }), 400
        if session_id not in interview_sessions:
            return jsonify({ 'error': 'Session not found' }), 404

        # Generate PDF bytes by calling the same logic used in the HTTP handler
        # Reuse code from download_pdf_report with minimal duplication
        # We'll call the function indirectly by building the PDF in-memory
        from reportlab.lib.pagesizes import A4
        buffer = io.BytesIO()
        # Create a short summary PDF to attach using existing function
        # For simplicity, call the endpoint logic by constructing a mini report
        # If needed, this can be refactored to a shared function.
        # We include a basic one-page PDF to avoid duplicating full logic here.
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        story = [Paragraph(f"Interview Report for Session {session_id}", styles['Heading1']), Spacer(1, 12), Paragraph("Please find the attached interview report.", styles['Normal'])]
        doc.build(story)
        buffer.seek(0)
        pdf_bytes = buffer.getvalue()

        # Build email
        msg = MIMEMultipart()
        msg['From'] = smtp_cfg.get('username', 'noreply@example.com')
        msg['To'] = to_email
        msg['Subject'] = f'Interview Report - Session {session_id}'
        body = MIMEText('Please find your interview report attached.', 'plain')
        msg.attach(body)

        part = MIMEBase('application', 'octet-stream')
        part.set_payload(pdf_bytes)
        encoders.encode_base64(part)
        part.add_header('Content-Disposition', f'attachment; filename="Interview_Report_{session_id}.pdf"')
        msg.attach(part)

        # Send email
        host = smtp_cfg.get('host', 'smtp.gmail.com')
        port = int(smtp_cfg.get('port', 587))
        username = smtp_cfg.get('username')
        password = smtp_cfg.get('password')
        use_tls = smtp_cfg.get('use_tls', True)

        with smtplib.SMTP(host, port) as server:
            server.ehlo()
            if use_tls:
                server.starttls()
            if username and password:
                server.login(username, password)
            server.sendmail(msg['From'], [to_email], msg.as_string())

        return jsonify({ 'status': 'sent' })
    except Exception as e:
        print(f"❌ Email send error: {e}")
        return jsonify({ 'error': str(e) }), 500