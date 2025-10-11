import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { authService } from './services/auth';
import Navigation from './components/Navigation';
import DateNavigation from './components/DateNavigation';
import EntryList from './components/EntryList';
import JournalEntry from './components/JournalEntry';
import InsightsDashboard from './components/InsightsDashboard';
import GenerateView from './pages/GenerateView';
import { LandingPage } from './pages/LandingPage';

// Simple landing page component for auth flows
function SimpleLandingPage({ onLogin }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Check if user was redirected due to auth issues
  const hasAuthError = searchParams.get('auth_required') === 'true';
  const showMigrationMessage = localStorage.getItem('auth_token') && hasAuthError;
  
  const handleLogin = (provider) => {
    setIsLoading(true);
    setLoadingProvider(provider);
    
    // Clear any auth_required flag when user attempts login
    if (hasAuthError) {
      setSearchParams({});
    }
    
    onLogin(provider);
  };
  
  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">CareerLog AI</h1>
          <p className="text-gray-600">Never miss a career win</p>
          
          {showMigrationMessage && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              🔄 We've upgraded our authentication system! Please log in again to continue.
            </div>
          )}
        </div>

        <div className="space-y-4">
          <button
            onClick={() => handleLogin('google')}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {isLoading && loadingProvider === 'google' ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                Redirecting to Google...
              </span>
            ) : (
              <>Continue with Google</>
            )}
          </button>

          <button
            onClick={() => handleLogin('linkedin')}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="#0077b5" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            {isLoading && loadingProvider === 'linkedin' ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                Redirecting to LinkedIn...
              </span>
            ) : (
              <>Continue with LinkedIn</>
            )}
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-6">
          By continuing, you agree to our terms of service and privacy policy
        </p>
      </div>
    </div>
  );
}

// Main journal view component
function JournalView({ user, onLogout }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentView, setCurrentView] = useState('journal');

  // Handle entry changes (to refresh list)
  const handleEntryChange = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Handle date selection
  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Navigation */}
      <Navigation 
        user={user} 
        onLogout={onLogout} 
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

// Loading component
function LoadingScreen({ isProcessingAuth = false }) {
  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">
          {isProcessingAuth ? 'Completing authentication...' : 'Loading CareerLog AI...'}
        </p>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingToken, setIsProcessingToken] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Debug environment variables (development only)
  useEffect(() => {
    if (import.meta.env.MODE === 'development' && typeof window !== 'undefined' && !window.__debugLogged) {
      console.log('🔧 Environment check:', {
        VITE_API_URL: import.meta.env.VITE_API_URL,
        MODE: import.meta.env.MODE
      });
      window.__debugLogged = true;
    }
  }, []);

  // Handle OAuth token from URL parameters
  useEffect(() => {
    const token = searchParams.get('token');
    const authSuccess = searchParams.get('auth');
    
    if (import.meta.env.MODE === 'development') {
      console.log('🔍 URL params check:', {
        hasToken: !!token,
        authSuccess,
        pathname: location.pathname
      });
    }

    if (token && !isProcessingToken) {
      if (import.meta.env.MODE === 'development') {
        console.log('🔑 OAuth token found in URL, processing...');
      }
      setIsProcessingToken(true);
      setIsLoading(true); // Keep loading screen while processing
      
      // Set token and fetch user profile
      authService.setToken(token).then(async () => {
        // Wait a moment for profile to be fetched
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const user = authService.getUser();
        if (import.meta.env.MODE === 'development') {
          console.log('✅ OAuth login successful');
        }
        
        if (user) {
          setUser(user);
          setIsLoading(false);
          setIsProcessingToken(false);
          
          // Clean up URL by navigating to /journal without params
          navigate('/journal', { replace: true });
        } else {
          // Token verification failed
          localStorage.removeItem('auth_token');
          setIsLoading(false);
          setIsProcessingToken(false);
          navigate('/', { replace: true });
        }
      }).catch(error => {
        if (import.meta.env.MODE === 'development') {
          console.error('❌ Auth setup error:', error);
        }
        localStorage.removeItem('auth_token');
        setIsLoading(false);
        setIsProcessingToken(false);
        navigate('/', { replace: true });
      });
    }
  }, [searchParams, navigate, location]);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is authenticated and fetch profile
        if (authService.isLoggedIn()) {
          const profileResult = await authService.fetchUserProfile();
          console.log('🔍 Initial profile fetch:', profileResult);
          
          if (profileResult.success && profileResult.data.user) {
            setUser(profileResult.data.user);
            // Profile loaded successfully (sensitive data not logged)
            
            // If on landing page and authenticated, redirect to journal
            if (location.pathname === '/') {
              navigate('/journal', { replace: true });
            }
          } else {
            // Profile fetch failed, clear auth and show helpful message
            authService.clearToken();
            if (location.pathname !== '/') {
              navigate('/?auth_required=true', { replace: true });
            }
          }
        } else {
          // Not authenticated, redirect to landing if on protected route
          if (location.pathname !== '/') {
            navigate('/', { replace: true });
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        authService.clearToken();
        // If trying to access protected route without auth, redirect to landing
        if (location.pathname !== '/') {
          navigate('/', { replace: true });
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Only run auth check if we're not processing an OAuth token
    if (!searchParams.get('token')) {
      checkAuth();
    }
    // If processing OAuth token, the token handler will manage loading state
  }, [navigate, location.pathname]);

  // Handle OAuth login
  const handleLogin = (provider) => {
    if (import.meta.env.MODE === 'development') {
      console.log('🖱️ Login button clicked for provider:', provider);
    }
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3005';
    const redirectUrl = `${apiUrl}/auth/${provider}`;
    
    // Add a small delay to ensure UI updates are visible
    setTimeout(() => {
      if (import.meta.env.MODE === 'development') {
        console.log('🚀 Executing redirect...');
      }
      window.location.href = redirectUrl;
    }, 100);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await authService.logout();
      setUser(null);
      localStorage.removeItem('auth_token');
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
      // Force logout even if API call fails
      setUser(null);
      localStorage.removeItem('auth_token');
      navigate('/', { replace: true });
    }
  };

  if (isLoading) {
    return <LoadingScreen isProcessingAuth={isProcessingToken} />;
  }

  return (
    <Routes>
      {/* Landing page - only accessible when not authenticated */}
      <Route 
        path="/" 
        element={
          user ? (
            <JournalView user={user} onLogout={handleLogout} />
          ) : (
            <LandingPage />
          )
        } 
      />
      
      {/* Journal view - requires authentication */}
      <Route 
        path="/journal" 
        element={
          user ? (
            <JournalView user={user} onLogout={handleLogout} />
          ) : (
            <SimpleLandingPage onLogin={handleLogin} />
          )
        } 
      />
      
      {/* Insights view - requires authentication */}
      <Route 
        path="/insights" 
        element={
          user ? (
            <div className="h-screen flex flex-col bg-gray-50">
              <Navigation 
                user={user} 
                onLogout={handleLogout} 
                currentView="insights"
                onViewChange={() => navigate('/insights')}
              />
              <InsightsDashboard />
            </div>
          ) : (
            <SimpleLandingPage onLogin={handleLogin} />
          )
        } 
      />
      
      {/* Generate view - requires authentication */}
      <Route 
        path="/generate" 
        element={
          user ? (
            <div className="h-screen flex flex-col bg-gray-50">
              <Navigation 
                user={user} 
                onLogout={handleLogout} 
                currentView="generate"
                onViewChange={() => navigate('/generate')}
              />
              <GenerateView />
            </div>
          ) : (
            <SimpleLandingPage onLogin={handleLogin} />
          )
        } 
      />
    </Routes>
  );
}

export default App;