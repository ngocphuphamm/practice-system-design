/**
 * Configuration Service for managing application configuration
 */
function getConfig(environment = process.env) {
  const redisEndpoints = (environment.REDIS_ENDPOINTS || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  return {
    port: Number(environment.PORT || 3000),
    mysql: {
      host: environment.MYSQL_HOST || '127.0.0.1',
      port: Number(environment.MYSQL_PORT || 3306),
      user: environment.MYSQL_USER || 'root',
      password: environment.MYSQL_PASSWORD || '',
      database: environment.MYSQL_DATABASE || 'contention_cms',
      connectionLimit: Number(environment.MYSQL_CONNECTION_LIMIT || 10)
    },
    maxAttempts: Number(environment.OPTIMISTIC_LOCK_MAX_ATTEMPTS || 3),
    redis: {
      endpoints: redisEndpoints,
      ttlMs: Number(environment.REDIS_LOCK_TTL_MS || 10000),
      retryCount: Number(environment.REDIS_LOCK_RETRY_COUNT || 3),
      retryDelayMs: Number(environment.REDIS_LOCK_RETRY_DELAY_MS || 50)
    }
  };
}

module.exports = { getConfig };