const DEFAULT_TTL_MS = 10000;
const DEFAULT_RETRY_DELAY_MS = 50;
const DEFAULT_RETRY_COUNT = 3;

/**
 * Redlock Manager for distributed locking
 */
class RedlockManager {
  constructor(redisClients, options = {}) {
    this.redisClients = redisClients;
    this.ttlMs = options.ttlMs || DEFAULT_TTL_MS;
    this.retryCount = options.retryCount || DEFAULT_RETRY_COUNT;
    this.retryDelayMs = options.retryDelayMs || DEFAULT_RETRY_DELAY_MS;
    this.keyPrefix = options.keyPrefix || 'redlock';
  }

  /**
   * Acquire a distributed lock with quorum-based approach
   * @param {string} lockKey - The key to lock
   * @param {number} [ttlMs] - Time to live in milliseconds
   * @returns {Promise<{token: string, key: string, clients: Array, quorum: number, startedAt: number} | null>}
   */
  async acquire(lockKey, ttlMs = this.ttlMs) {
    if (!Array.isArray(this.redisClients) || this.redisClients.length === 0) {
      return null;
    }

    const fullKey = `${this.keyPrefix}:${lockKey}`;
    const token = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const quorum = Math.floor(this.redisClients.length / 2) + 1;
    let successCount = 0;

    for (let attempt = 0; attempt < this.retryCount; attempt += 1) {
      successCount = 0;
      const startedAt = Date.now();

      // Acquire lock on all Redis instances
      const promises = this.redisClients.map(async (client) => {
        try {
          const result = await client.set(fullKey, token, { PX: ttlMs, NX: true });
          return result === 'OK';
        } catch (error) {
          // Ignore failed Redis nodes, continue to quorum check
          return false;
        }
      });

      const results = await Promise.all(promises);
      successCount = results.filter(Boolean).length;

      if (successCount >= quorum) {
        return { token, key: fullKey, clients: this.redisClients, quorum, startedAt };
      }

      await this.sleep(this.retryDelayMs);
    }

    // Release any partially acquired locks and return null if unsuccessful
    await this.release(fullKey, { token, key: fullKey, clients: this.redisClients });
    return null;
  }

  /**
   * Release a distributed lock
   * @param {string} lockKey - The key to lock
   * @param {Object} state - The lock state object from acquire()
   * @returns {Promise<void>}
   */
  async release(lockKey, state) {
    if (!state) {
      return;
    }

    const fullKey = state.key || `${this.keyPrefix}:${lockKey}`;

    // Safely attempt to release on all Redis instances without throwing on errors
    const promises = (state.clients || []).map(async (client) => {
      try {
        const value = await client.get(fullKey);
        if (value === state.token) {
          await client.del(fullKey);
        }
      } catch (error) {
        // Ignore release errors so a single Redis node failure does not break the workflow
        return false;
      }
      return true;
    });

    // We don't wait for all to complete, but execute all in parallel
    await Promise.all(promises);
  }

  /**
   * Sleep utility function
   * @private
   */
  sleep(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }
}

module.exports = { RedlockManager };