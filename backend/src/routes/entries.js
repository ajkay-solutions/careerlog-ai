/*
 * PRODUCTION DEBUGGING: Issues #6 & #7
 * 
 * This file contains targeted debugging logs prefixed with [ISSUE-6-DEBUG] and [ISSUE-7-DEBUG]
 * to help diagnose auto-save failures and OAuth authentication issues.
 * 
 * Issue #6: Auto-save error and left sidebar not refreshing
 * Issue #7: LinkedIn OAuth login failure
 * 
 * These logs can be removed after issues are resolved.
 */

const express = require('express');
const crypto = require('crypto');
const { requireAuth } = require('../middleware/auth');
const { getJobQueue } = require('../services/ai/jobQueue');
const dbService = require('../services/database');
const cachedDbService = require('../services/cachedDatabase');
const optimizedQueries = require('../services/optimizedQueries');
const { dbSemaphore } = require('../services/databaseSemaphore');

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
  console.log('🔍 [ISSUE-6-DEBUG] CREATE ENTRY REQUEST:', {
    userId: req.user?.id,
    userProvider: req.user?.provider,
    userEmail: req.user?.email,
    date: req.body.date,
    rawTextLength: req.body.rawText?.length,
    isHighlight: req.body.isHighlight,
    timestamp: new Date().toISOString(),
    userAgent: req.headers['user-agent']?.substring(0, 50),
    contentType: req.headers['content-type']
  });

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

    console.log('🔍 CREATE ENTRY - Processed data:', {
      entryDate: entryDate.toISOString(),
      wordCount,
      rawTextSnippet: rawText.substring(0, 50) + '...'
    });

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

    console.log('🔍 CREATE ENTRY - Existing entry check:', {
      hasExistingEntry: !!existingEntry,
      existingEntryId: existingEntry?.id
    });

    if (existingEntry) {
      console.log('❌ CREATE ENTRY - Entry already exists for date');
      return res.status(409).json({
        success: false,
        error: 'Entry already exists for this date. Use PUT to update.'
      });
    }

    console.log('🔍 CREATE ENTRY - About to create new entry...');
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

    console.log('✅ [ISSUE-6-DEBUG] CREATE ENTRY - Entry created successfully:', {
      entryId: entry.id,
      userId: entry.userId,
      date: entry.date.toISOString(),
      wordCount: entry.wordCount,
      createdAt: entry.createdAt.toISOString()
    });

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

    console.log('🔍 CREATE ENTRY - Sending success response');
    res.status(201).json({
      success: true,
      data: entry,
      message: 'Entry created successfully'
    });
  } catch (error) {
    console.error('❌ [ISSUE-6-DEBUG] Create entry error:', {
      error: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name,
      userId: req.user?.id,
      userProvider: req.user?.provider,
      date: req.body?.date,
      userAgent: req.headers['user-agent'],
      requestHeaders: {
        'content-type': req.headers['content-type'],
        'authorization': req.headers['authorization'] ? 'Bearer [PRESENT]' : 'MISSING'
      },
      requestBody: {
        hasDate: !!req.body?.date,
        hasRawText: !!req.body?.rawText,
        rawTextLength: req.body?.rawText?.length,
        bodyKeys: Object.keys(req.body || {})
      },
      databaseStatus: 'Unknown - crashed during creation'
    });
    res.status(500).json({
      success: false,
      error: 'Failed to create entry'
    });
  }
});

// PUT /api/entries/:date - Update existing entry
router.put('/:date', requireAuth, async (req, res) => {
  console.log('🔍 [ISSUE-6-DEBUG] UPDATE ENTRY REQUEST (Auto-save):', {
    userId: req.user?.id,
    userProvider: req.user?.provider,
    userEmail: req.user?.email,
    targetDate: req.params.date,
    rawTextLength: req.body.rawText?.length,
    isHighlight: req.body.isHighlight,
    hasProjectIds: !!req.body.projectIds,
    hasSkillIds: !!req.body.skillIds,
    hasCompetencyIds: !!req.body.competencyIds,
    timestamp: new Date().toISOString(),
    userAgent: req.headers['user-agent']?.substring(0, 50),
    contentType: req.headers['content-type']
  });

  try {
    const userId = req.user.id;
    const targetDate = formatDate(req.params.date);
    const { rawText, isHighlight, projectIds, skillIds, competencyIds } = req.body;

    console.log('🔍 UPDATE ENTRY - Processed data:', {
      targetDate: targetDate.toISOString(),
      rawTextSnippet: rawText ? rawText.substring(0, 50) + '...' : 'unchanged',
      isHighlight: isHighlight
    });

    const updateData = {};
    
    if (rawText !== undefined) {
      updateData.rawText = rawText;
      updateData.wordCount = countWords(rawText);
    }
    
    if (isHighlight !== undefined) updateData.isHighlight = isHighlight;
    if (projectIds !== undefined) updateData.projectIds = projectIds;
    if (skillIds !== undefined) updateData.skillIds = skillIds;
    if (competencyIds !== undefined) updateData.competencyIds = competencyIds;

    console.log('🔍 UPDATE ENTRY - Update data prepared:', {
      hasRawText: !!updateData.rawText,
      wordCount: updateData.wordCount,
      isHighlight: updateData.isHighlight
    });

    // Update entry and invalidate relevant caches
    console.log('🔍 UPDATE ENTRY - About to update entry in database...');
    const entry = await cachedDbService.updateAndInvalidateCache('entry', {
      where: {
        userId_date: {
          userId,
          date: targetDate
        }
      },
      data: updateData
    }, ['entries', 'dashboard']);

    console.log('✅ [ISSUE-6-DEBUG] UPDATE ENTRY - Auto-save successful:', {
      entryId: entry.id,
      userId: entry.userId,
      date: entry.date.toISOString(),
      wordCount: entry.wordCount,
      updatedAt: entry.updatedAt.toISOString(),
      rawTextLength: entry.rawText?.length
    });

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

    console.log('🔍 UPDATE ENTRY - Sending success response');
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
    
    console.error('❌ [ISSUE-6-DEBUG] Update entry error (Auto-save failed):', {
      error: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name,
      userId: req.user?.id,
      userProvider: req.user?.provider,
      targetDate: req.params?.date,
      userAgent: req.headers['user-agent'],
      requestHeaders: {
        'content-type': req.headers['content-type'],
        'authorization': req.headers['authorization'] ? 'Bearer [PRESENT]' : 'MISSING'
      },
      requestBody: {
        hasRawText: !!req.body?.rawText,
        rawTextLength: req.body?.rawText?.length,
        hasIsHighlight: req.body?.hasOwnProperty('isHighlight'),
        bodyKeys: Object.keys(req.body || {})
      },
      updateDataPrepared: {
        hadRawText: rawText !== undefined,
        hadIsHighlight: isHighlight !== undefined
      },
      databaseStatus: 'Unknown - crashed during update'
    });
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

module.exports = router;