/**
 * Competition Service for handling race condition scenarios
 */
class CompetitionService {
  constructor(lockManager) {
    this.lockManager = lockManager;
  }

  /**
   * Handle competition scenarios with distributed locks
   * @param {string} compType - Type of competition (e.g. "api-batch", "api-synchronized")
   * @param {string} competitionId - Identifier for the competition
   * @param {object} data - Additional data for the operation
   * @returns {Promise<object>} Result of the competition operation
   */
  async handleCompetition(compType, competitionId, data) {
    if (!this.lockManager) {
      const error = new Error('Distributed locking not configured');
      error.code = 'LOCK_MANAGER_NOT_CONFIGURED';
      throw error;
    }

    const lockKey = `competition:${compType}:${competitionId}`;
    let lockState = null;

    try {
      // Acquire distributed lock for competition
      lockState = await this.lockManager.acquire(lockKey);

      if (!lockState) {
        const error = new Error('Unable to acquire lock for competition scenario');
        error.code = 'COMPETITION_LOCK_FAILED';
        throw error;
      }

      // Simulate competition handling based on type
      let result;
      switch (compType) {
        case 'api-batch':
          // Example: Process batch data with lock to prevent race conditions
          result = {
            competitionId,
            status: 'processed',
            timestamp: Date.now(),
            batchData: data.batchData || []
          };
          break;

        case 'api-synchronized':
          // Example: Synchronized processing with lock to prevent race conditions
          result = {
            competitionId,
            status: 'synchronized',
            timestamp: Date.now(),
            syncData: data.syncData || {}
          };
          break;

        default:
          result = {
            competitionId,
            status: 'handled',
            timestamp: Date.now(),
            compType,
            data
          };
      }

      return result;

    } finally {
      // Always release the lock
      if (lockState) {
        await this.lockManager.release(lockKey, lockState);
      }
    }
  }
}

module.exports = { CompetitionService };