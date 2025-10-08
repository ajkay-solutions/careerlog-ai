// JWT-based authentication service for WorkLog AI
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3004';

class AuthService {
  constructor() {
    this.user = null;
    this.isAuthenticated = false;
    this.listeners = [];
    this.token = null;
    
    // Check for token in URL on initialization
    this.initializeAuth();
  }
  
  // Initialize authentication state  
  async initializeAuth() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      // Token from OAuth callback
      await this.setToken(token);
      // Clean the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      // Try to get existing token from localStorage
      const existingToken = localStorage.getItem('auth_token');
      if (existingToken) {
        this.token = existingToken;
        // Fetch fresh profile data
        await this.fetchUserProfile();
      }
    }
  }
  
  // Set authentication token
  async setToken(token) {
    this.token = token;
    localStorage.setItem('auth_token', token);
    
    // Fetch complete user profile from API instead of parsing JWT
    try {
      const profileResult = await this.fetchUserProfile();
      if (profileResult.success) {
        // Profile already set in fetchUserProfile
        // Profile loaded (sensitive data not logged for security)
      } else {
        // If profile API fails, this might indicate an incompatible JWT token
        // (e.g., from before multi-provider migration)
        console.warn('⚠️ [ISSUE-6-DEBUG] Profile API failed - this may be an incompatible JWT token from before the multi-provider migration');
        console.warn('⚠️ [ISSUE-6-DEBUG] Profile result:', profileResult);
        console.warn('⚠️ [ISSUE-6-DEBUG] Clearing token to force re-authentication...');
        this.clearToken();
        throw new Error('JWT token incompatible with current system - please log in again');
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      this.clearToken();
    }
  }
  
  // Clear authentication token
  clearToken() {
    this.token = null;
    this.user = null;
    this.isAuthenticated = false;
    localStorage.removeItem('auth_token');
    this.notifyListeners();
  }
  
  // Check authentication status with server
  async checkStatus() {
    if (!this.token) {
      return { success: false, message: 'No token found' };
    }
    
    try {
      const response = await fetch(`${API_BASE}/auth/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        this.user = data.user;
        this.isAuthenticated = true;
        this.notifyListeners();
        return { success: true, user: data.user };
      } else {
        this.clearToken();
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
      return { success: false, message: 'Network error' };
    }
  }
  
  // Fetch complete user profile with all provider information
  async fetchUserProfile() {
    if (!this.token) {
      return { success: false, message: 'No token found' };
    }
    
    try {
      const response = await fetch(`${API_BASE}/api/user/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Update user with complete profile data including best profile photo
        this.user = {
          ...data.data.user,
          providers: data.data.providers,
          stats: data.data.stats
        };
        this.isAuthenticated = true;
        this.notifyListeners();
        return { success: true, data: data.data };
      } else {
        if (response.status === 401) {
          this.clearToken();
        }
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('❌ [ISSUE-6-DEBUG] User profile fetch failed:', {
        error: error.message,
        status: error.status,
        response: error.response
      });
      return { success: false, message: 'Network error' };
    }
  }
  
  // Logout user (JWT is stateless, so we just clear the token)
  async logout() {
    try {
      // Since we're using JWT tokens (stateless), we don't need a server logout
      // Just clear the token from localStorage
      console.log('🔓 Logging out user...');
      this.clearToken();
      
      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, clear the token
      this.clearToken();
      return { success: false, message: 'Logout error' };
    }
  }
  
  // Get current user
  getUser() {
    return this.user;
  }
  
  // Check if user is authenticated
  isLoggedIn() {
    return this.isAuthenticated && this.token;
  }
  
  // Get auth token
  getToken() {
    return this.token;
  }
  
  // Add auth state change listener
  addListener(callback) {
    this.listeners.push(callback);
  }
  
  // Remove auth state change listener
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }
  
  // Notify all listeners of auth state changes
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.user, this.isAuthenticated);
      } catch (error) {
        console.error('Auth listener error:', error);
      }
    });
  }
  
  // Get OAuth login URL
  getLoginUrl(provider = 'google') {
    return `${API_BASE}/auth/${provider}`;
  }
  
  // Initiate OAuth login
  login(provider = 'google') {
    window.location.href = this.getLoginUrl(provider);
  }
  
  // Fetch connected providers
  async fetchProviders() {
    if (!this.token) {
      return { success: false, message: 'No token found' };
    }
    
    try {
      const response = await fetch(`${API_BASE}/api/user/providers`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        return { success: true, providers: data.data };
      } else {
        if (response.status === 401) {
          this.clearToken();
        }
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Providers fetch failed:', error);
      return { success: false, message: 'Network error' };
    }
  }
  
  // Disconnect a provider
  async disconnectProvider(provider) {
    if (!this.token) {
      return { success: false, message: 'No token found' };
    }
    
    try {
      const response = await fetch(`${API_BASE}/api/user/providers/${provider}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Refresh user profile after disconnecting provider
        await this.fetchUserProfile();
        return { success: true, message: data.message };
      } else {
        if (response.status === 401) {
          this.clearToken();
        }
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Provider disconnect failed:', error);
      return { success: false, message: 'Network error' };
    }
  }
  
  // Get user's profile photo (from best provider)
  getProfilePhoto() {
    return this.user?.profilePhoto || '';
  }
  
  // Get connected providers
  getConnectedProviders() {
    return this.user?.providers?.filter(p => p.connected) || [];
  }
  
  // Check if user has a specific provider connected
  hasProvider(provider) {
    return this.getConnectedProviders().some(p => p.provider === provider);
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;