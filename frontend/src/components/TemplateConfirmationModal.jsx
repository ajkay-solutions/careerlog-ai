import React from 'react';
import { AlertTriangle } from 'lucide-react';

const TemplateConfirmationModal = ({ 
  isOpen, 
  onCancel, 
  onConfirm, 
  newTemplateName 
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onCancel}
      >
        {/* Modal Content */}
        <div 
          className="bg-white rounded-lg shadow-xl max-w-sm w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  Switch Template?
                </h3>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 pb-4">
            <p className="text-sm text-gray-600 mb-4">
              You have content in your current template. Switching to <strong>{newTemplateName}</strong> will 
              replace the template structure but preserve your written content.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-blue-800">
                💡 Your actual content will be preserved - only the template prompts will change.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="px-4 pb-4 flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Keep Current
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Switch Template
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default TemplateConfirmationModal;