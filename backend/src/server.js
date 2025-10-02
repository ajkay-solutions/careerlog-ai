const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const { passport, initializePassport } = require('./config/passport');
const authRoutes = require('./routes/auth');
const entriesRoutes = require('./routes/entries');
const aiRoutes = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 3004;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:", "http:"],
      fontSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.NODE_ENV === 'production' 
      ? ['https://worklog.ajkaysolutions.com'] 
      : ['http://localhost:5173', 'http://localhost:3004'];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`❌ CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with', 'Origin', 'Accept'],
  optionsSuccessStatus: 200 // For legacy browser support
};

app.use(cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'worklog-ai-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Initialize OAuth strategies
const enabledStrategies = initializePassport();
console.log('🔐 OAuth strategies enabled:', enabledStrategies);

// Routes
app.use('/auth', authRoutes);
app.use('/api/entries', entriesRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'WorkLog AI Backend',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'WorkLog AI Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: {
        google: '/auth/google',
        linkedin: '/auth/linkedin',
        status: '/auth/status',
        logout: '/auth/logout'
      },
      entries: {
        list: '/api/entries',
        byDate: '/api/entries/:date',
        create: 'POST /api/entries',
        update: 'PUT /api/entries/:date',
        delete: 'DELETE /api/entries/:date',
        highlight: 'PATCH /api/entries/:date/highlight'
      },
      ai: {
        analyze: 'POST /api/ai/analyze/:entryId',
        batchAnalyze: 'POST /api/ai/analyze-batch',
        jobStatus: '/api/ai/job/:jobId',
        insights: '/api/ai/insights',
        summary: '/api/ai/summary',
        health: '/api/ai/health'
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('🚨 Server error:', err);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 WorkLog AI Backend running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Accepting requests from: ${corsOptions.origin}`);
});