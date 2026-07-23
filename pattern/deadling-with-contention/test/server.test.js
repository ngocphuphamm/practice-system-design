const test = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('../src/server');

async function request(server, method, path, body) {
  const address = server.address();
  const response = await fetch(`http://127.0.0.1:${address.port}${path}`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  return { status: response.status, body: await response.json() };
}

test('serves a document and maps service conflicts to HTTP 409', async (t) => {
  const service = {
    async getDocument(documentId) {
      return { document_id: documentId, content: 'Hello', status: 'draft', version: 1 };
    },
    async appendToDocument() {
      const error = new Error('Document changed while it was being edited');
      error.code = 'DOCUMENT_CONFLICT';
      throw error;
    }
  };
  const server = createServer(service).listen(0);
  t.after(() => server.close());

  const getResult = await request(server, 'GET', '/documents/1');
  assert.equal(getResult.status, 200);
  assert.equal(getResult.body.version, 1);

  const putResult = await request(server, 'PUT', '/documents/1/content', {
    expectedVersion: 1,
    append: ' update'
  });
  assert.equal(putResult.status, 409);
  assert.match(putResult.body.error, /changed/);
});

test('rejects malformed update payloads', async (t) => {
  const server = createServer({}).listen(0);
  t.after(() => server.close());

  const result = await request(server, 'PUT', '/documents/1/content', { append: 'missing version' });
  assert.equal(result.status, 400);
});
