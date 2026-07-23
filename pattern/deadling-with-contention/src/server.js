const http = require('node:http');
const { createPool } = require('mysql2/promise');
const { getConfig } = require('./config');
const { DocumentRepository } = require('./repository/document-repository');
const { DocumentConflictError, DocumentService } = require('./service/document-service');

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

function createServer(service) {
  return http.createServer(async (request, response) => {
    const match = request.url.match(/^\/documents\/(\d+)(?:\/content)?$/);
    if (!match) {
      sendJson(response, 404, { error: 'Route not found' });
      return;
    }

    const documentId = Number(match[1]);
    try {
      if (request.method === 'GET' && request.url.endsWith('/content') === false) {
        sendJson(response, 200, await service.getDocument(documentId));
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

      sendJson(response, 200, await service.appendToDocument(
        documentId,
        payload.append,
        payload.expectedVersion
      ));
    } catch (error) {
      if (error.code === 'DOCUMENT_NOT_FOUND') sendJson(response, 404, { error: error.message });
      else if (error.code === 'DOCUMENT_CONFLICT' || error.code === 'DOCUMENT_NOT_EDITABLE') sendJson(response, 409, { error: error.message });
      else if (error.code === 'INVALID_CONTENT' || error.code === 'INVALID_JSON') sendJson(response, 400, { error: error.message });
      else {
        console.error(error);
        sendJson(response, 500, { error: 'Internal server error' });
      }
    }
  });
}

if (require.main === module) {
  const config = getConfig();
  const pool = createPool(config.mysql);
  const service = new DocumentService(new DocumentRepository(pool), config);
  createServer(service).listen(config.port, () => {
    console.log(`Content service listening on port ${config.port}`);
  });
}

module.exports = { createServer, readJson };
