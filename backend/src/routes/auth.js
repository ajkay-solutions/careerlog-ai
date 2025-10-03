const express = require('express');
const jwt = require('jsonwebtoken');
const { passport } = require('../config/passport');
const router = express.Router();

// JWT secret for token signing
const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'fallback-jwt-secret';

// Generate JWT token for user
function generateToken(user) {
  return jwt.sign({
    id: user.id,
    provider: user.provider,
    displayName: user.displayName,
    name: user.name,
    email: user.email,
    profilePhoto: user.profilePhoto
  }, JWT_SECRET, { expiresIn: '24h' });
}

// LinkedIn OAuth routes
router.get('/linkedin', (req, res, next) => {
  console.log('🔗 LinkedIn OAuth initiated from:', req.get('host'));
  console.log('🔑 LinkedIn credentials check:', {
    hasClientId: !!process.env.LINKEDIN_CLIENT_ID,
    clientIdStart: process.env.LINKEDIN_CLIENT_ID?.substring(0, 4) || 'missing',
    hasClientSecret: !!process.env.LINKEDIN_CLIENT_SECRET
  });
  
  // Check if fresh login is requested
  const authOptions = { 
    scope: ['openid', 'profile', 'email']
  };
  
  if (req.query.prompt === 'login') {
    console.log('🔄 Forcing fresh LinkedIn login');
    authOptions.prompt = 'login';
  }
  
  passport.authenticate('linkedin', authOptions)(req, res, next);
});

// LinkedIn callback (centralized for all environments)
router.get('/linkedin/callback', 
  (req, res, next) => {
    console.log('🔄 LinkedIn callback received:', {
      query: req.query,
      session: req.session,
      url: req.url,
      fullUrl: req.protocol + '://' + req.get('host') + req.originalUrl
    });
    
    // If there's an error parameter, log it immediately and redirect
    if (req.query.error) {
      console.error('🚨 LinkedIn returned error:', {
        error: req.query.error,
        error_description: req.query.error_description,
        state: req.query.state
      });
      // Detect production environment and redirect to frontend
      const isProduction = process.env.NODE_ENV === 'production' || req.get('host').includes('worklog.ajkaysolutions.com');
      const errorRedirectUrl = isProduction
        ? `https://worklog.ajkaysolutions.com/?error=linkedin_auth_error`
        : `http://localhost:5173/?error=linkedin_auth_error`;
      return res.redirect(errorRedirectUrl);
    }
    
    // If there's an authorization code, log it
    if (req.query.code) {
      console.log('✅ LinkedIn authorization code received:', req.query.code.substring(0, 10) + '...');
    }
    
    passport.authenticate('linkedin', (err, user, info) => {
      console.log('🔍 Passport authenticate result:', {
        err: err,
        user: user ? { id: user.id, provider: user.provider } : null,
        info: info
      });
      
      if (err) {
        console.error('❌ LinkedIn authentication error:', err);
        // Detect production environment and redirect to frontend
      const isProduction = process.env.NODE_ENV === 'production' || req.get('host').includes('worklog.ajkaysolutions.com');
      const errorRedirectUrl = isProduction
        ? `https://worklog.ajkaysolutions.com/?error=linkedin_auth_error`
        : `http://localhost:5173/?error=linkedin_auth_error`;
      return res.redirect(errorRedirectUrl);
      }
      
      if (!user) {
        console.error('❌ LinkedIn authentication failed - no user returned:', info);
        // Detect production environment and redirect to frontend
        const isProduction = process.env.NODE_ENV === 'production' || req.get('host').includes('worklog.ajkaysolutions.com');
        const errorRedirectUrl = isProduction
          ? `https://worklog.ajkaysolutions.com/?error=linkedin_no_user`
          : `http://localhost:5173/?error=linkedin_no_user`;
        return res.redirect(errorRedirectUrl);
      }
      
      // Generate JWT token instead of using sessions
      const token = generateToken(user);
      console.log('✅ LinkedIn authentication successful for user:', user.displayName);
      console.log('🔑 JWT token generated');
      
      // Detect production environment more reliably
      const isProduction = process.env.NODE_ENV === 'production' || req.get('host').includes('worklog.ajkaysolutions.com');
      const redirectUrl = isProduction
        ? `https://worklog.ajkaysolutions.com/journal?token=${token}`
        : `http://localhost:5173/journal?token=${token}&auth=success`;
      
      console.log('🔗 Redirecting to:', redirectUrl);
      return res.redirect(redirectUrl);
    })(req, res, next);
  }
);

// Google OAuth routes  
router.get('/google', (req, res, next) => {
  console.log('🔗 Google OAuth initiated from:', req.get('host'));
  
  // Check if fresh login is requested
  const authOptions = { 
    scope: ['profile', 'email']
  };
  
  if (req.query.prompt === 'consent') {
    console.log('🔄 Forcing fresh Google login');
    authOptions.prompt = 'consent';
    authOptions.accessType = 'offline';
  }
  
  passport.authenticate('google', authOptions)(req, res, next);
});

// Google OAuth callback
router.get('/google/callback', 
  (req, res, next) => {
    console.log('🔄 Google callback received:', {
      query: req.query,
      session: req.session
    });
    
    passport.authenticate('google', (err, user, info) => {
      if (err) {
        console.error('❌ Google authentication error:', err);
        // Detect production environment and redirect to frontend
        const isProduction = process.env.NODE_ENV === 'production' || req.get('host').includes('worklog.ajkaysolutions.com');
        const errorRedirectUrl = isProduction
          ? `https://worklog.ajkaysolutions.com/?error=google_auth_error`
          : `http://localhost:5173/?error=google_auth_error`;
        return res.redirect(errorRedirectUrl);
      }
      
      if (!user) {
        console.error('❌ Google authentication failed - no user returned:', info);
        // Detect production environment and redirect to frontend
        const isProduction = process.env.NODE_ENV === 'production' || req.get('host').includes('worklog.ajkaysolutions.com');
        const errorRedirectUrl = isProduction
          ? `https://worklog.ajkaysolutions.com/?error=google_no_user`
          : `http://localhost:5173/?error=google_no_user`;
        return res.redirect(errorRedirectUrl);
      }
      
      // Generate JWT token instead of using sessions
      const token = generateToken(user);
      console.log('✅ Google authentication successful for user:', user.displayName);
      console.log('🔑 JWT token generated');
      
      // Detect production environment more reliably
      const isProduction = process.env.NODE_ENV === 'production' || req.get('host').includes('worklog.ajkaysolutions.com');
      const redirectUrl = isProduction
        ? `https://worklog.ajkaysolutions.com/journal?token=${token}`
        : `http://localhost:5173/journal?token=${token}&auth=success`;
      
      console.log('🔗 Redirecting to:', redirectUrl);
      return res.redirect(redirectUrl);
    })(req, res, next);
  }
);

// Get current user information
router.get('/user', (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    res.json({
      success: true,
      authenticated: true,
      user: {
        id: req.user.id,
        provider: req.user.provider,
        displayName: req.user.displayName,
        name: req.user.name,
        email: req.user.email,
        profilePhoto: req.user.profilePhoto
      }
    });
  } else {
    res.json({
      success: true,
      authenticated: false,
      user: null
    });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error during logout' 
      });
    }
    
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: 'Error destroying session' 
        });
      }
      
      res.json({ 
        success: true, 
        message: 'Logged out successfully' 
      });
    });
  });
});

// Check authentication status (JWT-based)
router.get('/status', (req, res) => {
  const authHeader = req.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  
  console.log('🔍 JWT Auth status check:', {
    hasAuthHeader: !!authHeader,
    hasToken: !!token,
    userAgent: req.get('User-Agent')?.substring(0, 50)
  });
  
  if (!token) {
    return res.json({
      success: true,
      authenticated: false,
      user: null
    });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ JWT token verified for user:', decoded.displayName);
    
    res.json({
      success: true,
      authenticated: true,
      user: decoded
    });
  } catch (error) {
    console.error('❌ JWT verification failed:', error.message);
    res.json({
      success: true,
      authenticated: false,
      user: null
    });
  }
});

module.exports = router;