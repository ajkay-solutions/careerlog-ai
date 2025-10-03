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
    return localStorage.getItem('auth_token');
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
      
      throw new ApiError('Network error', 0, { originalError: error });
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

  async getEntryByDate(date) {
    const formattedDate = this.formatDateForAPI(date);
    return this.get(`/api/entries/${formattedDate}`);
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