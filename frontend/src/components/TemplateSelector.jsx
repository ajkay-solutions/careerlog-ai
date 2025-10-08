import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const TEMPLATES = {
  'free-form': {
    id: 'free-form',
    name: 'Free-form',
    icon: '💭',
    description: 'Open journaling - write naturally',
    content: ``
  },
  'bullet-points': {
    id: 'bullet-points',
    name: 'Bullet Points',
    icon: '📋',
    description: 'Structured lists for organized thoughts',
    content: `📋 Today's highlights:
• 
• 
• 

🛠️ Skills I used:
• 
• 

👥 People I worked with:
• 
• 

`
  },
  'daily-reflection': {
    id: 'daily-reflection',
    name: 'Daily Reflection',
    icon: '🎯',
    description: 'Guided prompts for thoughtful reflection',
    content: `🎯 Today I worked on:


🏆 Something I'm proud of:


📚 What I learned:


🤝 Who I collaborated with:


`
  },
  'achievement-focus': {
    id: 'achievement-focus',
    name: 'Achievement Focus',
    icon: '✅',
    description: 'Highlight accomplishments and impact',
    content: `✅ What I accomplished:


🔧 How I did it:


📈 Impact or results:


`
  },
  'minimal-log': {
    id: 'minimal-log',
    name: 'Minimal Log',
    icon: '📝',
    description: 'Simple and quick entry',
    content: `📝 What I worked on today:




`
  },
  'guided-entry': {
    id: 'guided-entry',
    name: 'Guided Entry',
    icon: '🎯',
    description: 'Step-by-step prompts for comprehensive logging',
    content: `🎯 What I worked on today:


🎉 Any wins or accomplishments?


🚧 Challenges I faced:


`
  }
};

const TemplateSelector = ({ 
  currentTemplate = 'free-form', 
  onTemplateChange, 
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(null);

  const handleTemplateSelect = (templateId) => {
    if (templateId !== currentTemplate) {
      onTemplateChange(templateId);
    }
    setIsOpen(false);
  };

  const selectedTemplate = TEMPLATES[currentTemplate] || TEMPLATES['free-form'];

  return (
    <div className={`relative ${className}`}>
      {/* Template Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      >
        <span className="text-lg">{selectedTemplate.icon}</span>
        <span className="text-sm font-medium text-gray-700">
          Template: {selectedTemplate.name}
        </span>
        <ChevronDown 
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Content */}
          <div className="absolute top-full left-0 mt-1 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">
                📝 Choose Journal Template
              </h3>
            </div>

            {/* Template Options */}
            <div className="py-2 max-h-96 overflow-y-auto">
              {Object.values(TEMPLATES).map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template.id)}
                  onMouseEnter={() => setIsHovering(template.id)}
                  onMouseLeave={() => setIsHovering(null)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                    currentTemplate === template.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg mt-0.5">{template.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {currentTemplate === template.id && (
                          <span className="text-blue-500 text-sm">✓</span>
                        )}
                        <span className="font-medium text-gray-900 text-sm">
                          {template.name}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {template.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-600">
                💡 Templates help structure your thoughts. AI extracts insights from any format!
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export { TEMPLATES };
export default TemplateSelector;