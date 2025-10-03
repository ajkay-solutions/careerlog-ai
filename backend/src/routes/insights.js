const express = require('express');
const { requireAuth } = require('../middleware/auth');
const dbService = require('../services/database');
const cachedDbService = require('../services/cachedDatabase');
const optimizedQueries = require('../services/optimizedQueries');

const router = express.Router();

// Parse timeframe into date range
function parseTimeframe(timeframe) {
  const now = new Date();
  let startDate, endDate = now;

  switch (timeframe) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(0); // Beginning of time for 'all'
  }

  return { startDate, endDate };
}

// GET /api/insights/dashboard - Get dashboard summary data
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const timeframe = req.query.timeframe || 'all';
    const { startDate, endDate } = parseTimeframe(timeframe);

    console.log(`📊 Loading insights dashboard for user ${userId}, timeframe: ${timeframe}`);

    // Build where clause for timeframe filtering
    const whereClause = { userId };
    if (timeframe !== 'all') {
      whereClause.createdAt = {
        gte: startDate,
        lte: endDate
      };
    }

    // Get all data using optimized queries with caching for best performance
    const dashboardData = await cachedDbService.getCachedDashboardData(userId, timeframe, async () => {
      console.log(`📊 Executing optimized dashboard queries for timeframe: ${timeframe}`);
      
      // Use optimized dashboard query that leverages indexes and parallel execution
      const baseData = await optimizedQueries.getDashboardDataOptimized(userId, {
        startDate: timeframe !== 'all' ? startDate : null,
        endDate: timeframe !== 'all' ? endDate : null
      });
      
      // Get optimized streak calculation data
      const allEntries = await optimizedQueries.getEntriesForStreakOptimized(userId, 30);
      
      // Calculate consecutive days streak with optimized logic
      let currentStreak = 0;
      if (allEntries.length > 0) {
        const sortedDates = allEntries
          .map(entry => entry.date.toISOString().split('T')[0])
          .sort((a, b) => b.localeCompare(a)); // Descending order

        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        // Start from today or yesterday
        let checkDate = sortedDates[0] === today ? today : 
                       sortedDates[0] === yesterday ? yesterday : null;
        
        if (checkDate) {
          for (let i = 0; i < sortedDates.length; i++) {
            if (sortedDates[i] === checkDate) {
              currentStreak++;
              // Move to previous day
              const prevDate = new Date(checkDate);
              prevDate.setDate(prevDate.getDate() - 1);
              checkDate = prevDate.toISOString().split('T')[0];
            } else {
              break;
            }
          }
        }
      }
      
      return {
        projects: baseData.projects,
        skills: baseData.skills,
        competencies: baseData.competencies,
        entries: baseData.entries,
        summary: {
          ...baseData.summary,
          currentStreak,
          timeframe
        }
      };
    });

    console.log(`✅ Dashboard data loaded: ${dashboardData.summary.totalEntries} entries, ${dashboardData.summary.totalProjects} projects`);

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('❌ Dashboard loading failed:', {
      message: error.message,
      stack: error.stack,
      userId: req.user.id,
      timeframe: req.query.timeframe || 'all'
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to load dashboard data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/insights/summary - Get quick summary stats
router.get('/summary', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const summary = await dbService.executeOperation(async (prismaClient) => {
      const [entryCount, projectCount, skillCount, competencyCount, recentEntries] = await Promise.all([
        prismaClient.entry.count({ where: { userId } }),
        prismaClient.project.count({ where: { userId } }),
        prismaClient.skill.count({ where: { userId } }),
        prismaClient.competency.count({ where: { userId } }),
        prismaClient.entry.findMany({
          where: { userId },
          select: { date: true, wordCount: true },
          orderBy: { date: 'desc' },
          take: 30
        })
      ]);

      // Calculate streak (consecutive days with entries)
      let currentStreak = 0;
      const sortedDates = recentEntries
        .map(entry => entry.date.toISOString().split('T')[0])
        .sort((a, b) => b.localeCompare(a)); // Descending order

      if (sortedDates.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        // Start from today or yesterday
        let checkDate = sortedDates[0] === today ? today : 
                       sortedDates[0] === yesterday ? yesterday : null;
        
        if (checkDate) {
          for (let i = 0; i < sortedDates.length; i++) {
            if (sortedDates[i] === checkDate) {
              currentStreak++;
              // Move to previous day
              const prevDate = new Date(checkDate);
              prevDate.setDate(prevDate.getDate() - 1);
              checkDate = prevDate.toISOString().split('T')[0];
            } else {
              break;
            }
          }
        }
      }

      // Calculate total word count
      const totalWords = recentEntries.reduce((sum, entry) => sum + (entry.wordCount || 0), 0);

      return {
        totalEntries: entryCount,
        totalProjects: projectCount,
        totalSkills: skillCount,
        totalCompetencies: competencyCount,
        currentStreak,
        totalWords,
        avgWordsPerEntry: entryCount > 0 ? Math.round(totalWords / entryCount) : 0
      };
    });

    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('❌ Summary loading failed:', {
      message: error.message,
      stack: error.stack,
      userId: req.user.id
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to load summary data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/insights/trends - Get trend data for charts
router.get('/trends', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const days = parseInt(req.query.days) || 30;
    
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const trends = await dbService.executeOperation(async (prismaClient) => {
      // Get entries for the date range
      const entries = await prismaClient.entry.findMany({
        where: {
          userId,
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          date: true,
          wordCount: true,
          sentiment: true,
          extractedData: true
        },
        orderBy: { date: 'asc' }
      });

      // Group by date and calculate metrics
      const dailyStats = {};
      entries.forEach(entry => {
        const dateKey = entry.date.toISOString().split('T')[0];
        if (!dailyStats[dateKey]) {
          dailyStats[dateKey] = {
            date: dateKey,
            entryCount: 0,
            totalWords: 0,
            sentiments: { positive: 0, neutral: 0, negative: 0 },
            projects: new Set(),
            skills: new Set()
          };
        }

        const stats = dailyStats[dateKey];
        stats.entryCount++;
        stats.totalWords += entry.wordCount || 0;
        
        if (entry.sentiment) {
          stats.sentiments[entry.sentiment]++;
        }

        // Count unique projects and skills
        if (entry.extractedData) {
          entry.extractedData.projects?.forEach(p => stats.projects.add(p.name));
          entry.extractedData.skills?.forEach(s => stats.skills.add(s.name));
        }
      });

      // Convert to array and fill missing dates
      const dailyTrends = [];
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateKey = d.toISOString().split('T')[0];
        const stats = dailyStats[dateKey] || {
          date: dateKey,
          entryCount: 0,
          totalWords: 0,
          sentiments: { positive: 0, neutral: 0, negative: 0 },
          projects: new Set(),
          skills: new Set()
        };

        dailyTrends.push({
          date: dateKey,
          entryCount: stats.entryCount,
          totalWords: stats.totalWords,
          avgWords: stats.entryCount > 0 ? Math.round(stats.totalWords / stats.entryCount) : 0,
          sentiments: stats.sentiments,
          uniqueProjects: stats.projects.size,
          uniqueSkills: stats.skills.size
        });
      }

      return { dailyTrends };
    });

    res.json({
      success: true,
      data: trends
    });

  } catch (error) {
    console.error('❌ Trends loading failed:', {
      message: error.message,
      stack: error.stack,
      userId: req.user.id
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to load trend data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;