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

    // Test Prisma Operations
    const operationsTest = await dbService.executeOperation(async (prismaClient) => {
      console.log('🔍 Testing basic Prisma operations...');
      
      // Test User operations
      const userCount = await prismaClient.user.count();
      console.log(`✅ User count query: ${userCount}`);

      // Test Entry operations  
      const entryCount = await prismaClient.entry.count();
      console.log(`✅ Entry count query: ${entryCount}`);

      // Test Project operations
      const projectCount = await prismaClient.project.count();
      console.log(`✅ Project count query: ${projectCount}`);

      // Test Skill operations
      const skillCount = await prismaClient.skill.count();
      console.log(`✅ Skill count query: ${skillCount}`);

      // Test Competency operations
      const competencyCount = await prismaClient.competency.count();
      console.log(`✅ Competency count query: ${competencyCount}`);

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