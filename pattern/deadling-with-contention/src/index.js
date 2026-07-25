const { DocumentConflictError, DocumentService } = require('./modules/document/document.service');
const { DocumentRepository } = require('./modules/document/document.repository');
const { appendContent, validateEditableDocument } = require('./modules/document/document.domain');
const { RedlockManager } = require('./modules/locking/redlock.manager');

module.exports = {
  DocumentConflictError,
  DocumentService,
  DocumentRepository,
  appendContent,
  validateEditableDocument,
  RedlockManager
};