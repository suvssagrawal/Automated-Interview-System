import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Textarea } from "../ui/textarea";
import { ScrollArea } from "../ui/scroll-area";
import { 
  Play, 
  Pause, 
  Square, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff,
  Bot,
  User,
  Clock
} from "lucide-react";

interface LiveInterviewPageProps {
  onEndInterview: (responses: Array<{ questionId: number; answer: string; timeSpent: number }>) => void;
}

interface Message {
  id: string;
  sender: "ai" | "user";
  content: string;
  timestamp: Date;
}

const mockQuestions = [
  "Hello! I'm your AI interviewer. Let's start with a simple question: Can you tell me about yourself and your background?",
  "That's great! Now, tell me about a challenging project you've worked on recently. What made it challenging and how did you overcome the obstacles?",
  "Excellent. Let's talk about teamwork. Describe a time when you had to work with a difficult colleague. How did you handle the situation?",
  "Now I'd like to ask about your technical skills. Can you walk me through how you would approach debugging a complex system issue?",
  "Finally, why are you interested in this role, and where do you see yourself in 5 years?"
];

export function LiveInterviewPage({ onEndInterview }: LiveInterviewPageProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentResponse, setCurrentResponse] = useState("");
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [responses, setResponses] = useState<Array<{ questionId: number; answer: string; timeSpent: number }>>([]);

  useEffect(() => {
    let interval: number;
    if (interviewStarted) {
      interval = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [interviewStarted]);

  useEffect(() => {
    if (interviewStarted && currentQuestionIndex < mockQuestions.length) {
      const timer = setTimeout(() => {
        const newMessage: Message = {
          id: `ai-${Date.now()}`,
          sender: "ai",
          content: mockQuestions[currentQuestionIndex],
          timestamp: new Date()
        };
        setMessages(prev => [...prev, newMessage]);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [interviewStarted, currentQuestionIndex]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startInterview = () => {
    setInterviewStarted(true);
    setIsRecording(true);
  };

  const pauseInterview = () => {
    setIsRecording(!isRecording);
  };

  const submitResponse = () => {
    if (!currentResponse.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      content: currentResponse,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    
    const newResponse = {
      questionId: currentQuestionIndex + 1,
      answer: currentResponse,
      timeSpent: Math.floor(Math.random() * 120) + 30 // Mock time
    };
    
    setResponses(prev => [...prev, newResponse]);
    setCurrentResponse("");

    if (currentQuestionIndex < mockQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      endInterview();
    }
  };

  const endInterview = () => {
    setInterviewStarted(false);
    setIsRecording(false);
    onEndInterview(responses);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Bot className="h-8 w-8 text-blue-400" />
              <div>
                <h1 className="text-xl font-semibold">Live AI Interview</h1>
                <p className="text-sm text-slate-400">
                  Question {currentQuestionIndex + 1} of {mockQuestions.length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="h-4 w-4" />
              <span className="font-mono">{formatTime(sessionTime)}</span>
            </div>
            {isRecording && (
              <Badge variant="destructive" className="animate-pulse">
                ● REC
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 h-[calc(100vh-80px)]">
        {/* Left Side - AI Chat */}
        <div className="border-r border-slate-700 flex flex-col">
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-blue-400">
                <AvatarImage src="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=150&h=150&fit=crop&crop=center" />
                <AvatarFallback className="bg-blue-600 text-white">AI</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-lg font-semibold">InterviewGenie AI</h2>
                <p className="text-sm text-slate-400">Your AI Interviewer</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-xs text-green-400">Online</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              {!interviewStarted && (
                <div className="text-center py-12">
                  <Bot className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-300 mb-2">
                    Ready to Start?
                  </h3>
                  <p className="text-slate-400 mb-6">
                    Click "Start Interview" when you're ready to begin your AI interview session.
                  </p>
                </div>
              )}

              {messages.map((message) => (
                <div key={message.id} className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    {message.sender === "ai" ? (
                      <>
                        <Bot className="h-4 w-4" />
                        <span>AI Interviewer</span>
                      </>
                    ) : (
                      <>
                        <User className="h-4 w-4" />
                        <span>You</span>
                      </>
                    )}
                    <span>•</span>
                    <span>{message.timestamp.toLocaleTimeString()}</span>
                  </div>
                  <div className={`p-4 rounded-xl max-w-[80%] ${
                    message.sender === "ai" 
                      ? "bg-slate-800 text-slate-100" 
                      : "bg-blue-600 text-white ml-auto"
                  }`}>
                    <p className="leading-relaxed">{message.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Response Input */}
          {interviewStarted && (
            <div className="p-6 border-t border-slate-700">
              <div className="space-y-4">
                <Textarea
                  placeholder="Type your response here..."
                  value={currentResponse}
                  onChange={(e) => setCurrentResponse(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white placeholder-slate-400 min-h-[100px] resize-none"
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-slate-400">
                    Press Enter to submit or use the button
                  </p>
                  <Button 
                    onClick={submitResponse}
                    disabled={!currentResponse.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Submit Response
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side - Video Feed & Controls */}
        <div className="flex flex-col">
          {/* Video Preview */}
          <div className="flex-1 p-6">
            <Card className="h-full bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Your Video Feed
                </CardTitle>
              </CardHeader>
              <CardContent className="h-full">
                <div className="bg-slate-700 rounded-xl h-full flex items-center justify-center relative overflow-hidden">
                  {isVideoOn ? (
                    <div className="w-full h-full bg-gradient-to-br from-blue-900 to-slate-900 flex items-center justify-center">
                      <div className="text-center">
                        <User className="h-24 w-24 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-400">Video Preview</p>
                        <p className="text-xs text-slate-500">Camera would show here</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <VideoOff className="h-16 w-16 text-slate-500 mx-auto mb-4" />
                      <p className="text-slate-400">Camera Off</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transcript Area */}
          <div className="p-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Live Transcript</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-32">
                  <div className="text-sm text-slate-300 space-y-2">
                    {messages.length > 0 ? (
                      messages.slice(-3).map((msg) => (
                        <p key={msg.id} className="leading-relaxed">
                          <span className="text-slate-500">
                            {msg.sender === "ai" ? "AI: " : "You: "}
                          </span>
                          {msg.content}
                        </p>
                      ))
                    ) : (
                      <p className="text-slate-500 italic">
                        Transcript will appear here during the interview...
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <div className="p-6 border-t border-slate-700">
            <div className="flex justify-center items-center gap-4">
              {!interviewStarted ? (
                <Button
                  size="lg"
                  onClick={startInterview}
                  className="bg-green-600 hover:bg-green-700 px-8"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Start Interview
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setIsMicOn(!isMicOn)}
                    className={`border-slate-600 ${isMicOn ? 'text-white' : 'text-red-400'}`}
                  >
                    {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setIsVideoOn(!isVideoOn)}
                    className={`border-slate-600 ${isVideoOn ? 'text-white' : 'text-red-400'}`}
                  >
                    {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                  </Button>

                  <Button
                    size="lg"
                    onClick={pauseInterview}
                    variant="outline"
                    className="border-slate-600"
                  >
                    {isRecording ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>

                  <Button
                    size="lg"
                    onClick={endInterview}
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Square className="mr-2 h-4 w-4" />
                    End Interview
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}