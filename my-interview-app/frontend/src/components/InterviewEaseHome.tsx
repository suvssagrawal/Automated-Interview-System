import { Button } from "../ui/button";
import { ArrowRight, FileText, Brain, Zap } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";

interface InterviewEaseHomeProps {
  onStartInterview: () => void;
  onLearnMore: () => void;
}

export function InterviewEaseHome({ onStartInterview, onLearnMore }: InterviewEaseHomeProps) {
  const features = [
    {
      icon: <FileText className="h-6 w-6 text-blue-600" />,
      title: "Upload Resume",
      description: "Simply upload your resume and we'll tailor questions to your experience"
    },
    {
      icon: <Brain className="h-6 w-6 text-blue-600" />,
      title: "AI Interview",
      description: "Practice with our advanced AI interviewer in a realistic setting"
    },
    {
      icon: <Zap className="h-6 w-6 text-blue-600" />,
      title: "Instant Feedback",
      description: "Get detailed performance analysis and improvement suggestions"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-100 rounded-full opacity-30 blur-xl"></div>
        <div className="absolute top-40 right-20 w-48 h-48 bg-purple-100 rounded-full opacity-20 blur-2xl"></div>
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-blue-200 rounded-full opacity-25 blur-xl"></div>
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="px-4 py-20 sm:py-32">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="space-y-6">
                  <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                    Your Personal{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                      AI Interview
                    </span>{" "}
                    Partner
                  </h1>
                  <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                    Upload your resume, practice realistic AI interviews, and get instant feedback 
                    to ace your next job interview.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    size="lg" 
                    onClick={onStartInterview}
                    className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Start Interview
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    onClick={onLearnMore}
                    className="text-lg px-8 py-4 rounded-2xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                  >
                    Learn More
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="relative bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1661347561252-51484e8fb858?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aXJ0dWFsJTIwaW50ZXJ2aWV3JTIwQUklMjBsYXB0b3B8ZW58MXx8fHwxNzU5NjYxMDU2fDA&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="Virtual AI Interview"
                    className="w-full h-80 object-cover rounded-2xl"
                  />
                  <div className="absolute -top-4 -right-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-2xl shadow-lg">
                    <span className="text-sm font-semibold">AI Powered</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 bg-white/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                How InterviewEase Works
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Three simple steps to improve your interview skills
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center mb-6">
                    <div className="bg-blue-50 p-3 rounded-xl mr-4">
                      {feature.icon}
                    </div>
                    <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white">
              <h2 className="text-4xl font-bold mb-6">
                Ready to Ace Your Interview?
              </h2>
              <p className="text-xl mb-8 text-blue-100">
                Join thousands who've improved their interview skills with AI
              </p>
              <Button 
                size="lg"
                onClick={onStartInterview}
                className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4 rounded-2xl shadow-lg"
              >
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}