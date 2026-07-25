/**
 * Document Repository class for database operations
 */
class DocumentRepository {
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * Find a document by its ID
   * @param {number} documentId - The ID of the document to find
   * @returns {Promise<Object|null>} The document if found, null otherwise
   */
  async findById(documentId) {
    const [rows] = await this.pool.execute(
      `SELECT document_id, title, content, status, version, created_at, updated_at
       FROM documents
       WHERE document_id = ?`,
      [documentId]
    );
    return rows[0] || null;
  }

  /**
   * Update document content with optimistic locking
   * @param {number} documentId - ID of the document to update
   * @param {number} expectedVersion - Expected version number
   * @param {string} content - New content to set
   * @returns {Promise<Object>} Update result with status and version info  
   */
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