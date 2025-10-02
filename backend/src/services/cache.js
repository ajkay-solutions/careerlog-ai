// Redis cache service with environment prefixes
// Handles single Upstash database for both dev/prod environments

const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL);

// Environment-based key prefix to separate dev/prod data
const ENV_PREFIX = process.env.NODE_ENV === 'production' ? 'prod:' : 'dev:';

/**
 * Cache AI extraction result
 * @param {string} entryText - The journal entry text
 * @param {Object} result - The extracted data
 */
async function cacheExtraction(entryText, result) {
  const key = `${ENV_PREFIX}extraction:${hashText(entryText)}`;
  await redis.setex(key, 7 * 24 * 60 * 60, JSON.stringify(result)); // 7 days TTL
}

/**
 * Get cached AI extraction
 * @param {string} entryText - The journal entry text
 * @returns {Object|null} Cached extraction or null
 */
async function getCachedExtraction(entryText) {
  const key = `${ENV_PREFIX}extraction:${hashText(entryText)}`;
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
}

/**
 * Cache dashboard insights
 * @param {string} userId - User ID
 * @param {string} period - Time period (30d, 90d, etc.)
 * @param {Object} insights - Insights data
 */
async function cacheInsights(userId, period, insights) {
  const key = `${ENV_PREFIX}insights:${userId}:${period}`;
  await redis.setex(key, 60 * 60, JSON.stringify(insights)); // 1 hour TTL
}

/**
 * Get cached insights
 * @param {string} userId - User ID
 * @param {string} period - Time period
 * @returns {Object|null} Cached insights or null
 */
async function getCachedInsights(userId, period) {
  const key = `${ENV_PREFIX}insights:${userId}:${period}`;
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
}

/**
 * Clear all cache for a user (useful for data deletion)
 * @param {string} userId - User ID
 */
async function clearUserCache(userId) {
  const pattern = `${ENV_PREFIX}*:${userId}:*`;
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

/**
 * Create MD5 hash of text for cache key
 * @param {string} text - Text to hash
 * @returns {string} MD5 hash
 */
function hashText(text) {
  const crypto = require('crypto');
  return crypto.createHash('md5').update(text).digest('hex');
}

/**
 * Generic cache set function
 * @param {string} key - Cache key
 * @param {*} value - Value to cache (will be JSON stringified)
 * @param {number} ttl - TTL in seconds
 */
async function cacheSet(key, value, ttl = 3600) {
  const prefixedKey = `${ENV_PREFIX}${key}`;
  await redis.setex(prefixedKey, ttl, JSON.stringify(value));
}

/**
 * Generic cache get function
 * @param {string} key - Cache key
 * @returns {*} Cached value or null
 */
async function cacheGet(key) {
  const prefixedKey = `${ENV_PREFIX}${key}`;
  const cached = await redis.get(prefixedKey);
  return cached ? JSON.parse(cached) : null;
}

/**
 * Get cache statistics (useful for monitoring)
 * @returns {Object} Cache stats
 */
async function getCacheStats() {
  const devKeys = await redis.keys('dev:*');
  const prodKeys = await redis.keys('prod:*');
  
  return {
    environment: process.env.NODE_ENV,
    totalKeys: devKeys.length + prodKeys.length,
    devKeys: devKeys.length,
    prodKeys: prodKeys.length,
    currentEnvKeys: process.env.NODE_ENV === 'production' ? prodKeys.length : devKeys.length
  };
}

module.exports = {
  cacheExtraction,
  getCachedExtraction,
  cacheInsights,
  getCachedInsights,
  clearUserCache,
  getCacheStats,
  cacheSet,
  cacheGet
};