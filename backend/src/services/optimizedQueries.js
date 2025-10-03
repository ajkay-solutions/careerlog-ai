// Optimized Database Queries Service
// This service provides highly optimized queries that take advantage of indexes
// and minimize data transfer for better performance

const dbService = require('./database');

class OptimizedQueries {
  constructor() {
    this.queryCache = new Map();
    this.isWarmedUp = false;
  }

  /**
   * Pre-warm common query patterns to eliminate first-query latency
   * @param {string} sampleUserId - Sample user ID for query preparation
   */
  async warmupQueries(sampleUserId = 'warmup-user') {
    if (this.isWarmedUp) return;

    console.log('🔥 Pre-warming database query patterns...');
    const startTime = Date.now();

    try {
      await dbService.executeOperation(async (prismaClient) => {
        // Prepare common query patterns
        const prepQueries = [
          // User queries
          prismaClient.user.findUnique({
            where: { id: sampleUserId },
            select: { id: true }
          }).catch(() => null),

          // Entry queries with common patterns
          prismaClient.entry.findMany({
            where: { userId: sampleUserId },
            select: { id: true, date: true, wordCount: true },
            orderBy: { date: 'desc' },
            take: 1
          }).catch(() => []),

          // Count queries
          prismaClient.entry.count({
            where: { userId: sampleUserId }
          }).catch(() => 0),

          // Dashboard queries
          prismaClient.project.findMany({
            where: { userId: sampleUserId },
            select: { id: true, name: true, entryCount: true },
            orderBy: { entryCount: 'desc' },
            take: 1
          }).catch(() => []),

          prismaClient.skill.findMany({
            where: { userId: sampleUserId },
            select: { id: true, name: true, usageCount: true },
            orderBy: { usageCount: 'desc' },
            take: 1
          }).catch(() => []),

          // Date-based queries
          prismaClient.entry.findUnique({
            where: {
              userId_date: { 
                userId: sampleUserId, 
                date: new Date() 
              }
            },
            select: { id: true }
          }).catch(() => null),
        ];

        await Promise.allSettled(prepQueries);
        return true;
      }, 'query pattern warmup');

      const duration = Date.now() - startTime;
      console.log(`✅ Query patterns warmed up in ${duration}ms`);
      this.isWarmedUp = true;
    } catch (error) {
      console.warn('⚠️ Query warmup failed:', error.message);
    }
  }
  /**
   * Get user entries with minimal data transfer and optimal indexing
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object[]>} Optimized entries
   */
  async getUserEntriesOptimized(userId, options = {}) {
    const {
      date = null,
      limit = 50,
      offset = 0,
      includeText = false,
      includeExtractedData = false,
      onlyHighlights = false
    } = options;

    return await dbService.executeOperation(async (prismaClient) => {
      // Build optimized where clause using indexes
      const whereClause = { userId };
      
      if (date) {
        whereClause.date = date;
      }
      
      if (onlyHighlights) {
        whereClause.isHighlight = true;
      }

      // Minimal select for better performance
      const selectClause = {
        id: true,
        date: true,
        wordCount: true,
        isHighlight: true,
        sentiment: true,
        createdAt: true,
        updatedAt: true
      };

      // Only include heavy fields when necessary
      if (includeText) {
        selectClause.rawText = true;
      }
      
      if (includeExtractedData) {
        selectClause.extractedData = true;
      }

      return await prismaClient.entry.findMany({
        where: whereClause,
        select: selectClause,
        orderBy: { date: 'desc' }, // Uses userId + date index
        take: parseInt(limit),
        skip: parseInt(offset)
      });
    }, `optimized entries query for user ${userId}`);
  }

  /**
   * Get single entry by date with minimal data
   * @param {string} userId - User ID
   * @param {Date} date - Entry date
   * @param {boolean} includeText - Include raw text
   * @returns {Promise<Object|null>} Entry or null
   */
  async getSingleEntryOptimized(userId, date, includeText = false) {
    return await dbService.executeOperation(async (prismaClient) => {
      const selectClause = {
        id: true,
        date: true,
        wordCount: true,
        isHighlight: true,
        sentiment: true,
        extractedData: true,
        createdAt: true,
        updatedAt: true
      };

      if (includeText) {
        selectClause.rawText = true;
      }

      return await prismaClient.entry.findUnique({
        where: {
          userId_date: { userId, date }  // Uses unique index
        },
        select: selectClause
      });
    }, `optimized single entry query for user ${userId}`);
  }

  /**
   * Get dashboard data with single optimized query
   * @param {string} userId - User ID
   * @param {Object} timeframe - Date range
   * @returns {Promise<Object>} Dashboard data
   */
  async getDashboardDataOptimized(userId, timeframe = {}) {
    return await dbService.executeOperation(async (prismaClient) => {
      const { startDate, endDate } = timeframe;

      // Build where clause for entries
      const entryWhere = { userId };
      if (startDate && endDate) {
        entryWhere.date = {
          gte: startDate,
          lte: endDate
        };
      }

      // Execute optimized parallel queries
      const [projects, skills, competencies, entries, totalEntries] = await Promise.all([
        // Projects - uses userId + entryCount index
        prismaClient.project.findMany({
          where: { userId },
          select: {
            id: true,
            name: true,
            status: true,
            entryCount: true,
            updatedAt: true
          },
          orderBy: { entryCount: 'desc' },
          take: 10
        }),

        // Skills - uses userId + usageCount index
        prismaClient.skill.findMany({
          where: { userId },
          select: {
            id: true,
            name: true,
            category: true,
            usageCount: true,
            lastUsed: true
          },
          orderBy: { usageCount: 'desc' },
          take: 20
        }),

        // Competencies - uses userId + demonstrationCount index
        prismaClient.competency.findMany({
          where: { userId },
          select: {
            id: true,
            name: true,
            framework: true,
            demonstrationCount: true,
            lastDemonstrated: true
          },
          orderBy: { demonstrationCount: 'desc' },
          take: 15
        }),

        // Recent entries - uses userId + date index, minimal data
        prismaClient.entry.findMany({
          where: entryWhere,
          select: {
            id: true,
            date: true,
            wordCount: true,
            sentiment: true,
            isHighlight: true,
            createdAt: true
          },
          orderBy: { date: 'desc' },
          take: 10
        }),

        // Count query - uses userId index
        prismaClient.entry.count({
          where: entryWhere
        })
      ]);

      return {
        projects,
        skills,
        competencies,
        entries,
        summary: {
          totalEntries,
          totalProjects: projects.length,
          totalSkills: skills.length,
          totalCompetencies: competencies.length
        }
      };
    }, `optimized dashboard query for user ${userId}`);
  }

  /**
   * Get entries for streak calculation with minimal data
   * @param {string} userId - User ID
   * @param {number} limit - Number of recent entries
   * @returns {Promise<Object[]>} Entries with just dates
   */
  async getEntriesForStreakOptimized(userId, limit = 30) {
    return await dbService.executeOperation(async (prismaClient) => {
      return await prismaClient.entry.findMany({
        where: { userId },
        select: {
          date: true  // Only date field for streak calculation
        },
        orderBy: { date: 'desc' }, // Uses userId + date index
        take: limit
      });
    }, `optimized streak query for user ${userId}`);
  }

  /**
   * Get entries count with optimized query
   * @param {string} userId - User ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<number>} Count
   */
  async getEntriesCountOptimized(userId, filters = {}) {
    return await dbService.executeOperation(async (prismaClient) => {
      const whereClause = { userId, ...filters };
      
      return await prismaClient.entry.count({
        where: whereClause  // Uses appropriate index based on filters
      });
    }, `optimized count query for user ${userId}`);
  }

  /**
   * Search entries by text with pagination
   * @param {string} userId - User ID
   * @param {string} searchTerm - Search term
   * @param {Object} options - Pagination options
   * @returns {Promise<Object[]>} Matching entries
   */
  async searchEntriesOptimized(userId, searchTerm, options = {}) {
    const { limit = 20, offset = 0 } = options;

    return await dbService.executeOperation(async (prismaClient) => {
      return await prismaClient.entry.findMany({
        where: {
          userId, // Uses userId index first
          rawText: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        select: {
          id: true,
          date: true,
          rawText: true, // Need text for search highlighting
          wordCount: true,
          isHighlight: true,
          sentiment: true,
          createdAt: true
        },
        orderBy: { date: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
      });
    }, `optimized search query for user ${userId}`);
  }

  /**
   * Batch entry operations for better performance
   * @param {string} userId - User ID
   * @param {Object[]} operations - Batch operations
   * @returns {Promise<Object[]>} Results
   */
  async batchEntryOperations(userId, operations) {
    return await dbService.executeOperation(async (prismaClient) => {
      const results = [];
      
      // Execute operations in transaction for consistency
      await prismaClient.$transaction(async (tx) => {
        for (const operation of operations) {
          const { type, data } = operation;
          
          switch (type) {
            case 'create':
              const created = await tx.entry.create({
                data: { userId, ...data }
              });
              results.push(created);
              break;
              
            case 'update':
              const updated = await tx.entry.update({
                where: {
                  userId_date: { userId, date: data.date }
                },
                data: data.updates
              });
              results.push(updated);
              break;
              
            case 'delete':
              await tx.entry.delete({
                where: {
                  userId_date: { userId, date: data.date }
                }
              });
              results.push({ deleted: true, date: data.date });
              break;
          }
        }
      });
      
      return results;
    }, `batch operations for user ${userId}`);
  }
}

// Export singleton instance
module.exports = new OptimizedQueries();