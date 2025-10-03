// Cached Database Service - High-performance wrapper around database operations
// This service adds Redis caching to frequently accessed database operations

const dbService = require('./database');
const cache = require('./cache');

class CachedDatabaseService {
  constructor() {
    if (CachedDatabaseService.instance) {
      return CachedDatabaseService.instance;
    }
    CachedDatabaseService.instance = this;
  }

  /**
   * Get count with caching (for global counts like total users, entries, etc.)
   * @param {string} model - Model name (user, entry, project, skill, competency)
   * @param {Object} where - Where clause (optional)
   * @param {number} ttl - Cache TTL in seconds (default: 5 minutes)
   * @returns {number} Count
   */
  async getCachedCount(model, where = {}, ttl = 300) {
    // For global counts (no where clause), use global cache
    if (Object.keys(where).length === 0) {
      const cacheKey = model;
      const cached = await cache.getCachedDatabaseCount(cacheKey);
      
      if (cached !== null) {
        console.log(`✅ Cache hit: ${model} count = ${cached}`);
        return cached;
      }
      
      console.log(`🔍 Cache miss: Fetching ${model} count from database`);
      const startTime = process.hrtime.bigint();
      
      const count = await dbService.count(model, { where });
      
      const duration = Number(process.hrtime.bigint() - startTime) / 1000000;
      console.log(`📊 Database query completed in ${Math.round(duration)}ms`);
      
      await cache.cacheDatabaseCount(cacheKey, count, ttl);
      return count;
    }
    
    // For user-specific counts, use user cache
    if (where.userId) {
      const cacheKey = `count_${model}`;
      const cached = await cache.getCachedUserData(where.userId, cacheKey);
      
      if (cached !== null) {
        console.log(`✅ Cache hit: User ${where.userId} ${model} count = ${cached}`);
        return cached;
      }
      
      console.log(`🔍 Cache miss: Fetching user ${where.userId} ${model} count`);
      const startTime = process.hrtime.bigint();
      
      const count = await dbService.count(model, { where });
      
      const duration = Number(process.hrtime.bigint() - startTime) / 1000000;
      console.log(`📊 User-specific query completed in ${Math.round(duration)}ms`);
      
      await cache.cacheUserData(where.userId, cacheKey, count, ttl);
      return count;
    }
    
    // For other complex queries, no caching (fall back to direct database)
    return await dbService.count(model, { where });
  }

  /**
   * Get user data with caching (entries, projects, skills, etc.)
   * @param {string} model - Model name
   * @param {Object} params - Prisma query parameters
   * @param {string} cacheKey - Cache key suffix
   * @param {number} ttl - Cache TTL in seconds (default: 10 minutes)
   * @returns {Array} Results
   */
  async getCachedUserData(model, params, cacheKey, ttl = 600) {
    const userId = params.where?.userId;
    
    if (!userId) {
      // No userId means no caching, fall back to database
      return await dbService.findMany(model, params);
    }
    
    const cached = await cache.getCachedUserData(userId, cacheKey);
    
    if (cached !== null) {
      console.log(`✅ Cache hit: User ${userId} ${cacheKey}`);
      return cached;
    }
    
    console.log(`🔍 Cache miss: Fetching user ${userId} ${cacheKey}`);
    const startTime = process.hrtime.bigint();
    
    const results = await dbService.findMany(model, params);
    
    const duration = Number(process.hrtime.bigint() - startTime) / 1000000;
    console.log(`📊 User data query completed in ${Math.round(duration)}ms`);
    
    await cache.cacheUserData(userId, cacheKey, results, ttl);
    return results;
  }

  /**
   * Get dashboard data with caching
   * @param {string} userId - User ID
   * @param {string} timeframe - Timeframe (all, week, month, etc.)
   * @param {Function} dataLoader - Function that loads data from database
   * @param {number} ttl - Cache TTL in seconds (default: 10 minutes)
   * @returns {Object} Dashboard data
   */
  async getCachedDashboardData(userId, timeframe, dataLoader, ttl = 600) {
    const cached = await cache.getCachedDashboardData(userId, timeframe);
    
    if (cached !== null) {
      console.log(`✅ Cache hit: Dashboard data for user ${userId}, timeframe ${timeframe}`);
      return cached;
    }
    
    console.log(`🔍 Cache miss: Loading dashboard data for user ${userId}, timeframe ${timeframe}`);
    const startTime = process.hrtime.bigint();
    
    const dashboardData = await dataLoader();
    
    const duration = Number(process.hrtime.bigint() - startTime) / 1000000;
    console.log(`📊 Dashboard data loaded in ${Math.round(duration)}ms`);
    
    await cache.cacheDashboardData(userId, timeframe, dashboardData, ttl);
    return dashboardData;
  }

  /**
   * Get cached user entries (for journal page)
   * @param {string} userId - User ID
   * @param {string} date - Optional date filter
   * @param {Function} dataLoader - Function to load data if cache miss
   * @param {number} ttl - Cache TTL in seconds (default: 5 minutes)
   * @returns {Object[]} Entries array
   */
  async getCachedUserEntries(userId, date, dataLoader, ttl = 300) {
    const cacheKey = date ? `entries_${date}` : 'entries_recent';
    const cached = await cache.getCachedUserData(userId, cacheKey);
    
    if (cached !== null) {
      console.log(`✅ Cache hit: Entries for user ${userId}, key: ${cacheKey}`);
      return cached;
    }
    
    console.log(`🔍 Cache miss: Loading entries for user ${userId}, key: ${cacheKey}`);
    const startTime = process.hrtime.bigint();
    
    const entries = await dataLoader();
    
    const duration = Number(process.hrtime.bigint() - startTime) / 1000000;
    console.log(`📊 Entries loaded in ${Math.round(duration)}ms`);
    
    await cache.cacheUserData(userId, cacheKey, entries, ttl);
    return entries;
  }

  /**
   * Update data and invalidate relevant caches
   * @param {string} model - Model name
   * @param {Object} params - Update parameters
   * @param {string[]} cacheTypes - Types of cache to invalidate
   * @returns {Object} Update result
   */
  async updateAndInvalidateCache(model, params, cacheTypes = []) {
    const result = await dbService.update(model, params);
    
    // Invalidate cache for the affected user
    const userId = params.where?.userId || params.data?.userId;
    if (userId) {
      console.log(`🗑️ Invalidating cache for user ${userId}, types: ${cacheTypes.join(', ')}`);
      await cache.invalidateUserCache(userId, cacheTypes);
    }
    
    // Also invalidate global counts if relevant
    if (cacheTypes.includes('counts')) {
      console.log(`🗑️ Invalidating global counts cache`);
      const patterns = ['dev:count:*', 'prod:count:*'];
      for (const pattern of patterns) {
        const keys = await cache.redis?.keys(pattern) || [];
        if (keys.length > 0) {
          await cache.redis?.del(...keys);
        }
      }
    }
    
    return result;
  }

  /**
   * Create data and invalidate relevant caches
   * @param {string} model - Model name
   * @param {Object} params - Create parameters
   * @param {string[]} cacheTypes - Types of cache to invalidate
   * @returns {Object} Create result
   */
  async createAndInvalidateCache(model, params, cacheTypes = []) {
    const result = await dbService.create(model, params);
    
    // Invalidate cache for the affected user
    const userId = params.data?.userId;
    if (userId) {
      console.log(`🗑️ Invalidating cache for user ${userId}, types: ${cacheTypes.join(', ')}`);
      await cache.invalidateUserCache(userId, cacheTypes);
    }
    
    // Also invalidate global counts
    if (cacheTypes.includes('counts')) {
      console.log(`🗑️ Invalidating global counts cache`);
      const patterns = ['dev:count:*', 'prod:count:*'];
      for (const pattern of patterns) {
        const keys = await cache.redis?.keys(pattern) || [];
        if (keys.length > 0) {
          await cache.redis?.del(...keys);
        }
      }
    }
    
    return result;
  }

  /**
   * Pass-through methods for operations that don't need caching
   */
  async executeOperation(operation, operationName) {
    return await dbService.executeOperation(operation, operationName);
  }

  async findUnique(model, params) {
    return await dbService.findUnique(model, params);
  }

  async upsert(model, params) {
    return await dbService.upsert(model, params);
  }

  async delete(model, params) {
    return await dbService.delete(model, params);
  }

  async getPrismaClient() {
    return await dbService.getPrismaClient();
  }

  async healthCheck() {
    return await dbService.healthCheck();
  }
}

// Export singleton instance
const cachedDbService = new CachedDatabaseService();

module.exports = cachedDbService;