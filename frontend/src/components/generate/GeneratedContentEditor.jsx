import { useState, useRef } from 'react';
import { Copy, Download, Mail, RefreshCw, ArrowLeft, CheckCircle } from 'lucide-react';

function GeneratedContentEditor({ 
  generatedContent, 
  onContentChange, 
  onBack, 
  onBackToGenerate,
  onRegenerate,
  title = "Generated Content",
  subtitle = "Review and edit your generated content below",
  loading = false,
  metadata = {}
}) {
  const [content, setContent] = useState(generatedContent || '');
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Debug logging
  console.log('GeneratedContentEditor props:', { 
    generatedContentLength: generatedContent?.length || 0,
    title,
    loading 
  });
  const [exportFormat, setExportFormat] = useState('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const textareaRef = useRef(null);

  // Handle content changes
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    if (onContentChange) {
      onContentChange(newContent);
    }
  };

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  // Export functionality (reuse existing API)
  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Determine the export type based on title
      const exportType = title.toLowerCase().includes('performance') 
        ? 'performance-review' 
        : 'resume-bullets';

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3004';
      const response = await fetch(`${apiUrl}/api/generate/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('worklog_auth_token')}`
        },
        body: JSON.stringify({
          type: exportType,
          format: exportFormat,
          content: content,
          metadata: metadata
        })
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exportType}-${new Date().toISOString().split('T')[0]}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Configuration</span>
            </button>
          </div>
          
          {onBackToGenerate && (
            <button
              onClick={onBackToGenerate}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Generate</span>
            </button>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
            <p className="text-gray-600">{subtitle}</p>
          </div>
          
          <button
            onClick={onRegenerate}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Regenerating...' : 'Regenerate'}</span>
          </button>
        </div>
      </div>

      {/* Content Editor */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
              <h3 className="font-medium text-gray-900">Content Editor</h3>
              <p className="text-sm text-gray-600 mt-1">
                Edit the generated content to match your personal style
              </p>
            </div>
            
            {loading ? (
              <div className="p-8 text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Generating your content...</p>
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleContentChange}
                onInput={adjustTextareaHeight}
                className="w-full p-6 text-gray-900 resize-none focus:outline-none min-h-[500px] leading-relaxed"
                placeholder="Your generated content will appear here..."
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              />
            )}
          </div>

          {/* Word Count */}
          <div className="mt-2 text-sm text-gray-500">
            {content.split(/\s+/).filter(word => word.length > 0).length} words
          </div>
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-4">Quick Actions</h4>
            
            <div className="space-y-3">
              <button
                onClick={handleCopy}
                className="w-full flex items-center gap-3 text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {copySuccess ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-600" />
                )}
                <div>
                  <div className="font-medium text-gray-900">
                    {copySuccess ? 'Copied!' : 'Copy to Clipboard'}
                  </div>
                  <div className="text-sm text-gray-600">
                    Copy formatted text
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  // TODO: Implement email functionality
                  alert('Email functionality coming soon!');
                }}
                className="w-full flex items-center gap-3 text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Mail className="w-5 h-5 text-gray-600" />
                <div>
                  <div className="font-medium text-gray-900">Email to Self</div>
                  <div className="text-sm text-gray-600">Send via email</div>
                </div>
              </button>
            </div>
          </div>

          {/* Export Options */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-4">Export Document</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Format
                </label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="pdf">PDF Document</option>
                  <option value="docx">Word Document</option>
                  <option value="json">JSON Data</option>
                </select>
              </div>

              <button
                onClick={handleExport}
                disabled={isExporting || !content.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>
                  {isExporting ? 'Exporting...' : `Download ${exportFormat.toUpperCase()}`}
                </span>
              </button>
            </div>
          </div>

          {/* Metadata Info */}
          {metadata && Object.keys(metadata).length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Generation Details</h4>
              <div className="space-y-2 text-sm">
                {metadata.timeframe && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time Period:</span>
                    <span className="text-gray-900 capitalize">{metadata.timeframe}</span>
                  </div>
                )}
                {metadata.entriesCount && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Based on:</span>
                    <span className="text-gray-900">{metadata.entriesCount} entries</span>
                  </div>
                )}
                {metadata.generatedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Generated:</span>
                    <span className="text-gray-900">
                      {new Date(metadata.generatedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GeneratedContentEditor;