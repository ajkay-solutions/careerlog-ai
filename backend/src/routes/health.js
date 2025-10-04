const express = require('express');
const dbService = require('../services/database');

const router = express.Router();

// GET /api/health - Comprehensive health check
router.get('/', async (req, res) => {
  const startTime = Date.now();
  const healthReport = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {},
    errors: []
  };

  try {
    // Database Connection Test
    console.log('🔍 Running database health check...');
    
    const dbHealth = await dbService.healthCheck();
    healthReport.services.database = dbHealth;

    // Test Prisma Operations (single connection for all queries)
    const operationsTest = await dbService.executeOperation(async (prismaClient) => {
      console.log('🔍 Testing basic Prisma operations...');
      
      // Execute all count operations in a single transaction/connection
      const [userCount, entryCount, projectCount, skillCount, competencyCount] = await Promise.all([
        prismaClient.user.count(),
        prismaClient.entry.count(),
        prismaClient.project.count(),
        prismaClient.skill.count(),
        prismaClient.competency.count()
      ]);

      console.log(`✅ Count queries completed: Users(${userCount}), Entries(${entryCount}), Projects(${projectCount}), Skills(${skillCount}), Competencies(${competencyCount})`);

      return {
        userCount,
        entryCount,
        projectCount,
        skillCount,
        competencyCount
      };
    });

    healthReport.services.prismaOperations = {
      status: 'healthy',
      counts: operationsTest
    };

    console.log('✅ All database operations completed successfully');

  } catch (error) {
    console.error('❌ Health check failed:', error);
    healthReport.status = 'unhealthy';
    healthReport.services.database = {
      status: 'unhealthy',
      error: error.message
    };
    healthReport.errors.push({
      service: 'database',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }

  // Performance metrics
  const duration = Date.now() - startTime;
  healthReport.performance = {
    healthCheckDuration: `${duration}ms`,
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime()
  };

  const statusCode = healthReport.status === 'healthy' ? 200 : 503;
  
  res.status(statusCode).json(healthReport);
});

// GET /api/health/database - Database-specific health check
router.get('/database', async (req, res) => {
  try {
    const dbHealth = await dbService.healthCheck();
    res.json({
      success: true,
      data: dbHealth
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/health/quick - Quick health check (no database queries)
router.get('/quick', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    server: 'running',
    memory: process.memoryUsage(),
    uptime: process.uptime()
  });
});

// GET /api/health/debug - Comprehensive debug information for production troubleshooting
router.get('/debug', async (req, res) => {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      pid: process.pid
    },
    configuration: {
      port: process.env.PORT,
      databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT_SET',
      directUrl: process.env.DIRECT_URL ? 'SET' : 'NOT_SET',
      redisUrl: process.env.REDIS_URL ? 'SET' : 'NOT_SET',
      anthropicApiKey: process.env.ANTHROPIC_API_KEY ? 'SET' : 'NOT_SET',
      anthropicKeyLength: process.env.ANTHROPIC_API_KEY?.length,
      anthropicKeyPrefix: process.env.ANTHROPIC_API_KEY?.substring(0, 15),
      jwtSecret: process.env.JWT_SECRET ? 'SET' : 'NOT_SET',
      sessionSecret: process.env.SESSION_SECRET ? 'SET' : 'NOT_SET',
      googleClientId: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT_SET',
      googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT_SET',
      linkedinClientId: process.env.LINKEDIN_CLIENT_ID ? 'SET' : 'NOT_SET',
      linkedinClientSecret: process.env.LINKEDIN_CLIENT_SECRET ? 'SET' : 'NOT_SET',
      mailgunApiKey: process.env.MAILGUN_API_KEY ? 'SET' : 'NOT_SET',
      mailgunDomain: process.env.MAILGUN_DOMAIN
    },
    anthropicSdk: {
      version: require('@anthropic-ai/sdk/package.json').version,
      available: true
    }
  };

  // Test Anthropic client initialization
  try {
    const ClaudeService = require('../services/ai/claudeService');
    const claudeService = new ClaudeService();
    
    debugInfo.anthropicClient = {
      initialized: true,
      clientType: typeof claudeService.client,
      defaultModel: claudeService.defaultModel,
      maxTokens: claudeService.maxTokens,
      temperature: claudeService.temperature
    };

    // Test a simple health check call
    const healthCheck = await claudeService.healthCheck();
    debugInfo.anthropicHealth = healthCheck;
    
  } catch (anthropicError) {
    debugInfo.anthropicClient = {
      initialized: false,
      error: anthropicError.message,
      errorType: anthropicError.name
    };
  }

  // Test database connection
  try {
    const dbHealth = await dbService.healthCheck();
    debugInfo.database = dbHealth;
  } catch (dbError) {
    debugInfo.database = {
      status: 'error',
      error: dbError.message
    };
  }

  res.json({
    success: true,
    debugInfo: debugInfo
  });
});

module.exports = router;