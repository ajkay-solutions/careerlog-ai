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

module.exports = router;