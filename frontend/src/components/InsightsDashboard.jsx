import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import ProjectsModal from './ProjectsModal';
import SkillsModal from './SkillsModal';
import CompetenciesModal from './CompetenciesModal';
import ExportModal from './ExportModal';
import CompetencyChart from './insights/CompetencyChart';
import TrendChart from './insights/TrendChart';
import ProjectTimeline from './insights/ProjectTimeline';
import SkillsCloud from './insights/SkillsCloud';

const InsightsDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('all');
  
  // Modal states
  const [showExportModal, setShowExportModal] = useState(false);
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [showCompetenciesModal, setShowCompetenciesModal] = useState(false);

  // Load dashboard data on initial mount
  useEffect(() => {
    loadDashboardData(true); // Show loading on initial load
  }, []);

  // Reload data when timeframe changes (without full loading screen)
  useEffect(() => {
    if (dashboardData) { // Only reload if we already have data (not initial load)
      loadDashboardData(false); // Don't show loading spinner for timeframe changes
    }
  }, [timeframe]);

  const loadDashboardData = async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    } else {
      setIsUpdating(true);
    }
    setError(null);

    try {
      const response = await apiService.get(`/api/insights/dashboard?timeframe=${timeframe}`);
      
      if (response.success) {
        setDashboardData(response.data);
      } else {
        setError(response.error || 'Failed to load dashboard data');
      }
    } catch (err) {
      console.error('Dashboard loading error:', err);
      setError('Failed to load dashboard data');
    } finally {
      if (showLoading) {
        setIsLoading(false);
      } else {
        setIsUpdating(false);
      }
    }
  };

  // Format number with commas
  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  // Get timeframe display name
  const getTimeframeName = (tf) => {
    const names = {
      'week': 'This Week',
      'month': 'This Month', 
      'quarter': 'This Quarter',
      'year': 'This Year',
      'all': 'All Time'
    };
    return names[tf] || 'All Time';
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading insights...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Insights</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">📊 Insights Dashboard</h1>
              <p className="text-gray-600 mt-1">Track your career progress and achievements</p>
            </div>
            {isUpdating && (
              <div className="flex items-center gap-2 text-blue-600">
                <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                <span className="text-sm">Updating...</span>
              </div>
            )}
          </div>
          
          {/* Timeframe Selector */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Timeframe:</label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
                <option value="all">All Time</option>
              </select>
            </div>
            
            <button 
              onClick={() => setShowExportModal(true)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`p-6 space-y-6 transition-opacity duration-200 ${isUpdating ? 'opacity-60' : 'opacity-100'}`}>
        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="ENTRIES"
            value={dashboardData?.summary?.totalEntries || 0}
            icon="📝"
            color="blue"
            subtitle="this period"
          />
          <MetricCard
            title="STREAK"
            value={`🔥 ${dashboardData?.summary?.currentStreak || 0}`} 
            icon=""
            color="orange"
            subtitle="days"
          />
          <MetricCard
            title="PROJECTS"
            value={dashboardData?.summary?.totalProjects || 0}
            icon="📁"
            color="teal"
            subtitle={`${dashboardData?.projects?.filter(p => p.status === 'active').length || 0} active`}
          />
          <MetricCard
            title="SKILLS"
            value={dashboardData?.summary?.totalSkills || 0}
            icon="⚡"
            color="purple"
            subtitle={`${dashboardData?.skills?.filter(s => s.usageCount === 1).length || 0} new`}
          />
        </div>

        {/* Recent Activity & Top Projects */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Projects */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              📁 Top Projects
              <span className="text-sm font-normal text-gray-500">
                ({getTimeframeName(timeframe)})
              </span>
            </h3>
            
            {dashboardData?.projects?.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.projects.slice(0, 5).map((project, index) => {
                  const statusIcon = project.status === 'active' ? '🟢' : project.status === 'completed' ? '⚪' : '🔴';
                  
                  return (
                    <div key={project.id} className="flex items-start gap-3">
                      <div className="text-sm mt-0.5">
                        {statusIcon}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{project.name}</div>
                        <div className="text-sm text-gray-500">
                          {project.entryCount} entries, {project.status}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                <div className="pt-3 border-t border-gray-100">
                  <button 
                    onClick={() => setShowProjectsModal(true)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Manage Projects →
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📋</div>
                <p>No projects found for {getTimeframeName(timeframe).toLowerCase()}</p>
              </div>
            )}
          </div>

          {/* Top Skills */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              ⚡ Top Skills
              <span className="text-sm font-normal text-gray-500">
                ({getTimeframeName(timeframe)})
              </span>
            </h3>
            
            {dashboardData?.skills?.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.skills.slice(0, 6).map((skill, index) => {
                  const maxUsage = Math.max(...dashboardData.skills.map(s => s.usageCount));
                  const percentage = (skill.usageCount / maxUsage) * 100;
                  
                  return (
                    <div key={skill.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{skill.name}</span>
                        <span className="text-sm text-gray-500">{skill.usageCount}x</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-500 ease-out ${
                            skill.category === 'technical' 
                              ? 'bg-green-500'
                              : skill.category === 'soft'
                              ? 'bg-purple-500'
                              : 'bg-blue-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
                
                <div className="pt-3 border-t border-gray-100">
                  <button 
                    onClick={() => setShowSkillsModal(true)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View All Skills →
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">💡</div>
                <p>No skills found for {getTimeframeName(timeframe).toLowerCase()}</p>
              </div>
            )}
          </div>
        </div>

        {/* Competencies with Progress Bars */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Competencies Demonstrated
          </h3>
          
          {dashboardData?.competencies?.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.competencies.slice(0, 5).map((competency, index) => {
                const maxCount = Math.max(...dashboardData.competencies.map(c => c.demonstrationCount));
                const percentage = (competency.demonstrationCount / maxCount) * 100;
                
                return (
                  <div key={competency.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{competency.name}</span>
                      <span className="text-sm text-gray-500">{competency.demonstrationCount} times</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
              
              <div className="pt-4 border-t border-gray-100">
                <button 
                  onClick={() => setShowCompetenciesModal(true)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View Details →
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🎯</div>
              <p>No competencies found for {getTimeframeName(timeframe).toLowerCase()}</p>
            </div>
          )}
        </div>

        {/* Recent Entries */}
        {dashboardData?.entries?.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              📖 Recent Analyzed Entries
              <span className="text-sm font-normal text-gray-500">
                ({getTimeframeName(timeframe)})
              </span>
            </h3>
            
            <div className="space-y-4">
              {dashboardData.entries.slice(0, 3).map((entry) => (
                <div key={entry.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(entry.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      {entry.sentiment && (
                        <span className="text-lg">
                          {entry.sentiment === 'positive' ? '😊' : 
                           entry.sentiment === 'negative' ? '😔' : '😐'}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">{entry.wordCount} words</span>
                    </div>
                  </div>
                  
                  {entry.extractedData && (
                    <div className="flex flex-wrap gap-2">
                      {entry.extractedData.projects?.slice(0, 3).map((project, idx) => (
                        <span key={idx} className="px-2 py-1 bg-teal-100 text-teal-800 rounded text-xs">
                          📁 {project.name}
                        </span>
                      ))}
                      {entry.extractedData.skills?.slice(0, 3).map((skill, idx) => (
                        <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                          ⚡ {skill.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interactive Charts and Visualizations */}
        {dashboardData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            {/* Competency Development Chart */}
            <div className="lg:col-span-2">
              <CompetencyChart 
                competencies={dashboardData.competencies || []} 
                timeframe={timeframe}
                onViewAllClick={() => setShowCompetenciesModal(true)}
              />
            </div>
            
            {/* Skills Cloud */}
            <div className="lg:col-span-2">
              <SkillsCloud 
                skills={dashboardData.skills || []} 
                timeframe={timeframe}
                onSkillClick={(skill) => {
                  console.log('Skill clicked:', skill);
                  // Could open skill details modal or filter entries
                }}
              />
            </div>
            
            {/* Productivity Trends */}
            <div className="lg:col-span-2">
              <TrendChart 
                timeframe={timeframe === 'all' ? '30' : timeframe}
                chartType="entries"
              />
            </div>
            
            {/* Project Timeline */}
            <div className="lg:col-span-2">
              <ProjectTimeline 
                projects={dashboardData.projects || []} 
                entries={dashboardData.entries || []}
                timeframe={timeframe} 
              />
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ExportModal 
        isOpen={showExportModal} 
        onClose={() => setShowExportModal(false)}
        timeframe={timeframe}
      />
      
      <ProjectsModal 
        isOpen={showProjectsModal} 
        onClose={() => setShowProjectsModal(false)}
        timeframe={timeframe}
        onProjectUpdated={() => loadDashboardData(false)}
      />
      
      <SkillsModal 
        isOpen={showSkillsModal} 
        onClose={() => setShowSkillsModal(false)}
        timeframe={timeframe}
      />
      
      <CompetenciesModal 
        isOpen={showCompetenciesModal} 
        onClose={() => setShowCompetenciesModal(false)}
        timeframe={timeframe}
      />
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ title, value, icon, color, subtitle }) => {
  const colorClasses = {
    blue: 'bg-white border-gray-200',
    orange: 'bg-white border-gray-200', 
    teal: 'bg-white border-gray-200',
    purple: 'bg-white border-gray-200'
  };

  return (
    <div className={`p-6 border rounded-lg ${colorClasses[color] || colorClasses.blue}`}>
      <div className="text-center">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mb-1">
          {typeof value === 'number' ? new Intl.NumberFormat().format(value) : value}
        </p>
        {subtitle && (
          <p className="text-sm text-gray-600">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

export default InsightsDashboard;