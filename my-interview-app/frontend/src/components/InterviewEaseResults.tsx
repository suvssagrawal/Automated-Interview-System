import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { 
  Download, 
  RefreshCw, 
  Home, 
  CheckCircle, 
  AlertCircle,
  Star,
  TrendingUp,
  Brain,
  Eye,
  Clock
} from "lucide-react";

// Recharts for beautiful charts
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar
} from 'recharts';

interface EnhancedResultsProps {
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
  time_spent?: number;
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

interface FacialData {
  attention_scores: number[];
  emotions: Array<{emotion: string; count: number}>;
  alerts: string[];
  total_frames: number;
}

interface EmotionData {
  emotion: string;
  count: number;
  percent?: number;
}

export function InterviewEaseResults({ onRetakeInterview, onBackToHome }: EnhancedResultsProps) {
  const [backend, setBackend] = useState<BackendResults | null>(null);
  const [facialData, setFacialData] = useState<FacialData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
  const sid = window.sessionStorage.getItem('session_id');
  if (!sid) return;
  
  setLoading(true);
  
  // 🎯 SINGLE API CALL - results now include facial data
  fetch(`http://127.0.0.1:8000/api/interview-results/${sid}`)
    .then(response => response.json())
    .then(data => {
      if (data?.error) { 
        setError(data.error); 
        return; 
      }
      setBackend(data);
      // 🎯 CRITICAL: Set facial data from the same response
      setFacialData(data.facial_data);
    })
    .catch(e => setError(String(e)))
    .finally(() => setLoading(false));
}, []);
// ADD this function above the return statement:
const handleDownloadReport = async () => {
  const sid = window.sessionStorage.getItem('session_id');
  if (!sid) {
    alert('No interview session found. Please complete an interview first.');
    return;
  }

  try {
    console.log('📥 Starting PDF download for session:', sid);
    
    const response = await fetch(`http://127.0.0.1:8000/api/download-pdf-report/${sid}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Create blob from response
    const blob = await response.blob();
    
    // Check if blob is valid
    if (blob.size === 0) {
      throw new Error('PDF file is empty');
    }
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `Interview_Report_${sid}.pdf`;
    
    // Trigger download
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    console.log('✅ PDF Report downloaded successfully!');
    
  } catch (error) {
    console.error('❌ Download failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    alert(`Failed to download report: ${errorMessage}\n\nPlease check if the backend is running and try again.`);
  }
};

  // Calculate enhanced metrics
  const calculateEnhancedMetrics = () => {
    if (!backend?.questions) return null;

    const questions = backend.questions;
    const totalQuestions = questions.length;
    // Guard: avoid divide-by-zero and return sensible defaults when there are no questions
    if (totalQuestions === 0) {
      return {
        correctAnswers: 0,
        totalQuestions: 0,
        accuracy: 0,
        categoryPerformance: {} as Record<string, { total: number; correct: number }>,
        avgResponseTime: 0,
        grade: 'Needs Improvement'
      };
    }
    
    // Calculate correct answers (assuming similarity_score > 0.7 is correct)
    const correctAnswers = questions.filter(q => (q.similarity_score || 0) > 0.5).length;
    const accuracy = (correctAnswers / totalQuestions) * 100;
    
    // Calculate category performance
    const categoryPerformance = questions.reduce((acc, q) => {
      const category = q.category || 'General';
      if (!acc[category]) acc[category] = { total: 0, correct: 0 };
      acc[category].total += 1;
      if ((q.similarity_score || 0) > 0.5) acc[category].correct += 1;
      return acc;
    }, {} as Record<string, { total: number; correct: number }>);

    // Calculate average response time
    const avgResponseTime = questions.reduce((sum, q) => sum + (q.time_spent || 0), 0) / totalQuestions;

    return {
      correctAnswers,
      totalQuestions,
      accuracy: Number.isFinite(accuracy) ? Math.round(accuracy) : 0,
      categoryPerformance,
      avgResponseTime: Number.isFinite(avgResponseTime) ? Math.round(avgResponseTime) : 0,
      grade: accuracy >= 80 ? 'Excellent' : accuracy >= 60 ? 'Good' : 'Needs Improvement'
    };
  };

  const metrics = calculateEnhancedMetrics();
  const results = backend?.questions || [];

  // Chart data preparation
  const attentionChartData = facialData?.attention_scores?.map((score, index) => ({
    time: `Q${index + 1}`,
    attention: Math.round(score * 100)
  })) || [];

  // Recharts expects an array of records with string keys; ensure proper typing
  const rawEmotionData: EmotionData[] = facialData?.emotions || [
    { emotion: 'Neutral', count: 40 },
    { emotion: 'Focused', count: 35 },
    { emotion: 'Confident', count: 25 }
  ];

  const emotionChartData: Array<Record<string, any>> = rawEmotionData.map(e => ({ name: e.emotion, count: e.count }));

  const categoryChartData = metrics ? Object.entries(metrics.categoryPerformance).map(([category, data]) => ({
    category,
    score: Math.round((data.correct / data.total) * 100)
  })) : [];

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const getScoreColor = (score: number) => {
    if (score >= 60) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" => {
    if (score >= 60) return "default";
    if (score >= 50) return "secondary";
    return "destructive";
  };

  // Custom label renderer for pie chart
  const renderCustomizedLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent
  }: any) => {
    if (!percent) return null;
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Results</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={onBackToHome}>Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <CheckCircle className="h-10 w-10 text-green-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Interview Results</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Comprehensive analysis of your interview performance
          </p>
        </div>

        {/* SCORE SUMMARY SECTION */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Overall Score */}
          <Card className="border-0 shadow-lg rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50">
            <CardContent className="p-6 text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">
                {metrics ? `${metrics.correctAnswers}/${metrics.totalQuestions}` : '0/0'}
              </div>
              <p className="text-gray-600 mb-4">Correct Answers</p>
              <Badge variant={getScoreBadgeVariant(metrics?.accuracy || 0)} className="text-lg">
                {metrics?.accuracy}% Accuracy - {metrics?.grade}
              </Badge>
            </CardContent>
          </Card>

          {/* Facial Analysis Score */}
          <Card className="border-0 shadow-lg rounded-2xl bg-gradient-to-br from-green-50 to-teal-50">
            <CardContent className="p-6 text-center">
              <div className="text-5xl font-bold text-green-600 mb-2">
                {backend?.avg_attention ? Math.round(backend.avg_attention * 100) : 0}%
              </div>
              <p className="text-gray-600 mb-4">Average Attention</p>
              <div className="flex items-center justify-center gap-2">
                <Eye className="h-4 w-4 text-green-600" />
                <span className="text-sm text-gray-600">
                  {facialData?.total_frames || 0} frames analyzed
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Time Analysis */}
          <Card className="border-0 shadow-lg rounded-2xl bg-gradient-to-br from-orange-50 to-red-50">
            <CardContent className="p-6 text-center">
              <div className="text-5xl font-bold text-orange-600 mb-2">
                {metrics ? Math.round(metrics.avgResponseTime / 60) : 0}m
              </div>
              <p className="text-gray-600 mb-4">Avg Response Time</p>
              <div className="flex items-center justify-center gap-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-gray-600">Per question</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CHARTS SECTION */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Attention Timeline Chart */}
          <Card className="border-0 shadow-lg rounded-2xl lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Attention Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={attentionChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis label={{ value: 'Attention %', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="attention" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      dot={{ fill: '#3B82F6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Emotion Distribution Chart */}
          <Card className="border-0 shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                Emotion Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={emotionChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="name"
                    >
                      {emotionChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`${value}`, 'Count']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Category Performance Bar Chart - NEW! */}
          <Card className="border-0 shadow-lg rounded-2xl lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-green-600" />
                Performance by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis label={{ value: 'Score %', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Bar 
                      dataKey="score" 
                      fill="#10B981"
                      radius={[4, 4, 0, 0]}
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.score >= 60 ? '#10B981' : entry.score >= 50 ? '#F59E0B' : '#EF4444'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* QUESTION ANALYSIS TABLE */}
        <Card className="mb-8 border-0 shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl">Question-by-Question Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-2 font-semibold text-gray-900">Question</th>
                    <th className="text-center py-4 px-2 font-semibold text-gray-900 w-24">Score</th>
                    <th className="text-center py-4 px-2 font-semibold text-gray-900 w-32">Status</th>
                    <th className="text-left py-4 px-2 font-semibold text-gray-900">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => {
                    const score = (result.similarity_score || 0) * 100;
                    const isCorrect = score > 50;
                    return (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-2">
                          <p className="text-sm text-gray-900 font-medium">
                            {result.order}. {result.question}
                          </p>
                          {result.user_answer && (
                            <p className="text-xs text-gray-600 mt-1">
                              <strong>Your answer:</strong> {result.user_answer.substring(0, 100)}...
                            </p>
                          )}
                        </td>
                        <td className="py-4 px-2 text-center">
                          <span className={`font-bold ${getScoreColor(score)}`}>
                            {Math.round(score)}%
                          </span>
                        </td>
                        <td className="py-4 px-2 text-center">
                          <Badge variant={isCorrect ? "default" : "destructive"}>
                            {isCorrect ? '✅ Correct' : '❌ Needs Work'}
                          </Badge>
                        </td>
                        <td className="py-4 px-2">
                          <Badge variant="outline" className="text-xs">
                            {result.category || 'General'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {!results.length && (
              <div className="text-center text-sm text-gray-500 py-6">No results available.</div>
            )}
          </CardContent>
        </Card>

        {/* ACTION BUTTONS */}
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
            onClick={handleDownloadReport}
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