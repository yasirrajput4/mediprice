const Redis = require('ioredis');
const logger = require('../utils/logger');

let redis;

async function connectRedis() {
  redis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 50, 2000),
  });

  redis.on('error', (err) => logger.error('Redis error:', err));
  redis.on('connect', () => logger.info('Redis connected'));

  await redis.ping();
}

function getRedis() {
  if (!redis) throw new Error('Redis not initialized');
  return redis;
}

// Cache helpers
async function cacheGet(key) {
  const data = await getRedis().get(key);
  return data ? JSON.parse(data) : null;
}

async function cacheSet(key, value, ttlSeconds = 300) {
  await getRedis().setex(key, ttlSeconds, JSON.stringify(value));
}

async function cacheDel(key) {
  await getRedis().del(key);
}

async function cacheDelPattern(pattern) {
  const keys = await getRedis().keys(pattern);
  if (keys.length > 0) await getRedis().del(...keys);
}

module.exports = { connectRedis, getRedis, cacheGet, cacheSet, cacheDel, cacheDelPattern };
