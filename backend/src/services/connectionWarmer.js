// Database Connection Warmer
// This service pre-warms database connections and caches to eliminate cold starts

const dbService = require('./database');
const cache = require('./cache');
const optimizedQueries = require('./optimizedQueries');

class ConnectionWarmer {
  constructor() {
    this.isWarmedUp = false;
    this.warmupPromise = null;
    this.warmupTimeoutId = null;
  }

  /**
   * Pre-warm database connections and execute lightweight queries
   * @returns {Promise<boolean>} True if warmup successful
   */
  async warmupConnections() {
    if (this.isWarmedUp) {
      console.log('🔥 Connections already warmed up');
      return true;
    }

    if (this.warmupPromise) {
      console.log('🔄 Warmup already in progress, waiting...');
      return await this.warmupPromise;
    }

    console.log('🚀 Starting database connection warmup...');
    const startTime = Date.now();

    this.warmupPromise = this._performWarmup();
    const result = await this.warmupPromise;
    
    const duration = Date.now() - startTime;
    console.log(`✅ Database warmup completed in ${duration}ms`);
    
    this.isWarmedUp = result;
    this.warmupPromise = null;
    
    return result;
  }

  /**
   * Internal warmup logic
   * @private
   */
  async _performWarmup() {
    try {
      // 1. Establish database connection
      console.log('🔗 Establishing database connection...');
      const prismaClient = await dbService.connect();
      
      // 2. Execute lightweight warmup queries in parallel
      console.log('🔥 Executing warmup queries...');
      const warmupQueries = [
        // Simple count queries to warm up indexes
        prismaClient.$queryRaw`SELECT 1 as warmup`,
        prismaClient.user.count().catch(() => 0),
        prismaClient.entry.count({ take: 1 }).catch(() => 0),
        prismaClient.project.count({ take: 1 }).catch(() => 0),
        
        // Warm up connection pool
        prismaClient.$queryRaw`SELECT COUNT(*) FROM "User" LIMIT 1`.catch(() => 0),
      ];

      await Promise.all(warmupQueries);
      console.log('✅ Database warmup queries completed');

      // 3. Test Redis connection
      console.log('🔥 Testing Redis connection...');
      await cache.redis?.ping?.() || Promise.resolve();
      console.log('✅ Redis connection warmed');

      // 4. Pre-warm query patterns
      console.log('🔥 Pre-warming query patterns...');
      await optimizedQueries.warmupQueries();
      console.log('✅ Query patterns warmed');

      return true;
    } catch (error) {
      console.error('❌ Database warmup failed:', error.message);
      return false;
    }
  }

  /**
   * Pre-warm specific user data (called on first user request)
   * @param {string} userId - User ID to pre-warm
   */
  async warmupUserData(userId) {
    if (!userId) return;

    console.log(`🔥 Pre-warming data for user ${userId}...`);
    const startTime = Date.now();

    try {
      // Pre-warm most common queries for this user
      const warmupPromises = [
        // Pre-warm user existence check
        dbService.executeOperation(async (prismaClient) => {
          return await prismaClient.user.findUnique({
            where: { id: userId },
            select: { id: true }
          });
        }, `warmup user check`),

        // Pre-warm recent entries count
        dbService.executeOperation(async (prismaClient) => {
          return await prismaClient.entry.count({
            where: { userId },
            take: 1
          });
        }, `warmup entry count`),

        // Pre-warm basic project/skill counts
        dbService.executeOperation(async (prismaClient) => {
          return await Promise.all([
            prismaClient.project.count({ where: { userId }, take: 1 }),
            prismaClient.skill.count({ where: { userId }, take: 1 })
          ]);
        }, `warmup user counts`)
      ];

      await Promise.allSettled(warmupPromises);
      
      const duration = Date.now() - startTime;
      console.log(`✅ User data pre-warmed in ${duration}ms`);
    } catch (error) {
      console.warn('⚠️ User data warmup failed:', error.message);
    }
  }

  /**
   * Schedule periodic warmup to keep connections alive
   */
  startPeriodicWarmup() {
    if (this.warmupTimeoutId) {
      clearInterval(this.warmupTimeoutId);
    }

    // Keep connections warm every 5 minutes
    this.warmupTimeoutId = setInterval(async () => {
      console.log('🔄 Periodic connection warmup...');
      await this.warmupConnections();
    }, 5 * 60 * 1000); // 5 minutes

    console.log('⏰ Periodic warmup scheduled every 5 minutes');
  }

  /**
   * Stop periodic warmup
   */
  stopPeriodicWarmup() {
    if (this.warmupTimeoutId) {
      clearInterval(this.warmupTimeoutId);
      this.warmupTimeoutId = null;
      console.log('⏹️ Periodic warmup stopped');
    }
  }

  /**
   * Express middleware to warmup on first request
   */
  middleware() {
    return async (req, res, next) => {
      // Don't warmup on health checks or static files
      if (req.path === '/health' || req.path.startsWith('/static')) {
        return next();
      }

      // Warmup connections if not already done
      if (!this.isWarmedUp) {
        console.log('🔥 First request detected, warming up connections...');
        // Don't await - let it warmup in background for subsequent requests
        this.warmupConnections().catch(console.error);
      }

      // If user is authenticated, pre-warm their data
      if (req.user?.id && !this.isWarmedUp) {
        // Background warmup for user data
        this.warmupUserData(req.user.id).catch(console.error);
      }

      next();
    };
  }

  /**
   * Check if connections are warmed up
   */
  isReady() {
    return this.isWarmedUp;
  }

  /**
   * Force reset warmup state (for testing)
   */
  reset() {
    this.isWarmedUp = false;
    this.warmupPromise = null;
    if (this.warmupTimeoutId) {
      clearInterval(this.warmupTimeoutId);
      this.warmupTimeoutId = null;
    }
  }
}

// Export singleton instance
const connectionWarmer = new ConnectionWarmer();

// Auto-start periodic warmup
connectionWarmer.startPeriodicWarmup();

// Graceful shutdown
process.on('SIGINT', () => {
  connectionWarmer.stopPeriodicWarmup();
});

process.on('SIGTERM', () => {
  connectionWarmer.stopPeriodicWarmup();
});

module.exports = connectionWarmer;