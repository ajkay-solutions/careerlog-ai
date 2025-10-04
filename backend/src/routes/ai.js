const express = require('express');
const { requireAuth } = require('../middleware/auth');
const AnalysisService = require('../services/ai/analysisService');
const { getJobQueue } = require('../services/ai/jobQueue');

const router = express.Router();
const analysisService = new AnalysisService();
const jobQueue = getJobQueue();

// POST /api/ai/analyze/:entryId - Trigger AI analysis for a specific entry
router.post('/analyze/:entryId', requireAuth, async (req, res) => {
  console.log('🔍 AI ANALYZE REQUEST START:', {
    entryId: req.params.entryId,
    userId: req.user?.id,
    sync: req.body.sync,
    timestamp: new Date().toISOString(),
    userAgent: req.headers['user-agent'],
    origin: req.headers.origin
  });

  try {
    const { entryId } = req.params;
    const { sync = false, priority = 'normal' } = req.body;
    const userId = req.user.id;

    console.log('🔍 AI ANALYZE - Environment check:', {
      nodeEnv: process.env.NODE_ENV,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY ? 'SET' : 'NOT_SET',
      anthropicKeyLength: process.env.ANTHROPIC_API_KEY?.length,
      anthropicKeyPrefix: process.env.ANTHROPIC_API_KEY?.substring(0, 15)
    });

    // Verify entry belongs to user
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const entry = await prisma.entry.findFirst({
      where: { id: entryId, userId },
      select: { id: true, rawText: true }
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        error: 'Entry not found'
      });
    }

    if (sync) {
      // Synchronous analysis - user waits for result
      console.log('🔍 AI ANALYZE - Starting synchronous analysis for entry:', entryId);
      const result = await analysisService.analyzeEntry(entryId, { forceRefresh: true });
      
      console.log('🔍 AI ANALYZE - Analysis result:', {
        success: result.success,
        hasData: !!result.data,
        error: result.error,
        errorType: typeof result.error,
        cached: result.cached
      });
      
      res.json({
        success: result.success,
        data: result.data,
        error: result.error,
        usage: result.usage,
        cached: result.cached || false
      });
    } else {
      // Asynchronous analysis - return job ID
      const jobId = await jobQueue.addAnalysisJob(entryId, { priority });
      
      res.json({
        success: true,
        jobId,
        message: 'Analysis job queued successfully'
      });
    }

  } catch (error) {
    console.error('AI analyze endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start analysis'
    });
  }
});

// POST /api/ai/analyze-batch - Analyze multiple entries
router.post('/analyze-batch', requireAuth, async (req, res) => {
  try {
    const { entryIds, batchSize = 5 } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(entryIds) || entryIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'entryIds must be a non-empty array'
      });
    }

    // Verify all entries belong to user
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const userEntries = await prisma.entry.findMany({
      where: { id: { in: entryIds }, userId },
      select: { id: true }
    });

    if (userEntries.length !== entryIds.length) {
      return res.status(403).json({
        success: false,
        error: 'Some entries do not belong to user'
      });
    }

    const jobId = await jobQueue.addBatchAnalysisJob(entryIds, { batchSize });
    
    res.json({
      success: true,
      jobId,
      message: `Batch analysis job queued for ${entryIds.length} entries`
    });

  } catch (error) {
    console.error('AI batch analyze endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start batch analysis'
    });
  }
});

// GET /api/ai/job/:jobId - Get job status
router.get('/job/:jobId', requireAuth, async (req, res) => {
  try {
    const { jobId } = req.params;
    const status = await jobQueue.getJobStatus(jobId);
    
    res.json({
      success: true,
      job: status
    });

  } catch (error) {
    console.error('Job status endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get job status'
    });
  }
});

// GET /api/ai/insights - Generate insights from user's data
router.get('/insights', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { timeframe = 'month' } = req.query;
    
    // Get user's data summary
    const userData = await analysisService.getUserDataSummary(userId, timeframe);
    
    if (userData.entries.length === 0) {
      return res.json({
        success: true,
        data: {
          message: 'No entries with AI analysis found',
          summary: userData.summary
        }
      });
    }

    // Generate insights using Claude
    const insights = await analysisService.claudeService.generateInsights(
      userData.entries.map(entry => ({
        date: entry.date,
        rawText: entry.extractedData?.themes?.join(' ') || 'No data',
        extractedData: entry.extractedData
      })),
      timeframe
    );

    res.json({
      success: insights.success,
      data: insights.data,
      error: insights.error,
      usage: insights.usage,
      metadata: {
        entriesAnalyzed: userData.entries.length,
        timeframe,
        summary: userData.summary
      }
    });

  } catch (error) {
    console.error('Insights endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate insights'
    });
  }
});

// GET /api/ai/summary - Get user's AI-extracted data summary
router.get('/summary', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { timeframe } = req.query;
    
    const summary = await analysisService.getUserDataSummary(userId, timeframe);
    
    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('AI summary endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get AI summary'
    });
  }
});

// GET /api/ai/queue/stats - Get queue statistics (admin/debug)
router.get('/queue/stats', requireAuth, async (req, res) => {
  try {
    const stats = jobQueue.getQueueStats();
    
    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Queue stats endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get queue stats'
    });
  }
});

// POST /api/ai/queue/clear - Clear completed jobs from queue
router.post('/queue/clear', requireAuth, async (req, res) => {
  try {
    const cleared = jobQueue.clearCompleted();
    
    res.json({
      success: true,
      message: `Cleared ${cleared} completed jobs`,
      cleared
    });

  } catch (error) {
    console.error('Queue clear endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear queue'
    });
  }
});

// GET /api/ai/health - Health check for AI services
router.get('/health', requireAuth, async (req, res) => {
  try {
    const health = await analysisService.healthCheck();
    const queueStats = jobQueue.getQueueStats();
    
    res.json({
      success: true,
      health: {
        ...health,
        queue: queueStats
      }
    });

  } catch (error) {
    console.error('AI health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
});

module.exports = router;