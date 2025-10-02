import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const AIInsights = ({ entry, onAnalysisRequest }) => {
  const [insights, setInsights] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [error, setError] = useState(null);

  // Display extracted data if available
  const extractedData = entry?.extractedData;
  const hasAnalysis = extractedData && Object.keys(extractedData).length > 0;

  // Trigger AI analysis for this entry
  const handleAnalyzeEntry = async (sync = false) => {
    if (!entry?.id) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await apiService.post(`/api/ai/analyze/${entry.id}`, { sync });
      
      if (response.success) {
        if (sync) {
          // Immediate result
          setInsights(response.data);
          if (onAnalysisRequest) {
            onAnalysisRequest(response.data);
          }
        } else {
          // Async job
          setJobId(response.jobId);
          // Poll for results
          pollJobStatus(response.jobId);
        }
      } else {
        setError(response.error || 'Analysis failed');
      }
    } catch (err) {
      setError('Failed to start analysis');
      console.error('AI analysis error:', err);
    } finally {
      if (sync) {
        setIsAnalyzing(false);
      }
    }
  };

  // Poll job status for async analysis
  const pollJobStatus = async (jobId) => {
    const maxAttempts = 30; // 5 minutes max
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await apiService.get(`/api/ai/job/${jobId}`);
        
        if (response.success && response.job) {
          const job = response.job;
          
          if (job.status === 'completed') {
            setInsights(job.result?.data);
            setIsAnalyzing(false);
            if (onAnalysisRequest) {
              onAnalysisRequest(job.result?.data);
            }
            return;
          } else if (job.status === 'failed') {
            setError(job.lastError || 'Analysis failed');
            setIsAnalyzing(false);
            return;
          }
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000); // Poll every 10 seconds
        } else {
          setError('Analysis timeout');
          setIsAnalyzing(false);
        }
      } catch (err) {
        setError('Failed to check analysis status');
        setIsAnalyzing(false);
      }
    };

    poll();
  };

  // Format confidence as percentage
  const formatConfidence = (confidence) => {
    return `${Math.round(confidence * 100)}%`;
  };

  // Get sentiment emoji
  const getSentimentEmoji = (sentiment) => {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😔';
      default: return '😐';
    }
  };

  const displayData = insights || extractedData;

  if (!entry) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          🤖 AI Insights
          {displayData?.sentiment && (
            <span className="text-xl">
              {getSentimentEmoji(displayData.sentiment)}
            </span>
          )}
        </h3>
        
        <div className="flex items-center gap-2">
          {!hasAnalysis && (
            <button
              onClick={() => handleAnalyzeEntry(true)}
              disabled={isAnalyzing}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Entry'}
            </button>
          )}
          
          {hasAnalysis && (
            <button
              onClick={() => handleAnalyzeEntry(true)}
              disabled={isAnalyzing}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 disabled:opacity-50"
            >
              {isAnalyzing ? 'Re-analyzing...' : 'Re-analyze'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {isAnalyzing && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm">
          <div className="flex items-center gap-2">
            <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            AI is analyzing your entry...
            {jobId && <span className="text-xs">Job ID: {jobId}</span>}
          </div>
        </div>
      )}

      {!displayData && !isAnalyzing && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🔍</div>
          <p className="text-sm">No AI analysis available</p>
          <p className="text-xs mt-1">Click "Analyze Entry" to extract insights</p>
        </div>
      )}

      {displayData && (
        <div className="space-y-4">
          {/* Projects */}
          {displayData.projects && displayData.projects.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                📁 Projects
              </h4>
              <div className="flex flex-wrap gap-2">
                {displayData.projects.map((project, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-teal-100 text-teal-800 rounded text-sm"
                  >
                    {project.name}
                    {project.confidence && (
                      <span className="text-xs opacity-75">
                        {formatConfidence(project.confidence)}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {displayData.skills && displayData.skills.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                ⚡ Skills
              </h4>
              <div className="flex flex-wrap gap-2">
                {displayData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm ${
                      skill.category === 'technical' 
                        ? 'bg-green-100 text-green-800'
                        : skill.category === 'soft'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {skill.name}
                    {skill.confidence && (
                      <span className="text-xs opacity-75">
                        {formatConfidence(skill.confidence)}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Competencies */}
          {displayData.competencies && displayData.competencies.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                🎯 Competencies
              </h4>
              <div className="flex flex-wrap gap-2">
                {displayData.competencies.map((competency, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm"
                  >
                    {competency.name}
                    {competency.confidence && (
                      <span className="text-xs opacity-75">
                        {formatConfidence(competency.confidence)}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Achievements */}
          {displayData.achievements && displayData.achievements.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                🏆 Achievements
              </h4>
              <div className="space-y-2">
                {displayData.achievements.map((achievement, index) => (
                  <div
                    key={index}
                    className="p-2 bg-green-50 border border-green-200 rounded text-sm"
                  >
                    <div className="text-green-800">{achievement.description}</div>
                    {achievement.impact && (
                      <div className="text-green-600 text-xs mt-1">
                        Impact: {achievement.impact}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Keywords */}
          {displayData.keywords && displayData.keywords.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                🏷️ Keywords
              </h4>
              <div className="flex flex-wrap gap-1">
                {displayData.keywords.slice(0, 10).map((keyword, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sentiment & Metadata */}
          <div className="pt-2 border-t border-gray-200 text-xs text-gray-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {displayData.sentiment && (
                  <span className="flex items-center gap-1">
                    Sentiment: {getSentimentEmoji(displayData.sentiment)} {displayData.sentiment}
                  </span>
                )}
                {displayData.workLocation && displayData.workLocation !== 'other' && (
                  <span>Location: {displayData.workLocation}</span>
                )}
              </div>
              {insights && (
                <span>Analyzed by AI</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInsights;