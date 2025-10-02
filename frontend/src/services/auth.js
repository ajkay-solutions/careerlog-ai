// JWT-based authentication service for WorkLog AI
const isProduction = window.location.hostname === 'worklog.ajkaysolutions.com' || window.location.hostname.includes('render.com');
const API_BASE = isProduction
  ? '' // Use relative URLs in production (same origin)
  : 'http://localhost:3004'; // WorkLog AI backend port

class AuthService {
  constructor() {
    this.user = null;
    this.isAuthenticated = false;
    this.listeners = [];
    this.token = null;
    
    // Check for token in URL on initialization
    this.checkUrlToken();
  }
  
  // Check if there's a token in the URL parameters
  checkUrlToken() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      this.setToken(token);
      // Clean the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      // Try to get token from localStorage
      this.token = localStorage.getItem('worklog_auth_token');
    }
  }
  
  // Set authentication token
  setToken(token) {
    this.token = token;
    localStorage.setItem('worklog_auth_token', token);
    
    // Parse user data from JWT payload (basic parsing)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.user = {
        id: payload.id,
        email: payload.email,
        displayName: payload.displayName,
        provider: payload.provider,
        profilePhoto: payload.profilePhoto
      };
      this.isAuthenticated = true;
      this.notifyListeners();
    } catch (error) {
      console.error('Invalid token format:', error);
      this.clearToken();
    }
  }
  
  // Clear authentication token
  clearToken() {
    this.token = null;
    this.user = null;
    this.isAuthenticated = false;
    localStorage.removeItem('worklog_auth_token');
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
  
  // Logout user
  async logout() {
    try {
      if (this.token) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      this.clearToken();
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
}

// Export singleton instance
export const authService = new AuthService();
export default authService;