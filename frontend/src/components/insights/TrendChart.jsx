import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';
import { apiService } from '../../services/api';
import { format, parseISO, subDays, eachDayOfInterval } from 'date-fns';

const TrendChart = ({ timeframe = '30', chartType = 'entries' }) => {
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMetrics, setSelectedMetrics] = useState({
    entries: true,
    words: true,
    projects: false,
    skills: false
  });

  useEffect(() => {
    loadTrendData();
  }, [timeframe]);

  const loadTrendData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const days = parseInt(timeframe) || 30;
      const response = await apiService.get(`/api/insights/trends?days=${days}`);
      
      if (response.success) {
        const processedData = processTrendData(response.data.dailyTrends, days);
        setTrendData(processedData);
      } else {
        setError('Failed to load trend data');
      }
    } catch (err) {
      console.error('Trend data loading error:', err);
      setError('Failed to load trend data');
    } finally {
      setLoading(false);
    }
  };

  const processTrendData = (dailyTrends, days) => {
    // Ensure we have data for all days in the range
    const endDate = new Date();
    const startDate = subDays(endDate, days - 1);
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

    const trendMap = new Map();
    dailyTrends.forEach(trend => {
      trendMap.set(trend.date, trend);
    });

    return dateRange.map(date => {
      const dateKey = format(date, 'yyyy-MM-dd');
      const trend = trendMap.get(dateKey) || {
        date: dateKey,
        entryCount: 0,
        totalWords: 0,
        avgWords: 0,
        uniqueProjects: 0,
        uniqueSkills: 0,
        sentiments: { positive: 0, neutral: 0, negative: 0 }
      };

      return {
        date: dateKey,
        displayDate: format(date, 'MMM dd'),
        shortDate: format(date, 'MM/dd'),
        entries: trend.entryCount,
        words: trend.totalWords,
        avgWords: trend.avgWords,
        projects: trend.uniqueProjects,
        skills: trend.uniqueSkills,
        positiveCount: trend.sentiments.positive,
        neutralCount: trend.sentiments.neutral,
        negativeCount: trend.sentiments.negative,
        // Calculate rolling averages
        weeklyAvgEntries: 0, // Will be calculated below
        weeklyAvgWords: 0
      };
    });
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{data.displayDate}</p>
          <div className="space-y-1 text-sm">
            {payload.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                ></div>
                <span className="text-gray-700">
                  {entry.name}: <strong>{entry.value}</strong>
                  {entry.dataKey === 'words' ? ' words' : 
                   entry.dataKey === 'entries' ? ' entries' :
                   entry.dataKey === 'projects' ? ' projects' :
                   entry.dataKey === 'skills' ? ' skills' : ''}
                </span>
              </div>
            ))}
            
            {/* Sentiment breakdown if available */}
            {data.positiveCount + data.neutralCount + data.negativeCount > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-600 font-medium">Sentiment:</p>
                <div className="flex gap-3 text-xs">
                  <span className="text-green-600">😊 {data.positiveCount}</span>
                  <span className="text-gray-600">😐 {data.neutralCount}</span>
                  <span className="text-red-600">😔 {data.negativeCount}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const toggleMetric = (metric) => {
    setSelectedMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric]
    }));
  };

  const getMetricColor = (metric) => {
    const colors = {
      entries: '#3B82F6',    // Blue
      words: '#10B981',      // Green
      projects: '#8B5CF6',   // Purple
      skills: '#F59E0B'      // Orange
    };
    return colors[metric] || '#6B7280';
  };

  const getMetricLabel = (metric) => {
    const labels = {
      entries: 'Journal Entries',
      words: 'Total Words',
      projects: 'Unique Projects',
      skills: 'Unique Skills'
    };
    return labels[metric] || metric;
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📈 Productivity Trends
        </h3>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📈 Productivity Trends
        </h3>
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <div className="text-4xl mb-4">⚠️</div>
          <p>{error}</p>
          <button 
            onClick={loadTrendData}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!trendData || trendData.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📈 Productivity Trends
        </h3>
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <div className="text-4xl mb-4">📊</div>
          <p>No trend data available</p>
          <p className="text-sm mt-2">Start logging entries to see your progress!</p>
        </div>
      </div>
    );
  }

  const totalEntries = trendData.reduce((sum, d) => sum + d.entries, 0);
  const totalWords = trendData.reduce((sum, d) => sum + d.words, 0);
  const avgEntriesPerDay = (totalEntries / trendData.length).toFixed(1);
  const avgWordsPerDay = Math.round(totalWords / trendData.length);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            📈 Productivity Trends
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Last {timeframe} days of activity
          </p>
        </div>
        
        {/* Metric toggles */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(selectedMetrics).map(([metric, isSelected]) => (
            <button
              key={metric}
              onClick={() => toggleMetric(metric)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                isSelected 
                  ? 'border-transparent text-white'
                  : 'border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
              style={{
                backgroundColor: isSelected ? getMetricColor(metric) : 'transparent'
              }}
            >
              {getMetricLabel(metric)}
            </button>
          ))}
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={trendData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="shortDate" 
              fontSize={12}
              stroke="#6B7280"
              tickMargin={8}
            />
            {/* Primary Y-Axis for word counts */}
            <YAxis 
              yAxisId="words"
              stroke="#6B7280"
              fontSize={12}
              label={{ value: 'Words', angle: -90, position: 'insideLeft' }}
            />
            {/* Secondary Y-Axis for counts */}
            <YAxis 
              yAxisId="counts"
              orientation="right"
              stroke="#6B7280"
              fontSize={12}
              label={{ value: 'Counts', angle: 90, position: 'insideRight' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {selectedMetrics.entries && (
              <Line 
                type="monotone" 
                dataKey="entries" 
                yAxisId="counts"
                stroke={getMetricColor('entries')}
                strokeWidth={2}
                dot={{ fill: getMetricColor('entries'), strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: getMetricColor('entries'), strokeWidth: 2 }}
                name="Entries"
              />
            )}
            
            {selectedMetrics.words && (
              <Line 
                type="monotone" 
                dataKey="words" 
                yAxisId="words"
                stroke={getMetricColor('words')}
                strokeWidth={2}
                dot={{ fill: getMetricColor('words'), strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: getMetricColor('words'), strokeWidth: 2 }}
                name="Words"
              />
            )}
            
            {selectedMetrics.projects && (
              <Line 
                type="monotone" 
                dataKey="projects" 
                yAxisId="counts"
                stroke={getMetricColor('projects')}
                strokeWidth={2}
                dot={{ fill: getMetricColor('projects'), strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: getMetricColor('projects'), strokeWidth: 2 }}
                name="Projects"
              />
            )}
            
            {selectedMetrics.skills && (
              <Line 
                type="monotone" 
                dataKey="skills" 
                yAxisId="counts"
                stroke={getMetricColor('skills')}
                strokeWidth={2}
                dot={{ fill: getMetricColor('skills'), strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: getMetricColor('skills'), strokeWidth: 2 }}
                name="Skills"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">{totalEntries}</div>
          <div className="text-sm text-gray-600">Total Entries</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">{avgEntriesPerDay}</div>
          <div className="text-sm text-gray-600">Avg Entries/Day</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">{totalWords.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Total Words</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">{avgWordsPerDay}</div>
          <div className="text-sm text-gray-600">Avg Words/Day</div>
        </div>
      </div>

      {/* Timeframe selector */}
      <div className="mt-4 flex justify-center">
        <div className="flex bg-gray-100 rounded-lg p-1">
          {['7', '14', '30', '90'].map(days => (
            <button
              key={days}
              onClick={() => {
                // This would typically be handled by parent component
                console.log(`Change timeframe to ${days} days`);
              }}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                timeframe === days
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {days}d
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrendChart;