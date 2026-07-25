const { appendContent, validateEditableDocument } = require('./document.domain');

/**
 * Error class for document conflicts
 */
class DocumentConflictError extends Error {
  constructor(message = 'Document changed while it was being edited') {
    super(message);
    this.name = 'DocumentConflictError';
    this.code = 'DOCUMENT_CONFLICT';
  }
}

/**
 * Document Service class for business logic
 */
class DocumentService {
  constructor(repository, options = {}) {
    this.repository = repository;
    this.maxAttempts = options.maxAttempts || 3;
    this.retryDelayMs = options.retryDelayMs || 0;
    this.lockManager = options.lockManager || null;
    this.lockPrefix = options.lockPrefix || 'document';
    this.sleep = options.sleep || ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
  }

  /**
   * Get a document by ID
   * @param {number} documentId - The ID of the document to retrieve
   * @returns {Promise<Object>} The document object
   */
  async getDocument(documentId) {
    const document = await this.repository.findById(documentId);
    if (!document) {
      const error = new Error('Document not found');
      error.code = 'DOCUMENT_NOT_FOUND';
      throw error;
    }
    return document;
  }

  /**
   * Append content to a document with optimistic locking
   * @param {number} documentId - The ID of the document to update
   * @param {string} append - Content to append
   * @param {number} expectedVersion - Expected version number
   * @returns {Promise<Object>} Updated document with new version
   */
  async appendToDocument(documentId, append, expectedVersion) {
    const lockKey = `${this.lockPrefix}:${documentId}`;
    let lockState = null;

    if (this.lockManager) {
      lockState = await this.lockManager.acquire(lockKey);
      if (!lockState) {
        const error = new Error('Document is currently locked by another writer');
        error.code = 'DOCUMENT_LOCKED';
        throw error;
      }
    }

    try {
      let document = await this.repository.findById(documentId);
      if (!document) {
        const error = new Error('Document not found');
        error.code = 'DOCUMENT_NOT_FOUND';
        throw error;
      }

      if (document.version !== expectedVersion) {
        throw new DocumentConflictError();
      }

      for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
        const changes = appendContent(document, append);
        const result = await this.repository.updateContent(
          documentId,
          document.version,
          changes.content
        );

        if (result.status === 'updated') {
          return { ...document, ...changes, version: result.version };
        }
        if (result.status === 'missing') {
          const error = new Error('Document not found');
          error.code = 'DOCUMENT_NOT_FOUND';
          throw error;
        }
        if (attempt === this.maxAttempts) {
          throw new DocumentConflictError();
        }

        document = result.document;
        await this.sleep(this.retryDelayMs);
      }

      throw new DocumentConflictError();
    } finally {
      if (this.lockManager && lockState) {
        await this.lockManager.release(lockKey, lockState);
      }
    }
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

module.exports = { DocumentConflictError, DocumentService };