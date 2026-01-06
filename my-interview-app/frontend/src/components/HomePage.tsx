import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Brain, Clock, Users, CheckCircle } from "lucide-react";

interface HomePageProps {
  onStartInterview: () => void;
}

export function HomePage({ onStartInterview }: HomePageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Brain className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">AI Interview Pro</h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Experience the future of job interviews with our AI-powered platform. 
            Get personalized feedback and improve your interview skills.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <Brain className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <CardTitle>AI-Powered Questions</CardTitle>
              <CardDescription>
                Dynamic questions tailored to your experience and role
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <CardTitle>Real-time Feedback</CardTitle>
              <CardDescription>
                Get instant analysis of your responses and communication style
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <CardTitle>Industry Focused</CardTitle>
              <CardDescription>
                Questions and scenarios specific to your target industry
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Main CTA */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Ready to Start Your AI Interview?</CardTitle>
            <CardDescription>
              Complete a comprehensive interview simulation and receive detailed feedback
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="secondary">Behavioral Questions</Badge>
              <Badge variant="secondary">Technical Assessment</Badge>
              <Badge variant="secondary">Communication Analysis</Badge>
              <Badge variant="secondary">Performance Metrics</Badge>
            </div>
            
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>15-20 minute interview simulation</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Detailed performance analysis</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Personalized improvement suggestions</span>
              </div>
            </div>

            <Button onClick={onStartInterview} size="lg" className="w-full">
              Start AI Interview
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}