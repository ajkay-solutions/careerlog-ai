# WorkLog AI - Frontend & Development Guidelines Document

## Document Control
- **Version**: 2.1
- **Date**: October 3, 2025
- **Author**: Arsalan Jehangir Khan
- **Status**: Active - MVP Phase with Performance Optimizations
- **Last Updated**: Performance optimization complete with Redis caching and connection pooling
- **Parent Document**: [TECHNICAL_SPEC.md](../TECHNICAL_SPEC.md)

---

## Overview

This document covers frontend components, security guidelines, and development practices for WorkLog AI. It's part of a split from the main technical specification for better maintainability.

**Related Documents:**
- [TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md) - Architecture, infrastructure, performance
- [TECHNICAL_API_DATA.md](./TECHNICAL_API_DATA.md) - Data models, API specs, AI integration
- [TECHNICAL_SPEC.md](../TECHNICAL_SPEC.md) - Main overview and index

---

## 1. Frontend Components

### 1.1 Component Architecture

```
src/
├── components/
│   ├── common/              # Reusable UI components
│   │   ├── Button.jsx
│   │   ├── Modal.jsx
│   │   ├── Toast.jsx
│   │   ├── LoadingSpinner.jsx
│   │   └── DatePicker.jsx
│   │
│   ├── auth/                # Authentication related
│   │   ├── LoginPage.jsx
│   │   ├── AuthStatus.jsx
│   │   └── ProtectedRoute.jsx
│   │
│   ├── journal/             # Journal entry components
│   │   ├── JournalEntry.jsx     # Main editor component
│   │   ├── DateNavigation.jsx   # Date selector/navigator
│   │   ├── EntryList.jsx        # Sidebar entry list
│   │   ├── AIInsights.jsx       # AI analysis display
│   │   ├── TagSelector.jsx      # Manual tagging
│   │   └── AutoSave.jsx         # Auto-save indicator
│   │
│   ├── insights/            # Analytics dashboard
│   │   ├── InsightsDashboard.jsx
│   │   ├── CompetencyChart.jsx
│   │   ├── ProjectsList.jsx
│   │   ├── SkillsCloud.jsx
│   │   ├── StatsCards.jsx
│   │   └── TrendChart.jsx
│   │
│   ├── generation/          # Export/generation tools
│   │   ├── ExportModal.jsx
│   │   ├── PerformanceReviewGenerator.jsx
│   │   ├── ResumeBulletGenerator.jsx
│   │   └── TemplateSelector.jsx
│   │
│   └── settings/            # User settings
│       ├── ProfileSettings.jsx
│       ├── PreferencesPanel.jsx
│       ├── ProjectsManager.jsx
│       ├── SkillsManager.jsx
│       └── PrivacySettings.jsx
```

### 1.2 Core Components Implementation

#### JournalEntry.jsx (Main Editor)
```javascript
import React, { useState, useEffect, useCallback } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import AutoSave from './AutoSave';
import AIInsights from './AIInsights';

const JournalEntry = ({ selectedDate, onEntryChange }) => {
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  
  // Debounce content changes for auto-save
  const debouncedContent = useDebounce(content, 2000);
  
  // Auto-save effect
  useEffect(() => {
    if (debouncedContent && debouncedContent !== initialContent) {
      handleAutoSave();
    }
  }, [debouncedContent]);

  const handleAutoSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/entries/${formatDate(selectedDate)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          date: formatDate(selectedDate),
          rawText: content
        })
      });

      if (response.ok) {
        setLastSaved(new Date());
        onEntryChange();
        
        // Trigger AI analysis if content is substantial
        if (content.length > 50) {
          triggerAIAnalysis();
        }
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
      // Show error toast
    } finally {
      setIsSaving(false);
    }
  };

  const triggerAIAnalysis = async () => {
    try {
      const response = await fetch(`/api/ai/analyze/${entryId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      
      const result = await response.json();
      if (result.success) {
        // Poll for completion
        pollAnalysisStatus(result.data.jobId);
      }
    } catch (error) {
      console.error('AI analysis trigger failed:', error);
    }
  };

  return (
    <div className="flex-1 flex">
      {/* Main editor area */}
      <div className="flex-1 p-6">
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-900">
            {formatDateForDisplay(selectedDate)}
          </h2>
          <AutoSave 
            isSaving={isSaving} 
            lastSaved={lastSaved}
          />
        </div>
        
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What did you accomplish today? What challenges did you face? What did you learn?"
          className="w-full h-96 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          style={{ fontSize: '18px', lineHeight: '1.8' }}
        />
        
        <div className="mt-4 flex justify-between text-sm text-gray-600">
          <span>{content.length} characters • {Math.ceil(content.split(' ').length)} words</span>
          <button 
            onClick={() => setContent('')}
            className="text-red-600 hover:text-red-800"
          >
            Clear entry
          </button>
        </div>
      </div>

      {/* AI Insights sidebar */}
      <AIInsights 
        analysis={aiAnalysis}
        onAnalysisUpdate={setAiAnalysis}
        entryText={content}
      />
    </div>
  );
};

export default JournalEntry;
```

#### InsightsDashboard.jsx
```javascript
import React, { useState, useEffect } from 'react';
import StatsCards from './StatsCards';
import CompetencyChart from './CompetencyChart';
import ProjectsList from './ProjectsList';
import SkillsCloud from './SkillsCloud';

const InsightsDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState('30d');

  useEffect(() => {
    fetchDashboardData();
  }, [timePeriod]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/insights/dashboard?period=${timePeriod}`, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      
      const result = await response.json();
      if (result.success) {
        setDashboardData(result.data);
      }
    } catch (error) {
      console.error('Dashboard fetch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 bg-gray-50">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Insights Dashboard</h1>
        <select 
          value={timePeriod}
          onChange={(e) => setTimePeriod(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      {/* Stats Cards */}
      <StatsCards data={dashboardData?.summary} />
      
      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Competencies Chart */}
        <div className="lg:col-span-2">
          <CompetencyChart data={dashboardData?.competencies} />
        </div>
        
        {/* Projects List */}
        <ProjectsList projects={dashboardData?.projects} />
        
        {/* Skills Cloud */}
        <SkillsCloud skills={dashboardData?.skills} />
      </div>
    </div>
  );
};

export default InsightsDashboard;
```

#### AIInsights.jsx (AI Analysis Display)
```javascript
import React, { useState } from 'react';
import { Lightbulb, Users, Target, TrendingUp, RefreshCw } from 'lucide-react';

const AIInsights = ({ analysis, onAnalysisUpdate, entryText }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showInsights, setShowInsights] = useState(true);

  const handleReanalyze = async () => {
    setIsAnalyzing(true);
    try {
      // Trigger new analysis
      const response = await fetch(`/api/ai/analyze/${entryId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      
      const result = await response.json();
      if (result.success) {
        // Poll for results
        pollAnalysisStatus(result.data.jobId);
      }
    } catch (error) {
      console.error('Re-analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!showInsights) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-4">
        <button
          onClick={() => setShowInsights(true)}
          className="w-full p-2 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-2"
        >
          <Lightbulb size={20} />
          Show AI Insights
        </button>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Lightbulb size={20} className="text-blue-600" />
          AI Insights
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handleReanalyze}
            disabled={isAnalyzing || !entryText}
            className="p-1 text-gray-600 hover:text-blue-600 disabled:opacity-50"
          >
            <RefreshCw size={16} className={isAnalyzing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowInsights(false)}
            className="p-1 text-gray-600 hover:text-red-600"
          >
            ✕
          </button>
        </div>
      </div>

      {!analysis && !isAnalyzing && (
        <div className="text-gray-600 text-sm">
          Start writing to see AI-powered insights about your work...
        </div>
      )}

      {isAnalyzing && (
        <div className="text-center py-4">
          <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Analyzing your entry...</p>
        </div>
      )}

      {analysis && (
        <div className="space-y-4">
          {/* Projects */}
          {analysis.projects?.length > 0 && (
            <InsightSection
              title="Projects Mentioned"
              icon={<Target size={16} />}
              items={analysis.projects}
              renderItem={(project) => (
                <div className="flex justify-between">
                  <span>{project.name}</span>
                  <span className="text-xs text-gray-500">
                    {Math.round(project.confidence * 100)}%
                  </span>
                </div>
              )}
            />
          )}

          {/* Skills */}
          {analysis.skills?.length > 0 && (
            <InsightSection
              title="Skills Demonstrated"
              icon={<TrendingUp size={16} />}
              items={analysis.skills}
              renderItem={(skill) => (
                <div className="flex justify-between">
                  <span>{skill.name}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${getSkillCategoryColor(skill.category)}`}>
                    {skill.category}
                  </span>
                </div>
              )}
            />
          )}

          {/* People */}
          {analysis.people?.length > 0 && (
            <InsightSection
              title="People Mentioned"
              icon={<Users size={16} />}
              items={analysis.people}
              renderItem={(person) => (
                <div>
                  <span className="font-medium">{person.name}</span>
                  {person.role && (
                    <span className="text-gray-600 text-sm"> - {person.role}</span>
                  )}
                </div>
              )}
            />
          )}

          {/* Competencies */}
          {analysis.competencies?.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-2">Competencies Shown</h4>
              <div className="space-y-2">
                {analysis.competencies.map((comp, index) => (
                  <div key={index} className="p-3 bg-blue-50 rounded-lg">
                    <div className="font-medium text-blue-900">{comp.name}</div>
                    <div className="text-sm text-blue-700 mt-1">{comp.evidence}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sentiment */}
          {analysis.sentiment && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Overall sentiment:</span>
                <span className={`px-2 py-1 rounded-full text-xs ${getSentimentColor(analysis.sentiment)}`}>
                  {analysis.sentiment}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const InsightSection = ({ title, icon, items, renderItem }) => (
  <div>
    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
      {icon}
      {title}
    </h4>
    <div className="space-y-2">
      {items.slice(0, 5).map((item, index) => (
        <div key={index} className="text-sm">
          {renderItem(item)}
        </div>
      ))}
      {items.length > 5 && (
        <div className="text-xs text-gray-500">
          +{items.length - 5} more
        </div>
      )}
    </div>
  </div>
);

export default AIInsights;
```

### 1.3 State Management

#### Context Providers
```javascript
// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const status = await authService.checkStatus();
      if (status.success) {
        setUser(status.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (provider) => {
    window.location.href = `${process.env.REACT_APP_API_URL}/auth/${provider}`;
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      refetch: checkAuthStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

#### Custom Hooks
```javascript
// src/hooks/useDebounce.js
import { useState, useEffect } from 'react';

export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// src/hooks/useLocalStorage.js
import { useState, useEffect } from 'react';

export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
};

// src/hooks/useApi.js
import { useState, useEffect } from 'react';

export const useApi = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json',
            ...options.headers
          },
          ...options
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        setData(result.data || result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
};
```

---

## 2. Security & Privacy

### 2.1 Security Best Practices

#### Input Validation & Sanitization
```javascript
// Input validation utilities
const validateEntry = (entryData) => {
  const errors = [];
  
  // Required fields
  if (!entryData.date) {
    errors.push('Date is required');
  }
  
  if (!entryData.rawText || entryData.rawText.trim().length === 0) {
    errors.push('Entry text cannot be empty');
  }
  
  // Content length limits
  if (entryData.rawText && entryData.rawText.length > 10000) {
    errors.push('Entry text exceeds maximum length (10,000 characters)');
  }
  
  // Date validation
  const entryDate = new Date(entryData.date);
  const now = new Date();
  const maxFutureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days future
  
  if (entryDate > maxFutureDate) {
    errors.push('Entry date cannot be more than 7 days in the future');
  }
  
  if (entryDate < new Date('2020-01-01')) {
    errors.push('Entry date cannot be before 2020');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// XSS Prevention
const sanitizeContent = (content) => {
  if (typeof content !== 'string') return '';
  
  return content
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Content Security Policy
const CSP_HEADER = `
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https:;
  connect-src 'self' https://api.anthropic.com;
  frame-src 'none';
  object-src 'none';
`.replace(/\s+/g, ' ').trim();
```

#### Authentication Security
```javascript
// JWT Token Management
class TokenManager {
  static setToken(token) {
    localStorage.setItem('auth_token', token);
    this.scheduleRefresh(token);
  }
  
  static getToken() {
    return localStorage.getItem('auth_token');
  }
  
  static removeToken() {
    localStorage.removeItem('auth_token');
    this.cancelRefresh();
  }
  
  static isTokenValid(token = this.getToken()) {
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  }
  
  static scheduleRefresh(token) {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const refreshTime = (payload.exp - 300) * 1000; // 5 minutes before expiry
    const now = Date.now();
    
    if (refreshTime > now) {
      setTimeout(() => {
        this.refreshToken();
      }, refreshTime - now);
    }
  }
  
  static async refreshToken() {
    try {
      const response = await fetch('/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`
        }
      });
      
      if (response.ok) {
        const { token } = await response.json();
        this.setToken(token);
      } else {
        this.removeToken();
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.removeToken();
      window.location.href = '/login';
    }
  }
}

// Request Interceptor
const apiRequest = async (url, options = {}) => {
  const token = TokenManager.getToken();
  
  if (!TokenManager.isTokenValid(token)) {
    TokenManager.removeToken();
    window.location.href = '/login';
    return;
  }
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers
  };
  
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  if (response.status === 401) {
    TokenManager.removeToken();
    window.location.href = '/login';
    return;
  }
  
  return response;
};
```

### 2.2 Data Privacy

#### Privacy Controls
```javascript
// Privacy settings component
const PrivacySettings = () => {
  const [settings, setSettings] = useState({
    allowExport: true,
    allowAnalytics: true,
    dataRetention: '2-years',
    aiProcessing: true
  });

  const updateSetting = async (key, value) => {
    try {
      await apiRequest('/api/settings/privacy', {
        method: 'PATCH',
        body: JSON.stringify({ [key]: value })
      });
      
      setSettings(prev => ({ ...prev, [key]: value }));
    } catch (error) {
      console.error('Privacy setting update failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Privacy & Data</h3>
      
      <div className="space-y-4">
        <SettingToggle
          label="Allow data export"
          description="Enable ability to export all your data"
          checked={settings.allowExport}
          onChange={(value) => updateSetting('allowExport', value)}
        />
        
        <SettingToggle
          label="Usage analytics"
          description="Help improve the app with anonymous usage data"
          checked={settings.allowAnalytics}
          onChange={(value) => updateSetting('allowAnalytics', value)}
        />
        
        <SettingToggle
          label="AI processing"
          description="Allow AI analysis of your journal entries"
          checked={settings.aiProcessing}
          onChange={(value) => updateSetting('aiProcessing', value)}
        />
        
        <div className="border-t pt-4">
          <h4 className="font-medium text-red-600 mb-2">Danger Zone</h4>
          <button
            onClick={handleExportData}
            className="mr-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Export All Data
          </button>
          <button
            onClick={handleDeleteAccount}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};

// Data encryption utilities
const encryptSensitiveData = (data) => {
  // For client-side encryption of sensitive data
  // Using Web Crypto API for browser compatibility
  // Note: This is for demonstration - real implementation would be more complex
  return btoa(JSON.stringify(data));
};

const decryptSensitiveData = (encryptedData) => {
  try {
    return JSON.parse(atob(encryptedData));
  } catch {
    return null;
  }
};
```

---

## 3. Development Guidelines

### 3.1 Code Standards

#### JavaScript/React Guidelines
```javascript
// File naming convention
components/         // PascalCase for React components
utils/             // camelCase for utility functions
hooks/             // camelCase with 'use' prefix
services/          // camelCase for service files
types/             // PascalCase for TypeScript types (future)

// Component structure template
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * ComponentName - Brief description of what this component does
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Title to display
 * @param {Function} props.onAction - Callback function
 * @returns {JSX.Element} Rendered component
 */
const ComponentName = ({ title, onAction }) => {
  // State declarations
  const [loading, setLoading] = useState(false);
  
  // Effects
  useEffect(() => {
    // Effect logic
  }, []);
  
  // Event handlers
  const handleAction = () => {
    // Handler logic
    onAction?.();
  };
  
  // Render
  return (
    <div className="component-name">
      <h2>{title}</h2>
      <button onClick={handleAction}>
        Action
      </button>
    </div>
  );
};

// PropTypes validation
ComponentName.propTypes = {
  title: PropTypes.string.isRequired,
  onAction: PropTypes.func
};

// Default props
ComponentName.defaultProps = {
  onAction: () => {}
};

export default ComponentName;
```

#### Error Handling
```javascript
// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Report to error tracking service
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: { errorInfo }
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>We're sorry, but something unexpected happened.</p>
          <button onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Async error handling hook
const useAsyncError = () => {
  const [error, setError] = useState(null);
  
  const throwError = useCallback((error) => {
    setError(error);
  }, []);
  
  useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);
  
  return throwError;
};

// API error handling
const handleApiError = (error, context = '') => {
  console.error(`API Error${context ? ` (${context})` : ''}:`, error);
  
  if (error.status === 401) {
    TokenManager.removeToken();
    window.location.href = '/login';
    return;
  }
  
  if (error.status === 403) {
    showToast('You don\'t have permission to perform this action', 'error');
    return;
  }
  
  if (error.status >= 500) {
    showToast('Server error. Please try again later.', 'error');
    return;
  }
  
  showToast(error.message || 'An unexpected error occurred', 'error');
};
```

### 3.2 Performance Guidelines

#### Component Optimization
```javascript
// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data, onUpdate }) => {
  // Component logic
}, (prevProps, nextProps) => {
  // Custom comparison function
  return prevProps.data.id === nextProps.data.id;
});

// Use useMemo for expensive calculations
const ProcessedData = ({ entries }) => {
  const statistics = useMemo(() => {
    return entries.reduce((acc, entry) => {
      acc.totalWords += entry.wordCount;
      acc.avgWordsPerEntry = acc.totalWords / entries.length;
      return acc;
    }, { totalWords: 0, avgWordsPerEntry: 0 });
  }, [entries]);
  
  return <StatsDisplay stats={statistics} />;
};

// Use useCallback for stable function references
const EntryList = ({ entries, onEntryUpdate }) => {
  const handleEntryClick = useCallback((entryId) => {
    onEntryUpdate(entryId);
  }, [onEntryUpdate]);
  
  return (
    <div>
      {entries.map(entry => (
        <EntryItem 
          key={entry.id}
          entry={entry}
          onClick={handleEntryClick}
        />
      ))}
    </div>
  );
};
```

#### Bundle Optimization
```javascript
// Lazy loading for route components
const InsightsDashboard = React.lazy(() => import('../components/InsightsDashboard'));
const SettingsPanel = React.lazy(() => import('../components/SettingsPanel'));

// Code splitting with Suspense
const App = () => (
  <Router>
    <Routes>
      <Route path="/journal" element={<JournalView />} />
      <Route 
        path="/insights" 
        element={
          <Suspense fallback={<LoadingSpinner />}>
            <InsightsDashboard />
          </Suspense>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <Suspense fallback={<LoadingSpinner />}>
            <SettingsPanel />
          </Suspense>
        } 
      />
    </Routes>
  </Router>
);
```

### 3.3 Testing Guidelines

#### Component Testing
```javascript
// Example test file: JournalEntry.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JournalEntry from '../JournalEntry';

// Mock API calls
jest.mock('../services/api', () => ({
  saveEntry: jest.fn(),
  analyzeEntry: jest.fn()
}));

describe('JournalEntry', () => {
  const mockProps = {
    selectedDate: new Date('2025-10-03'),
    onEntryChange: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders entry editor', () => {
    render(<JournalEntry {...mockProps} />);
    
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByText('October 3, 2025')).toBeInTheDocument();
  });

  test('auto-saves after typing', async () => {
    const user = userEvent.setup();
    render(<JournalEntry {...mockProps} />);
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Today I completed the API documentation');
    
    await waitFor(() => {
      expect(mockProps.onEntryChange).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  test('shows character count', async () => {
    const user = userEvent.setup();
    render(<JournalEntry {...mockProps} />);
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Hello world');
    
    expect(screen.getByText(/11 characters/)).toBeInTheDocument();
  });
});
```

#### Integration Testing
```javascript
// Example integration test
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';

// Mock authentication
jest.mock('../services/auth', () => ({
  checkStatus: jest.fn(() => Promise.resolve({
    success: true,
    user: { id: '1', email: 'test@example.com' }
  }))
}));

const renderApp = () => {
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
};

describe('App Integration', () => {
  test('authenticated user sees journal page', async () => {
    renderApp();
    
    await waitFor(() => {
      expect(screen.getByText('Journal')).toBeInTheDocument();
    });
  });
});
```

### 3.4 Accessibility Guidelines

#### ARIA and Semantic HTML
```javascript
// Accessible form components
const AccessibleForm = () => (
  <form onSubmit={handleSubmit} role="form" aria-labelledby="form-title">
    <h2 id="form-title">Entry Settings</h2>
    
    <div className="form-group">
      <label htmlFor="reminder-time" className="form-label">
        Daily Reminder Time
      </label>
      <input
        id="reminder-time"
        type="time"
        className="form-input"
        aria-describedby="reminder-help"
        required
      />
      <div id="reminder-help" className="form-help">
        Choose when you'd like to receive daily logging reminders
      </div>
    </div>
    
    <button 
      type="submit"
      className="btn-primary"
      aria-describedby="submit-status"
    >
      Save Settings
    </button>
    
    <div 
      id="submit-status" 
      role="status" 
      aria-live="polite"
      className="sr-only"
    >
      {submitStatus}
    </div>
  </form>
);

// Keyboard navigation support
const NavigableList = ({ items, onSelect }) => {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < items.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : items.length - 1
        );
        break;
      case 'Enter':
        if (focusedIndex >= 0) {
          onSelect(items[focusedIndex]);
        }
        break;
    }
  };
  
  return (
    <ul 
      role="listbox"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {items.map((item, index) => (
        <li
          key={item.id}
          role="option"
          aria-selected={index === focusedIndex}
          className={index === focusedIndex ? 'focused' : ''}
          onClick={() => onSelect(item)}
        >
          {item.name}
        </li>
      ))}
    </ul>
  );
};
```

---

## Document Maintenance

This document should be updated when:
- New frontend components are added
- Security practices or guidelines change
- Development standards are modified
- Accessibility requirements are updated
- New testing practices are established

**Next Review Date**: January 3, 2026
**Reviewers**: Frontend Lead, UX Designer, Security Engineer