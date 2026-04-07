const redis = require('redis');
const { logger } = require('../utils/logger');

let client;

async function connectRedis() {
  try {
    client = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: process.env.REDIS_DB || 0,
    });

    client.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    client.on('connect', () => {
      logger.info('Connected to Redis');
    });

    await client.connect();
    
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
}

function getRedisClient() {
  if (!client) {
    throw new Error('Redis client not initialized');
  }
  return client;
}

async function setCache(key, value, expireInSeconds = 3600) {
  try {
    const client = getRedisClient();
    await client.setEx(key, expireInSeconds, JSON.stringify(value));
  } catch (error) {
    logger.error('Redis set cache error:', error);
  }
}

async function getCache(key) {
  try {
    const client = getRedisClient();
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error('Redis get cache error:', error);
    return null;
  }
}

async function deleteCache(key) {
  try {
    const client = getRedisClient();
    await client.del(key);
  } catch (error) {
    logger.error('Redis delete cache error:', error);
  }
}

async function incrementCounter(key, expireInSeconds = 3600) {
  try {
    const client = getRedisClient();
    const result = await client.incr(key);
    if (result === 1) {
      await client.expire(key, expireInSeconds);
    }
    return result;
  } catch (error) {
    logger.error('Redis increment counter error:', error);
    return 0;
  }
}

module.exports = {
  connectRedis,
  getRedisClient,
  setCache,
  getCache,
  deleteCache,
  incrementCounter
};