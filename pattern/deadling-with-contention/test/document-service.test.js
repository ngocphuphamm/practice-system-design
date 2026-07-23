const test = require('node:test');
const assert = require('node:assert/strict');
const { DocumentConflictError, DocumentService } = require('../src/service/document-service');

function makeRepository(document) {
  return {
    document,
    conflicts: 0,
    findByIdCalls: 0,
    async findById() {
      this.findByIdCalls += 1;
      return this.document;
    },
    async updateContent(documentId, expectedVersion, content) {
      if (this.conflicts > 0) {
        this.conflicts -= 1;
        this.document = { ...this.document, content: `${this.document.content} from another editor`, version: expectedVersion + 1 };
        return { status: 'conflict', document: this.document };
      }
      this.document = { ...this.document, content, version: expectedVersion + 1 };
      return { status: 'updated', version: this.document.version };
    }
  };
}

test('updates a draft and increments its version', async () => {
  const repository = makeRepository({ document_id: 1, content: 'Hello', status: 'draft', version: 1 });
  const service = new DocumentService(repository);

  const result = await service.appendToDocument(1, ' world', 1);

  assert.equal(result.content, 'Hello world');
  assert.equal(result.version, 2);
});

test('reloads and reapplies the domain operation after a conflict', async () => {
  const repository = makeRepository({ document_id: 1, content: 'Hello', status: 'draft', version: 1 });
  repository.conflicts = 1;
  const service = new DocumentService(repository, { maxAttempts: 2 });

  const result = await service.appendToDocument(1, ' from me', 1);

  assert.equal(result.content, 'Hello from another editor from me');
  assert.equal(result.version, 3);
  assert.equal(repository.findByIdCalls, 1);
});

test('stops after the configured retry limit', async () => {
  const repository = makeRepository({ document_id: 1, content: 'Hello', status: 'draft', version: 1 });
  repository.conflicts = 5;
  const service = new DocumentService(repository, { maxAttempts: 2 });

  await assert.rejects(
    service.appendToDocument(1, ' from me', 1),
    (error) => error instanceof DocumentConflictError
  );
});

test('does not edit a published document', async () => {
  const repository = makeRepository({ document_id: 1, content: 'Published', status: 'published', version: 1 });
  const service = new DocumentService(repository);

  await assert.rejects(
    service.appendToDocument(1, ' change', 1),
    (error) => error.code === 'DOCUMENT_NOT_EDITABLE'
  );
});

test('rejects an expected version that is already stale', async () => {
  const repository = makeRepository({ document_id: 1, content: 'Current', status: 'draft', version: 2 });
  const service = new DocumentService(repository);

  await assert.rejects(
    service.appendToDocument(1, ' change', 1),
    (error) => error instanceof DocumentConflictError
  );
});
