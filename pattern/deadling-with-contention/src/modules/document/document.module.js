const { DocumentController } = require('./document.controller');
const { DocumentService } = require('./document.service');
const { DocumentRepository } = require('./document.repository');

/**
 * Document Module for managing document operations
 */
class DocumentModule {
  static createController(documentService) {
    return new DocumentController(documentService);
  }

  static createService(repository, options) {
    return new DocumentService(repository, options);
  }

  static createRepository(pool) {
    return new DocumentRepository(pool);
  }
}

module.exports = { DocumentModule };