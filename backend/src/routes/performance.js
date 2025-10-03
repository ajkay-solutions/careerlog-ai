const express = require('express');
const dbService = require('../services/database');

const router = express.Router();

// Performance test utilities
function measureTime(label) {
  const start = process.hrtime.bigint();
  return () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds
    return { label, duration: Math.round(duration * 100) / 100 };
  };
}

// GET /api/performance/database - Comprehensive database performance test
router.get('/database', async (req, res) => {
  const testResults = {
    timestamp: new Date().toISOString(),
    totalDuration: 0,
    tests: [],
    summary: {},
    recommendations: []
  };

  const overallTimer = measureTime('Total Test Suite');

  try {
    console.log('🚀 Starting comprehensive database performance tests...');

    // Test 1: Basic Connection Speed
    const connectionTimer = measureTime('Database Connection');
    await dbService.connect();
    testResults.tests.push(connectionTimer());

    // Test 2: Simple SELECT operations
    const selectTests = [
      {
        name: 'User Count',
        operation: (prisma) => prisma.user.count()
      },
      {
        name: 'Entry Count',
        operation: (prisma) => prisma.entry.count()
      },
      {
        name: 'Project Count', 
        operation: (prisma) => prisma.project.count()
      },
      {
        name: 'Skill Count',
        operation: (prisma) => prisma.skill.count()
      },
      {
        name: 'Competency Count',
        operation: (prisma) => prisma.competency.count()
      }
    ];

    for (const test of selectTests) {
      const timer = measureTime(`SELECT: ${test.name}`);
      try {
        await dbService.executeOperation(test.operation, test.name);
        testResults.tests.push(timer());
      } catch (error) {
        const result = timer();
        result.error = error.message;
        testResults.tests.push(result);
      }
    }

    // Test 3: Complex SELECT with userId (realistic user queries)
    const userId = 'test-user-id'; // We'll use actual user ID if available
    
    const realUserTests = [
      {
        name: 'User Entries with Date Range',
        operation: (prisma) => prisma.entry.findMany({
          where: { 
            userId,
            date: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          },
          select: { id: true, date: true, wordCount: true },
          orderBy: { date: 'desc' },
          take: 10
        })
      },
      {
        name: 'User Projects',
        operation: (prisma) => prisma.project.findMany({
          where: { userId },
          orderBy: { entryCount: 'desc' },
          take: 10
        })
      },
      {
        name: 'User Skills',
        operation: (prisma) => prisma.skill.findMany({
          where: { userId },
          orderBy: { usageCount: 'desc' },
          take: 20
        })
      },
      {
        name: 'User Competencies',
        operation: (prisma) => prisma.competency.findMany({
          where: { userId },
          orderBy: { demonstrationCount: 'desc' },
          take: 15
        })
      }
    ];

    for (const test of realUserTests) {
      const timer = measureTime(`COMPLEX SELECT: ${test.name}`);
      try {
        await dbService.executeOperation(test.operation, test.name);
        testResults.tests.push(timer());
      } catch (error) {
        const result = timer();
        result.error = error.message;
        testResults.tests.push(result);
      }
    }

    // Test 4: INSERT Performance (simulated)
    const insertTimer = measureTime('INSERT: Test Entry');
    try {
      const testEntry = {
        userId: 'perf-test-user',
        date: new Date(),
        rawText: 'Performance test entry - this is a sample journal entry for testing database insert performance.',
        wordCount: 15
      };
      
      await dbService.executeOperation(
        (prisma) => prisma.entry.upsert({
          where: { 
            userId_date: { 
              userId: testEntry.userId, 
              date: testEntry.date 
            }
          },
          update: testEntry,
          create: testEntry
        }),
        'Insert Test Entry'
      );
      testResults.tests.push(insertTimer());
    } catch (error) {
      const result = insertTimer();
      result.error = error.message;
      testResults.tests.push(result);
    }

    // Test 5: UPDATE Performance
    const updateTimer = measureTime('UPDATE: Test Entry');
    try {
      await dbService.executeOperation(
        (prisma) => prisma.entry.updateMany({
          where: { userId: 'perf-test-user' },
          data: { 
            wordCount: 16,
            updatedAt: new Date()
          }
        }),
        'Update Test Entry'
      );
      testResults.tests.push(updateTimer());
    } catch (error) {
      const result = updateTimer();
      result.error = error.message;
      testResults.tests.push(result);
    }

    // Test 6: Concurrent Operations Simulation
    const concurrentTimer = measureTime('CONCURRENT: Multiple Operations');
    try {
      const promises = [
        dbService.executeOperation((prisma) => prisma.user.count(), 'Concurrent User Count'),
        dbService.executeOperation((prisma) => prisma.entry.count(), 'Concurrent Entry Count'),
        dbService.executeOperation((prisma) => prisma.project.count(), 'Concurrent Project Count'),
        dbService.executeOperation((prisma) => prisma.skill.count(), 'Concurrent Skill Count'),
        dbService.executeOperation((prisma) => prisma.competency.count(), 'Concurrent Competency Count')
      ];
      
      await Promise.all(promises);
      testResults.tests.push(concurrentTimer());
    } catch (error) {
      const result = concurrentTimer();
      result.error = error.message;
      testResults.tests.push(result);
    }

    // Test 7: Large Data Query (simulate insights dashboard)
    const dashboardTimer = measureTime('DASHBOARD: Full Insights Load');
    try {
      await dbService.executeOperation(async (prisma) => {
        const [projects, skills, competencies, entries] = await Promise.all([
          prisma.project.findMany({
            where: { userId },
            orderBy: { entryCount: 'desc' },
            take: 10
          }),
          prisma.skill.findMany({
            where: { userId },
            orderBy: { usageCount: 'desc' },
            take: 20
          }),
          prisma.competency.findMany({
            where: { userId },
            orderBy: { demonstrationCount: 'desc' },
            take: 15
          }),
          prisma.entry.findMany({
            where: { userId },
            select: {
              id: true,
              date: true,
              extractedData: true,
              sentiment: true,
              wordCount: true
            },
            orderBy: { date: 'desc' },
            take: 10
          })
        ]);
        
        return { projects, skills, competencies, entries };
      }, 'Dashboard Data Load');
      testResults.tests.push(dashboardTimer());
    } catch (error) {
      const result = dashboardTimer();
      result.error = error.message;
      testResults.tests.push(result);
    }

    // Calculate summary statistics
    const validTests = testResults.tests.filter(t => !t.error);
    const errorTests = testResults.tests.filter(t => t.error);
    
    testResults.summary = {
      totalTests: testResults.tests.length,
      successfulTests: validTests.length,
      failedTests: errorTests.length,
      averageDuration: validTests.length > 0 ? 
        Math.round((validTests.reduce((sum, t) => sum + t.duration, 0) / validTests.length) * 100) / 100 : 0,
      slowestOperation: validTests.length > 0 ? 
        validTests.reduce((max, t) => t.duration > max.duration ? t : max) : null,
      fastestOperation: validTests.length > 0 ? 
        validTests.reduce((min, t) => t.duration < min.duration ? t : min) : null
    };

    // Generate performance recommendations
    testResults.recommendations = [];
    
    if (testResults.summary.averageDuration > 100) {
      testResults.recommendations.push('CRITICAL: Average query time > 100ms - investigate database connection pooling');
    }
    
    if (testResults.summary.slowestOperation?.duration > 500) {
      testResults.recommendations.push(`CRITICAL: Slowest operation (${testResults.summary.slowestOperation.label}) takes ${testResults.summary.slowestOperation.duration}ms - needs optimization`);
    }
    
    const dashboardTest = testResults.tests.find(t => t.label.includes('DASHBOARD'));
    if (dashboardTest && dashboardTest.duration > 1000) {
      testResults.recommendations.push('URGENT: Dashboard load time > 1 second - implement caching and query optimization');
    }
    
    if (errorTests.length > 0) {
      testResults.recommendations.push(`ERROR: ${errorTests.length} operations failed - investigate connection stability`);
    }

    // Connection pool recommendations
    if (testResults.tests.some(t => t.label.includes('CONCURRENT') && t.duration > 200)) {
      testResults.recommendations.push('Consider increasing database connection pool size for better concurrent performance');
    }

    testResults.totalDuration = overallTimer().duration;

    console.log(`✅ Performance tests completed in ${testResults.totalDuration}ms`);
    console.log(`📊 Results: ${testResults.summary.successfulTests}/${testResults.summary.totalTests} successful, avg: ${testResults.summary.averageDuration}ms`);

    res.json({
      success: true,
      data: testResults
    });

  } catch (error) {
    testResults.totalDuration = overallTimer().duration;
    testResults.error = error.message;
    
    console.error('❌ Performance testing failed:', error);
    res.status(500).json({
      success: false,
      error: 'Performance testing failed',
      data: testResults
    });
  }
});

// GET /api/performance/real-user - Test with actual user data
router.get('/real-user/:userId', async (req, res) => {
  const { userId } = req.params;
  const testResults = {
    userId,
    timestamp: new Date().toISOString(),
    tests: []
  };

  try {
    console.log(`🎯 Running real user performance tests for: ${userId}`);

    // Test real user queries that matter for UX
    const userTests = [
      {
        name: 'Load Today Entry',
        operation: (prisma) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return prisma.entry.findUnique({
            where: {
              userId_date: { userId, date: today }
            }
          });
        }
      },
      {
        name: 'Load Recent Entries (Sidebar)',
        operation: (prisma) => prisma.entry.findMany({
          where: { userId },
          select: { date: true, id: true, wordCount: true },
          orderBy: { date: 'desc' },
          take: 30
        })
      },
      {
        name: 'Save Entry Update',
        operation: (prisma) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return prisma.entry.upsert({
            where: {
              userId_date: { userId, date: today }
            },
            update: {
              rawText: 'Updated test entry for performance testing',
              wordCount: 8,
              updatedAt: new Date()
            },
            create: {
              userId,
              date: today,
              rawText: 'New test entry for performance testing',
              wordCount: 8
            }
          });
        }
      },
      {
        name: 'Load Dashboard Data',
        operation: (prisma) => Promise.all([
          prisma.project.findMany({
            where: { userId },
            orderBy: { entryCount: 'desc' },
            take: 10
          }),
          prisma.skill.findMany({
            where: { userId },
            orderBy: { usageCount: 'desc' },
            take: 20
          }),
          prisma.entry.count({ where: { userId } })
        ])
      }
    ];

    for (const test of userTests) {
      const timer = measureTime(test.name);
      try {
        await dbService.executeOperation(test.operation, test.name);
        testResults.tests.push(timer());
      } catch (error) {
        const result = timer();
        result.error = error.message;
        testResults.tests.push(result);
      }
    }

    // Calculate UX impact
    const entryLoadTime = testResults.tests.find(t => t.label === 'Load Today Entry')?.duration || 0;
    const entrySaveTime = testResults.tests.find(t => t.label === 'Save Entry Update')?.duration || 0;
    const dashboardLoadTime = testResults.tests.find(t => t.label === 'Load Dashboard Data')?.duration || 0;

    testResults.uxAnalysis = {
      entryLoadTime,
      entrySaveTime,
      dashboardLoadTime,
      userExperience: {
        entryLoading: entryLoadTime < 200 ? 'EXCELLENT' : entryLoadTime < 500 ? 'GOOD' : 'POOR',
        entrySaving: entrySaveTime < 300 ? 'EXCELLENT' : entrySaveTime < 600 ? 'GOOD' : 'POOR',
        dashboardLoading: dashboardLoadTime < 800 ? 'EXCELLENT' : dashboardLoadTime < 1500 ? 'GOOD' : 'POOR'
      }
    };

    res.json({
      success: true,
      data: testResults
    });

  } catch (error) {
    console.error('❌ Real user performance testing failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      data: testResults
    });
  }
});

module.exports = router;