import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';

const EntryList = ({ selectedDate, onDateSelect, refreshTrigger }) => {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterHighlighted, setFilterHighlighted] = useState(false);

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

  // Truncate text for preview
  const truncateText = (text, maxLength = 120) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  // Load entries
  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.getEntries({ limit: 50 });
      
      if (response.success) {
        setEntries(response.data || []);
      } else {
        setError('Failed to load entries');
      }
    } catch (err) {
      console.error('Error loading entries:', err);
      setError('Failed to load entries');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Filter entries based on search and filters
  const filteredEntries = entries.filter(entry => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesText = entry.rawText.toLowerCase().includes(searchLower);
      const matchesDate = formatDate(entry.date).toLowerCase().includes(searchLower);
      
      if (!matchesText && !matchesDate) {
        return false;
      }
    }

    // Highlight filter
    if (filterHighlighted && !entry.isHighlight) {
      return false;
    }

    return true;
  });

  // Handle entry click
  const handleEntryClick = (entry) => {
    const entryDate = new Date(entry.date);
    onDateSelect(entryDate);
  };

  // Handle entry deletion
  const handleDeleteEntry = async (entry, e) => {
    e.stopPropagation(); // Prevent entry selection
    
    if (!confirm('Are you sure you want to delete this entry?')) {
      return;
    }

    try {
      await apiService.deleteEntry(entry.date);
      // Refresh entries list
      loadEntries();
      
      // If this was the selected entry, clear selection
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
    e.stopPropagation(); // Prevent entry selection
    
    try {
      await apiService.toggleEntryHighlight(entry.date);
      // Refresh entries list
      loadEntries();
    } catch (err) {
      console.error('Error toggling highlight:', err);
    }
  };

  // Load entries on mount and when refreshTrigger changes
  useEffect(() => {
    loadEntries();
  }, [loadEntries, refreshTrigger]);

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
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Journal Entries
        </h2>
        
        {/* Search */}
        <input
          type="text"
          placeholder="Search entries..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        
        {/* Filters */}
        <div className="mt-2 flex items-center gap-2">
          <label className="flex items-center text-sm text-gray-600">
            <input
              type="checkbox"
              checked={filterHighlighted}
              onChange={(e) => setFilterHighlighted(e.target.checked)}
              className="mr-1"
            />
            Highlighted only
          </label>
        </div>
      </div>

      {/* Entries List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            Loading entries...
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {entries.length === 0 ? (
              <>
                <div className="text-4xl mb-2">📝</div>
                <p className="text-sm">No entries yet</p>
                <p className="text-xs mt-1">Start writing your first work log!</p>
              </>
            ) : (
              <>
                <div className="text-4xl mb-2">🔍</div>
                <p className="text-sm">No entries match your search</p>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredEntries.map((entry) => {
              const entryDate = new Date(entry.date);
              const isSelected = selectedDate && entryDate.toDateString() === selectedDate.toDateString();
              
              return (
                <div
                  key={entry.id}
                  onClick={() => handleEntryClick(entry)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  }`}
                >
                  {/* Entry header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(entry.date)}
                      </span>
                      {entry.isHighlight && (
                        <span className="text-yellow-500" title="Highlighted entry">
                          ⭐
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {/* Highlight toggle */}
                      <button
                        onClick={(e) => handleToggleHighlight(entry, e)}
                        className={`p-1 rounded hover:bg-gray-200 transition-colors ${
                          entry.isHighlight ? 'text-yellow-500' : 'text-gray-400'
                        }`}
                        title={entry.isHighlight ? 'Remove highlight' : 'Highlight entry'}
                      >
                        ⭐
                      </button>
                      
                      {/* Delete button */}
                      <button
                        onClick={(e) => handleDeleteEntry(entry, e)}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-gray-200 rounded transition-colors"
                        title="Delete entry"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  {/* Entry preview */}
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {truncateText(entry.rawText)}
                  </p>
                  
                  {/* Entry metadata */}
                  <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                    <span>{entry.wordCount} words</span>
                    {entry.sentiment && (
                      <span className="capitalize">{entry.sentiment}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {filteredEntries.length > 0 && (
        <div className="p-3 border-t border-gray-200 text-xs text-gray-500 text-center">
          {filteredEntries.length} of {entries.length} entries
        </div>
      )}
    </div>
  );
};

export default EntryList;