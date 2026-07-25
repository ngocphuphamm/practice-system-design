/**
 * Client test for Redlock distributed locking in competition scenarios
 * This file demonstrates how to test race conditions with distributed locks
 */

const http = require('http');
const { createServer } = require('../src/server');
const { DocumentService } = require('../src/service/document-service');
const { DocumentRepository } = require('../src/repository/document-repository');
const { getConfig } = require('../src/config');
const { createPool } = require('mysql2/promise');

// Mock Redis client for testing
class MockRedisClient {
  constructor(id) {
    this.id = id;
    this.keys = new Map(); // Simulate Redis storage
  }

  async set(key, value, options) {
    // Simulate Redis set with NX flag
    if (!this.keys.has(key)) {
      this.keys.set(key, value);
      return 'OK';
    }
    return null;
  }

  async get(key) {
    return this.keys.get(key) || null;
  }

  async del(key) {
    return this.keys.delete(key) ? 1 : 0;
  }
}

// Mock lock manager for simulation
class MockLockManager {
  constructor(clients) {
    this.clients = clients;
  }

  async acquire(lockKey) {
    const quorum = Math.floor(this.clients.length / 2) + 1;
    let successCount = 0;
    const token = `token-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    
    // Try to acquire lock on all clients
    for (const client of this.clients) {
      try {
        const result = await client.set(lockKey, token, { PX: 10000, NX: true });
        if (result === 'OK') successCount++;
      } catch (error) {
        // Ignore failed clients
      }
    }
    
    if (successCount >= quorum) {
      return { token, key: lockKey, clients: this.clients };
    }
    
    // Return null if we didn't get quorum
    return null;
  }

  async release(lockKey, state) {
    if (!state || !state.clients) return;
    
    // Try to release on all clients
    for (const client of state.clients) {
      try {
        const value = await client.get(lockKey);
        if (value === state.token) {
          await client.del(lockKey);
        }
      } catch (error) {
        // Ignore errors
      }
    }
  }
}

// Create a test server instance with mock lock manager for demonstration
async function createTestServer() {
  // Database setup (mocked for test purposes)
  const pool = {
    execute: async () => [
      [
        {
          document_id: 1,
          title: 'Test Document',
          content: 'Hello',
          status: 'draft',
          version: 1,
          created_at: new Date(),
          updated_at: new Date()
        }
      ]
    ]
  };

  const repo = new DocumentRepository(pool);
  const config = getConfig();
  const options = { ...config };
  
  // Simulate Redis configuration for test
  const mockClients = [
    new MockRedisClient(1),
    new MockRedisClient(2),
    new MockRedisClient(3),
    new MockRedisClient(4),
    new MockRedisClient(5)
  ];
  
  options.lockManager = new MockLockManager(mockClients);
  
  const service = new DocumentService(repo, options);
  
  // Create test server using the same approach as main server
  const server = http.createServer(async (req, res) => {
    // Match /competition/ endpoint for testing
    const match = req.url.match(/^\/competition\/(\w+)$/);
    
    if (!match) {
      res.writeHead(404, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'Route not found' }));
      return;
    }
    
    const compType = match[1];
    
    try {
      if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          let payload;
          try {
            payload = JSON.parse(body);
          } catch (err) {
            res.writeHead(400, { 'content-type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
            return;
          }
          
          if (!payload.competitionId) {
            res.writeHead(400, { 'content-type': 'application/json' });
            res.end(JSON.stringify({ error: 'competitionId is required' }));
            return;
          }
          
          // Test the competition handler
          const result = await service.handleCompetition(compType, payload.competitionId, payload.data || {});
          
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end(JSON.stringify(result));
        });
      } else {
        res.writeHead(405, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
      }
    } catch (error) {
      if (error.code === 'LOCK_MANAGER_NOT_CONFIGURED') {
        res.writeHead(400, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      } else if (error.code === 'COMPETITION_LOCK_FAILED') {
        res.writeHead(409, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      } else {
        res.writeHead(500, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    }
  });
  
  return server;
}

// Function to demonstrate client behavior in race condition scenario
async function runRaceConditionDemo() {
  console.log('=== Redlock Competition Race Condition Demo ===\n');
  
  // Create test server
  const server = await createTestServer();
  
  server.listen(3001, () => {
    console.log('Test server started on port 3001');
    console.log('Testing competition scenarios...');
    
    // Simulate concurrent requests that would benefit from Redlock
    const requests = [
      { type: 'api-batch', id: 'batch-123', data: { batchData: ['item1', 'item2'] } },
      { type: 'api-synchronized', id: 'sync-456', data: { syncData: { key: 'value' } } },
      { type: 'api-batch', id: 'batch-789', data: { batchData: ['item3', 'item4'] } }
    ];
    
    // Make concurrent requests to simulate race condition scenario
    requests.forEach((request, index) => {
      setTimeout(() => {
        const postData = JSON.stringify({
          competitionId: request.id,
          data: request.data
        });
        
        const req = http.request({
          hostname: 'localhost',
          port: 3001,
          path: `/competition/${request.type}`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        }, (res) => {
          let data = '';
          res.on('data', chunk => {
            data += chunk;
          });
          res.on('end', () => {
            const result = JSON.parse(data);
            console.log(`Request ${index + 1} (${request.type} ${request.id}):`, result);
          });
        });
        
        req.on('error', (error) => {
          console.error(`Request ${index + 1} failed:`, error.message);
        });
        
        req.write(postData);
        req.end();
      }, index * 500); // Stagger requests
    });
    
    // After all requests, shut down server
    setTimeout(() => {
      server.close(() => {
        console.log('\nTest completed.');
      });
    }, 3000);
  });
}

// Run the demonstration
if (require.main === module) {
  runRaceConditionDemo().catch(console.error);
}

module.exports = {
  createTestServer,
  runRaceConditionDemo
};