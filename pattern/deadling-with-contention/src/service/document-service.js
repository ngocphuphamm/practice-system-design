const { appendContent } = require('../domain/document');

// --- Custom Error Class Definition ---
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

// --- Service Class Definition ---
/**
 * Document Service class for business logic
 */
class DocumentService {
  constructor(repository, options = {}) {
    this.repository = repository;
    this.maxAttempts = options.maxAttempts || 3;
    this.retryDelayMs = options.retryDelayMs || 0;
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
    // Step 1: Fetch initial document state
    let document = await this.repository.findById(documentId);
    if (!document) {
      const error = new Error('Document not found');
      error.code = 'DOCUMENT_NOT_FOUND';
      throw error;
    }

    // Step 2: Validate version is current
    if (document.version !== expectedVersion) {
      throw new DocumentConflictError();
    }

    // Step 3: Attempt update with retry logic
    for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
      try {
        // Apply domain operation
        const changes = appendContent(document, append);
        
        // Execute database update using atomic compare-and-update
        const result = await this.repository.updateContent(
          documentId,
          document.version,
          changes.content
        );

        // Handle update results
        if (result.status === 'updated') {
          return { ...document, ...changes, version: result.version };
        }
        
        if (result.status === 'missing') {
          const error = new Error('Document not found');
          error.code = 'DOCUMENT_NOT_FOUND';
          throw error;
        }
        
        // This is a conflict, retry by reloading document
        if (attempt === this.maxAttempts) {
          throw new DocumentConflictError();
        }

        // Reload document to get latest version
        document = result.document;
        await this.sleep(this.retryDelayMs);
      } catch (error) {
        // Re-throw errors to avoid silent failures
        throw error;
      }
    }

    // Should never reach here due to early throws
    throw new DocumentConflictError();
  }
}

module.exports = { DocumentConflictError, DocumentService };
