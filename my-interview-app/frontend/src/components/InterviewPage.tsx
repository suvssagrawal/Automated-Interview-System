import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Textarea } from "../ui/textarea";
import { Progress } from "../ui/progress";
import { Badge } from "../ui/badge";
import { Clock, Mic, MicOff } from "lucide-react";

interface Question {
  id: number;
  type: "behavioral" | "technical" | "situational";
  question: string;
  category: string;
}

interface InterviewPageProps {
  onCompleteInterview: (responses: Array<{ questionId: number; answer: string; timeSpent: number }>) => void;
}

const mockQuestions: Question[] = [
  {
    id: 1,
    type: "behavioral",
    question: "Tell me about a time when you had to work under pressure to meet a tight deadline. How did you handle it?",
    category: "Problem Solving"
  },
  {
    id: 2,
    type: "technical",
    question: "Explain how you would approach debugging a complex issue in a production system that multiple users are reporting.",
    category: "Technical Skills"
  },
  {
    id: 3,
    type: "behavioral",
    question: "Describe a situation where you had to collaborate with a difficult team member. What was your approach?",
    category: "Teamwork"
  },
  {
    id: 4,
    type: "situational",
    question: "If you were given a project with unclear requirements, how would you proceed to ensure successful delivery?",
    category: "Leadership"
  },
  {
    id: 5,
    type: "behavioral",
    question: "Tell me about a time when you made a mistake at work. How did you handle it and what did you learn?",
    category: "Growth Mindset"
  }
];

export function InterviewPage({ onCompleteInterview }: InterviewPageProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [responses, setResponses] = useState<Array<{ questionId: number; answer: string; timeSpent: number }>>([]);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [isRecording, setIsRecording] = useState(false);

  const currentQuestion = mockQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / mockQuestions.length) * 100;
  const isLastQuestion = currentQuestionIndex === mockQuestions.length - 1;

  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentQuestionIndex]);

  const handleNextQuestion = () => {
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    const newResponse = {
      questionId: currentQuestion.id,
      answer: currentAnswer,
      timeSpent
    };

    const updatedResponses = [...responses, newResponse];
    setResponses(updatedResponses);

    if (isLastQuestion) {
      onCompleteInterview(updatedResponses);
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setCurrentAnswer("");
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // In a real app, this would start/stop voice recording
  };

  const getTypeColor = (type: Question["type"]) => {
    switch (type) {
      case "behavioral": return "bg-blue-100 text-blue-800";
      case "technical": return "bg-green-100 text-green-800";
      case "situational": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">AI Interview in Progress</h1>
            <Badge variant="outline" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Question {currentQuestionIndex + 1} of {mockQuestions.length}
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Interview Question</CardTitle>
              <Badge className={getTypeColor(currentQuestion.type)}>
                {currentQuestion.type.charAt(0).toUpperCase() + currentQuestion.type.slice(1)}
              </Badge>
            </div>
            <CardDescription className="text-sm text-muted-foreground">
              Category: {currentQuestion.category}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg leading-relaxed mb-6">
              {currentQuestion.question}
            </p>
            
            {/* Response Area */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label htmlFor="answer" className="text-sm font-medium">
                  Your Response
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleRecording}
                  className={`flex items-center gap-2 ${isRecording ? 'text-red-600 border-red-300' : ''}`}
                >
                  {isRecording ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  {isRecording ? 'Recording...' : 'Voice Input'}
                </Button>
              </div>
              
              <Textarea
                id="answer"
                placeholder="Type your answer here... Take your time to provide a detailed response."
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                className="min-h-[200px] resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                disabled={currentQuestionIndex === 0}
                onClick={() => {
                  if (currentQuestionIndex > 0) {
                    setCurrentQuestionIndex(prev => prev - 1);
                    setCurrentAnswer("");
                  }
                }}
              >
                Previous Question
              </Button>
              
              <Button
                onClick={handleNextQuestion}
                disabled={!currentAnswer.trim()}
                className="min-w-[120px]"
              >
                {isLastQuestion ? 'Complete Interview' : 'Next Question'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Interview Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Use the STAR method for behavioral questions (Situation, Task, Action, Result)</li>
              <li>• Be specific and provide concrete examples</li>
              <li>• Take your time to think before responding</li>
              <li>• Focus on your role and contributions in team situations</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}