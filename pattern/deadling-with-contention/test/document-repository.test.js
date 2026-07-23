const test = require('node:test');
const assert = require('node:assert/strict');
const { DocumentRepository } = require('../src/repository/document-repository');

test('uses the document version in the atomic update and reports success', async () => {
  const calls = [];
  const pool = {
    async execute(sql, parameters) {
      calls.push({ sql, parameters });
      return [{ affectedRows: 1 }, []];
    }
  };
  const repository = new DocumentRepository(pool);

  const result = await repository.updateContent(7, 3, 'updated');

  assert.deepEqual(result, { status: 'updated', version: 4 });
  assert.match(calls[0].sql, /WHERE document_id = \? AND version = \?/);
  assert.deepEqual(calls[0].parameters, ['updated', 7, 3]);
});

test('distinguishes a stale version from a missing document', async (t) => {
  await t.test('stale version', async () => {
    const pool = {
      async execute(sql) {
        if (sql.startsWith('UPDATE')) return [{ affectedRows: 0 }, []];
        return [[{ document_id: 7, version: 4 }], []];
      }
    };
    const result = await new DocumentRepository(pool).updateContent(7, 3, 'updated');
    assert.equal(result.status, 'conflict');
  });

  await t.test('missing document', async () => {
    const pool = {
      async execute(sql) {
        if (sql.startsWith('UPDATE')) return [{ affectedRows: 0 }, []];
        return [[], []];
      }
    };
    const result = await new DocumentRepository(pool).updateContent(7, 3, 'updated');
    assert.deepEqual(result, { status: 'missing' });
  });
});
