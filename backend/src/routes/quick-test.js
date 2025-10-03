const express = require('express');
const dbService = require('../services/database');
const cachedDbService = require('../services/cachedDatabase');

const router = express.Router();

// GET /api/quick-test/operations - Fast performance test for critical operations
router.get('/operations', async (req, res) => {
  const results = [];
  const startTime = process.hrtime.bigint();

  try {
    // Test 1: Simple count queries with caching (most common operations)
    const tests = [
      { name: 'User Count (Cached)', query: () => cachedDbService.getCachedCount('user') },
      { name: 'Entry Count (Cached)', query: () => cachedDbService.getCachedCount('entry') },
      { name: 'Project Count (Cached)', query: () => cachedDbService.getCachedCount('project') }
    ];

    for (const test of tests) {
      const testStart = process.hrtime.bigint();
      try {
        const result = await test.query();
        const duration = Number(process.hrtime.bigint() - testStart) / 1000000; // Convert to ms
        results.push({
          test: test.name,
          duration: Math.round(duration * 100) / 100,
          status: 'success',
          result: result
        });
      } catch (error) {
        const duration = Number(process.hrtime.bigint() - testStart) / 1000000;
        results.push({
          test: test.name,
          duration: Math.round(duration * 100) / 100,
          status: 'error',
          error: error.message
        });
      }
    }

    const totalDuration = Number(process.hrtime.bigint() - startTime) / 1000000;
    const avgDuration = results.length > 0 ? 
      results.reduce((sum, r) => sum + r.duration, 0) / results.length : 0;

    res.json({
      success: true,
      summary: {
        totalTests: results.length,
        totalDuration: Math.round(totalDuration * 100) / 100,
        averageDuration: Math.round(avgDuration * 100) / 100,
        recommendation: avgDuration < 10 ? 'EXCELLENT' : avgDuration < 50 ? 'GOOD' : avgDuration < 100 ? 'ACCEPTABLE' : 'NEEDS_OPTIMIZATION',
        cacheStatus: 'enabled'
      },
      results
    });

  } catch (error) {
    const totalDuration = Number(process.hrtime.bigint() - startTime) / 1000000;
    res.status(500).json({
      success: false,
      error: error.message,
      duration: Math.round(totalDuration * 100) / 100,
      results
    });
  }
});

// GET /api/quick-test/real-user/:userId - Test actual user operations
router.get('/real-user/:userId', async (req, res) => {
  const { userId } = req.params;
  const results = [];
  const startTime = process.hrtime.bigint();

  try {
    // Critical user operations with caching
    const userTests = [
      {
        name: 'Load Today Entry (Cached)',
        query: async () => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return await dbService.executeOperation(
            (prisma) => prisma.entry.findUnique({
              where: { userId_date: { userId, date: today } },
              select: { id: true, rawText: true, wordCount: true }
            }),
            'Load Today Entry'
          );
        }
      },
      {
        name: 'Load Recent Entries (Cached)',
        query: async () => {
          return await cachedDbService.getCachedUserData(
            'entry',
            {
              where: { userId },
              select: { date: true, id: true, wordCount: true },
              orderBy: { date: 'desc' },
              take: 10
            },
            'recent_entries'
          );
        }
      },
      {
        name: 'Count User Entries (Cached)',
        query: async () => {
          return await cachedDbService.getCachedCount('entry', { userId });
        }
      }
    ];

    for (const test of userTests) {
      const testStart = process.hrtime.bigint();
      try {
        const result = await test.query();
        const duration = Number(process.hrtime.bigint() - testStart) / 1000000;
        results.push({
          test: test.name,
          duration: Math.round(duration * 100) / 100,
          status: 'success',
          resultCount: Array.isArray(result) ? result.length : (result ? 1 : 0)
        });
      } catch (error) {
        const duration = Number(process.hrtime.bigint() - testStart) / 1000000;
        results.push({
          test: test.name,
          duration: Math.round(duration * 100) / 100,
          status: 'error',
          error: error.message
        });
      }
    }

    const totalDuration = Number(process.hrtime.bigint() - startTime) / 1000000;
    const avgDuration = results.length > 0 ? 
      results.reduce((sum, r) => sum + r.duration, 0) / results.length : 0;

    // UX Analysis
    const entryLoadTime = results.find(r => r.test === 'Load Today Entry')?.duration || 0;
    const recentEntriesTime = results.find(r => r.test === 'Load Recent Entries')?.duration || 0;

    res.json({
      success: true,
      userId,
      summary: {
        totalTests: results.length,
        totalDuration: Math.round(totalDuration * 100) / 100,
        averageDuration: Math.round(avgDuration * 100) / 100,
        uxRating: {
          overall: avgDuration < 10 ? 'EXCELLENT' : avgDuration < 50 ? 'GOOD' : avgDuration < 100 ? 'ACCEPTABLE' : 'POOR',
          entryLoading: entryLoadTime < 10 ? 'EXCELLENT' : entryLoadTime < 50 ? 'GOOD' : entryLoadTime < 100 ? 'ACCEPTABLE' : 'POOR',
          listLoading: recentEntriesTime < 10 ? 'EXCELLENT' : recentEntriesTime < 50 ? 'GOOD' : recentEntriesTime < 100 ? 'ACCEPTABLE' : 'POOR'
        },
        cacheStatus: 'enabled'
      },
      results
    });

  } catch (error) {
    const totalDuration = Number(process.hrtime.bigint() - startTime) / 1000000;
    res.status(500).json({
      success: false,
      error: error.message,
      duration: Math.round(totalDuration * 100) / 100,
      results
    });
  }
});

module.exports = router;