import { useState } from "react";
import { InterviewEaseNavigation } from "./components/InterviewEaseNavigation";
import './styles/globals.css';
import { InterviewEaseHome } from "./components/InterviewEaseHome";
import { InterviewEaseInterview } from "./components/InterviewEaseInterview";
import { InterviewEaseResults } from "./components/InterviewEaseResults";

type Page = "home" | "interview" | "results";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page);
  };

  const handleStartInterview = () => {
    setCurrentPage("interview");
  };

  const handleCompleteInterview = () => {
    setCurrentPage("results");
  };

  const handleRetakeInterview = () => {
    setCurrentPage("interview");
  };

  const handleBackToHome = () => {
    setCurrentPage("home");
  };

  const handleLearnMore = () => {
    // For now, keep users on home page when they click Learn More
    setCurrentPage("home");
  };

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return (
          <InterviewEaseHome
            onStartInterview={handleStartInterview}
            onLearnMore={handleLearnMore}
          />
        );
      case "interview":
        return <InterviewEaseInterview onStartInterview={handleCompleteInterview} />;
      case "results":
        return (
          <InterviewEaseResults
            onRetakeInterview={handleRetakeInterview}
            onBackToHome={handleBackToHome}
          />
        );
      default:
        return (
          <InterviewEaseHome
            onStartInterview={handleStartInterview}
            onLearnMore={handleLearnMore}
          />
        );
    }
  };

  return (
    <div className="min-h-screen">
      <InterviewEaseNavigation currentPage={currentPage} onNavigate={handleNavigate} />
      {renderPage()}
    </div>
  );
}