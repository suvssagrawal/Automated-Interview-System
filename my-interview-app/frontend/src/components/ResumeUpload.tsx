import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ExtractedSkill {
  category?: string;
  skill?: string;
  confidence?: string;
  [key: string]: string | undefined;
}

interface UploadResponse {
  message: string;
  filename: string;
  extracted_skills: {
    skills_found: ExtractedSkill[];
    total_skills: number;
    file_path?: string;
    error?: string;
  };
}

export function ResumeUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['.pdf', '.docx', '.txt'];
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(fileExtension)) {
      setError('Please upload PDF, DOCX, or TXT files only');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/api/upload-resume', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setUploadResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <FileText className="h-6 w-6" />
          Upload Your Resume
        </CardTitle>
        <CardDescription className="text-lg">
          Upload your resume to get personalized interview questions based on your skills
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Upload Area */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
          <input
            type="file"
            id="resume-upload"
            accept=".pdf,.docx,.txt"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
          />
          <label
            htmlFor="resume-upload"
            className="cursor-pointer flex flex-col items-center gap-4"
          >
            {isUploading ? (
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
            ) : (
              <Upload className="h-12 w-12 text-gray-400" />
            )}
            <div className="space-y-2">
              <div className="text-lg font-medium">
                {isUploading ? 'Processing Resume...' : 'Click to upload your resume'}
              </div>
              <div className="text-sm text-gray-500">
                Supported formats: PDF, DOCX, TXT
              </div>
            </div>
          </label>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Display with Skills */}
        {uploadResult && (
          <div className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="font-semibold text-lg">
                  ✅ Resume processed successfully!
                </div>
                <div className="mt-2">
                  File: <strong>{uploadResult.filename}</strong>
                </div>
              </AlertDescription>
            </Alert>

            {/* Extracted Skills Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🎯 Extracted Skills
                  <Badge variant="secondary" className="ml-2">
                    {uploadResult.extracted_skills.total_skills} skills found
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {uploadResult.extracted_skills.skills_found.length > 0 ? (
                  <div className="space-y-4">
                    {/* Skills Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {uploadResult.extracted_skills.skills_found.map((skill, index) => (
                        <div
                          key={index}
                          className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center hover:bg-blue-100 transition-colors"
                        >
                          <div className="font-medium text-blue-800">
                            {skill.skill || skill.category || 'Unknown Skill'}
                          </div>
                          {skill.confidence && (
                            <div className="text-xs text-blue-600 mt-1">
                              Confidence: {skill.confidence}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Skills by Category */}
                    <div className="mt-6">
                      <h4 className="font-semibold mb-3">Skills by Category:</h4>
                      <div className="space-y-3">
                        {Object.entries(
                          uploadResult.extracted_skills.skills_found.reduce((acc, skill) => {
                            const category = skill.category || 'Other';
                            if (!acc[category]) acc[category] = [];
                            acc[category].push(skill.skill || 'Unknown');
                            return acc;
                          }, {} as Record<string, string[]>)
                        ).map(([category, skills]) => (
                          <div key={category} className="border rounded-lg p-3">
                            <div className="font-medium text-gray-900 mb-2">
                              {category} ({skills.length})
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {skills.map((skill, idx) => (
                                <Badge key={idx} variant="outline">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <Alert>
                    <AlertDescription>
                      No skills were extracted from the resume. This might be because:
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>The resume format is not supported</li>
                        <li>No recognizable skills were found</li>
                        <li>There was an issue processing the file</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold mb-2">Why upload your resume?</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
            <li>Get personalized interview questions based on your actual skills</li>
            <li>AI will analyze your experience and background</li>
            <li>Better interview practice tailored to your specific profile</li>
            <li>Identify skill gaps and areas for improvement</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}