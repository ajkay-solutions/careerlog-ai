import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const SkillsModal = ({ isOpen, onClose, timeframe }) => {
  const [skills, setSkills] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('usageCount'); // usageCount, name, category, lastUsed

  useEffect(() => {
    if (isOpen) {
      loadSkills();
    }
  }, [isOpen, timeframe]);

  const loadSkills = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // For now, we'll use the dashboard data since we don't have a dedicated skills endpoint
      const response = await apiService.get(`/api/insights/dashboard?timeframe=${timeframe}`);
      
      if (response.success) {
        setSkills(response.data.skills || []);
      } else {
        setError('Failed to load skills');
      }
    } catch (err) {
      console.error('Skills loading error:', err);
      setError('Failed to load skills');
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredAndSortedSkills = () => {
    let filtered = skills.filter(skill => 
      skill.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterCategory === 'all' || skill.category === filterCategory)
    );

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'category':
          return (a.category || '').localeCompare(b.category || '');
        case 'lastUsed':
          return new Date(b.lastUsed || 0) - new Date(a.lastUsed || 0);
        case 'usageCount':
        default:
          return b.usageCount - a.usageCount;
      }
    });
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'technical': return '⚙️';
      case 'soft': return '🤝';
      case 'domain': return '🎯';
      default: return '💡';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'technical': return 'bg-green-100 text-green-800';
      case 'soft': return 'bg-purple-100 text-purple-800';
      case 'domain': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUsageLevel = (usageCount) => {
    if (usageCount >= 10) return { level: 'Expert', color: 'bg-green-500' };
    if (usageCount >= 5) return { level: 'Proficient', color: 'bg-blue-500' };
    if (usageCount >= 2) return { level: 'Developing', color: 'bg-yellow-500' };
    return { level: 'Beginner', color: 'bg-gray-500' };
  };

  const filteredSkills = getFilteredAndSortedSkills();
  const categories = ['all', ...new Set(skills.map(s => s.category).filter(Boolean))];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">⚡ All Skills</h2>
            <p className="text-sm text-gray-600 mt-1">
              View and analyze your skill development ({timeframe === 'all' ? 'All Time' : timeframe})
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
                placeholder="Search skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                🔍
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Category:</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : 
                     category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="usageCount">Usage Count</option>
                <option value="name">Name</option>
                <option value="category">Category</option>
                <option value="lastUsed">Last Used</option>
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
          ) : filteredSkills.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-2">💡</div>
              <p>No skills found{searchTerm ? ` for "${searchTerm}"` : ''}</p>
              {filterCategory !== 'all' && (
                <p className="text-sm mt-1">in {filterCategory} category</p>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredSkills.map((skill) => {
                const usageLevel = getUsageLevel(skill.usageCount);
                const maxUsageCount = Math.max(...skills.map(s => s.usageCount));
                const usagePercentage = (skill.usageCount / maxUsageCount) * 100;

                return (
                  <div key={skill.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getCategoryIcon(skill.category)}</span>
                        <h3 className="font-semibold text-gray-900">{skill.name}</h3>
                      </div>
                      {skill.category && (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(skill.category)}`}>
                          {skill.category}
                        </span>
                      )}
                    </div>

                    {/* Usage Statistics */}
                    <div className="space-y-3">
                      {/* Usage Count */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Usage Count</span>
                        <span className="font-medium text-gray-900">{skill.usageCount}x</span>
                      </div>

                      {/* Usage Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Proficiency Level</span>
                          <span className="text-xs text-gray-600">{usageLevel.level}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full transition-all duration-500 ${usageLevel.color}`}
                            style={{ width: `${usagePercentage}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Last Used */}
                      {skill.lastUsed && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Last Used</span>
                          <span className="text-sm text-gray-500">
                            {new Date(skill.lastUsed).toLocaleDateString()}
                          </span>
                        </div>
                      )}
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
            {filteredSkills.length} skill{filteredSkills.length !== 1 ? 's' : ''} found
            {filterCategory !== 'all' && ` in ${filterCategory} category`}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SkillsModal;