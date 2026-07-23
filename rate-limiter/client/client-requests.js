'use strict';

const http = require('http');

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:3000';
const clientId = process.env.CLIENT_ID || 'demo-user';

function request(path) {
  return new Promise((resolve, reject) => {
    const req = http.request(`${baseUrl}${path}`, {
      method: 'GET',
      headers: { 'x-client-id': clientId }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          resolve({ raw: body });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function runScenario(label, path) {
  console.log(`\n=== ${label} ===`);
  for (let i = 1; i <= 5; i += 1) {
    const result = await request(path);
    console.log(`${i}. ${result.allowed ? 'ALLOWED' : 'REJECTED'} -> remaining ${result.remaining}`);
  }
}

(async () => {
  try {
    // await runScenario('Fixed Window Counter', '/fixed-window');
    await runScenario('Sliding Window Log', '/sliding-window-log');
    // await runScenario('Sliding Window Counter', '/sliding-window-counter');
    // await runScenario('Token Bucket', '/token-bucket');
  } catch (error) {
    console.error('Client error:', error.message);
  }
})();
