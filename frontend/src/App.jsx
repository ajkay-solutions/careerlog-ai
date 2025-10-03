import React, { useState, useEffect } from 'react';
import { authService } from './services/auth';
import Navigation from './components/Navigation';
import DateNavigation from './components/DateNavigation';
import EntryList from './components/EntryList';
import JournalEntry from './components/JournalEntry';
import InsightsDashboard from './components/InsightsDashboard';
import GenerateView from './pages/GenerateView';

function App() {
  const [user, setUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState('journal');

  // Debug environment variables (only log once)
  if (typeof window !== 'undefined' && !window.__debugLogged) {
    console.log('🔧 Environment check:', {
      VITE_API_URL: import.meta.env.VITE_API_URL,
      NODE_ENV: import.meta.env.NODE_ENV,
      MODE: import.meta.env.MODE
    });
    window.__debugLogged = true;
  }

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authStatus = await authService.checkStatus();
        if (authStatus.success && authStatus.user) {
          setUser(authStatus.user);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Handle OAuth login
  const handleLogin = (provider) => {
    console.log('🖱️ Login button clicked for provider:', provider);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3004';
    const redirectUrl = `${apiUrl}/auth/${provider}`;
    console.log('🔗 Redirecting to OAuth:', redirectUrl);
    console.log('🌐 Current window location:', window.location.href);
    
    // Add a small delay to ensure console logs are visible
    setTimeout(() => {
      console.log('🚀 Executing redirect...');
      window.location.href = redirectUrl;
    }, 100);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Handle entry changes (to refresh list)
  const handleEntryChange = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Handle date selection
  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading WorkLog AI...</p>
        </div>
      </div>
    );
  }

  // Login screen
  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full mx-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">WorkLog AI</h1>
            <p className="text-gray-600">Never miss a career win</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => handleLogin('google')}
              className="w-full flex items-center justify-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <button
              onClick={() => handleLogin('linkedin')}
              className="w-full flex items-center justify-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              style={{ order: -1 }}
            >
              <svg className="w-5 h-5" fill="#0077b5" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              Continue with LinkedIn (Test This First)
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-6">
            By continuing, you agree to our terms of service and privacy policy
          </p>
        </div>
      </div>
    );
  }

  // Main application
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Navigation */}
      <Navigation 
        user={user} 
        onLogout={handleLogout} 
        currentView={currentView}
        onViewChange={setCurrentView}
      />

      {/* Conditional Content Based on Current View */}
      {currentView === 'journal' && (
        <>
          {/* Date Navigation */}
          <DateNavigation
            selectedDate={selectedDate}
            onDateChange={handleDateSelect}
          />

          {/* Main Content */}
          <div className="flex-1 flex">
            {/* Entry List Sidebar */}
            <EntryList
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              refreshTrigger={refreshTrigger}
            />

            {/* Journal Entry Editor */}
            <JournalEntry
              selectedDate={selectedDate}
              onEntryChange={handleEntryChange}
            />
          </div>
        </>
      )}

      {currentView === 'insights' && (
        <InsightsDashboard />
      )}

      {currentView === 'generate' && (
        <GenerateView />
      )}
    </div>
  );
}

export default App
