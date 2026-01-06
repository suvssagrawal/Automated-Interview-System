import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { 
  Download, 
  RefreshCw, 
  Home, 
  CheckCircle, 
  AlertCircle,
  Star,
  TrendingUp
} from "lucide-react";

interface InterviewEaseResultsProps {
  onRetakeInterview: () => void;
  onBackToHome: () => void;
}

interface QuestionResult {
  order: number;
  question: string;
  user_answer?: string;
  correct_answer?: string;
  is_correct?: boolean;
  similarity_score?: number;
  category?: string;
}

interface BackendResults {
  session_id: number;
  score: number;
  correctness_pct?: number;
  avg_similarity?: number;
  avg_attention?: number;
  dominant_emotion?: string;
  questions: QuestionResult[];
}

export function InterviewEaseResults({ onRetakeInterview, onBackToHome }: InterviewEaseResultsProps) {
  const [backend, setBackend] = useState<BackendResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Retrieve last session id (stored by interview component or server)
    const sid = window.sessionStorage.getItem('session_id');
    if (!sid) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/interview-results?session_id=${sid}`).then(r => r.json()),
      fetch(`/api/facial-timeline?session_id=${sid}`).then(r => r.json()).catch(() => null)
    ])
      .then(([resultsResp, timelineResp]) => {
        if (resultsResp?.error) { setError(resultsResp.error); return; }
        setBackend(resultsResp);
        // timelineResp reserved for future chart usage
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  const results: QuestionResult[] = backend?.questions || [];
  const totalScore = backend ? Math.round(backend.score) : 0;

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 85) return "default";
    if (score >= 70) return "secondary";
    return "destructive";
  };

  // Derive simple category scores (correct % per category)
  const categoryScores = (() => {
    if (!results.length) return [] as { category: string; score: number }[];
    const byCat: Record<string, { total: number; correct: number }> = {};
    results.forEach(r => {
      const cat = r.category || 'General';
      if (!byCat[cat]) byCat[cat] = { total: 0, correct: 0 };
      byCat[cat].total += 1;
      if (r.is_correct) byCat[cat].correct += 1;
    });
    return Object.entries(byCat).map(([category, v]) => ({ category, score: Math.round((v.correct / v.total) * 100) }));
  })();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <CheckCircle className="h-10 w-10 text-green-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Your Interview Results</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Comprehensive analysis of your interview performance
          </p>
        </div>

        {/* Overall Score Card */}
        <Card className="mb-8 border-0 shadow-lg rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Overall Performance
                </h2>
                <p className="text-gray-600 mb-4">
                  Based on AI analysis across all interview dimensions
                </p>
                <Badge 
                  variant={getScoreBadgeVariant(totalScore)} 
                  className="text-lg px-6 py-2 rounded-xl"
                >
                  {totalScore >= 85 ? "Excellent" : 
                   totalScore >= 70 ? "Good" : results.length ? "Needs Improvement" : loading ? 'Loading' : 'No Data'}
                </Badge>
              </div>
              <div className="text-center">
                <div className="text-6xl font-bold text-blue-600 mb-2">
                  {loading ? '...' : totalScore}
                  <span className="text-2xl text-gray-500">/100</span>
                </div>
                <p className="text-gray-600">Total Score</p>
              </div>
            </div>
            {backend && (
              <div className="mt-6 grid sm:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-500">Avg Similarity</p>
                  <p className="text-lg font-semibold text-gray-800">{backend.avg_similarity?.toFixed(2) ?? '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Avg Attention</p>
                  <p className="text-lg font-semibold text-gray-800">{backend.avg_attention?.toFixed(2) ?? '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Dominant Emotion</p>
                  <p className="text-lg font-semibold text-gray-800">{backend.dominant_emotion ?? '—'}</p>
                </div>
                <div className="sm:col-span-3 flex justify-center gap-8 pt-4 text-sm text-gray-600">
                  <span><strong>Correctness:</strong> {backend.correctness_pct?.toFixed(1) ?? '—'}%</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Table */}
        <Card className="mb-8 border-0 shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl">Question-by-Question Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-2 font-semibold text-gray-900">Question</th>
                    <th className="text-center py-4 px-2 font-semibold text-gray-900 w-32">Score</th>
                    <th className="text-left py-4 px-2 font-semibold text-gray-900">Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-2">
                        <p className="text-sm text-gray-900 font-medium leading-relaxed">
                          {result.order}. {result.question}
                        </p>
                      </td>
                      <td className="py-4 px-2 text-center">
                        <Badge className="px-3 py-1 rounded-lg">
                          {result.is_correct ? 'Correct' : '—'}
                        </Badge>
                      </td>
                      <td className="py-4 px-2">
                        <p className="text-xs text-gray-600 leading-relaxed break-words">
                          Sim: {result.similarity_score?.toFixed(2) ?? '—'} | Cat: {result.category || '—'}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!loading && !results.length && (
              <div className="text-center text-sm text-gray-500 py-6">No results available.</div>
            )}
          </CardContent>
        </Card>

        {/* Performance by Category */}
        <Card className="mb-8 border-0 shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Performance by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {categoryScores.map((category, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">{category.category}</h4>
                    <Badge variant={getScoreBadgeVariant(category.score)}>
                      {category.score}%
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        category.score >= 85 ? 'bg-green-500' :
                        category.score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${category.score}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Total Marks Summary */}
        <Card className="mb-8 border-0 shadow-xl rounded-2xl bg-gradient-to-r from-green-50 to-blue-50 border-l-4 border-l-blue-600">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Total Marks</h3>
                <p className="text-gray-600">Combined score across all interview questions</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">{totalScore} / 100</div>
                <p className="text-sm text-gray-600">Points</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            size="lg"
            onClick={onRetakeInterview}
            variant="outline"
            className="flex items-center gap-2 border-2 rounded-2xl px-8 py-3"
          >
            <RefreshCw className="h-5 w-5" />
            Retake Interview
          </Button>
          
          <Button
            size="lg"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 rounded-2xl px-8 py-3 shadow-lg"
          >
            <Download className="h-5 w-5" />
            Download Report
          </Button>
          
          <Button
            size="lg"
            onClick={onBackToHome}
            variant="outline"
            className="flex items-center gap-2 border-2 rounded-2xl px-8 py-3"
          >
            <Home className="h-5 w-5" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}