import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const CompetenciesModal = ({ isOpen, onClose, timeframe }) => {
  const [competencies, setCompetencies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('demonstrationCount'); // demonstrationCount, name, lastDemonstrated
  const [selectedCompetency, setSelectedCompetency] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadCompetencies();
    }
  }, [isOpen, timeframe]);

  const loadCompetencies = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // For now, we'll use the dashboard data since we don't have a dedicated competencies endpoint
      const response = await apiService.get(`/api/insights/dashboard?timeframe=${timeframe}`);
      
      if (response.success) {
        setCompetencies(response.data.competencies || []);
      } else {
        setError('Failed to load competencies');
      }
    } catch (err) {
      console.error('Competencies loading error:', err);
      setError('Failed to load competencies');
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredAndSortedCompetencies = () => {
    let filtered = competencies.filter(competency => 
      competency.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'lastDemonstrated':
          return new Date(b.lastDemonstrated || 0) - new Date(a.lastDemonstrated || 0);
        case 'demonstrationCount':
        default:
          return b.demonstrationCount - a.demonstrationCount;
      }
    });
  };

  const getDemonstrationLevel = (count) => {
    if (count >= 15) return { level: 'Mastery', color: 'bg-purple-500', icon: '👑' };
    if (count >= 10) return { level: 'Advanced', color: 'bg-blue-500', icon: '⭐' };
    if (count >= 5) return { level: 'Proficient', color: 'bg-green-500', icon: '✅' };
    if (count >= 2) return { level: 'Developing', color: 'bg-yellow-500', icon: '📈' };
    return { level: 'Emerging', color: 'bg-gray-500', icon: '🌱' };
  };

  const getCompetencyIcon = (name) => {
    const iconMap = {
      'leadership': '👑',
      'innovation': '💡',
      'collaboration': '🤝',
      'communication': '💬',
      'problem solving': '🧩',
      'adaptability': '🔄',
      'initiative': '🚀',
      'accountability': '📋',
      'customer focus': '🎯',
      'results oriented': '📊',
      'teamwork': '👥',
      'mentoring': '🧭'
    };
    return iconMap[name.toLowerCase()] || '🎯';
  };

  const handleCompetencyClick = (competency) => {
    setSelectedCompetency(competency);
  };

  const handleCloseDetail = () => {
    setSelectedCompetency(null);
  };

  const filteredCompetencies = getFilteredAndSortedCompetencies();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">🎯 Competencies Demonstrated</h2>
            <p className="text-sm text-gray-600 mt-1">
              View and analyze your competency development ({timeframe === 'all' ? 'All Time' : timeframe})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Filters and Controls */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-64">
              <input
                type="text"
                placeholder="Search competencies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                🔍
              </div>
            </div>

            {/* Sort By */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="demonstrationCount">Demonstration Count</option>
                <option value="name">Name</option>
                <option value="lastDemonstrated">Last Demonstrated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto max-h-96 p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">
              <div className="text-4xl mb-2">⚠️</div>
              <p>{error}</p>
            </div>
          ) : filteredCompetencies.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-2">🎯</div>
              <p>No competencies found{searchTerm ? ` for "${searchTerm}"` : ''}</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCompetencies.map((competency) => {
                const demonstrationLevel = getDemonstrationLevel(competency.demonstrationCount);
                const maxDemonstrations = Math.max(...competencies.map(c => c.demonstrationCount));
                const demonstrationPercentage = (competency.demonstrationCount / maxDemonstrations) * 100;

                return (
                  <div 
                    key={competency.id} 
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleCompetencyClick(competency)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getCompetencyIcon(competency.name)}</span>
                        <h3 className="font-semibold text-gray-900">{competency.name}</h3>
                      </div>
                      <span className="text-lg">{demonstrationLevel.icon}</span>
                    </div>

                    {/* Demonstration Statistics */}
                    <div className="space-y-3">
                      {/* Demonstration Count */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Demonstrations</span>
                        <span className="font-medium text-gray-900">{competency.demonstrationCount}x</span>
                      </div>

                      {/* Level Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Development Level</span>
                          <span className="text-xs text-gray-600">{demonstrationLevel.level}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full transition-all duration-500 ${demonstrationLevel.color}`}
                            style={{ width: `${demonstrationPercentage}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Last Demonstrated */}
                      {competency.lastDemonstrated && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Last Demonstrated</span>
                          <span className="text-sm text-gray-500">
                            {new Date(competency.lastDemonstrated).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      {/* Growth Indicator */}
                      {competency.recentGrowth && (
                        <div className="flex items-center gap-1 text-green-600">
                          <span className="text-sm">📈</span>
                          <span className="text-xs">Growing</span>
                        </div>
                      )}
                    </div>

                    {/* Click to view details hint */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <span className="text-xs text-blue-600 hover:text-blue-800">
                        Click for timeline →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {filteredCompetencies.length} competenc{filteredCompetencies.length !== 1 ? 'ies' : 'y'} found
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Done
          </button>
        </div>
      </div>

      {/* Competency Detail Modal */}
      {selectedCompetency && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[70vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getCompetencyIcon(selectedCompetency.name)}</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedCompetency.name}</h3>
                  <p className="text-sm text-gray-600">
                    {selectedCompetency.demonstrationCount} demonstrations
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseDetail}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 overflow-auto">
              <div className="space-y-4">
                {/* Development Timeline (placeholder) */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Development Timeline</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">
                        Timeline visualization coming soon
                      </span>
                    </div>
                  </div>
                </div>

                {/* Key Evidence (placeholder) */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Key Evidence</h4>
                  <div className="text-sm text-gray-600">
                    Evidence from journal entries will be displayed here
                  </div>
                </div>

                {/* Growth Insights (placeholder) */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Growth Insights</h4>
                  <div className="text-sm text-gray-600">
                    AI-powered growth analysis coming soon
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompetenciesModal;