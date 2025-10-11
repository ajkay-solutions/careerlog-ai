import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Search, Star, Pin, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

const MobileEntrySheet = ({ selectedDate, onDateSelect, refreshTrigger }) => {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sheetHeight, setSheetHeight] = useState('collapsed'); // collapsed, partial, full
  const [searchTerm, setSearchTerm] = useState('');

  // Simplified mobile entry format
  const formatMobileDate = (date) => {
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
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const truncateMobile = (text, maxLength = 40) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  // Load entries (simplified for mobile)
  const loadEntries = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getEntries({ limit: 25 });
      if (response.success) {
        setEntries(response.data || []);
      }
    } catch (err) {
      console.error('Error loading entries:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter entries for mobile
  const filteredEntries = entries.filter(entry => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return entry.rawText?.toLowerCase().includes(searchLower) ||
             formatMobileDate(entry.date).toLowerCase().includes(searchLower);
    }
    return true;
  });

  // Get recent entries for collapsed view
  const recentEntries = filteredEntries.slice(0, 3);

  const handleEntryClick = (entry) => {
    const entryDate = new Date(entry.date);
    onDateSelect(entryDate);
    setSheetHeight('collapsed'); // Collapse after selection
  };

  const handleDeleteEntry = async (entry, e) => {
    e.stopPropagation();
    
    if (!confirm('Delete this entry?')) return;

    try {
      await apiService.deleteEntry(entry.date);
      loadEntries();
      
      if (selectedDate && new Date(entry.date).toDateString() === selectedDate.toDateString()) {
        onDateSelect(null);
      }
    } catch (err) {
      console.error('Error deleting entry:', err);
      alert('Failed to delete entry');
    }
  };

  useEffect(() => {
    loadEntries();
  }, [refreshTrigger]);

  const getSheetClasses = () => {
    const base = "sidebar-bottom-sheet md:hidden";
    if (sheetHeight === 'partial') return `${base} expanded`;
    if (sheetHeight === 'full') return `${base} full`;
    return base;
  };

  return (
    <div className={getSheetClasses()}>
      {/* Handle bar */}
      <div
        className="flex justify-center py-2 cursor-pointer"
        onClick={() => setSheetHeight(sheetHeight === 'collapsed' ? 'partial' : 'collapsed')}
      >
        <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
      </div>

      {/* Header */}
      <div className="px-4 py-2 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            📝 Recent Entries
            {sheetHeight === 'collapsed' && (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            )}
          </h3>
          
          {sheetHeight !== 'collapsed' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSheetHeight('full')}
                className="p-1 text-gray-400 hover:text-gray-600"
                disabled={sheetHeight === 'full'}
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSheetHeight('collapsed')}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        
        {/* Search - only show when expanded */}
        {sheetHeight !== 'collapsed' && (
          <div className="relative mt-2">
            <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-2 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              style={{ fontSize: '16px' }} // Prevents zoom on iOS
            />
          </div>
        )}
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            Loading...
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p className="text-sm">No entries found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {(sheetHeight === 'collapsed' ? recentEntries : filteredEntries).map((entry) => {
              const entryDate = new Date(entry.date);
              const isSelected = selectedDate && entryDate.toDateString() === selectedDate.toDateString();
              
              return (
                <div
                  key={entry.id}
                  onClick={() => handleEntryClick(entry)}
                  className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors min-h-[56px] ${
                    isSelected ? 'bg-blue-50 border-l-3 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${
                          formatMobileDate(entry.date) === 'Today' ? 'bg-green-500' : 
                          formatMobileDate(entry.date) === 'Yesterday' ? 'bg-blue-500' : 
                          'bg-gray-400'
                        }`} />
                        
                        <span className="text-sm font-medium text-gray-900">
                          {formatMobileDate(entry.date)}
                        </span>
                        
                        <span className="text-xs text-gray-500">
                          {entry.wordCount || 0}w
                        </span>
                        
                        {entry.isHighlight && (
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        )}
                        
                        {entry.isPinned && (
                          <Pin className="w-3 h-3 text-amber-600 fill-current" />
                        )}
                      </div>
                      
                      {sheetHeight !== 'collapsed' && entry.rawText && (
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {truncateMobile(entry.rawText, 60)}
                        </p>
                      )}
                    </div>
                    
                    {sheetHeight !== 'collapsed' && (
                      <button
                        onClick={(e) => handleDeleteEntry(entry, e)}
                        className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                        title="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {sheetHeight !== 'collapsed' && filteredEntries.length > 0 && (
        <div className="p-2 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-600 text-center">
            {filteredEntries.length} entries
            {sheetHeight === 'partial' && filteredEntries.length > 10 && (
              <button
                onClick={() => setSheetHeight('full')}
                className="ml-2 text-blue-600 hover:text-blue-700"
              >
                View all
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileEntrySheet;