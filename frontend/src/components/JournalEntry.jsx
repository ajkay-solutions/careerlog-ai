import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/api';
import AIInsights from './AIInsights';

const JournalEntry = ({ selectedDate, onEntryChange }) => {
  const [entry, setEntry] = useState(null);
  const [rawText, setRawText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [error, setError] = useState(null);
  const [wordCount, setWordCount] = useState(0);
  
  const autoSaveTimeoutRef = useRef(null);
  const textareaRef = useRef(null);
  const entryRef = useRef(entry);
  const onEntryChangeRef = useRef(onEntryChange);

  // Format date for display
  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  };

  // Count words in text
  const countWords = useCallback((text) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }, []);

  // Load entry for selected date
  const loadEntry = useCallback(async () => {
    if (!selectedDate) return;

    setIsLoading(true);
    setError(null);


    try {
      const response = await apiService.getEntryByDate(selectedDate);
      
      if (response.success && response.data) {
        setEntry(response.data);
        setRawText(response.data.rawText || '');
        setWordCount(response.data.wordCount || 0);
        setLastSaved(new Date(response.data.updatedAt));
      } else {
        // No entry exists for this date
        setEntry(null);
        setRawText('');
        setWordCount(0);
        setLastSaved(null);
      }
    } catch (err) {
      console.error('Error loading entry:', err);
      setError('Failed to load entry');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  // Save entry (create or update)
  const saveEntry = useCallback(async (textToSave) => {
    if (!selectedDate || !textToSave.trim()) return;

    setIsSaving(true);
    setError(null);

    try {
      const currentEntry = entryRef.current;
      const entryData = {
        date: selectedDate,
        rawText: textToSave,
        isHighlight: currentEntry?.isHighlight || false
      };

      let response;
      if (currentEntry) {
        // Update existing entry
        response = await apiService.updateEntry(selectedDate, entryData);
      } else {
        // Create new entry
        response = await apiService.createEntry(entryData);
      }

      if (response.success) {
        setEntry(response.data);
        setLastSaved(new Date());
        setWordCount(response.data.wordCount);
        
        // Notify parent component of change
        const currentOnEntryChange = onEntryChangeRef.current;
        if (currentOnEntryChange) {
          currentOnEntryChange(response.data);
        }
      }
    } catch (err) {
      console.error('Error saving entry:', err);
      setError('Failed to save entry');
    } finally {
      setIsSaving(false);
    }
  }, [selectedDate]); // Only depend on selectedDate for stability

  // Auto-save with debouncing - use ref to avoid dependency issues
  const debouncedSave = useCallback((text) => {
    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    autoSaveTimeoutRef.current = setTimeout(async () => {
      // Perform save logic directly here to avoid dependency on saveEntry
      if (!selectedDate || !text.trim()) return;

      setIsSaving(true);
      setError(null);

      try {
        const currentEntry = entryRef.current;
        const entryData = {
          date: selectedDate,
          rawText: text,
          isHighlight: currentEntry?.isHighlight || false
        };

        let response;
        if (currentEntry) {
          // Update existing entry
          response = await apiService.updateEntry(selectedDate, entryData);
        } else {
          // Create new entry
          response = await apiService.createEntry(entryData);
        }

        if (response.success) {
          setEntry(response.data);
          setLastSaved(new Date());
          setWordCount(response.data.wordCount);
          
          // Notify parent component of change
          const currentOnEntryChange = onEntryChangeRef.current;
          if (currentOnEntryChange) {
            currentOnEntryChange(response.data);
          }
        }
      } catch (err) {
        console.error('Error auto-saving entry:', err);
        setError('Failed to auto-save entry');
      } finally {
        setIsSaving(false);
      }
    }, 2000); // Save after 2 seconds of inactivity
  }, [selectedDate]); // Only depend on selectedDate to keep function stable

  // Handle text change
  const handleTextChange = (e) => {
    const newText = e.target.value;
    setRawText(newText);
    setWordCount(countWords(newText));
    
    // Trigger auto-save
    debouncedSave(newText);
  };

  // Toggle highlight status
  const toggleHighlight = async () => {
    if (!entry) return;

    try {
      const response = await apiService.toggleEntryHighlight(selectedDate);
      if (response.success) {
        setEntry(response.data);
        if (onEntryChange) {
          onEntryChange(response.data);
        }
      }
    } catch (err) {
      console.error('Error toggling highlight:', err);
      setError('Failed to update highlight status');
    }
  };

  // Manual save (Ctrl+S)
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveEntry(rawText);
    }
  };

  // Handle AI analysis update
  const handleAIAnalysis = (analysisData) => {
    if (entry) {
      const updatedEntry = {
        ...entry,
        extractedData: analysisData
      };
      setEntry(updatedEntry);
      if (onEntryChange) {
        onEntryChange(updatedEntry);
      }
    }
  };

  // Load entry when date changes
  useEffect(() => {
    loadEntry();
  }, [loadEntry]);

  // Update word count when rawText changes
  useEffect(() => {
    setWordCount(countWords(rawText));
  }, [rawText, countWords]);

  // Keep refs updated with latest values
  useEffect(() => {
    entryRef.current = entry;
  }, [entry]);

  useEffect(() => {
    onEntryChangeRef.current = onEntryChange;
  }, [onEntryChange]);

  // Focus textarea when component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [selectedDate]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  if (!selectedDate) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <div className="text-6xl mb-4">📅</div>
          <h2 className="text-xl font-medium mb-2">Select a Date</h2>
          <p>Choose a date to start writing your work log entry</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {formatDate(selectedDate)}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span>{wordCount} words</span>
              {lastSaved && (
                <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
              )}
              {isSaving && (
                <span className="text-blue-600">Saving...</span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {entry && (
              <button
                onClick={toggleHighlight}
                className={`p-2 rounded-lg border transition-colors ${
                  entry.isHighlight
                    ? 'bg-yellow-100 border-yellow-300 text-yellow-800'
                    : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                }`}
                title={entry.isHighlight ? 'Remove highlight' : 'Highlight this entry'}
              >
                ⭐
              </button>
            )}
          </div>
        </div>
        
        {error && (
          <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Entry Form */}
      <div className="flex-1 p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading entry...</div>
          </div>
        ) : (
          <div className="h-full flex flex-col lg:flex-row gap-6">
            {/* Main Editor Section */}
            <div className="flex-1 flex flex-col">
              <textarea
                ref={textareaRef}
                value={rawText}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                placeholder="What did you accomplish today? Document your work, projects, learnings, and wins..."
                className="flex-1 resize-none border border-gray-300 rounded-lg p-4 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                style={{ minHeight: '400px' }}
              />
              
              <div className="mt-4 text-xs text-gray-400">
                💡 Tip: Press Ctrl+S to save manually. Auto-save happens every 2 seconds.
              </div>
            </div>

            {/* AI Insights Sidebar - Now Visible! */}
            <div className="lg:w-80 flex-shrink-0">
              <AIInsights 
                entry={entry} 
                onAnalysisRequest={handleAIAnalysis}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JournalEntry;