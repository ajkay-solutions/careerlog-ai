import { useState, useEffect } from 'react';
import { Target, FileText, ArrowLeft, ArrowRight, Zap, Settings } from 'lucide-react';
import GeneratedContentEditor from './GeneratedContentEditor';
import { apiService } from '../../services/api';

function ResumeBulletsWizard({ onBack }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [metadata, setMetadata] = useState({});

  // Step 1 Configuration State
  const [config, setConfig] = useState({
    startDate: '',
    endDate: '',
    timeframe: 'quarter',
    targetRole: '',
    targetIndustry: '',
    skillsFocus: {
      technical: true,
      leadership: true,
      communication: false,
      problemSolving: false,
      projectManagement: false,
      dataAnalysis: false
    },
    format: 'action-oriented',
    bulletCount: 5
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
        startDate.setDate(today.getDate() - 90);
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
        const result = await apiService.get(`/api/insights/dashboard?timeframe=${config.timeframe}`);
        const data = result.success ? result.data : result;
        setDashboardData(data);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      }
    };

    loadDashboardData();
  }, [config.timeframe]);

  // Handle skills toggle
  const handleSkillToggle = (skill) => {
    setConfig(prev => ({
      ...prev,
      skillsFocus: {
        ...prev.skillsFocus,
        [skill]: !prev.skillsFocus[skill]
      }
    }));
  };

  // Generate resume bullets
  const handleGenerate = async () => {
    setLoading(true);
    try {
      const selectedSkills = Object.entries(config.skillsFocus)
        .filter(([_, selected]) => selected)
        .map(([skill, _]) => skill);

      const result = await apiService.post('/api/generate/resume-bullets', {
        startDate: config.startDate,
        endDate: config.endDate,
        timeframe: config.timeframe,
        targetRole: config.targetRole,
        targetIndustry: config.targetIndustry,
        skillsFocus: selectedSkills,
        format: config.format,
        count: config.bulletCount
      });

      console.log('Resume bullets response:', result);
      
      const bulletsContent = result.success ? result.data?.bullets || result.bullets : result.bullets;
      console.log('Extracted bullets content:', bulletsContent);
      
      setGeneratedContent(bulletsContent || '');
      setMetadata({
        timeframe: config.timeframe,
        entriesCount: dashboardData?.summary?.totalEntries || 0,
        targetRole: config.targetRole,
        bulletCount: config.bulletCount,
        generatedAt: new Date().toISOString()
      });
      setCurrentStep(2);
    } catch (error) {
      console.error('Generation failed:', error);
      alert('Failed to generate resume bullets. Please try again.');
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
        title="Resume Bullet Points"
        subtitle="Review and edit your resume bullets"
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
          <Target className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Resume Bullet Points</h1>
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
          Create compelling resume bullets that showcase your impact and achievements
        </p>
      </div>

      {/* Configuration Form */}
      <div className="bg-white border border-gray-200 rounded-xl p-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Target Position */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Target Position
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Role (Optional)
                </label>
                <input
                  type="text"
                  value={config.targetRole}
                  onChange={(e) => setConfig(prev => ({ ...prev, targetRole: e.target.value }))}
                  placeholder="e.g., Senior Software Engineer, Product Manager"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Helps tailor bullets to specific role requirements
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Industry (Optional)
                </label>
                <select
                  value={config.targetIndustry}
                  onChange={(e) => setConfig(prev => ({ ...prev, targetIndustry: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Industry</option>
                  <option value="technology">Technology</option>
                  <option value="finance">Finance</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="consulting">Consulting</option>
                  <option value="education">Education</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="retail">Retail</option>
                  <option value="media">Media & Entertainment</option>
                  <option value="government">Government</option>
                  <option value="nonprofit">Non-Profit</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Bullets
                </label>
                <select
                  value={config.bulletCount}
                  onChange={(e) => setConfig(prev => ({ ...prev, bulletCount: parseInt(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={3}>3 bullets</option>
                  <option value={5}>5 bullets</option>
                  <option value={7}>7 bullets</option>
                  <option value={10}>10 bullets</option>
                </select>
              </div>
            </div>
          </div>

          {/* Time Period */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Time Period
            </h3>
            
            {/* Quick Selectors */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Select
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'month', label: 'Last Month' },
                  { value: 'quarter', label: 'Last Quarter' },
                  { value: 'year', label: 'Last Year' },
                  { value: 'all', label: 'All Time' }
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
                  with <strong>{dashboardData.skills?.length || 0}</strong> skills tracked
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Skills Focus */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            Skills to Highlight
          </h3>
          
          <p className="text-sm text-gray-600 mb-4">
            Select the skills you want to emphasize in your resume bullets
          </p>

          <div className="grid md:grid-cols-2 gap-3">
            {[
              { key: 'technical', label: 'Technical Skills', description: 'Programming, tools, technologies' },
              { key: 'leadership', label: 'Leadership', description: 'Team management, mentoring, vision' },
              { key: 'communication', label: 'Communication', description: 'Presentations, documentation, collaboration' },
              { key: 'problemSolving', label: 'Problem Solving', description: 'Analytical thinking, debugging, solutions' },
              { key: 'projectManagement', label: 'Project Management', description: 'Planning, coordination, delivery' },
              { key: 'dataAnalysis', label: 'Data Analysis', description: 'Metrics, insights, decision-making' }
            ].map((skill) => (
              <label
                key={skill.key}
                className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={config.skillsFocus[skill.key]}
                  onChange={() => handleSkillToggle(skill.key)}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900">{skill.label}</div>
                  <div className="text-sm text-gray-600">{skill.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Output Format */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            Format Style
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="format"
                value="action-oriented"
                checked={config.format === 'action-oriented'}
                onChange={(e) => setConfig(prev => ({ ...prev, format: e.target.value }))}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div>
                <div className="font-medium text-gray-900">Action-Oriented (Recommended)</div>
                <div className="text-sm text-gray-600">
                  Starts with strong action verbs, includes metrics and impact
                </div>
                <div className="text-xs text-gray-500 mt-1 italic">
                  "Led cross-functional team of 8 to deliver..."
                </div>
              </div>
            </label>
            
            <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="format"
                value="achievement-focused"
                checked={config.format === 'achievement-focused'}
                onChange={(e) => setConfig(prev => ({ ...prev, format: e.target.value }))}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div>
                <div className="font-medium text-gray-900">Achievement-Focused</div>
                <div className="text-sm text-gray-600">
                  Emphasizes results and outcomes with quantified metrics
                </div>
                <div className="text-xs text-gray-500 mt-1 italic">
                  "Achieved 25% performance improvement by..."
                </div>
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
                <span>Generating Bullets...</span>
              </>
            ) : (
              <>
                <span>Generate Resume Bullets</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResumeBulletsWizard;