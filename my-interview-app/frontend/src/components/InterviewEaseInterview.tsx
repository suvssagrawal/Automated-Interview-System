import { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Upload, FileText, Camera, Mic, CheckCircle, AlertTriangle, Eye, User, MicOff, Maximize, Minimize } from "lucide-react";
import { useCamera } from "../hooks/useCamera"; // 🎯 IMPORT THE HOOK
import { useSpeechRecognition } from "../hooks/useSpeechRecognition"; // 🎤 SPEECH-TO-TEXT
import { useFullscreen } from "../hooks/useFullscreen"; // 🖥️ FULLSCREEN

interface InterviewEaseInterviewProps {
  onStartInterview: () => void;
}

interface ExtractedSkill {
  category?: string;
  skill?: string;
  confidence?: string;
  [key: string]: string | undefined;
}

interface UploadResponse {
  message: string;
  filename: string;
  extracted_skills: {
    skills_found: ExtractedSkill[];
    total_skills: number;
    file_path?: string;
    error?: string;
  };
}

interface FacialData {
  session_id: number;
  is_active: boolean;
  frames_analyzed: number;
  recent_alerts: Array<{
    type: string;
    message: string;
    timestamp: string;
  }>;
  current_attention: number;
  current_emotion: string;
}

export function InterviewEaseInterview({ onStartInterview }: InterviewEaseInterviewProps) {
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [answering, setAnswering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answerDraft, setAnswerDraft] = useState("");
  const [scores, setScores] = useState<number[]>([]);
  const [currentScore, setCurrentScore] = useState<number | null>(null);
  
  // NEW: Facial Analysis State
  const [facialSessionId, setFacialSessionId] = useState<number | null>(null);
  const [facialData, setFacialData] = useState<FacialData | null>(null);
  const [facialAlerts, setFacialAlerts] = useState<string[]>([]);
  const facialIntervalRef = useRef<number | null>(null);
  const frameIntervalRef = useRef<number | null>(null);

  // 🎯 USE THE CAMERA HOOK
  const {
    videoRef,
    isCameraActive,
    error: cameraError,
    startCamera,
    stopCamera,
    hasCameraSupport
  } = useCamera();

  // 🎤 USE SPEECH RECOGNITION HOOK
  const {
    transcript,
    isListening,
    isSupported: isSpeechSupported,
    startListening,
    stopListening,
    resetTranscript,
    interimTranscript
  } = useSpeechRecognition({
    continuous: true,
    interimResults: true,
    lang: 'en-US'
  });

  // 🖥️ USE FULLSCREEN HOOK
  const {
    isFullscreen,
    isSupported: isFullscreenSupported,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
    fullscreenExitCount
  } = useFullscreen();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 🎥 CAMERA DEBUGGING - Add this useEffect to debug camera state
  useEffect(() => {
    console.log('🎥 Camera State Debug:', {
      isCameraActive,
      hasCameraSupport,
      cameraError,
      interviewStarted,
      facialSessionId
    });
  }, [isCameraActive, hasCameraSupport, cameraError, interviewStarted, facialSessionId]);

  // 🎥 ADD VIDEO ELEMENT DEBUGGING
  useEffect(() => {
    if (videoRef.current) {
      console.log('🎥 Video element debug:', {
        video: videoRef.current,
        srcObject: videoRef.current.srcObject,
        readyState: videoRef.current.readyState,
        videoWidth: videoRef.current.videoWidth,
        videoHeight: videoRef.current.videoHeight,
        paused: videoRef.current.paused
      });

      // Force play if needed
      if (videoRef.current.srcObject && videoRef.current.paused) {
        videoRef.current.play().catch(e => console.error('🎥 Play failed:', e));
      }
    }
  }, [isCameraActive, interviewStarted]);

  // 🎥 ADD THIS NEW EFFECT FOR VIDEO TIMING
  useEffect(() => {
    if (interviewStarted && isCameraActive && videoRef.current) {
      console.log('🔄 Interview started - forcing video refresh');
      
      // Force the video to re-initialize
      const forceVideoPlay = async () => {
        if (videoRef.current && videoRef.current.srcObject) {
          try {
            // Re-assign the stream to force refresh
            const currentStream = videoRef.current.srcObject;
            videoRef.current.srcObject = null;
            await new Promise(resolve => setTimeout(resolve, 50));
            videoRef.current.srcObject = currentStream;
            
            // Force play
            await videoRef.current.play();
            console.log('✅ Video forced to play');
          } catch (error) {
            console.error('❌ Force video play failed:', error);
          }
        }
      };
      
      forceVideoPlay();
    }
  }, [interviewStarted, isCameraActive]);

  // 🎥 CAMERA RESTART FIX
  const restartCamera = async () => {
    console.log('🔄 Restarting camera...');
    stopCamera();
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait a bit
    await startCamera();
  };

  // 🎥 AUTO-RESTART IF CAMERA NOT SHOWING
  useEffect(() => {
    if (interviewStarted && isCameraActive) {
      // If camera is active but not showing after 2 seconds, restart it
      const timer = setTimeout(() => {
        if (videoRef.current && 
            (!videoRef.current.videoWidth || !videoRef.current.videoHeight)) {
          console.log('🔄 Camera not showing - attempting restart');
          restartCamera();
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [interviewStarted, isCameraActive]);

  // 🎤 SYNC SPEECH TRANSCRIPT TO ANSWER DRAFT
  useEffect(() => {
    if (transcript) {
      setAnswerDraft((prev) => {
        // Only append if transcript has changed
        if (!prev.endsWith(transcript)) {
          return prev + transcript;
        }
        return prev;
      });
    }
  }, [transcript]);

  // 🎤 TOGGLE SPEECH RECOGNITION
  const toggleSpeechRecognition = () => {
    if (isListening) {
      stopListening();
      console.log('🎤 Stopped listening');
    } else {
      startListening();
      console.log('🎤 Started listening');
    }
  };

  // 🎥 MANUAL CAMERA TEST FUNCTION
  const testCameraManually = async () => {
    console.log('🎥 Testing camera manually...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      console.log('✅ Camera test successful - stream:', stream);
      
      // Create test video element to verify camera works
      const testVideo = document.createElement('video');
      testVideo.srcObject = stream;
      testVideo.play();
      document.body.appendChild(testVideo);
      testVideo.style.position = 'fixed';
      testVideo.style.top = '10px';
      testVideo.style.right = '10px';
      testVideo.style.width = '200px';
      testVideo.style.zIndex = '1000';
      testVideo.style.border = '2px solid red';
      
      console.log('✅ Test video element created');
      
    } catch (err) {
      console.error('❌ Camera test failed:', err);
    }
  };

  // 🎥 TEST CAMERA DISPLAY FUNCTION
  const testCameraDisplay = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      console.log('🎥 Current video stream:', videoRef.current.srcObject);
      // Create a visible test video
      const testVideo = document.createElement('video');
      testVideo.srcObject = videoRef.current.srcObject;
      testVideo.autoplay = true;
      testVideo.playsInline = true;
      testVideo.muted = true;
      testVideo.style.cssText = 'position:fixed;top:50px;right:50px;width:300px;height:200px;border:3px solid red;z-index:9999;';
      document.body.appendChild(testVideo);
    } else {
      console.log('🎥 No video stream available');
    }
  };

  // 🎥 CHECK BROWSER PERMISSIONS FUNCTION
  const checkCameraPermissions = async () => {
    try {
      // Check camera permissions
      const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
      console.log('📷 Camera permission:', permissionStatus.state);

      // Check available cameras
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');
      console.log('📷 Available cameras:', cameras);

      return { permission: permissionStatus.state, cameras: cameras.length };
    } catch (err) {
      console.error('❌ Permission check failed:', err);
      return { permission: 'unknown', cameras: 0 };
    }
  };

  // Focus the textarea whenever a (new) current question becomes available
  useEffect(() => {
    if (interviewStarted && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [interviewStarted, currentQuestionIndex, questions.length]);

  // NEW: Poll for facial data when interview is active
  useEffect(() => {
    if (interviewStarted && facialSessionId) {
      // Start polling for facial data
      facialIntervalRef.current = window.setInterval(fetchFacialData, 2000); // Poll every 2 seconds
      
      return () => {
        if (facialIntervalRef.current) {
          window.clearInterval(facialIntervalRef.current);
        }
      };
    }
  }, [interviewStarted, facialSessionId]);

  // NEW: Frame capture and sending
  const captureAndSendFrame = async () => {
    if (!videoRef.current || !facialSessionId || !isCameraActive) return;
    
    try {
      // Create canvas to capture frame
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return;
      
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      // Draw current video frame to canvas
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      // Convert to base64
      const frameData = canvas.toDataURL('image/jpeg', 0.8);
      
      // Send to backend for analysis
      const response = await fetch(`http://127.0.0.1:8000/api/process-frame/${facialSessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          frame: frameData
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        // Update facial data with real analysis
        setFacialData(prev => {
          if (!prev) {
            // Create new facial data object if none exists
            return {
              session_id: facialSessionId,
              is_active: true,
              frames_analyzed: result.frames_processed || 0,
              recent_alerts: [],
              current_attention: result.attention_score || 0,
              current_emotion: result.emotion || 'neutral'
            };
          }
          // Update existing facial data
          return {
            ...prev,
            current_attention: result.attention_score || prev.current_attention,
            current_emotion: result.emotion || prev.current_emotion,
            frames_analyzed: result.frames_processed || prev.frames_analyzed
          };
        });
      }
    } catch (err) {
      console.error('Failed to process frame:', err);
    }
  };

  // Start frame capture when camera is active
  useEffect(() => {
    if (isCameraActive && facialSessionId) {
      frameIntervalRef.current = window.setInterval(captureAndSendFrame, 2000); // Every 2 seconds
    }
    
    return () => {
      if (frameIntervalRef.current) {
        window.clearInterval(frameIntervalRef.current);
      }
    };
  }, [isCameraActive, facialSessionId]);

  const fetchFacialData = async () => {
    if (!facialSessionId) return;
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/facial-data/${facialSessionId}`);
      const data = await response.json();
      
      if (response.ok) {
        setFacialData(data);
        
        // Update alerts
        if (data.recent_alerts && data.recent_alerts.length > 0) {
          const newAlerts = data.recent_alerts.map((alert: any) => alert.message);
          setFacialAlerts(prev => [...newAlerts, ...prev].slice(0, 5)); // Keep last 5 alerts
        }
      }
    } catch (err) {
      console.error('Failed to fetch facial data:', err);
    }
  };

  const startFacialAnalysis = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/start-facial-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to start facial analysis');
      }

      setFacialSessionId(result.session_id);
      console.log('🎯 Facial analysis started with session:', result.session_id);
      
    } catch (err) {
      console.error('Failed to start facial analysis:', err);
      // Don't block interview if facial analysis fails
    }
  };

  const stopFacialAnalysis = async () => {
    if (!facialSessionId) return;
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/stop-facial-analysis/${facialSessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        console.log('🎯 Facial analysis stopped. Data:', result.summary);
        // Data is automatically stored in backend and local JSON file
      }
      
      // Clear intervals
      if (facialIntervalRef.current) {
        window.clearInterval(facialIntervalRef.current);
      }
      if (frameIntervalRef.current) {
        window.clearInterval(frameIntervalRef.current);
      }
      
    } catch (err) {
      console.error('Failed to stop facial analysis:', err);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['.pdf', '.docx', '.txt'];
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(fileExtension)) {
      setError('Please upload PDF, DOCX, or TXT files only');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/upload-resume', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setResumeUploaded(true);
      setUploadResult(result);
      console.log('Upload successful:', result);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed - check if backend is running');
    } finally {
      setLoading(false);
    }
  };

  // 🎥 MODIFIED START INTERVIEW WITH BETTER CAMERA HANDLING
  const startInterview = async () => {
    setLoading(true);
    try {
      console.log('🎥 Starting camera...');
      
      // 🎯 FORCE CAMERA START FIRST
      await startCamera();
      
      // Wait a bit for camera to initialize
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('🎥 Camera started, starting facial analysis...');
      
      // Then start facial analysis
      await startFacialAnalysis();
      
      console.log('🎯 Starting interview session...');
      
      // 🖥️ ENTER FULLSCREEN MODE for anti-cheating
      if (isFullscreenSupported) {
        await enterFullscreen();
        console.log('✅ Entered fullscreen mode');
      }
      
      // Then start interview session
      const response = await fetch('http://127.0.0.1:8000/api/start-interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to start interview');
      }

      setSessionId(result.session_id);
      setQuestions([result.first_question]);
      setShowInstructions(false);
      setInterviewStarted(true);
      
      console.log('✅ Interview started successfully');
      
    } catch (err) {
      console.error('❌ Interview start failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to start interview');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!sessionId || currentQuestionIndex >= questions.length) return;
    
    setAnswering(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/submit-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          question_index: currentQuestionIndex,
          answer: answerDraft
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit answer');
      }

      // Store score and update state
      setScores(prev => [...prev, result.score]);
      setCurrentScore(result.current_score);
      
      if (result.is_complete) {
        // Interview completed - STOP CAMERA, SPEECH AND FACIAL ANALYSIS
        stopCamera();
        stopListening(); // Stop speech recognition
        await stopFacialAnalysis();
        
        // Exit fullscreen
        if (isFullscreen) {
          await exitFullscreen();
        }
        
        // 🎯 CRITICAL: Save session data before navigating
        if (sessionId) {
          window.sessionStorage.setItem('session_id', sessionId.toString());
          console.log('✅ Session ID saved to storage:', sessionId);
        }
        
        onStartInterview(); // This should go to results page
      } else {
        // Get next question
        const nextQuestionResponse = await fetch(
          `http://127.0.0.1:8000/api/get-question/${sessionId}/${result.next_question_index}`
        );
        
        const nextQuestion = await nextQuestionResponse.json();
        
        if (!nextQuestionResponse.ok) {
          throw new Error(nextQuestion.error || 'Failed to get next question');
        }

        setQuestions(prev => [...prev, nextQuestion.question]);
        setCurrentQuestionIndex(result.next_question_index);
        setAnswerDraft('');
        resetTranscript(); // Clear speech transcript for next question
        stopListening(); // Stop listening for next question (user can restart)
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit answer');
    } finally {
      setAnswering(false);
    }
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (answerDraft.trim() && !answering && currentQuestionIndex < scores.length) {
        e.preventDefault();
        submitAnswer();
      }
    }
  };

  // REPLACE the endInterviewEarly function with this:
  const endInterviewEarly = async () => {
    console.log('🛑 Ending interview early...');
    
    // Stop camera, speech recognition and facial analysis
    stopCamera();
    stopListening();
    await stopFacialAnalysis();
    
    // Exit fullscreen
    if (isFullscreen) {
      await exitFullscreen();
    }
    
    // 🎯 CRITICAL: Save session data before navigating
    if (sessionId) {
      window.sessionStorage.setItem('session_id', sessionId.toString());
      console.log('✅ Session ID saved to storage:', sessionId);
    } else {
      console.error('❌ No sessionId found to save!');
    }
    
    console.log('✅ Interview ended, navigating to results...');
    onStartInterview(); // Navigate to results
  };

  const currentQuestion = questions[currentQuestionIndex];
  const isAnswered = currentQuestionIndex < scores.length;
  const charCount = answerDraft.length;
  const wordCount = answerDraft.trim() ? answerDraft.trim().split(/\s+/).filter(Boolean).length : 0;

  // Get attention color based on score
  const getAttentionColor = (score: number) => {
    if (score >= 0.7) return "text-green-600";
    if (score >= 0.5) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI Interview Session
          </h1>
          <p className="text-gray-600">
            Follow the steps below to begin your interview practice
          </p>
        </div>

        {/* 🖥️ FULLSCREEN WARNING BANNER */}
        {interviewStarted && !isFullscreen && fullscreenExitCount > 0 && (
          <div className="mb-6 bg-red-50 border-2 border-red-300 rounded-xl p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-bold text-red-900">
                  ⚠️ Fullscreen Mode Exited ({fullscreenExitCount} {fullscreenExitCount === 1 ? 'time' : 'times'})
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  You have exited fullscreen mode during the interview. This may be flagged as suspicious behavior.
                </p>
              </div>
              {isFullscreenSupported && (
                <Button
                  onClick={enterFullscreen}
                  variant="destructive"
                  size="sm"
                  className="flex-shrink-0"
                >
                  <Maximize className="h-4 w-4 mr-2" />
                  Re-enter Fullscreen
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Left Panel - Resume Upload with Skills Display */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg rounded-2xl">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Upload Resume
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div 
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                    resumeUploaded 
                      ? 'border-green-300 bg-green-50' 
                      : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {loading ? (
                    <div className="space-y-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-sm font-medium text-gray-700">Processing...</p>
                    </div>
                  ) : resumeUploaded ? (
                    <div className="space-y-2">
                      <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                      <p className="text-sm font-medium text-green-800">Resume Uploaded</p>
                      <p className="text-xs text-green-600">{uploadResult?.filename}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                      <p className="text-sm font-medium text-gray-700">Click to upload</p>
                      <p className="text-xs text-gray-500">PDF, DOCX, TXT files</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <p className="text-xs text-gray-500 text-center">
                  Upload your resume to get personalized questions
                </p>
                
                {/* Error Display */}
                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="text-sm text-red-800 font-medium">Error</div>
                    <div className="text-xs text-red-700">{error}</div>
                  </div>
                )}

                {/* Success Message with Skills */}
                {uploadResult && (
                  <div className="mt-4 space-y-3">
                    <div className="text-sm text-green-800 bg-green-50 p-2 rounded border border-green-200">
                      ✅ Found {uploadResult.extracted_skills.total_skills} skills!
                    </div>
                    
                    {/* Skills Display */}
                    {uploadResult.extracted_skills.skills_found.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-gray-700">Skills for Interview:</div>
                        <div className="flex flex-wrap gap-1">
                          {uploadResult.extracted_skills.skills_found.slice(0, 6).map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {skill.Category || skill.category || skill.skill}
                            </Badge>
                          ))}
                          {uploadResult.extracted_skills.total_skills > 6 && (
                            <Badge variant="outline" className="text-xs">
                              +{uploadResult.extracted_skills.total_skills - 6} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 🎥 TEMPORARY CAMERA TEST BUTTONS */}
                <Button 
                  onClick={testCameraManually}
                  variant="outline" 
                  className="mt-4 w-full"
                  size="sm"
                >
                  Test Camera Manually
                </Button>

                <Button 
                  onClick={testCameraDisplay}
                  variant="outline" 
                  className="mt-2 w-full"
                  size="sm"
                >
                  Test Camera Display
                </Button>

                <Button 
                  onClick={checkCameraPermissions}
                  variant="outline" 
                  className="mt-2 w-full"
                  size="sm"
                >
                  Check Camera Permissions
                </Button>

                <Button 
                  onClick={restartCamera}
                  variant="outline" 
                  className="mt-2 w-full"
                  size="sm"
                >
                  Restart Camera
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Center Panel - Interview Questions */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg rounded-2xl min-h-[500px]">
              <CardContent className="p-8">
                {showInstructions ? (
                  <div className="text-center space-y-6">
                    <div className="bg-blue-50 rounded-2xl p-8">
                      <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                        Interview Instructions
                      </h2>
                      <div className="space-y-4 text-left max-w-md mx-auto">
                        <div className="flex items-center gap-3">
                          <Camera className="h-5 w-5 text-blue-600" />
                          <span className="text-gray-700">Make sure your camera is on</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Mic className="h-5 w-5 text-blue-600" />
                          <span className="text-gray-700">Check your microphone</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <span className="text-gray-700">Upload your resume (optional)</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="lg"
                      onClick={startInterview}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-lg px-12 py-4 rounded-2xl shadow-lg"
                    >
                      OK, Start Interview
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="text-center mb-8">
                      <div className="bg-gray-100 rounded-xl px-4 py-2 inline-block mb-4">
                        <span className="text-sm font-medium text-gray-600">
                          Question {currentQuestionIndex + 1} of {questions.length}
                          {currentScore !== null && ` • Score: ${currentScore.toFixed(2)}`}
                        </span>
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-6">
                        AI Interview Question
                      </h2>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
                      <p className="text-lg text-gray-800 leading-relaxed text-center mb-4">
                        {currentQuestion?.Question || 'Loading question...'}
                      </p>
                      {currentQuestion?.Category && (
                        <div className="text-center">
                          <Badge variant="outline" className="text-xs">
                            {currentQuestion.Category}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Show previous score if available */}
                    {scores[currentQuestionIndex - 1] !== undefined && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                        <div className="text-center">
                          <div className="text-sm font-medium text-yellow-800">
                            Previous Question Score: {(scores[currentQuestionIndex - 1] * 10).toFixed(1)}/10
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="text-center pt-6">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-full flex flex-col gap-1">
                          <textarea
                            ref={textareaRef}
                            className="w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={5}
                            placeholder="Type your answer here... (Be detailed for better scoring) Or use speech-to-text 🎤"
                            value={answerDraft}
                            onChange={e => setAnswerDraft(e.target.value)}
                            onKeyDown={handleTextareaKeyDown}
                            disabled={isAnswered || answering}
                          />
                          <div className="flex justify-between text-xs text-gray-500 px-1">
                            <span>
                              {wordCount} word{wordCount === 1 ? '' : 's'} • {charCount} char{charCount === 1 ? '' : 's'}
                              {isListening && <span className="ml-2 text-red-600 animate-pulse">● Recording speech...</span>}
                              {interimTranscript && <span className="ml-2 text-blue-600 italic">"{interimTranscript}"</span>}
                            </span>
                            {isAnswered && <span className="text-green-600 font-medium">✓ Answer submitted</span>}
                            {answering && <span className="text-blue-600 font-medium">Submitting...</span>}
                          </div>
                        </div>
                        <div className="flex gap-3 flex-wrap justify-center">
                          {/* Speech-to-Text Button */}
                          {isSpeechSupported && (
                            <Button
                              type="button"
                              variant={isListening ? "destructive" : "outline"}
                              size="lg"
                              onClick={toggleSpeechRecognition}
                              disabled={isAnswered || answering}
                              className={`px-6 py-3 rounded-2xl ${
                                isListening 
                                  ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' 
                                  : 'border-blue-300 text-blue-600 hover:bg-blue-50'
                              }`}
                            >
                              {isListening ? (
                                <>
                                  <MicOff className="h-5 w-5 mr-2" />
                                  Stop Recording
                                </>
                              ) : (
                                <>
                                  <Mic className="h-5 w-5 mr-2" />
                                  Voice Input
                                </>
                              )}
                            </Button>
                          )}
                          
                          <Button
                            size="lg"
                            disabled={answering || !answerDraft.trim() || isAnswered}
                            onClick={submitAnswer}
                            className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3 rounded-2xl"
                          >
                            {isAnswered ? 'Submitted' : (answering ? 'Submitting...' : 'Submit Answer')}
                          </Button>
                          
                          {/* End Interview Early Button */}
                          <Button
                            variant="outline"
                            onClick={endInterviewEarly}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            End Interview
                          </Button>
                          
                          {/* Fullscreen Toggle Button */}
                          {isFullscreenSupported && (
                            <Button
                              variant="outline"
                              onClick={toggleFullscreen}
                              className="border-blue-300 text-blue-600 hover:bg-blue-50"
                              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                            >
                              {isFullscreen ? (
                                <>
                                  <Minimize className="h-4 w-4 mr-2" />
                                  Exit Fullscreen
                                </>
                              ) : (
                                <>
                                  <Maximize className="h-4 w-4 mr-2" />
                                  Fullscreen
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 text-center">
                      <p className="text-sm text-gray-500">
                        Provide detailed answers for better scoring
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Live Camera Feed with Facial Analysis - FIXED */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg rounded-2xl">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-lg">
                  <Camera className="h-5 w-5 text-blue-600" />
                  Live Camera Feed
                  {isCameraActive && (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      ● Live
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 🎥 LIVE CAMERA FEED - FIXED */}
                <div className="bg-gray-900 rounded-xl h-48 flex items-center justify-center relative overflow-hidden">
                  {interviewStarted && isCameraActive ? (
                    // REAL CAMERA FEED - ENHANCED
                    <video 
                      ref={videoRef}
                      autoPlay 
                      playsInline
                      muted
                      className="w-full h-full object-cover rounded-xl bg-black"
                      style={{
                        transform: 'scaleX(-1)', // Mirror effect
                        display: 'block' // Ensure it's visible
                      }}
                      onLoadedData={() => console.log('🎥 Video data loaded')}
                      onCanPlay={() => console.log('🎥 Video can play')}
                      onPlaying={() => console.log('🎥 Video is playing')}
                    />
                  ) : (
                    // Placeholder when not started
                    <div className="text-center text-white">
                      <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm opacity-75">Camera Preview</p>
                      <p className="text-xs opacity-50 mt-1">Will activate when interview starts</p>
                    </div>
                  )}
                  
                  {/* 🎥 TEMPORARY VISUAL INDICATOR */}
                  {interviewStarted && isCameraActive && (
                    <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                      Video Element Active
                    </div>
                  )}
                  
                  {/* Recording Indicator */}
                  {isCameraActive && (
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-white font-medium">LIVE</span>
                    </div>
                  )}
                </div>

                {/* Camera Status Display */}
                <div className="text-xs text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Camera Status:</span>
                    <span className={isCameraActive ? "text-green-600 font-medium" : "text-yellow-600"}>
                      {isCameraActive ? "Active" : "Ready"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Permission:</span>
                    <span className="text-green-600 font-medium">Granted</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cameras Found:</span>
                    <span className="text-green-600 font-medium">1</span>
                  </div>
                </div>

                {/* Camera Error Display */}
                {cameraError && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-700">{cameraError}</p>
                  </div>
                )}

                {/* Facial Analysis Metrics */}
                {facialData && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-blue-600" />
                        <span>Attention:</span>
                      </div>
                      <span className={`font-medium ${getAttentionColor(facialData.current_attention)}`}>
                        {(facialData.current_attention * 100).toFixed(0)}%
                      </span>
                      
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-purple-600" />
                        <span>Emotion:</span>
                      </div>
                      <span className="font-medium text-gray-700 capitalize">
                        {facialData.current_emotion}
                      </span>
                      
                      <div className="flex items-center gap-2">
                        <Camera className="h-4 w-4 text-green-600" />
                        <span>Frames:</span>
                      </div>
                      <span className="font-medium text-gray-700">
                        {facialData.frames_analyzed}
                      </span>
                    </div>
                  </div>
                )}

                {/* Real-time Alerts */}
                {facialAlerts.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="text-xs font-medium text-gray-700 flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3 text-orange-500" />
                      Recent Alerts:
                    </div>
                    <div className="space-y-1 max-h-20 overflow-y-auto">
                      {facialAlerts.map((alert, index) => (
                        <div key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                          ⚠️ {alert}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status Information */}
                <div className="text-xs text-gray-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Video Quality</span>
                    <span className="text-green-600 font-medium">HD</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Facial Analysis</span>
                    <span className={facialSessionId ? "text-green-600 font-medium" : "text-gray-600"}>
                      {facialSessionId ? "Active" : "Ready"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}