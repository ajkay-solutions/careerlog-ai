import React, { useState, useEffect } from 'react';
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';

const ProjectTimeline = ({ projects = [], entries = [], timeframe = 'all' }) => {
  const [timelineData, setTimelineData] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' or 'gantt'

  useEffect(() => {
    if (projects && projects.length > 0) {
      const processedTimeline = processProjectTimeline(projects, entries);
      setTimelineData(processedTimeline);
    } else {
      setTimelineData([]);
    }
  }, [projects, entries]);

  const processProjectTimeline = (projectsData, entriesData) => {
    return projectsData
      .filter(project => project.entryCount > 0) // Only show projects with activity
      .map(project => {
        // Find all entries related to this project
        const projectEntries = entriesData.filter(entry => {
          if (!entry.extractedData) return false;
          
          try {
            const analysis = typeof entry.extractedData === 'string' 
              ? JSON.parse(entry.extractedData) 
              : entry.extractedData;
            
            // Check if this entry mentions this project
            if (analysis.projects?.some(p => {
              const projectName = typeof p === 'object' ? p.name : p;
              return projectName?.toLowerCase().includes(project.name.toLowerCase()) ||
                     project.name.toLowerCase().includes(projectName?.toLowerCase());
            })) {
              return true;
            }
            
            // Also check raw text for project name mentions
            if (entry.rawText?.toLowerCase().includes(project.name.toLowerCase())) {
              return true;
            }
            
            return false;
          } catch {
            // If parsing fails, check raw text as fallback
            return entry.rawText?.toLowerCase().includes(project.name.toLowerCase()) || false;
          }
        });

        // Calculate timeline metrics
        const entryDates = projectEntries.map(entry => new Date(entry.date)).sort((a, b) => a - b);
        const firstEntry = entryDates[0];
        const lastEntry = entryDates[entryDates.length - 1];
        
        // Calculate activity intensity over time
        const activityByMonth = {};
        projectEntries.forEach(entry => {
          const monthKey = format(new Date(entry.date), 'yyyy-MM');
          activityByMonth[monthKey] = (activityByMonth[monthKey] || 0) + 1;
        });

        return {
          id: project.id,
          name: project.name,
          status: project.status,
          entryCount: project.entryCount,
          startDate: firstEntry,
          endDate: lastEntry,
          duration: firstEntry && lastEntry 
            ? Math.ceil((lastEntry - firstEntry) / (1000 * 60 * 60 * 24)) + 1 
            : 0,
          activityByMonth,
          recentActivity: projectEntries
            .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by date descending
            .slice(0, 5), // Take first 5 (most recent)
          statusIcon: getStatusIcon(project.status),
          statusColor: getStatusColor(project.status),
          createdAt: new Date(project.createdAt),
          updatedAt: new Date(project.updatedAt)
        };
      })
      .sort((a, b) => {
        // Sort by status (active first), then by last activity
        if (a.status !== b.status) {
          if (a.status === 'active') return -1;
          if (b.status === 'active') return 1;
          if (a.status === 'completed') return -1;
          if (b.status === 'completed') return 1;
        }
        return (b.endDate || b.updatedAt) - (a.endDate || a.updatedAt);
      });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return '🟢';
      case 'completed': return '✅';
      case 'archived': return '📦';
      default: return '⚫';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'completed': return '#6B7280';
      case 'archived': return '#EF4444';
      default: return '#9CA3AF';
    }
  };

  const formatDuration = (days) => {
    if (days === 0) return 'Same day';
    if (days === 1) return '1 day';
    if (days < 30) return `${days} days`;
    if (days < 365) return `${Math.round(days / 30)} months`;
    return `${Math.round(days / 365)} years`;
  };

  const getActivityIntensity = (project) => {
    if (!project.duration || project.duration === 0) return 100;
    const entriesPerDay = project.entryCount / project.duration;
    return Math.min(100, entriesPerDay * 100); // Normalize to 0-100
  };

  if (!timelineData || timelineData.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🗓️ Project Timeline
        </h3>
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-center">
            No project activity data available
          </p>
          <p className="text-sm text-center mt-2">
            Start working on projects and logging entries to see your timeline!
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
            🗓️ Project Timeline
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Track project progression and activity over time
          </p>
        </div>
        
        {/* View mode toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              viewMode === 'timeline'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Timeline
          </button>
          <button
            onClick={() => setViewMode('gantt')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              viewMode === 'gantt'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Gantt
          </button>
        </div>
      </div>

      {viewMode === 'timeline' ? (
        <div className="space-y-4">
          {timelineData.map((project, index) => (
            <div 
              key={project.id} 
              className={`relative border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
                selectedProject?.id === project.id ? 'ring-2 ring-blue-500 border-blue-500' : ''
              }`}
              onClick={() => setSelectedProject(selectedProject?.id === project.id ? null : project)}
            >
              {/* Timeline connector line */}
              {index < timelineData.length - 1 && (
                <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-200"></div>
              )}
              
              <div className="flex items-start gap-4">
                {/* Status indicator */}
                <div className="flex-shrink-0 mt-1">
                  <div 
                    className="w-4 h-4 rounded-full border-2 border-white shadow-md"
                    style={{ backgroundColor: project.statusColor }}
                  ></div>
                </div>
                
                {/* Project info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{project.statusIcon}</span>
                      <h4 className="font-semibold text-gray-900">{project.name}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        project.status === 'active' ? 'bg-green-100 text-green-800' :
                        project.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      {project.entryCount} entries
                    </div>
                  </div>
                  
                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                    {project.startDate && (
                      <span>
                        Started: {format(project.startDate, 'MMM dd, yyyy')}
                      </span>
                    )}
                    {project.endDate && project.startDate !== project.endDate && (
                      <span>
                        Last activity: {format(project.endDate, 'MMM dd, yyyy')}
                      </span>
                    )}
                    {project.duration > 0 && (
                      <span>
                        Duration: {formatDuration(project.duration)}
                      </span>
                    )}
                  </div>
                  
                  {/* Activity intensity bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Activity Intensity</span>
                      <span>{(getActivityIntensity(project) / 10).toFixed(1)}/10</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="h-1.5 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${getActivityIntensity(project)}%`,
                          backgroundColor: project.statusColor 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Expanded details */}
              {selectedProject?.id === project.id && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h5 className="font-medium text-gray-900 mb-3">Recent Activity</h5>
                  <div className="space-y-2">
                    {project.recentActivity.length > 0 ? (
                      project.recentActivity.map((entry, idx) => (
                        <div key={idx} className="text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">
                              {format(new Date(entry.date), 'MMM dd, yyyy')}
                            </span>
                            <span className="text-gray-500">
                              {entry.wordCount} words
                            </span>
                          </div>
                          {entry.rawText && (
                            <p className="text-gray-700 mt-1 truncate">
                              {entry.rawText.substring(0, 100)}...
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No recent activity</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Gantt Chart View */
        <div className="space-y-2">
          <div className="text-sm text-gray-600 mb-4">
            Gantt chart view showing project durations and overlaps
          </div>
          
          {/* Timeline header */}
          <div className="grid grid-cols-12 gap-1 mb-2 text-xs text-gray-500">
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className="text-center">
                {format(new Date(2024, i, 1), 'MMM')}
              </div>
            ))}
          </div>
          
          {timelineData.map(project => (
            <div key={project.id} className="flex items-center gap-4">
              <div className="w-32 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{project.statusIcon}</span>
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {project.name}
                  </span>
                </div>
              </div>
              
              <div className="flex-1 grid grid-cols-12 gap-1 h-6">
                {Array.from({ length: 12 }, (_, monthIndex) => {
                  const monthKey = format(new Date(2024, monthIndex, 1), 'yyyy-MM');
                  const activityCount = project.activityByMonth[monthKey] || 0;
                  const hasActivity = activityCount > 0;
                  
                  return (
                    <div
                      key={monthIndex}
                      className={`rounded-sm ${
                        hasActivity 
                          ? 'opacity-80 hover:opacity-100' 
                          : 'bg-gray-100'
                      }`}
                      style={{
                        backgroundColor: hasActivity ? project.statusColor : undefined,
                        opacity: hasActivity ? Math.min(1, activityCount / 5) : undefined
                      }}
                      title={hasActivity ? `${activityCount} entries in ${format(new Date(2024, monthIndex, 1), 'MMMM')}` : ''}
                    ></div>
                  );
                })}
              </div>
              
              <div className="w-16 text-xs text-gray-600 text-right">
                {project.entryCount} entries
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Summary stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">{timelineData.length}</div>
          <div className="text-sm text-gray-600">Total Projects</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {timelineData.filter(p => p.status === 'active').length}
          </div>
          <div className="text-sm text-gray-600">Active Projects</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {timelineData.filter(p => p.status === 'completed').length}
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {Math.round(timelineData.reduce((sum, p) => sum + p.duration, 0) / timelineData.length) || 0}
          </div>
          <div className="text-sm text-gray-600">Avg Duration (days)</div>
        </div>
      </div>
    </div>
  );
};

export default ProjectTimeline;