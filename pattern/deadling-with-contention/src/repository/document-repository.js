class DocumentRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async findById(documentId) {
    const [rows] = await this.pool.execute(
      `SELECT document_id, title, content, status, version, created_at, updated_at
       FROM documents
       WHERE document_id = ?`,
      [documentId]
    );
    return rows[0] || null;
  }

  async updateContent(documentId, expectedVersion, content) {
    const [result] = await this.pool.execute(
      `UPDATE documents
       SET content = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP(3)
       WHERE document_id = ? AND version = ?`,
      [content, documentId, expectedVersion]
    );

    if (result.affectedRows === 1) {
      return { status: 'updated', version: expectedVersion + 1 };
    }

    const document = await this.findById(documentId);
    return document
      ? { status: 'conflict', document }
      : { status: 'missing' };
  }
}

module.exports = { DocumentRepository };
