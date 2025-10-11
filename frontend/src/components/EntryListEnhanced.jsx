import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiService } from '../services/api';
import { Search, Star, Pin, Trash2, Calendar, Filter, ChevronDown, ChevronRight } from 'lucide-react';

const EntryListEnhanced = ({ selectedDate, onDateSelect, refreshTrigger }) => {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  const [filterHighlighted, setFilterHighlighted] = useState(false);
  const [filterPinned, setFilterPinned] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({
    pinned: true,
    today: true,
    yesterday: true,
    thisWeek: true,
    lastWeek: true,
    earlier: false
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Helper functions for date comparison
  const isToday = (date) => {
    const today = new Date();
    const entryDate = new Date(date);
    return entryDate.toDateString() === today.toDateString();
  };

  const isYesterday = (date) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const entryDate = new Date(date);
    return entryDate.toDateString() === yesterday.toDateString();
  };

  const isThisWeek = (date) => {
    const entryDate = new Date(date);
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
    weekStart.setHours(0, 0, 0, 0);
    return entryDate >= weekStart && !isToday(date) && !isYesterday(date);
  };

  const isLastWeek = (date) => {
    const entryDate = new Date(date);
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(weekStart);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
    
    return entryDate >= lastWeekStart && entryDate <= lastWeekEnd;
  };

  // Format date for display
  const formatDate = (date) => {
    const entryDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (entryDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (entryDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return entryDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: entryDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  // Format date range for grouped entries
  const formatDateRange = (entries) => {
    if (entries.length === 0) return '';
    const dates = entries.map(e => new Date(e.date)).sort((a, b) => a - b);
    const start = dates[0];
    const end = dates[dates.length - 1];
    
    if (start.toDateString() === end.toDateString()) {
      return formatDate(start);
    }
    
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  // Truncate text for preview
  const truncateText = (text, maxLength = 80) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  // Load entries
  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.getEntries({ limit: 75 }); // Increased limit
      
      if (response.success) {
        setEntries(response.data || []);
      } else {
        console.error('Failed to load entries:', response);
        setError('Failed to load entries');
      }
    } catch (err) {
      console.error('Error loading entries:', err);
      setError('Failed to load entries');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Group entries by time period
  const groupedEntries = useMemo(() => {
    const filtered = entries.filter(entry => {
      // Search filter
      if (searchDebounce) {
        const searchLower = searchDebounce.toLowerCase();
        const matchesText = entry.rawText?.toLowerCase().includes(searchLower);
        const matchesDate = formatDate(entry.date).toLowerCase().includes(searchLower);
        
        if (!matchesText && !matchesDate) {
          return false;
        }
      }

      // Highlight filter
      if (filterHighlighted && !entry.isHighlight) {
        return false;
      }

      // Pinned filter
      if (filterPinned && !entry.isPinned) {
        return false;
      }

      return true;
    });

    const groups = {
      pinned: filtered.filter(e => e.isPinned),
      today: filtered.filter(e => !e.isPinned && isToday(e.date)),
      yesterday: filtered.filter(e => !e.isPinned && isYesterday(e.date)),
      thisWeek: filtered.filter(e => !e.isPinned && isThisWeek(e.date)),
      lastWeek: filtered.filter(e => !e.isPinned && isLastWeek(e.date)),
      earlier: filtered.filter(e => !e.isPinned && !isToday(e.date) && !isYesterday(e.date) && !isThisWeek(e.date) && !isLastWeek(e.date))
    };

    return groups;
  }, [entries, searchDebounce, filterHighlighted, filterPinned]);

  // Calculate total entry count
  const totalFilteredCount = Object.values(groupedEntries).reduce((sum, group) => sum + group.length, 0);

  // Handle entry click
  const handleEntryClick = (entry) => {
    const entryDate = new Date(entry.date);
    onDateSelect(entryDate);
  };

  // Handle entry deletion
  const handleDeleteEntry = async (entry, e) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this entry?')) {
      return;
    }

    try {
      await apiService.deleteEntry(entry.date);
      
      setTimeout(() => {
        loadEntries();
      }, 100);
      
      if (selectedDate && new Date(entry.date).toDateString() === selectedDate.toDateString()) {
        onDateSelect(null);
      }
    } catch (err) {
      console.error('Error deleting entry:', err);
      alert('Failed to delete entry');
    }
  };

  // Handle highlight toggle
  const handleToggleHighlight = async (entry, e) => {
    e.stopPropagation();
    
    try {
      await apiService.toggleEntryHighlight(entry.date);
      loadEntries();
    } catch (err) {
      console.error('Error toggling highlight:', err);
    }
  };

  // Handle pin toggle
  const handleTogglePin = async (entry, e) => {
    e.stopPropagation();
    
    try {
      await apiService.toggleEntryPin(entry.date);
      loadEntries();
    } catch (err) {
      console.error('Error toggling pin:', err);
    }
  };

  // Toggle group expansion
  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  // Load entries on mount and when refreshTrigger changes
  useEffect(() => {
    loadEntries();
  }, [loadEntries, refreshTrigger]);

  // Entry component
  const EntryItem = ({ entry, isSelected }) => (
    <div
      onClick={() => handleEntryClick(entry)}
      className={`group px-4 py-3 cursor-pointer transition-all duration-150 hover:bg-gray-50 hover:translate-x-1 ${
        isSelected ? 'bg-blue-50 border-l-3 border-blue-500' : ''
      } ${entry.isPinned ? 'border-l-3 border-amber-500' : ''}`}
    >
      {/* Entry header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {/* Status dot */}
          <span className={`w-2 h-2 rounded-full ${
            isToday(entry.date) ? 'bg-green-500' : 
            isYesterday(entry.date) ? 'bg-blue-500' : 
            'bg-gray-400'
          }`} />
          
          <span className="text-sm font-medium text-gray-900">
            {formatDate(entry.date)}
          </span>
          
          <span className="text-xs text-gray-500">
            • {entry.wordCount || 0} words
          </span>
          
          {entry.isHighlight && (
            <Star className="w-3 h-3 text-yellow-500 fill-current" />
          )}
          
          {entry.isPinned && (
            <Pin className="w-3 h-3 text-amber-600 fill-current" />
          )}
        </div>
        
        {/* Quick actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => handleTogglePin(entry, e)}
            className={`p-1 rounded hover:bg-gray-200 transition-colors ${
              entry.isPinned ? 'text-amber-600' : 'text-gray-400'
            }`}
            title={entry.isPinned ? 'Unpin entry' : 'Pin entry'}
          >
            <Pin className="w-4 h-4" />
          </button>
          
          <button
            onClick={(e) => handleToggleHighlight(entry, e)}
            className={`p-1 rounded hover:bg-gray-200 transition-colors ${
              entry.isHighlight ? 'text-yellow-500' : 'text-gray-400'
            }`}
            title={entry.isHighlight ? 'Remove highlight' : 'Highlight entry'}
          >
            <Star className="w-4 h-4" />
          </button>
          
          <button
            onClick={(e) => handleDeleteEntry(entry, e)}
            className="p-1 text-gray-400 hover:text-red-500 hover:bg-gray-200 rounded transition-colors"
            title="Delete entry"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Entry preview */}
      {entry.rawText && (
        <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
          {truncateText(entry.rawText)}
        </p>
      )}
      
      {/* Entry metadata/tags */}
      {entry.extractedData && (
        <div className="mt-2 flex flex-wrap gap-1">
          {entry.extractedData.projects?.slice(0, 2).map((project, idx) => (
            <span key={idx} className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
              {project}
            </span>
          ))}
          {entry.extractedData.skills?.slice(0, 2).map((skill, idx) => (
            <span key={idx} className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
              {skill}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  // Group section component
  const EntryGroup = ({ title, icon, entries, groupKey, showCount = true }) => {
    if (entries.length === 0) return null;
    
    const isExpanded = expandedGroups[groupKey];
    
    return (
      <div className="border-b border-gray-100 last:border-0">
        <button
          onClick={() => toggleGroup(groupKey)}
          className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-gray-500">{icon}</span>
            <span className="text-sm font-medium text-gray-700 uppercase tracking-wider">
              {title}
            </span>
            {showCount && (
              <span className="text-xs text-gray-500">({entries.length})</span>
            )}
          </div>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </button>
        
        {isExpanded && (
          <div className="divide-y divide-gray-50">
            {entries.map((entry) => {
              const entryDate = new Date(entry.date);
              const isSelected = selectedDate && entryDate.toDateString() === selectedDate.toDateString();
              return (
                <EntryItem key={entry.id} entry={entry} isSelected={isSelected} />
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (error) {
    return (
      <div className="w-80 bg-white border-r border-gray-200 p-4">
        <div className="text-center text-red-600">
          <div className="text-4xl mb-2">⚠️</div>
          <p className="text-sm">{error}</p>
          <button
            onClick={loadEntries}
            className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 md:w-80 sm:w-full bg-white border-r border-gray-200 flex flex-col sidebar-mobile-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          📝 Recent Entries
        </h2>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search entries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        {/* Quick Filters */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterPinned(!filterPinned)}
            className={`p-2 rounded-lg transition-colors ${
              filterPinned ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Show pinned only"
          >
            <Pin className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setFilterHighlighted(!filterHighlighted)}
            className={`p-2 rounded-lg transition-colors ${
              filterHighlighted ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Show highlighted only"
          >
            <Star className="w-4 h-4" />
          </button>
          
          <button
            className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            title="Date range filter"
          >
            <Calendar className="w-4 h-4" />
          </button>
          
          <button
            className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            title="Advanced filters"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Entries List */}
      <div className="flex-1 overflow-y-auto sidebar-scroll">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            Loading entries...
          </div>
        ) : totalFilteredCount === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {entries.length === 0 ? (
              <>
                <div className="text-4xl mb-2">📝</div>
                <p className="text-sm">No entries yet</p>
                <p className="text-xs mt-1">Start writing your first career journal!</p>
              </>
            ) : (
              <>
                <div className="text-4xl mb-2">🔍</div>
                <p className="text-sm">No entries match your filters</p>
              </>
            )}
          </div>
        ) : (
          <div>
            {/* Pinned Entries */}
            {groupedEntries.pinned.length > 0 && (
              <EntryGroup
                title="Pinned Entries"
                icon="📌"
                entries={groupedEntries.pinned}
                groupKey="pinned"
                showCount={false}
              />
            )}
            
            {/* Today */}
            {groupedEntries.today.length > 0 && (
              <EntryGroup
                title="Today"
                icon="🟢"
                entries={groupedEntries.today}
                groupKey="today"
                showCount={false}
              />
            )}
            
            {/* Yesterday */}
            {groupedEntries.yesterday.length > 0 && (
              <EntryGroup
                title="Yesterday"
                icon="⚪"
                entries={groupedEntries.yesterday}
                groupKey="yesterday"
                showCount={false}
              />
            )}
            
            {/* This Week */}
            {groupedEntries.thisWeek.length > 0 && (
              <EntryGroup
                title="This Week"
                icon="📅"
                entries={groupedEntries.thisWeek}
                groupKey="thisWeek"
              />
            )}
            
            {/* Last Week */}
            {groupedEntries.lastWeek.length > 0 && (
              <EntryGroup
                title="Last Week"
                icon="📅"
                entries={groupedEntries.lastWeek}
                groupKey="lastWeek"
              />
            )}
            
            {/* Earlier */}
            {groupedEntries.earlier.length > 0 && (
              <EntryGroup
                title="Earlier"
                icon="📅"
                entries={groupedEntries.earlier}
                groupKey="earlier"
              />
            )}
          </div>
        )}
      </div>

      {/* Footer with stats */}
      {totalFilteredCount > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>📊 {totalFilteredCount} of {entries.length} entries</span>
            <span className="flex items-center gap-2">
              🔥 12-day streak
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntryListEnhanced;