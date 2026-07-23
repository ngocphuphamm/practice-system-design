const MAX_CONTENT_LENGTH = 100000;

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
