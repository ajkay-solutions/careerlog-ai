import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/api';
import AIInsights from './AIInsights';
import TemplateSelector, { TEMPLATES } from './TemplateSelector';
import TipsModal from './TipsModal';
import TemplateConfirmationModal from './TemplateConfirmationModal';
import { 
  getTemplatePreference, 
  setTemplatePreference, 
  isOnlyTemplateContent,
  extractUserContent,
  mergeContentWithTemplate 
} from '../utils/templatePreferences';

const JournalEntry = ({ selectedDate, onEntryChange }) => {
  const [entry, setEntry] = useState(null);
  const [rawText, setRawText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [error, setError] = useState(null);
  const [wordCount, setWordCount] = useState(0);
  
  // Template-related state
  const [currentTemplate, setCurrentTemplate] = useState(getTemplatePreference());
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState(null);
  
  const autoSaveTimeoutRef = useRef(null);
  const textareaRef = useRef(null);
  const entryRef = useRef(entry);
  const onEntryChangeRef = useRef(onEntryChange);
  const needsFreshLoadRef = useRef(false);
  const lastAutoSaveRef = useRef(0);

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

  // Apply template to current content
  const applyTemplate = useCallback((templateId) => {
    const template = TEMPLATES[templateId];
    if (!template) return;

    const currentContent = rawText;
    const templateContent = template.content;
    
    // If no content or only template content, replace completely
    if (!currentContent || isOnlyTemplateContent(currentContent, templateContent)) {
      setRawText(templateContent);
    } else {
      // Extract user content and merge with new template
      const userContent = extractUserContent(currentContent, TEMPLATES[currentTemplate]?.content || '');
      const mergedContent = mergeContentWithTemplate(userContent, templateContent);
      setRawText(mergedContent);
    }
    
    setCurrentTemplate(templateId);
    setTemplatePreference(templateId);
  }, [rawText, currentTemplate]);

  // Handle template change with confirmation if needed
  const handleTemplateChange = useCallback((newTemplateId) => {
    if (newTemplateId === currentTemplate) return;

    const currentContent = rawText;
    const currentTemplateContent = TEMPLATES[currentTemplate]?.content || '';
    
    // Check if we have real user content that needs confirmation
    if (currentContent && !isOnlyTemplateContent(currentContent, currentTemplateContent)) {
      // Show confirmation modal
      setPendingTemplate(newTemplateId);
      setShowConfirmationModal(true);
    } else {
      // No real content, switch immediately
      applyTemplate(newTemplateId);
    }
  }, [rawText, currentTemplate, applyTemplate]);

  // Confirm template switch
  const confirmTemplateSwitch = useCallback(() => {
    if (pendingTemplate) {
      applyTemplate(pendingTemplate);
      setPendingTemplate(null);
    }
    setShowConfirmationModal(false);
  }, [pendingTemplate, applyTemplate]);

  // Cancel template switch
  const cancelTemplateSwitch = useCallback(() => {
    setPendingTemplate(null);
    setShowConfirmationModal(false);
  }, []);

  // Load entry for selected date
  const loadEntry = useCallback(async (forceFresh = false) => {
    if (!selectedDate) return;

    // Check if this entry needs a fresh load from localStorage
    const dateKey = selectedDate.toISOString().split('T')[0];
    const needsRefreshTimestamp = localStorage.getItem(`entry_needs_refresh_${dateKey}`);
    const shouldForceFresh = forceFresh || !!needsRefreshTimestamp;
    
    // Clear the flag once we're loading fresh
    if (needsRefreshTimestamp) {
      localStorage.removeItem(`entry_needs_refresh_${dateKey}`);
      console.log('🔍 Found localStorage refresh flag, forcing fresh load');
    }

    console.log('🔍 Loading entry for date:', selectedDate, shouldForceFresh ? '(force fresh)' : '');
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.getEntryByDate(selectedDate, { bustCache: shouldForceFresh });
      
      console.log('🔍 Entry load response:', {
        success: response.success,
        hasData: !!response.data,
        entryId: response.data?.id,
        textLength: response.data?.rawText?.length,
        updatedAt: response.data?.updatedAt,
        forceFresh: forceFresh
      });
      
      if (response.success && response.data) {
        setEntry(response.data);
        setRawText(response.data.rawText || '');
        setWordCount(response.data.wordCount || 0);
        setLastSaved(new Date(response.data.updatedAt));
        
        console.log('🔍 Entry loaded and state updated:', {
          entryId: response.data.id,
          rawTextLength: response.data.rawText?.length,
          setRawTextLength: response.data.rawText?.length
        });
      } else {
        // No entry exists for this date
        console.log('🔍 No entry found for date, resetting state');
        setEntry(null);
        
        // Apply user's preferred template for new entries
        const template = TEMPLATES[currentTemplate];
        const templateContent = template ? template.content : '';
        setRawText(templateContent);
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
        // Update rate limiting timestamp for manual saves too
        lastAutoSaveRef.current = Date.now();
        
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
      // Rate limiting: Don't auto-save more than once every 2 seconds
      const now = Date.now();
      const timeSinceLastSave = now - lastAutoSaveRef.current;
      
      if (timeSinceLastSave < 2000) {
        console.log('🔍 Auto-save skipped - rate limited (too soon)');
        // Re-schedule after the rate limit period
        autoSaveTimeoutRef.current = setTimeout(() => {
          debouncedSave(text);
        }, 2000 - timeSinceLastSave);
        return;
      }
      
      // Perform save logic directly here to avoid dependency on saveEntry
      console.log('🔍 Auto-save executing...', {
        selectedDate: selectedDate,
        textLength: text.length,
        textEmpty: !text.trim(),
        hasCurrentEntry: !!entryRef.current
      });
      
      if (!selectedDate || !text.trim()) {
        console.log('🔍 Auto-save skipped - missing date or empty text');
        return;
      }

      console.log('🔍 Auto-save proceeding...');
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
          console.log('✅ Auto-save successful:', {
            entryId: response.data.id,
            newTextLength: response.data.rawText?.length,
            oldTextLength: text.length,
            updatedAt: response.data.updatedAt
          });
          
          // Update rate limiting timestamp
          lastAutoSaveRef.current = Date.now();
          
          setEntry(response.data);
          setLastSaved(new Date());
          setWordCount(response.data.wordCount);
          
          // Mark that this entry needs a fresh load next time it's accessed
          needsFreshLoadRef.current = true;
          
          // Also store in localStorage to persist across navigation
          const dateKey = selectedDate.toISOString().split('T')[0];
          localStorage.setItem(`entry_needs_refresh_${dateKey}`, Date.now().toString());
          console.log('🔍 Marked entry for fresh reload on next access (memory + localStorage)');
          
          // Verify the rawText matches what we saved and force reload if mismatch
          if (response.data.rawText !== text) {
            console.warn('⚠️ Auto-save text mismatch, forcing immediate reload:', {
              expected: text.length,
              received: response.data.rawText?.length,
              expectedSnippet: text.substring(0, 50),
              receivedSnippet: response.data.rawText?.substring(0, 50)
            });
            
            // Force an immediate fresh reload to sync data
            setTimeout(() => {
              console.log('🔄 Force reloading entry due to mismatch');
              loadEntry(true); // Force fresh load
            }, 500); // Small delay to avoid race conditions
          }
          
          // Notify parent component of change
          const currentOnEntryChange = onEntryChangeRef.current;
          if (currentOnEntryChange) {
            console.log('🔍 Notifying parent component of entry change');
            currentOnEntryChange(response.data);
          } else {
            console.log('🔍 No onEntryChange callback available');
          }
        } else {
          console.error('❌ Auto-save failed - server returned error:', response);
          setError('Failed to auto-save entry');
        }
      } catch (err) {
        console.error('❌ Auto-save failed with exception:', err);
        setError('Failed to auto-save entry');
      } finally {
        setIsSaving(false);
      }
    }, 3000); // Save after 3 seconds of inactivity (increased to reduce frequency)
  }, [selectedDate]); // Only depend on selectedDate to keep function stable

  // Handle text change
  const handleTextChange = (e) => {
    const newText = e.target.value;
    setRawText(newText);
    setWordCount(countWords(newText));
    
    // Debug logging for auto-save
    console.log('🔍 Text changed, triggering auto-save...', {
      textLength: newText.length,
      hasEntry: !!entryRef.current,
      selectedDate: selectedDate
    });
    
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

  // Handle keyboard shortcuts and bullet point formatting
  const handleKeyDown = (e) => {
    // Manual save (Ctrl+S)
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveEntry(rawText);
      return;
    }

    // Handle Enter key for bullet points - works regardless of template if content has bullets
    if (e.key === 'Enter') {
      const textarea = e.target;
      const { selectionStart, selectionEnd } = textarea;
      const text = textarea.value;
      
      // Get the current line
      const lines = text.substring(0, selectionStart).split('\n');
      const currentLine = lines[lines.length - 1];
      
      // Check if the current line starts with a bullet point
      const bulletMatch = currentLine.match(/^(•|\*|-|\d+\.)\s*/);
      
      if (bulletMatch) {
        e.preventDefault();
        
        // Check if current line only has the bullet (empty bullet point)
        const lineContent = currentLine.substring(bulletMatch[0].length).trim();
        
        if (lineContent === '') {
          // Empty bullet, remove it and add a blank line
          const beforeCursor = text.substring(0, selectionStart - currentLine.length);
          const afterCursor = text.substring(selectionEnd);
          const newText = beforeCursor + '\n' + afterCursor;
          
          setRawText(newText);
          
          // Set cursor position after the new line
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = beforeCursor.length + 1;
          }, 0);
          
          // Trigger auto-save for empty bullet case
          debouncedSave(newText);
        } else {
          // Non-empty bullet, add a new bullet on the next line
          const bullet = bulletMatch[1];
          let nextBullet = bullet;
          
          // Handle numbered lists
          if (/^\d+\.$/.test(bullet)) {
            const num = parseInt(bullet);
            nextBullet = `${num + 1}.`;
          }
          
          const beforeCursor = text.substring(0, selectionEnd);
          const afterCursor = text.substring(selectionEnd);
          const newText = beforeCursor + '\n' + nextBullet + ' ' + afterCursor;
          
          setRawText(newText);
          
          // Set cursor position after the new bullet
          setTimeout(() => {
            const newPos = selectionEnd + nextBullet.length + 2;
            textarea.selectionStart = textarea.selectionEnd = newPos;
          }, 0);
          
          // Trigger auto-save for new bullet case
          debouncedSave(newText);
        }
      }
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
    const shouldForceFresh = needsFreshLoadRef.current;
    needsFreshLoadRef.current = false; // Reset the flag
    
    console.log('🔍 useEffect triggered, loading entry with forceFresh:', shouldForceFresh);
    loadEntry(shouldForceFresh);
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

        {/* Template Controls */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-4">
            <TemplateSelector 
              currentTemplate={currentTemplate}
              onTemplateChange={handleTemplateChange}
            />
            
            <button
              onClick={() => setShowTipsModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              💡 <span>Tips</span>
            </button>
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

      {/* Modals */}
      <TipsModal 
        isOpen={showTipsModal}
        onClose={() => setShowTipsModal(false)}
      />
      
      <TemplateConfirmationModal 
        isOpen={showConfirmationModal}
        onCancel={cancelTemplateSwitch}
        onConfirm={confirmTemplateSwitch}
        newTemplateName={pendingTemplate ? TEMPLATES[pendingTemplate]?.name : ''}
      />
    </div>
  );
};

export default JournalEntry;