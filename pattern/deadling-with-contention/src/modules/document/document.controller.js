const { DocumentConflictError, DocumentService } = require('./document.service');
const { DocumentRepository } = require('./document.repository');
const { getConfig } = require('../../shared/config/config.service');

// Reusable JSON handling functions
function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => { body += chunk; });
    request.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(Object.assign(new Error('Request body must be valid JSON'), { code: 'INVALID_JSON' }));
      }
    });
    request.on('error', reject);
  });
}

/**
 * Document Controller class for handling HTTP requests
 */
class DocumentController {
  constructor(documentService) {
    this.documentService = documentService;
  }

  async handleRequest(request, response) {
    const docMatch = request.url.match(/^\/documents\/(\d+)(?:\/content)?$/);
    const compMatch = request.url.match(/^\/competition\/(\w+)$/);

    if (!docMatch && !compMatch) {
      sendJson(response, 404, { error: 'Route not found' });
      return;
    }

    try {
      if (docMatch) {
        const documentId = Number(docMatch[1]);

        if (request.method === 'GET' && request.url.endsWith('/content') === false) {
          sendJson(response, 200, await this.documentService.getDocument(documentId));
          return;
        }

        if (request.method !== 'PUT' || !request.url.endsWith('/content')) {
          sendJson(response, 405, { error: 'Method not allowed' });
          return;
        }

        const payload = await readJson(request);
        if (!Number.isInteger(payload.expectedVersion) || typeof payload.append !== 'string') {
          sendJson(response, 400, { error: 'expectedVersion and append are required' });
          return;
        }

        sendJson(response, 200, await this.documentService.appendToDocument(
          documentId,
          payload.append,
          payload.expectedVersion
        ));
      }

      // Competition API endpoint for handling race conditions with distributed locks
      else if (compMatch) {
        const compType = compMatch[1];

        if (request.method !== 'POST') {
          sendJson(response, 405, { error: 'Method not allowed' });
          return;
        }

        const payload = await readJson(request);
        if (!payload.competitionId) {
          sendJson(response, 400, { error: 'competitionId is required' });
          return;
        }

        // Use competition-specific locking for competitive APIs
        const result = await this.documentService.handleCompetition(
          compType,
          payload.competitionId,
          payload.data || {}
        );

        sendJson(response, 200, result);
      }
    } catch (error) {
      if (error.code === 'DOCUMENT_NOT_FOUND') sendJson(response, 404, { error: error.message });
      else if (error.code === 'DOCUMENT_CONFLICT' || error.code === 'DOCUMENT_NOT_EDITABLE' || error.code === 'DOCUMENT_LOCKED' || error.code === 'COMPETITION_LOCK_FAILED') sendJson(response, 409, { error: error.message });
      else if (error.code === 'INVALID_CONTENT' || error.code === 'INVALID_JSON' || error.code === 'LOCK_MANAGER_NOT_CONFIGURED') sendJson(response, 400, { error: error.message });
      else {
        console.error(error);
        sendJson(response, 500, { error: 'Internal server error' });
      }
    }
  }
}

module.exports = { DocumentController, readJson };