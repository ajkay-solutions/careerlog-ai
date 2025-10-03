const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const session = require('express-session');
const path = require('path');
// Load .env file only in development (Render provides env vars directly)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const { passport, initializePassport } = require('./config/passport');
const connectionWarmer = require('./services/connectionWarmer');
const authRoutes = require('./routes/auth');
const entriesRoutes = require('./routes/entries');
const aiRoutes = require('./routes/ai');
const insightsRoutes = require('./routes/insights');
const projectsRoutes = require('./routes/projects');
const healthRoutes = require('./routes/health');
const performanceRoutes = require('./routes/performance');
const quickTestRoutes = require('./routes/quick-test');
const exportRoutes = require('./routes/export');
const generateRoutes = require('./routes/generate');

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
    let allowedOrigins;
    
    if (process.env.NODE_ENV === 'production') {
      // Use environment variable for production origins, fallback to default
      allowedOrigins = process.env.ALLOWED_ORIGINS 
        ? process.env.ALLOWED_ORIGINS.split(',').map(url => url.trim())
        : ['https://worklog.ajkaysolutions.com'];
    } else {
      allowedOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3004'];
    }
    
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

// Connection warmup middleware (for cold start optimization)
app.use(connectionWarmer.middleware());

// Routes
app.use('/auth', authRoutes);
app.use('/api/entries', entriesRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/quick-test', quickTestRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/generate', generateRoutes);

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
        health: '/api/ai/health'
      },
      insights: {
        dashboard: '/api/insights/dashboard',
        summary: '/api/insights/summary',
        trends: '/api/insights/trends'
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

app.listen(PORT, async () => {
  console.log(`🚀 WorkLog AI Backend running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Accepting requests from: ${corsOptions.origin}`);
  
  // Start connection warmup immediately after server start
  console.log('🔥 Starting connection warmup on server startup...');
  try {
    await connectionWarmer.warmupConnections();
    console.log('✅ Server startup warmup completed - ready for fast responses');
  } catch (error) {
    console.warn('⚠️ Server startup warmup failed:', error.message);
  }
});