import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Upload, FileText, Camera, Mic, CheckCircle } from "lucide-react";

interface InterviewEaseInterviewProps {
  onStartInterview: () => void;
}

interface BackendQuestion {
  id: number;
  order: number;
  question: string;
  category?: string;
  answered?: boolean;
}

export function InterviewEaseInterview({ onStartInterview }: InterviewEaseInterviewProps) {
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<BackendQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [answering, setAnswering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answerDraft, setAnswerDraft] = useState("");
  // Track answered status per question id for enabling / disabling navigation
  const [answeredMap, setAnsweredMap] = useState<Record<number, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus the textarea whenever a (new) current question becomes available
  useEffect(() => {
    if (interviewStarted && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [interviewStarted, currentQuestionIndex, questions.length]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('email', 'candidate@example.com'); // placeholder email
    formData.append('name', 'Candidate User');
    formData.append('create_session', 'true');
    setLoading(true);
    fetch('/api/upload-resume', { method: 'POST', body: formData })
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return; }
        setResumeUploaded(true);
        if (data.session_id) {
          setSessionId(data.session_id);
          window.sessionStorage.setItem('session_id', String(data.session_id));
        }
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  };

  const startInterview = () => {
    if (sessionId) {
      setLoading(true);
      fetch('/api/start-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'candidate@example.com', session_id: sessionId })
      })
        .then(r => r.json())
        .then(d => {
          if (d.error) { setError(d.error); return; }
          setShowInstructions(false);
          setInterviewStarted(true);
          // Immediately fetch first question
          loadNextQuestion(d.session_id);
          window.sessionStorage.setItem('session_id', String(d.session_id));
        })
        .catch(e => setError(String(e)))
        .finally(() => setLoading(false));
    } else {
      // Fallback: start without resume
      setLoading(true);
      fetch('/api/start-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'candidate@example.com' })
      })
        .then(r => r.json())
        .then(d => {
          if (d.error) { setError(d.error); return; }
          setSessionId(d.session_id);
          window.sessionStorage.setItem('session_id', String(d.session_id));
          setShowInstructions(false);
          setInterviewStarted(true);
          loadNextQuestion(d.session_id);
        })
        .catch(e => setError(String(e)))
        .finally(() => setLoading(false));
    }
  };

  const loadNextQuestion = (sid: number) => {
    fetch(`/api/get-next-question?session_id=${sid}`)
      .then(r => r.json())
      .then(d => {
        if (d.done) {
          onStartInterview();
        } else if (d.question) {
          setQuestions((qs: BackendQuestion[]) => {
            const exists = qs.find((q: BackendQuestion) => q.id === d.question.id);
            if (exists) return qs; // already have
            return [...qs, d.question];
          });
          setCurrentQuestionIndex((qi: number) => qi); // no change yet
        }
      })
      .catch(e => setError(String(e)));
  };

  const submitAnswer = () => {
    const q = questions[currentQuestionIndex];
    if (!q || !sessionId) return;
    setAnswering(true);
    fetch('/api/submit-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, question_id: q.id, answer: answerDraft })
    })
      .then(r => r.json())
      .then(() => {
        setAnswerDraft('');
        // Mark answered
  setAnsweredMap((prev: Record<number, boolean>) => ({ ...prev, [q.id]: true }));
        setCurrentQuestionIndex((idx: number) => idx);
        loadNextQuestion(sessionId);
      })
      .catch(e => setError(String(e)))
      .finally(() => setAnswering(false));
  };

  const nextQuestion = () => {
    // Advance only if current question has been answered
    const q = questions[currentQuestionIndex];
    if (!q) return;
    if (!answeredMap[q.id]) return;
    setCurrentQuestionIndex((i: number) => i + 1);
    if (sessionId) loadNextQuestion(sessionId);
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // Submit on Enter (single line) if there is content and not already answered
      const q = questions[currentQuestionIndex];
      if (q && answerDraft.trim() && !answeredMap[q.id] && !answering) {
        e.preventDefault();
        submitAnswer();
      }
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const isAnswered = currentQuestion ? !!answeredMap[currentQuestion.id] : false;
  const charCount = answerDraft.length;
  const wordCount = answerDraft.trim() ? answerDraft.trim().split(/\s+/).filter(Boolean).length : 0;

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

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Left Panel - Resume Upload */}
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
                  {resumeUploaded ? (
                    <div className="space-y-2">
                      <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                      <p className="text-sm font-medium text-green-800">Resume Uploaded</p>
                      <p className="text-xs text-green-600">resume.pdf</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                      <p className="text-sm font-medium text-gray-700">Click to upload</p>
                      <p className="text-xs text-gray-500">PDF files only</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <p className="text-xs text-gray-500 text-center">
                  Upload your resume to get personalized questions
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Center Panel - Main Content */}
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
                          Question {currentQuestionIndex + 1}
                        </span>
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-6">
                        AI Interview Question
                      </h2>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
                      <p className="text-lg text-gray-800 leading-relaxed text-center">
                        {questions[currentQuestionIndex]?.question || 'Loading question...'}
                      </p>
                    </div>

                    <div className="text-center pt-6">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-full flex flex-col gap-1">
                          <textarea
                            ref={textareaRef}
                            className="w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring"
                            rows={5}
                            placeholder="Type your answer here... (Enter to submit, Shift+Enter for newline)"
                            value={answerDraft}
                            onChange={e => setAnswerDraft(e.target.value)}
                            onKeyDown={handleTextareaKeyDown}
                            disabled={isAnswered}
                          />
                          <div className="flex justify-between text-xs text-gray-500 px-1">
                            <span>{wordCount} word{wordCount === 1 ? '' : 's'} • {charCount} char{charCount === 1 ? '' : 's'}</span>
                            {isAnswered && <span className="text-green-600 font-medium">Answer submitted</span>}
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <Button
                            size="lg"
                            disabled={answering || !answerDraft.trim() || isAnswered}
                            onClick={submitAnswer}
                            className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3 rounded-2xl"
                          >
                            {isAnswered ? 'Submitted' : (answering ? 'Submitting...' : 'Submit Answer')}
                          </Button>
                          <Button
                            variant="outline"
                            size="lg"
                            disabled={questions.length === 0 || !sessionId || !isAnswered}
                            onClick={nextQuestion}
                            className="rounded-2xl px-8 py-3"
                          >
                            Next Question
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 text-center">
                      <p className="text-sm text-gray-500">
                        Take your time to think about your answer before responding
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Camera Feed */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg rounded-2xl">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-lg">
                  <Camera className="h-5 w-5 text-blue-600" />
                  Camera Feed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 rounded-xl h-48 flex items-center justify-center relative overflow-hidden">
                  <div className="text-center text-white">
                    <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm opacity-75">Camera Preview</p>
                    <p className="text-xs opacity-50 mt-1">Live video would appear here</p>
                  </div>
                  {/* Simulated recording indicator */}
                  {interviewStarted && (
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-white font-medium">REC</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Video Quality</span>
                    <span className="text-green-600 font-medium">HD</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Connection</span>
                    <span className="text-green-600 font-medium">Stable</span>
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