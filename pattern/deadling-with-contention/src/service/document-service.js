const { appendContent } = require('../domain/document');

class DocumentConflictError extends Error {
  constructor(message = 'Document changed while it was being edited') {
    super(message);
    this.name = 'DocumentConflictError';
    this.code = 'DOCUMENT_CONFLICT';
  }
}

class DocumentService {
  constructor(repository, options = {}) {
    this.repository = repository;
    this.maxAttempts = options.maxAttempts || 3;
    this.retryDelayMs = options.retryDelayMs || 0;
    this.sleep = options.sleep || ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
  }

  async getDocument(documentId) {
    const document = await this.repository.findById(documentId);
    if (!document) {
      const error = new Error('Document not found');
      error.code = 'DOCUMENT_NOT_FOUND';
      throw error;
    }
    return document;
  }

  async appendToDocument(documentId, append, expectedVersion) {
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
  }
}

module.exports = { DocumentConflictError, DocumentService };
