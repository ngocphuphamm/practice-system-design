const { DocumentModule } = require('../modules/document/document.module');
const { LockingModule } = require('../modules/locking/locking.module');
const { CompetitionModule } = require('../modules/competition/competition.module');
const { getConfig } = require('../shared/config/config.service');

/**
 * Application Module - Main entry point for the application
 */
class AppModule {
  static async createApp() {
    const config = getConfig();
    
    // Initialize the document module
    const documentRepo = DocumentModule.createRepository(config.mysql);
    const documentService = DocumentModule.createService(documentRepo, config);
    
    // Initialize the locking module if Redis is configured
    let lockManager = null;
    if (config.redis && config.redis.endpoints.length > 0) {
      const redis = require('redis');
      const clients = [];
      
      for (const endpoint of config.redis.endpoints) {
        const client = redis.createClient({ url: endpoint });
        client.on('error', (error) => console.error(`Redis error (${endpoint}):`, error));
        await client.connect();
        clients.push(client);
      }
      
      lockManager = LockingModule.createManager(clients, {
        ttlMs: config.redis.ttlMs,
        retryCount: config.redis.retryCount,
        retryDelayMs: config.redis.retryDelayMs
      });
    }
    
    // Configure document service with lock manager
    const enhancedDocumentService = new DocumentModule.DocumentService(
      documentRepo, 
      { ...config, lockManager }
    );
    
    // Initialize competition module
    const competitionService = CompetitionModule.createService(lockManager);
    
    // Return the configured modules
    return {
      documentController: DocumentModule.createController(enhancedDocumentService),
      competitionController: CompetitionModule.createController(competitionService),
      config,
      lockManager
    };
  }
}

module.exports = { AppModule };