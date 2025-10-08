/**
 * Centralized logging utility for WorkLog AI
 * Automatically disables sensitive logging in production
 */

const isProduction = import.meta.env.PROD;
const isDevelopment = import.meta.env.MODE === 'development';

// Define what should NEVER be logged in any environment
const SENSITIVE_KEYS = [
  'token', 'jwt', 'password', 'secret', 'key', 'authorization',
  'profilePhoto', 'email', 'displayName', 'name', 'phone'
];

// Sanitize objects to remove sensitive data
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    const keyLower = key.toLowerCase();
    const isSensitive = SENSITIVE_KEYS.some(sensitive => keyLower.includes(sensitive));
    
    if (isSensitive) {
      if (typeof value === 'string') {
        sanitized[key] = value.length > 10 ? '[REDACTED]' : '[HIDDEN]';
      } else {
        sanitized[key] = '[REDACTED]';
      }
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export const logger = {
  // Development-only logs (completely disabled in production)
  debug: (...args) => {
    if (isDevelopment) {
      const sanitized = args.map(arg => 
        typeof arg === 'object' ? sanitizeObject(arg) : arg
      );
      console.log(...sanitized);
    }
  },
  
  // Info logs (limited in production)
  info: (...args) => {
    if (isDevelopment) {
      const sanitized = args.map(arg => 
        typeof arg === 'object' ? sanitizeObject(arg) : arg
      );
      console.log(...sanitized);
    } else if (!isProduction) {
      // Only show non-sensitive info in staging
      console.log('[INFO]', ...args.filter(arg => typeof arg !== 'object'));
    }
  },
  
  // Warnings (always show but sanitized)
  warn: (...args) => {
    const sanitized = args.map(arg => 
      typeof arg === 'object' ? sanitizeObject(arg) : arg
    );
    console.warn(...sanitized);
  },
  
  // Errors (always show but sanitized)
  error: (...args) => {
    const sanitized = args.map(arg => 
      typeof arg === 'object' ? sanitizeObject(arg) : arg
    );
    console.error(...sanitized);
  },
  
  // Performance logs (development only)
  perf: (label, ...args) => {
    if (isDevelopment) {
      console.log(`⚡ ${label}:`, ...args);
    }
  }
};

export default logger;