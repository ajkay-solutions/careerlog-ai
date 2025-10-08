import React from 'react';
import { X } from 'lucide-react';

const TipsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal Content */}
        <div 
          className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              💡 Journal Writing Tips
            </h2>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* What to Include Section */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                🎯 <span>What to include in your entries:</span>
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Projects you worked on</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Achievements and wins (big or small)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Skills and technologies you used</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>People you collaborated with</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Problems you solved</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Challenges you faced</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>What you learned</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Meetings and key decisions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Any metrics or results</span>
                </li>
              </ul>
            </div>

            {/* Templates Info */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                📝 <span>Templates:</span>
              </h3>
              <p className="text-sm text-purple-800">
                Use the template selector above to choose from 6 different journal formats - from free-form writing to structured prompts. Switch templates anytime to find what works best for you!
              </p>
            </div>

            {/* AI Reminder */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                🤖 <span>Remember:</span>
              </h3>
              <p className="text-sm text-blue-800">
                Our AI extracts insights from any format! Write naturally - don't worry about perfect structure.
              </p>
            </div>

            {/* Pro Tip */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                ⚡ <span>Pro tip:</span>
              </h3>
              <p className="text-sm text-yellow-800">
                Even 2-3 sentences are valuable for your career growth tracking!
              </p>
            </div>

            {/* Example Section */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                📝 <span>Quick examples:</span>
              </h3>
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-700 italic">
                    "Fixed the authentication bug in the user login flow. Used React hooks and collaborated with Sarah from backend team. Learned about JWT token validation."
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-700 italic">
                    "Led the morning standup. Presented quarterly results to stakeholders - 23% improvement in user engagement. Feeling confident about the new feature rollout."
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default TipsModal;