const jwt = require('jsonwebtoken');

// JWT secret for token verification
const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'fallback-jwt-secret';

// JWT-based authentication middleware
const requireAuth = (req, res, next) => {
  const authHeader = req.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required - no token provided',
      redirectTo: '/login'
    });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    console.log('✅ JWT authenticated user:', decoded.displayName);
    next();
  } catch (error) {
    console.error('❌ JWT verification failed:', error.message);
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token',
      redirectTo: '/login'
    });
  }
};

// Optional authentication - doesn't block if not authenticated
const optionalAuth = (req, res, next) => {
  const authHeader = req.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      console.log('✅ JWT optional auth - user found:', decoded.displayName);
    } catch (error) {
      console.log('ℹ️ JWT optional auth - invalid token, proceeding without user');
      req.user = null;
    }
  } else {
    req.user = null;
  }
  
  next();
};

// Check if user has specific provider authentication
const requireProvider = (provider) => {
  return (req, res, next) => {
    if (req.user && req.user.provider === provider) {
      return next();
    }
    
    res.status(401).json({ 
      success: false, 
      message: `${provider} authentication required`,
      redirectTo: `/auth/${provider}`
    });
  };
};

module.exports = {
  requireAuth,
  optionalAuth,
  requireProvider
};