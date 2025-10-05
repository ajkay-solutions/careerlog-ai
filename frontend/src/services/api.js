// API service for WorkLog AI
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get auth token from localStorage
  getAuthToken() {
    const token = localStorage.getItem('auth_token');
    
    // Debug token retrieval issues
    if (token) {
      console.log('🔍 Token retrieved from localStorage:', {
        length: token.length,
        startsCorrectly: token.startsWith('eyJ'),
        hasNewlines: token.includes('\n'),
        hasCarriageReturns: token.includes('\r'),
        firstChars: token.substring(0, 20) + '...',
        lastChars: '...' + token.substring(token.length - 20)
      });
      
      // Clean token if it has newlines or extra whitespace
      const cleanToken = token.replace(/[\n\r]/g, '').trim();
      if (cleanToken !== token) {
        console.warn('🧹 Token had formatting issues, cleaned and re-stored');
        localStorage.setItem('auth_token', cleanToken);
        return cleanToken;
      }
      
      return token;
    } else {
      console.log('🔍 No auth token found in localStorage');
      return null;
    }
  }

  // Make authenticated API request with timeout
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getAuthToken();
    
    // Set timeout based on endpoint type
    let timeout;
    if (endpoint.includes('/insights/')) {
      timeout = 30000; // 30 seconds for insights
    } else if (endpoint.includes('/export') || endpoint.includes('/generate')) {
      timeout = 60000; // 60 seconds for export and generation
    } else {
      timeout = 10000; // 10 seconds for others
    }

    const config = {
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      config.signal = controller.signal;
      
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(
          data.error || `HTTP ${response.status}`,
          response.status,
          data
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Handle timeout errors
      if (error.name === 'AbortError') {
        throw new ApiError(`Request timeout (${timeout/1000}s) - ${endpoint}`, 408, { originalError: error });
      }
      
      // Handle connection errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new ApiError(`Connection failed - Backend service may be unavailable. Please check if the backend is running at ${this.baseURL}`, 0, { originalError: error });
      }
      
      // Log the original error for debugging
      console.error('🔍 API Service Error Details:', {
        name: error.name,
        message: error.message,
        endpoint: endpoint,
        baseURL: this.baseURL
      });
      
      throw new ApiError(`Network error: ${error.message}`, 0, { originalError: error });
    }
  }

  // GET request
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return this.request(url, {
      method: 'GET',
    });
  }

  // POST request
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  // PATCH request
  async patch(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // POST request for file downloads (returns blob)
  async postFile(endpoint, data = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getAuthToken();
    
    // Set timeout for file operations (60 seconds)
    const timeout = 60000;

    const config = {
      method: 'POST',
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    };

    // Add auth token if available
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      config.signal = controller.signal;
      
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      if (!response.ok) {
        // Try to get error message from response
        try {
          const errorData = await response.json();
          throw new ApiError(
            errorData.error || `HTTP ${response.status}`,
            response.status,
            errorData
          );
        } catch (jsonError) {
          throw new ApiError(`HTTP ${response.status}`, response.status);
        }
      }

      // Return blob for file download
      return await response.blob();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Handle timeout errors
      if (error.name === 'AbortError') {
        throw new ApiError(`Request timeout (${timeout/1000}s) - ${endpoint}`, 408, { originalError: error });
      }
      
      // Handle connection errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new ApiError(`Connection failed - Backend service may be unavailable. Please check if the backend is running at ${this.baseURL}`, 0, { originalError: error });
      }
      
      throw new ApiError(`Network error: ${error.message}`, 0, { originalError: error });
    }
  }

  // Entry-specific methods
  async getEntries(params = {}) {
    return this.get('/api/entries', params);
  }

  // Helper function to format date for API without timezone issues
  formatDateForAPI(date) {
    if (typeof date === 'string') return date;
    if (!(date instanceof Date)) return date;
    
    // Use local date components to avoid timezone conversion
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async getEntryByDate(date, options = {}) {
    const formattedDate = this.formatDateForAPI(date);
    const params = {};
    
    // Add cache-busting parameter if requested
    if (options.bustCache) {
      params._t = Date.now();
      console.log('🔍 Adding cache-busting timestamp:', params._t);
    }
    
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/api/entries/${formattedDate}?${queryString}` : `/api/entries/${formattedDate}`;
    
    // Use custom request with cache-busting headers if requested
    if (options.bustCache) {
      return this.request(url, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    } else {
      return this.request(url, {
        method: 'GET'
      });
    }
  }

  async createEntry(entryData) {
    return this.post('/api/entries', entryData);
  }

  async updateEntry(date, entryData) {
    const formattedDate = this.formatDateForAPI(date);
    return this.put(`/api/entries/${formattedDate}`, entryData);
  }

  async deleteEntry(date) {
    const formattedDate = this.formatDateForAPI(date);
    return this.delete(`/api/entries/${formattedDate}`);
  }

  async toggleEntryHighlight(date) {
    const formattedDate = this.formatDateForAPI(date);
    return this.patch(`/api/entries/${formattedDate}/highlight`);
  }

  // Auth methods
  async checkAuthStatus() {
    return this.get('/auth/status');
  }

  async logout() {
    // JWT logout is handled client-side (stateless tokens)
    localStorage.removeItem('auth_token');
    return { success: true, message: 'Logged out successfully' };
  }

  // AI methods
  async analyzeEntry(entryId, options = {}) {
    return this.post(`/api/ai/analyze/${entryId}`, options);
  }

  async batchAnalyzeEntries(entryIds, options = {}) {
    return this.post('/api/ai/analyze-batch', { entryIds, ...options });
  }

  async getJobStatus(jobId) {
    return this.get(`/api/ai/job/${jobId}`);
  }

  async getInsights(timeframe = 'month') {
    return this.get('/api/ai/insights', { timeframe });
  }

  async getAISummary(timeframe = null) {
    const params = timeframe ? { timeframe } : {};
    return this.get('/api/ai/summary', params);
  }

  async getAIHealth() {
    return this.get('/api/ai/health');
  }
}

// Export singleton instance
export const apiService = new ApiService();
export { ApiError };