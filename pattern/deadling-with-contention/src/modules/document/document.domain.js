const MAX_CONTENT_LENGTH = 100000;

/**
 * Validates that a document can be edited (must be in draft status)
 * @param {Object} document - The document to validate
 * @throws {Error} If document is not found or not in draft status
 */
function validateEditableDocument(document) {
  if (!document) {
    const error = new Error('Document not found');
    error.code = 'DOCUMENT_NOT_FOUND';
    throw error;
  }

  if (document.status !== 'draft') {
    const error = new Error('Only draft documents can be edited');
    error.code = 'DOCUMENT_NOT_EDITABLE';
    throw error;
  }
}

/**
 * Appends content to a document after validating it
 * @param {Object} document - The existing document
 * @param {string} append - Content to append to the document
 * @returns {Object} Object containing updated content
 * @throws {Error} If content validation fails
 */
function appendContent(document, append) {
  validateEditableDocument(document);

  if (typeof append !== 'string' || append.length === 0) {
    const error = new Error('append must be a non-empty string');
    error.code = 'INVALID_CONTENT';
    throw error;
  }

  const content = document.content + append;
  if (content.length > MAX_CONTENT_LENGTH) {
    const error = new Error('content exceeds the maximum length');
    error.code = 'INVALID_CONTENT';
    throw error;
  }

  return { content };
}

module.exports = { appendContent, validateEditableDocument };