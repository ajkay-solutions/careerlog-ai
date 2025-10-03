import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CompetencyChart = ({ competencies = [], timeframe = 'all', onViewAllClick }) => {
  const [chartData, setChartData] = useState([]);
  const [hoveredBar, setHoveredBar] = useState(null);

  useEffect(() => {
    if (competencies && competencies.length > 0) {
      // Process competencies data for chart
      const processedData = competencies
        .slice(0, 10) // Show top 10 competencies
        .map((competency, index) => ({
          id: competency.id,
          name: competency.name.length > 15 
            ? competency.name.substring(0, 15) + '...' 
            : competency.name,
          fullName: competency.name,
          demonstrations: competency.demonstrationCount || 0,
          level: getDemonstrationLevel(competency.demonstrationCount || 0),
          color: getDemonstrationColor(competency.demonstrationCount || 0),
          lastDemonstrated: competency.lastDemonstrated,
          rank: index + 1
        }))
        .sort((a, b) => b.demonstrations - a.demonstrations);

      setChartData(processedData);
    } else {
      setChartData([]);
    }
  }, [competencies]);

  const getDemonstrationLevel = (count) => {
    if (count >= 15) return 'Mastery';
    if (count >= 10) return 'Advanced';
    if (count >= 5) return 'Proficient';
    if (count >= 2) return 'Developing';
    return 'Emerging';
  };

  const getDemonstrationColor = (count) => {
    if (count >= 15) return '#8B5CF6'; // Purple - Mastery
    if (count >= 10) return '#3B82F6'; // Blue - Advanced
    if (count >= 5) return '#10B981';  // Green - Proficient
    if (count >= 2) return '#F59E0B';  // Yellow - Developing
    return '#6B7280';                  // Gray - Emerging
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{data.fullName}</p>
          <div className="space-y-1 text-sm">
            <p className="text-gray-700">
              <span className="font-medium">Demonstrations:</span> {data.demonstrations}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Level:</span> 
              <span className={`ml-1 px-2 py-1 rounded text-xs font-medium`}
                   style={{ backgroundColor: data.color + '20', color: data.color }}>
                {data.level}
              </span>
            </p>
            {data.lastDemonstrated && (
              <p className="text-gray-600">
                <span className="font-medium">Last shown:</span> {new Date(data.lastDemonstrated).toLocaleDateString()}
              </p>
            )}
            <p className="text-gray-600">
              <span className="font-medium">Rank:</span> #{data.rank}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomBar = (props) => {
    const { fill, ...rest } = props;
    return (
      <Bar 
        {...rest} 
        fill={chartData[props.index]?.color || fill}
        onMouseEnter={() => setHoveredBar(props.index)}
        onMouseLeave={() => setHoveredBar(null)}
        style={{
          filter: hoveredBar === props.index ? 'brightness(1.1)' : 'none',
          transition: 'all 0.2s ease'
        }}
      />
    );
  };

  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🎯 Competency Development Chart
        </h3>
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-center">
            No competency data available for {timeframe === 'all' ? 'all time' : timeframe}
          </p>
          <p className="text-sm text-center mt-2">
            Start logging journal entries to see your competency development!
          </p>
        </div>
      </div>
    );
  }

  const maxDemonstrations = Math.max(...chartData.map(d => d.demonstrations));

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            🎯 Competency Development Chart
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Top competencies demonstrated ({timeframe === 'all' ? 'All Time' : timeframe})
          </p>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { level: 'Mastery', color: '#8B5CF6', min: 15 },
            { level: 'Advanced', color: '#3B82F6', min: 10 },
            { level: 'Proficient', color: '#10B981', min: 5 },
            { level: 'Developing', color: '#F59E0B', min: 2 },
            { level: 'Emerging', color: '#6B7280', min: 1 }
          ].map(({ level, color, min }) => (
            <div key={level} className="flex items-center gap-1">
              <div 
                className="w-3 h-3 rounded" 
                style={{ backgroundColor: color }}
              ></div>
              <span className="text-gray-600">{level} ({min}+)</span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            barCategoryGap="20%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={12}
              stroke="#6B7280"
            />
            <YAxis 
              stroke="#6B7280"
              fontSize={12}
              domain={[0, Math.max(15, maxDemonstrations + 2)]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="demonstrations" 
              radius={[4, 4, 0, 0]}
              animationDuration={800}
              animationBegin={0}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  style={{
                    filter: hoveredBar === index ? 'brightness(1.1)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary stats below chart */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">{chartData.length}</div>
          <div className="text-sm text-gray-600">Total Competencies</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {chartData.filter(c => c.level === 'Mastery' || c.level === 'Advanced').length}
          </div>
          <div className="text-sm text-gray-600">Advanced+</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {Math.round(chartData.reduce((sum, c) => sum + c.demonstrations, 0) / chartData.length) || 0}
          </div>
          <div className="text-sm text-gray-600">Avg Demonstrations</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {chartData[0]?.demonstrations || 0}
          </div>
          <div className="text-sm text-gray-600">Top Competency</div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex justify-end">
        <button 
          onClick={() => {
            if (onViewAllClick) {
              onViewAllClick();
            } else {
              console.log('Open competencies modal for detailed view');
            }
          }}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          View All Competencies →
        </button>
      </div>
    </div>
  );
};

export default CompetencyChart;