import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Separator } from "../ui/separator";
import { 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  Download, 
  RefreshCw, 
  Home,
  Star,
  User,
  MessageSquare,
  Brain,
  Eye
} from "lucide-react";

interface Response {
  questionId: number;
  answer: string;
  timeSpent: number;
}

interface FeedbackPageProps {
  responses: Response[];
  onRetakeInterview: () => void;
  onBackToHome: () => void;
}

interface FeedbackCategory {
  name: string;
  score: number;
  feedback: string;
  icon: React.ReactNode;
  suggestions: string[];
}

export function FeedbackPage({ responses, onRetakeInterview, onBackToHome }: FeedbackPageProps) {
  // Mock comprehensive feedback analysis
  const overallScore = 78;
  
  const categories: FeedbackCategory[] = [
    {
      name: "Communication",
      score: 82,
      feedback: "Clear and articulate responses with good structure",
      icon: <MessageSquare className="h-5 w-5" />,
      suggestions: [
        "Use more specific examples to support your points",
        "Practice varying your sentence structure",
        "Include more quantifiable achievements"
      ]
    },
    {
      name: "Confidence",
      score: 75,
      feedback: "Good presence, but room for improvement in assertiveness",
      icon: <User className="h-5 w-5" />,
      suggestions: [
        "Maintain steady eye contact throughout responses",
        "Use more decisive language",
        "Practice power poses before interviews"
      ]
    },
    {
      name: "Knowledge",
      score: 85,
      feedback: "Strong technical knowledge and industry awareness",
      icon: <Brain className="h-5 w-5" />,
      suggestions: [
        "Stay updated with latest industry trends",
        "Prepare more specific examples of problem-solving",
        "Research company-specific challenges"
      ]
    },
    {
      name: "Body Language",
      score: 70,
      feedback: "Generally positive, but could be more engaging",
      icon: <Eye className="h-5 w-5" />,
      suggestions: [
        "Use more hand gestures to emphasize points",
        "Lean forward slightly to show engagement",
        "Smile more naturally during conversation"
      ]
    }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 70) return "secondary";
    return "destructive";
  };

  const getCircularProgress = (score: number) => {
    const circumference = 2 * Math.PI * 45;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
      <div className="relative w-32 h-32">
        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-gray-200"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className={`transition-all duration-1000 ease-out ${getScoreColor(score)}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
              {score}%
            </div>
            <div className="text-xs text-gray-500">Score</div>
          </div>
        </div>
      </div>
    );
  };

  const strengths = [
    "Excellent use of the STAR method in behavioral responses",
    "Strong technical problem-solving approach",
    "Good awareness of industry best practices",
    "Clear and structured communication style"
  ];

  const improvements = [
    "Include more specific metrics and quantifiable results",
    "Practice maintaining eye contact during longer responses",
    "Develop more compelling personal stories",
    "Research company-specific challenges and solutions"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Interview Complete!</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Here's your comprehensive feedback and performance analysis
          </p>
        </div>

        {/* Overall Score Card */}
        <Card className="mb-8 border-0 shadow-xl bg-gradient-to-br from-blue-50 to-violet-50">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="text-center lg:text-left">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Overall Performance
                </h2>
                <p className="text-gray-600 mb-4">
                  Based on AI analysis of your responses, communication, and delivery
                </p>
                <Badge 
                  variant={getScoreBadgeVariant(overallScore)} 
                  className="text-lg px-6 py-2"
                >
                  {overallScore >= 80 ? "Excellent" : 
                   overallScore >= 70 ? "Good" : "Needs Improvement"}
                </Badge>
              </div>
              <div className="flex items-center gap-8">
                {getCircularProgress(overallScore)}
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-2">Interview Duration</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {Math.floor(responses.reduce((sum, r) => sum + r.timeSpent, 0) / 60)}m
                  </div>
                  <div className="text-sm text-gray-500">
                    {responses.length} questions answered
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-blue-600" />
                Performance Breakdown
              </CardTitle>
              <CardDescription>
                Detailed analysis across key interview dimensions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {categories.map((category, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {category.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{category.name}</h4>
                        <p className="text-sm text-gray-600">{category.feedback}</p>
                      </div>
                    </div>
                    <Badge variant={getScoreBadgeVariant(category.score)}>
                      {category.score}%
                    </Badge>
                  </div>
                  <Progress value={category.score} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Strengths and Improvements */}
          <div className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-6 w-6" />
                  Key Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <AlertCircle className="h-6 w-6" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {improvements.map((improvement, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{improvement}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Detailed Category Feedback */}
        <Card className="mb-8 border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Detailed Feedback & Suggestions</CardTitle>
            <CardDescription>
              Specific recommendations to improve your interview performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              {categories.map((category, index) => (
                <div key={index} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {category.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{category.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(category.score / 20)
                                ? "text-yellow-400 fill-current"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                        <span className="text-sm text-gray-600 ml-2">
                          {category.score}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 mb-3">{category.feedback}</p>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Suggestions:
                      </p>
                      <ul className="space-y-1">
                        {category.suggestions.map((suggestion, idx) => (
                          <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            size="lg"
            onClick={onRetakeInterview}
            variant="outline"
            className="flex items-center gap-2 border-2"
          >
            <RefreshCw className="h-5 w-5" />
            Practice Again
          </Button>
          
          <Button
            size="lg"
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
          >
            <Download className="h-5 w-5" />
            Download Report
          </Button>
          
          <Button
            size="lg"
            onClick={onBackToHome}
            variant="outline"
            className="flex items-center gap-2 border-2"
          >
            <Home className="h-5 w-5" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}