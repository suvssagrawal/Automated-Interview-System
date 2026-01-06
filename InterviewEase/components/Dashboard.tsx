import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { 
  Bot, 
  Play, 
  Clock, 
  TrendingUp, 
  Award, 
  Calendar,
  CheckCircle,
  User,
  Brain,
  Code,
  Users
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface DashboardProps {
  onStartInterview: (type: string) => void;
}

export function Dashboard({ onStartInterview }: DashboardProps) {
  const userProgress = {
    name: "Alex Johnson",
    email: "alex.johnson@email.com",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    overallScore: 82,
    interviewsCompleted: 15,
    streak: 7
  };

  const interviewTypes = [
    {
      id: "behavioral",
      title: "Behavioral",
      description: "STAR method, leadership, and soft skills",
      icon: <Users className="h-8 w-8 text-blue-600" />,
      color: "bg-blue-50 border-blue-200",
      questions: 25,
      avgTime: "20 min"
    },
    {
      id: "technical",
      title: "Technical",
      description: "Coding problems and system design",
      icon: <Code className="h-8 w-8 text-green-600" />,
      color: "bg-green-50 border-green-200",
      questions: 40,
      avgTime: "45 min"
    },
    {
      id: "hr",
      title: "HR",
      description: "Company culture and role-specific questions",
      icon: <User className="h-8 w-8 text-purple-600" />,
      color: "bg-purple-50 border-purple-200",
      questions: 20,
      avgTime: "15 min"
    },
    {
      id: "custom",
      title: "Custom",
      description: "Tailored questions for specific roles",
      icon: <Brain className="h-8 w-8 text-orange-600" />,
      color: "bg-orange-50 border-orange-200",
      questions: 30,
      avgTime: "30 min"
    }
  ];

  const recentInterviews = [
    {
      type: "Technical",
      date: "2 hours ago",
      score: 88,
      duration: "42 min",
      status: "completed"
    },
    {
      type: "Behavioral",
      date: "Yesterday",
      score: 76,
      duration: "18 min",
      status: "completed"
    },
    {
      type: "HR",
      date: "3 days ago",
      score: 92,
      duration: "12 min",
      status: "completed"
    }
  ];

  const achievements = [
    { title: "First Interview", icon: "🎯", unlocked: true },
    { title: "Perfect Score", icon: "💯", unlocked: true },
    { title: "Week Streak", icon: "🔥", unlocked: true },
    { title: "Tech Master", icon: "⚡", unlocked: false },
    { title: "Interview Pro", icon: "👑", unlocked: false }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Welcome back, {userProgress.name.split(' ')[0]}!</h1>
              <p className="text-gray-600">Ready to practice your interview skills?</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="bg-teal-50 text-teal-700 border-teal-200">
                {userProgress.streak} day streak 🔥
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Left Panel - User Profile */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center pb-4">
                <Avatar className="w-20 h-20 mx-auto mb-4">
                  <AvatarImage src={userProgress.avatar} alt={userProgress.name} />
                  <AvatarFallback className="text-lg">
                    {userProgress.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-lg">{userProgress.name}</CardTitle>
                <CardDescription>{userProgress.email}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {userProgress.overallScore}%
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Overall Score</p>
                  <Progress value={userProgress.overallScore} className="h-2" />
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {userProgress.interviewsCompleted}
                    </div>
                    <p className="text-xs text-gray-600">Interviews</p>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {userProgress.streak}
                    </div>
                    <p className="text-xs text-gray-600">Day Streak</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-600" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {achievements.map((achievement, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-xl text-center border transition-all ${
                        achievement.unlocked
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-gray-50 border-gray-200 opacity-50'
                      }`}
                    >
                      <div className="text-2xl mb-1">{achievement.icon}</div>
                      <p className="text-xs font-medium">{achievement.title}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center Panel - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Start Interview */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white">
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <div className="bg-white/20 p-4 rounded-2xl w-fit mx-auto mb-4">
                    <Bot className="h-12 w-12 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Start Mock Interview</h2>
                  <p className="text-blue-100">
                    Practice with our AI interviewer and get instant feedback
                  </p>
                </div>
                <Button 
                  size="lg"
                  onClick={() => onStartInterview("behavioral")}
                  className="bg-white text-blue-600 hover:bg-gray-100 shadow-xl"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Start Interview
                </Button>
              </CardContent>
            </Card>

            {/* Interview Types */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Choose Interview Type</CardTitle>
                <CardDescription>
                  Select the type of interview you'd like to practice
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {interviewTypes.map((type) => (
                    <Card 
                      key={type.id} 
                      className={`cursor-pointer hover:shadow-md transition-all border-2 ${type.color}`}
                      onClick={() => onStartInterview(type.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-white rounded-xl">
                            {type.icon}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {type.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-3">
                              {type.description}
                            </p>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>{type.questions} questions</span>
                              <span>{type.avgTime}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - History & Analytics */}
          <div className="lg:col-span-1 space-y-6">
            {/* Performance Graph */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-teal-600" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-32 bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl flex items-center justify-center">
                    <ImageWithFallback
                      src="https://images.unsplash.com/photo-1608222351212-18fe0ec7b13b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHN0ZWNobm9sb2d5JTIwZGFzaGJvYXJkJTIwYW5hbHl0aWNzfGVufDF8fHx8MTc1OTY1ODYxMHww&ixlib=rb-4.1.0&q=80&w=300"
                      alt="Performance Analytics"
                      className="w-full h-full object-cover rounded-xl opacity-70"
                    />
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">+12%</div>
                    <p className="text-sm text-gray-600">This week</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Interviews */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-600" />
                  Recent Interviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentInterviews.map((interview, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-medium text-sm text-gray-900">
                          {interview.type}
                        </p>
                        <p className="text-xs text-gray-600">{interview.date}</p>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={interview.score >= 80 ? "default" : "secondary"}
                          className="mb-1"
                        >
                          {interview.score}%
                        </Badge>
                        <p className="text-xs text-gray-600">{interview.duration}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}