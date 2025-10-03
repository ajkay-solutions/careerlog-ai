import { useState, useEffect } from 'react';
import { Calendar, FileText, ArrowLeft, ArrowRight, CheckCircle, Settings } from 'lucide-react';
import GeneratedContentEditor from './GeneratedContentEditor';

function PerformanceReviewWizard({ onBack }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [metadata, setMetadata] = useState({});

  // Step 1 Configuration State
  const [config, setConfig] = useState({
    startDate: '',
    endDate: '',
    timeframe: 'quarter',
    competencies: {
      leadership: true,
      communication: true,
      technical: true,
      problemSolving: false,
      innovation: false,
      customerFocus: false
    },
    format: 'structured'
  });

  // Dashboard data for showing entry count
  const [dashboardData, setDashboardData] = useState(null);

  // Initialize dates based on timeframe
  useEffect(() => {
    const today = new Date();
    let startDate, endDate;

    switch (config.timeframe) {
      case 'week':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        endDate = today;
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = today;
        break;
      case 'quarter':
        const quarterStart = Math.floor(today.getMonth() / 3) * 3;
        startDate = new Date(today.getFullYear(), quarterStart, 1);
        endDate = today;
        break;
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = today;
        break;
      case 'all':
        startDate = new Date('2023-01-01');
        endDate = today;
        break;
      default:
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);
        endDate = today;
    }

    setConfig(prev => ({
      ...prev,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    }));
  }, [config.timeframe]);

  // Load dashboard data to show entry count
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3004';
        console.log('Loading dashboard data for timeframe:', config.timeframe);
        const response = await fetch(`${apiUrl}/api/insights/dashboard?timeframe=${config.timeframe}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('worklog_auth_token')}`
          }
        });
        
        console.log('Dashboard response status:', response.status);
        
        if (response.ok) {
          const result = await response.json();
          console.log('Dashboard result received:', result);
          const data = result.success ? result.data : result;
          console.log('Dashboard summary:', data.summary);
          setDashboardData(data);
        } else {
          console.error('Dashboard API failed:', response.status, response.statusText);
          const errorText = await response.text();
          console.error('Error response:', errorText);
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      }
    };

    // Add a small delay to ensure component is mounted
    setTimeout(loadDashboardData, 100);
  }, [config.timeframe]);

  // Handle competency toggle
  const handleCompetencyToggle = (competency) => {
    setConfig(prev => ({
      ...prev,
      competencies: {
        ...prev.competencies,
        [competency]: !prev.competencies[competency]
      }
    }));
  };

  // Generate performance review
  const handleGenerate = async () => {
    setLoading(true);
    try {
      const selectedCompetencies = Object.entries(config.competencies)
        .filter(([_, selected]) => selected)
        .map(([competency, _]) => competency);

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3004';
      const response = await fetch(`${apiUrl}/api/generate/performance-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('worklog_auth_token')}`
        },
        body: JSON.stringify({
          startDate: config.startDate,
          endDate: config.endDate,
          timeframe: config.timeframe,
          competencies: selectedCompetencies,
          format: config.format
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Performance review API failed:', response.status, errorText);
        throw new Error('Failed to generate performance review');
      }

      const result = await response.json();
      console.log('Performance review response:', result);
      
      const reviewContent = result.success ? result.data?.review || result.review : result.review;
      console.log('Extracted review content:', reviewContent);
      
      setGeneratedContent(reviewContent || '');
      setMetadata({
        timeframe: config.timeframe,
        entriesCount: dashboardData?.summary?.totalEntries || 0,
        generatedAt: new Date().toISOString()
      });
      
      console.log('About to transition to step 2 with content length:', (reviewContent || '').length);
      setCurrentStep(2);
      console.log('Step changed to 2');
    } catch (error) {
      console.error('Generation failed:', error);
      alert('Failed to generate performance review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle regeneration
  const handleRegenerate = async () => {
    setCurrentStep(1);
    // Could also regenerate with same settings by calling handleGenerate
  };

  if (currentStep === 2) {
    return (
      <GeneratedContentEditor
        generatedContent={generatedContent}
        onContentChange={setGeneratedContent}
        onBack={() => setCurrentStep(1)}
        onBackToGenerate={onBack}
        onRegenerate={handleRegenerate}
        title="Personal Performance Review"
        subtitle="Review and edit your performance review content"
        metadata={metadata}
        loading={loading}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Generate Hub</span>
          </button>
        </div>
        
        <div className="flex items-center gap-3 mb-3">
          <FileText className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Personal Performance Review</h1>
        </div>
        
        {/* Progress Steps */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
              1
            </div>
            <span className="font-medium text-blue-600">Configure</span>
          </div>
          <div className="w-12 h-0.5 bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
              2
            </div>
            <span className="text-gray-600">Review & Edit</span>
          </div>
        </div>
        
        <p className="text-lg text-gray-600">
          Configure your performance review settings and generate professional content
        </p>
      </div>

      {/* Configuration Form */}
      <div className="bg-white border border-gray-200 rounded-xl p-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Time Period */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Time Period
            </h3>
            
            {/* Quick Selectors */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Select
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'week', label: 'This Week' },
                  { value: 'month', label: 'This Month' },
                  { value: 'quarter', label: 'This Quarter' },
                  { value: 'year', label: 'This Year' },
                  { value: 'all', label: 'All Time' },
                  { value: 'custom', label: 'Custom' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setConfig(prev => ({ ...prev, timeframe: option.value }))}
                    className={`
                      px-3 py-2 text-sm font-medium rounded-lg border transition-colors
                      ${config.timeframe === option.value
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Date
                </label>
                <input
                  type="date"
                  value={config.startDate}
                  onChange={(e) => setConfig(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To Date
                </label>
                <input
                  type="date"
                  value={config.endDate}
                  onChange={(e) => setConfig(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Data Preview */}
            {dashboardData && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  📊 Based on <strong>{dashboardData.summary?.totalEntries || 0}</strong> entries 
                  across <strong>{dashboardData.projects?.length || 0}</strong> projects
                </p>
              </div>
            )}
          </div>

          {/* Competencies */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              Focus Areas
            </h3>
            
            <p className="text-sm text-gray-600 mb-4">
              Select competencies to highlight in your review
            </p>

            <div className="space-y-3">
              {[
                { key: 'leadership', label: 'Leadership & Management', description: 'Team leadership, project management, mentoring' },
                { key: 'communication', label: 'Communication', description: 'Presentations, documentation, stakeholder management' },
                { key: 'technical', label: 'Technical Excellence', description: 'Technical skills, implementation, architecture' },
                { key: 'problemSolving', label: 'Problem Solving', description: 'Analytical thinking, troubleshooting, solutions' },
                { key: 'innovation', label: 'Innovation', description: 'Creative solutions, process improvements, new ideas' },
                { key: 'customerFocus', label: 'Customer Focus', description: 'User experience, customer satisfaction, feedback' }
              ].map((competency) => (
                <label
                  key={competency.key}
                  className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={config.competencies[competency.key]}
                    onChange={() => handleCompetencyToggle(competency.key)}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{competency.label}</div>
                    <div className="text-sm text-gray-600">{competency.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Output Format */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Output Format</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="format"
                value="structured"
                checked={config.format === 'structured'}
                onChange={(e) => setConfig(prev => ({ ...prev, format: e.target.value }))}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div>
                <div className="font-medium text-gray-900">Structured (Recommended)</div>
                <div className="text-sm text-gray-600">Organized by competencies with bullet points</div>
              </div>
            </label>
            
            <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="format"
                value="narrative"
                checked={config.format === 'narrative'}
                onChange={(e) => setConfig(prev => ({ ...prev, format: e.target.value }))}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div>
                <div className="font-medium text-gray-900">Narrative</div>
                <div className="text-sm text-gray-600">Flowing paragraphs with storytelling approach</div>
              </div>
            </label>
          </div>
        </div>

        {/* Generate Button */}
        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={loading || !config.startDate || !config.endDate}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-8 py-3 rounded-lg font-semibold flex items-center gap-3 transition-colors"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Generating Review...</span>
              </>
            ) : (
              <>
                <span>Generate Performance Review</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PerformanceReviewWizard;