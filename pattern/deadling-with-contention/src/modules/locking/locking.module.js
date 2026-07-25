const { RedlockManager } = require('./redlock.manager');

/**
 * Locking Module for managing distributed locks
 */
class LockingModule {
  static createManager(redisClients, options) {
    return new RedlockManager(redisClients, options);
  }
}

module.exports = { LockingModule };