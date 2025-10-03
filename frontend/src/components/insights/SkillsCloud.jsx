import React, { useState, useEffect, useMemo } from 'react';

const SkillsCloud = ({ skills = [], timeframe = 'all', onSkillClick }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [hoveredSkill, setHoveredSkill] = useState(null);
  const [viewMode, setViewMode] = useState('cloud'); // 'cloud' or 'list'

  // Helper functions (defined before usage)
  const calculateFontSize = (usage, min, max) => {
    if (max === min) return 16;
    const normalized = (usage - min) / (max - min);
    return Math.max(12, Math.min(32, 12 + normalized * 20));
  };

  const getCategoryColor = (category) => {
    const colorMap = {
      'technical': '#3B82F6',    // Blue
      'soft': '#10B981',         // Emerald Green
      'domain': '#8B5CF6',       // Purple
      'tool': '#F59E0B',         // Amber
      'framework': '#EF4444',    // Red
      'language': '#06B6D4',     // Cyan
      'process': '#84CC16',      // Lime
      'business': '#F97316',     // Orange
      'leadership': '#EC4899',   // Pink
      'creative': '#A855F7',     // Violet
      'management': '#14B8A6',   // Teal
      'communication': '#F472B6', // Hot Pink
      'analytical': '#6366F1',   // Indigo
      'design': '#EAB308',       // Yellow
      'research': '#059669',     // Emerald
      'testing': '#DC2626',      // Red 600
      'database': '#0EA5E9',     // Sky Blue
      'cloud': '#7C3AED',        // Violet 600
      'security': '#DC2626',     // Red 600
      'mobile': '#F59E0B',       // Amber 500
      'web': '#3B82F6',          // Blue 500
      'devops': '#059669',       // Emerald 600
      'ai': '#8B5CF6',           // Purple 500
      'data': '#0891B2',         // Cyan 600
      'product': '#EC4899'       // Pink 500
    };
    
    // If no specific category match, generate a consistent color based on category name
    if (!colorMap[category?.toLowerCase()]) {
      const colors = [
        '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', 
        '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#A855F7',
        '#14B8A6', '#F472B6', '#6366F1', '#EAB308', '#059669',
        '#DC2626', '#0EA5E9', '#7C3AED'
      ];
      const hash = category ? category.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0) : 0;
      return colors[Math.abs(hash) % colors.length];
    }
    
    return colorMap[category?.toLowerCase()] || '#6B7280';
  };

  const getUsageLevel = (usageCount) => {
    if (usageCount >= 20) return 'Expert';
    if (usageCount >= 10) return 'Proficient';
    if (usageCount >= 5) return 'Intermediate';
    if (usageCount >= 2) return 'Beginner';
    return 'Novice';
  };

  // Process skills data for visualization
  const processedSkills = useMemo(() => {
    if (!skills || skills.length === 0) return [];

    const filtered = selectedCategory === 'all' 
      ? skills 
      : skills.filter(skill => skill.category === selectedCategory);

    // Sort by usage count and take top 50 for cloud view
    const sorted = filtered
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, viewMode === 'cloud' ? 50 : 100);

    // Calculate font sizes and colors based on usage
    const maxUsage = Math.max(...sorted.map(s => s.usageCount || 0), 1);
    const minUsage = Math.min(...sorted.map(s => s.usageCount || 0), 1);

    return sorted.map(skill => ({
      ...skill,
      fontSize: calculateFontSize(skill.usageCount || 0, minUsage, maxUsage),
      color: getCategoryColor(skill.category),
      opacity: hoveredSkill ? (hoveredSkill.id === skill.id ? 1 : 0.6) : 1
    }));
  }, [skills, selectedCategory, hoveredSkill, viewMode]);

  // Get available categories
  const categories = useMemo(() => {
    const cats = [...new Set(skills.map(skill => skill.category).filter(Boolean))];
    return ['all', ...cats.sort()];
  }, [skills]);

  const handleSkillClick = (skill) => {
    if (onSkillClick) {
      onSkillClick(skill);
    } else {
      // Default behavior - could open skill details
      console.log('Skill clicked:', skill);
    }
  };

  if (!processedSkills || processedSkills.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ⚡ Skills Cloud
        </h3>
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <div className="text-4xl mb-4">🎯</div>
          <p className="text-center">
            No skills data available for {timeframe === 'all' ? 'all time' : timeframe}
          </p>
          <p className="text-sm text-center mt-2">
            Start logging journal entries and AI will extract your skills!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            ⚡ Skills Cloud
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Skills demonstrated ({timeframe === 'all' ? 'All Time' : timeframe})
          </p>
        </div>
        
        {/* View mode toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('cloud')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              viewMode === 'cloud'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Cloud
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* Category filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-100 border-blue-300 text-blue-800'
                  : 'border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
              {category !== 'all' && (
                <span className="ml-1 text-xs">
                  ({skills.filter(s => s.category === category).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Skills visualization */}
      {viewMode === 'cloud' ? (
        <div className="relative min-h-64 flex flex-wrap items-center justify-center gap-2 p-4 bg-gray-50 rounded-lg">
          {processedSkills.map((skill, index) => (
            <button
              key={skill.id}
              onClick={() => handleSkillClick(skill)}
              onMouseEnter={() => setHoveredSkill(skill)}
              onMouseLeave={() => setHoveredSkill(null)}
              className="transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-2 py-1"
              style={{
                fontSize: `${skill.fontSize}px`,
                color: skill.color,
                opacity: skill.opacity,
                fontWeight: skill.usageCount > 10 ? 'bold' : 'normal',
                textShadow: hoveredSkill?.id === skill.id ? '0 0 4px rgba(0,0,0,0.3)' : 'none'
              }}
              title={`${skill.name} - Used ${skill.usageCount} times (${skill.category})`}
            >
              {skill.name}
            </button>
          ))}
          
          {/* Hover tooltip */}
          {hoveredSkill && (
            <div className="absolute top-4 right-4 bg-white border border-gray-200 rounded-lg p-3 shadow-lg z-10">
              <div className="text-sm font-semibold text-gray-900">{hoveredSkill.name}</div>
              <div className="text-xs text-gray-600 space-y-1">
                <div>Category: {hoveredSkill.category || 'Uncategorized'}</div>
                <div>Used: {hoveredSkill.usageCount} times</div>
                <div>Level: {getUsageLevel(hoveredSkill.usageCount)}</div>
                {hoveredSkill.lastUsed && (
                  <div>Last used: {new Date(hoveredSkill.lastUsed).toLocaleDateString()}</div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {processedSkills.map((skill, index) => (
            <div
              key={skill.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              onClick={() => handleSkillClick(skill)}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: skill.color }}
                ></div>
                <div>
                  <div className="font-medium text-gray-900">{skill.name}</div>
                  <div className="text-xs text-gray-600">
                    {skill.category || 'Uncategorized'} • {getUsageLevel(skill.usageCount)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">{skill.usageCount}</div>
                <div className="text-xs text-gray-600">times used</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">{processedSkills.length}</div>
          <div className="text-sm text-gray-600">Skills Shown</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">{skills.length}</div>
          <div className="text-sm text-gray-600">Total Skills</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {processedSkills.filter(s => s.usageCount >= 10).length}
          </div>
          <div className="text-sm text-gray-600">Proficient+</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {Math.round(processedSkills.reduce((sum, s) => sum + s.usageCount, 0) / processedSkills.length) || 0}
          </div>
          <div className="text-sm text-gray-600">Avg Usage</div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-gray-400 rounded"></div>
          <span className="text-gray-600">Size = Usage frequency</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-blue-500 rounded"></div>
          <span className="text-gray-600">Color = Category</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-bold text-gray-600">Bold</span>
          <span className="text-gray-600">= 10+ uses</span>
        </div>
      </div>
    </div>
  );
};

export default SkillsCloud;