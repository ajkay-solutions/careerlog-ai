import React, { useState } from 'react';
import { apiService } from '../services/api';

const ExportModal = ({ isOpen, onClose, timeframe }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState('entries'); // Only journal entries export
  const [format, setFormat] = useState('pdf'); // pdf, docx, json
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [includeOptions, setIncludeOptions] = useState({
    rawText: true,
    aiAnalysis: true,
    projects: true,
    skills: true,
    competencies: true,
    metrics: false
  });

  // Set default date range based on timeframe
  React.useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const startDate = new Date();
      
      switch (timeframe) {
        case 'week':
          startDate.setDate(today.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(today.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(today.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(today.getFullYear() - 1);
          break;
        case 'all':
        default:
          startDate.setFullYear(today.getFullYear() - 2); // Default to 2 years back
          break;
      }
      
      setDateRange({
        startDate: startDate.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      });
    }
  }, [isOpen, timeframe]);

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      let endpoint = '';
      let params = new URLSearchParams();
      
      // Add common parameters
      params.append('format', format);
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      
      // Only handle journal entries export
      endpoint = '/api/export';
      // Add include options for entries export
      Object.entries(includeOptions).forEach(([key, value]) => {
        if (value) params.append(`include${key.charAt(0).toUpperCase() + key.slice(1)}`, 'true');
      });
      
      // Handle journal entries export
      let response;
      
      // For PDF/DOCX exports, handle file downloads
      if (format === 'pdf' || format === 'docx') {
        const fullUrl = `${apiService.baseURL}${endpoint}?${params.toString()}`;
        const token = apiService.getAuthToken();
        
        const fetchResponse = await fetch(fullUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': '*/*'
          }
        });
        
        if (fetchResponse.ok) {
          const blob = await fetchResponse.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `worklog-export-${dateRange.startDate}-to-${dateRange.endDate}.${format}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          onClose();
          return;
        } else {
          throw new Error(`Export failed: HTTP ${fetchResponse.status}`);
        }
      } else {
        response = await apiService.get(`${endpoint}?${params.toString()}`);
      }
      
      if (response.success) {
        // JSON export - create downloadable file
        const content = JSON.stringify(response.data, null, 2);
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `worklog-export-${dateRange.startDate}-to-${dateRange.endDate}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        onClose();
      } else {
        throw new Error(response.error || 'Export failed');
      }
    } catch (err) {
      console.error('Export error:', err);
      alert('Export failed: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleIncludeOptionChange = (option) => {
    setIncludeOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">📥 Export Journal Data</h2>
            <p className="text-sm text-gray-600 mt-1">
              Export your journal entries, AI analysis, and extracted data
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Export Type */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Export Type</label>
            <div className="space-y-2">
              <div className="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="mr-3">
                  <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                </div>
                <div>
                  <div className="font-medium text-blue-900">📝 Journal Entries</div>
                  <div className="text-sm text-blue-700">Export your raw journal entries and AI analysis</div>
                </div>
              </div>
              
              <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="text-sm text-gray-600">
                  <strong>Looking for Performance Reviews or Resume Bullets?</strong><br/>
                  Visit the <span className="font-medium text-blue-600">Generate tab</span> to create and export these documents with advanced editing capabilities.
                </div>
              </div>
            </div>
          </div>

          {/* Format Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="pdf">PDF Document</option>
              <option value="docx">Word Document</option>
              <option value="json">JSON Data</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Date Range</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">End Date</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Include Options */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Include in Export</label>
            <div className="space-y-2">
              {Object.entries(includeOptions).map(([key, value]) => (
                <label key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={() => handleIncludeOptionChange(key)}
                    className="mr-3"
                  />
                  <span className="text-sm text-gray-700">
                    {key === 'rawText' && 'Raw journal text'}
                    {key === 'aiAnalysis' && 'AI analysis and insights'}
                    {key === 'projects' && 'Project information'}
                    {key === 'skills' && 'Skills and competencies'}
                    {key === 'competencies' && 'Demonstrated competencies'}
                    {key === 'metrics' && 'Performance metrics'}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={isExporting}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || !dateRange.startDate || !dateRange.endDate}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                Exporting...
              </>
            ) : (
              <>
                📥 Export
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;