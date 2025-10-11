const express = require('express');
const crypto = require('crypto');
const { requireAuth } = require('../middleware/auth');
const { getJobQueue } = require('../services/ai/jobQueue');
const dbService = require('../services/database');
const cachedDbService = require('../services/cachedDatabase');
const optimizedQueries = require('../services/optimizedQueries');
const { dbSemaphore } = require('../services/databaseSemaphore');
const cache = require('../services/cache');

const router = express.Router();

const jobQueue = getJobQueue();

// Helper function to format date for consistency
const formatDate = (dateString) => {
  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);
  return date;
};

// Helper function to count words
const countWords = (text) => {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

// GET /api/entries - Get user's entries with optional date filtering
router.get('/', requireAuth, async (req, res) => {
  try {
    const { date, limit = 50, offset = 0 } = req.query;
    const userId = req.user.id;

    console.log('📚 Fetching entries for user:', { userId, date, limit, offset });

    const whereClause = { userId };
    
    if (date) {
      const targetDate = formatDate(date);
      whereClause.date = targetDate;
    }

    // Use optimized queries with caching for best performance
    // Add timeout protection for database queries (increased to 30 seconds for heavy concurrent loads)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database query timeout')), 30000)
    );

    const entriesPromise = dbSemaphore.acquire(async () => {
      console.log('📊 DB Semaphore status:', dbSemaphore.getStatus());
      return await cachedDbService.getCachedUserEntries(userId, date, async () => {
        // Use optimized query that leverages indexes and minimal data transfer
        return await optimizedQueries.getUserEntriesOptimized(userId, {
          date: date ? formatDate(date) : null,
          limit: parseInt(limit),
          offset: parseInt(offset),
          includeText: true,  // Include text for journal display
          includeExtractedData: true  // Include AI data for display
        });
      });
    });

    const entries = await Promise.race([entriesPromise, timeoutPromise]);

    console.log(`✅ Retrieved ${entries.length} entries for user ${userId}`);

    res.json({
      success: true,
      data: entries,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: entries.length
      }
    });
  } catch (error) {
    console.error('Get entries error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch entries'
    });
  }
});

// GET /api/entries/:date - Get specific entry by date
router.get('/:date', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const targetDate = formatDate(req.params.date);
    const bustCache = req.query._t; // Cache-busting timestamp parameter
    
    console.log('🔍 GET ENTRY REQUEST:', {
      userId: userId,
      date: req.params.date,
      targetDate: targetDate.toISOString(),
      bustCache: !!bustCache,
      bustCacheValue: bustCache,
      userAgent: req.headers['user-agent']
    });

    // Add timeout protection for database queries (increased to 30 seconds for heavy concurrent loads)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database query timeout')), 30000)
    );

    let entryPromise;
    
    if (bustCache) {
      console.log('🔍 Cache-busting requested, bypassing cache...');
      // Bypass cache and get fresh data
      entryPromise = dbSemaphore.acquire(async () => {
        console.log('📊 DB Semaphore status:', dbSemaphore.getStatus());
        return await optimizedQueries.getSingleEntryOptimized(userId, targetDate, true);
      });
    } else {
      console.log('🔍 Using cached data if available...');
      // Use optimized single entry query with caching
      entryPromise = dbSemaphore.acquire(async () => {
        console.log('📊 DB Semaphore status:', dbSemaphore.getStatus());
        return await cachedDbService.getCachedUserEntries(userId, req.params.date, async () => {
          const result = await optimizedQueries.getSingleEntryOptimized(userId, targetDate, true);
          return result ? [result] : []; // Wrap in array for consistent caching
        }).then(singleEntry => {
          // Extract single entry from cached array
          return Array.isArray(singleEntry) ? singleEntry[0] : singleEntry;
        });
      });
    }

    const entry = await Promise.race([entryPromise, timeoutPromise]);

    if (!entry) {
      return res.json({
        success: true,
        data: null,
        message: 'No entry found for this date'
      });
    }

    res.json({
      success: true,
      data: entry
    });
  } catch (error) {
    console.error('Get entry by date error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch entry'
    });
  }
});

// POST /api/entries - Create new entry
router.post('/', requireAuth, async (req, res) => {

  try {
    const userId = req.user.id;
    const { date, rawText, isHighlight = false } = req.body;

    if (!date || !rawText) {
      console.log('❌ CREATE ENTRY - Missing required fields:', { date: !!date, rawText: !!rawText });
      return res.status(400).json({
        success: false,
        error: 'Date and rawText are required'
      });
    }

    const entryDate = formatDate(date);
    const wordCount = countWords(rawText);


    // Check if entry already exists for this date
    const existingEntry = await dbService.executeOperation(async (prismaClient) => {
      return await prismaClient.entry.findUnique({
        where: {
          userId_date: {
            userId,
            date: entryDate
          }
        }
      });
    }, `check existing entry for user ${userId}`);


    if (existingEntry) {
      console.log('❌ CREATE ENTRY - Entry already exists for date');
      return res.status(409).json({
        success: false,
        error: 'Entry already exists for this date. Use PUT to update.'
      });
    }

    // Generate a unique ID for the entry
    const entryId = crypto.randomUUID();
    
    // Create entry and invalidate relevant caches
    const entry = await cachedDbService.createAndInvalidateCache('entry', {
      data: {
        id: entryId,  // Provide the ID explicitly
        userId,
        date: entryDate,
        rawText,
        wordCount,
        isHighlight,
        extractedData: null, // Will be populated by AI in Week 3
        projectIds: [],
        skillIds: [],
        competencyIds: []
      }
    }, ['entries', 'counts', 'dashboard']);


    // Trigger AI analysis asynchronously (non-blocking)
    try {
      if (rawText.trim().length > 20) { // Only analyze substantial entries
        await jobQueue.addAnalysisJob(entry.id, { priority: 'normal' });
        console.log(`🤖 Queued AI analysis for new entry ${entry.id}`);
      }
    } catch (aiError) {
      console.warn('Failed to queue AI analysis:', aiError.message);
      // Don't fail the entry creation if AI queuing fails
    }

    res.status(201).json({
      success: true,
      data: entry,
      message: 'Entry created successfully'
    });
  } catch (error) {
    console.error('Create entry error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create entry'
    });
  }
});

// PUT /api/entries/:date - Update existing entry
router.put('/:date', requireAuth, async (req, res) => {

  // Declare variables outside try block so they're accessible in catch
  const { rawText, isHighlight, projectIds, skillIds, competencyIds } = req.body;
  
  try {
    const userId = req.user.id;
    const targetDate = formatDate(req.params.date);


    const updateData = {};
    
    if (rawText !== undefined) {
      updateData.rawText = rawText;
      updateData.wordCount = countWords(rawText);
    }
    
    if (isHighlight !== undefined) updateData.isHighlight = isHighlight;
    if (projectIds !== undefined) updateData.projectIds = projectIds;
    if (skillIds !== undefined) updateData.skillIds = skillIds;
    if (competencyIds !== undefined) updateData.competencyIds = competencyIds;


    // Update entry and invalidate relevant caches
    const entry = await cachedDbService.updateAndInvalidateCache('entry', {
      where: {
        userId_date: {
          userId,
          date: targetDate
        }
      },
      data: updateData
    }, ['entries', 'dashboard']);


    // Trigger AI analysis if rawText was updated
    try {
      if (rawText !== undefined && rawText.trim().length > 20) {
        await jobQueue.addAnalysisJob(entry.id, { priority: 'normal' });
        console.log(`🤖 Queued AI re-analysis for updated entry ${entry.id}`);
      }
    } catch (aiError) {
      console.warn('Failed to queue AI analysis:', aiError.message);
      // Don't fail the entry update if AI queuing fails
    }

    res.json({
      success: true,
      data: entry,
      message: 'Entry updated successfully'
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Entry not found'
      });
    }
    
    console.error('Update entry error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update entry'
    });
  }
});

// DELETE /api/entries/:date - Delete entry
router.delete('/:date', requireAuth, async (req, res) => {
  
  try {
    const userId = req.user.id;
    const targetDate = formatDate(req.params.date);

    // Delete entry using cached database service
    await cachedDbService.delete('entry', {
      where: {
        userId_date: {
          userId,
          date: targetDate
        }
      }
    });

    // Invalidate cache after successful deletion
    await cache.invalidateUserCache(userId, ['entries', 'counts', 'dashboard']);
    console.log(`🗑️ Cache invalidated after deleting entry for ${req.params.date}`);

    res.json({
      success: true,
      message: 'Entry deleted successfully'
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Entry not found'
      });
    }
    
    console.error('Delete entry error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete entry'
    });
  }
});

// PATCH /api/entries/:date/highlight - Toggle highlight status
router.patch('/:date/highlight', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const targetDate = formatDate(req.params.date);

    // Get current entry to toggle highlight
    const currentEntry = await dbService.executeOperation(async (prismaClient) => {
      return await prismaClient.entry.findUnique({
        where: {
          userId_date: {
            userId,
            date: targetDate
          }
        }
      });
    }, `find entry for highlight toggle user ${userId}`);

    if (!currentEntry) {
      return res.status(404).json({
        success: false,
        error: 'Entry not found'
      });
    }

    // Update entry and invalidate relevant caches
    const entry = await cachedDbService.updateAndInvalidateCache('entry', {
      where: {
        userId_date: {
          userId,
          date: targetDate
        }
      },
      data: {
        isHighlight: !currentEntry.isHighlight
      }
    }, ['entries', 'dashboard']);

    res.json({
      success: true,
      data: entry,
      message: `Entry ${entry.isHighlight ? 'highlighted' : 'unhighlighted'} successfully`
    });
  } catch (error) {
    console.error('Toggle highlight error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle highlight'
    });
  }
});

// PATCH /api/entries/:date/pin - Toggle pin status
router.patch('/:date/pin', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const targetDate = formatDate(req.params.date);

    // Get current entry to toggle pin
    const currentEntry = await dbService.executeOperation(async (prismaClient) => {
      return await prismaClient.entry.findUnique({
        where: {
          userId_date: {
            userId,
            date: targetDate
          }
        }
      });
    }, `find entry for pin toggle user ${userId}`);

    if (!currentEntry) {
      return res.status(404).json({
        success: false,
        error: 'Entry not found'
      });
    }

    // Update entry and invalidate relevant caches
    const entry = await cachedDbService.updateAndInvalidateCache('entry', {
      where: {
        userId_date: {
          userId,
          date: targetDate
        }
      },
      data: {
        isPinned: !currentEntry.isPinned
      }
    }, ['entries', 'dashboard']);

    res.json({
      success: true,
      data: entry,
      message: `Entry ${entry.isPinned ? 'pinned' : 'unpinned'} successfully`
    });
  } catch (error) {
    console.error('Toggle pin error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle pin'
    });
  }
});

module.exports = router;