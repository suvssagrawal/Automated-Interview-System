import { Button } from "./ui/button";
import { Brain } from "lucide-react";

interface InterviewEaseNavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function InterviewEaseNavigation({ currentPage, onNavigate }: InterviewEaseNavigationProps) {
  const navItems = [
    { name: "Home", id: "home" },
    { name: "Interview", id: "interview" },
    { name: "Results", id: "results" }
  ];

  return (
    <nav className="bg-white/90 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div 
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => onNavigate("home")}
          >
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-xl">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-semibold text-gray-900">InterviewEase</span>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                  currentPage === item.id ? 'text-blue-600' : 'text-gray-700'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}