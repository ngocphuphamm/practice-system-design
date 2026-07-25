const http = require('node:http');
const { createPool } = require('mysql2/promise');
const { AppModule } = require('./app.module');

/**
 * Main application launcher
 */
async function main() {
  try {
    // Create the application modules
    const { documentController, competitionController, config } = await AppModule.createApp();
    
    // Create the HTTP server
    const server = http.createServer(async (request, response) => {
      // Route document requests to document controller
      if (request.url.startsWith('/documents/')) {
        return await documentController.handleRequest(request, response);
      }
      
      // Route competition requests to competition controller
      if (request.url.startsWith('/competition/')) {
        return await competitionController.handleRequest(request, response);
      }
      
      // Handle 404 for unmatched routes
      response.writeHead(404, { 'content-type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ error: 'Route not found' }));
    });
    
    // Start listening
    server.listen(config.port, () => {
      console.log(`Content service listening on port ${config.port}`);
    });
    
    return server;
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exitCode = 1;
  }
}

// Start the application if this file is run directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };