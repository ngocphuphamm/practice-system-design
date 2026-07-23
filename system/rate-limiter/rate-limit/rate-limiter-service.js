'use strict';

const http = require('http');
const { createClient } = require('redis');
const RedisStore = require('./redis-store');

const PORT = process.env.PORT || 3000;

const FixedWindowStrategy = require('./algos/fixed-window-strategy');
const SlidingWindowLogStrategy = require('./algos/sliding-window-log-strategy');
const SlidingWindowCounterStrategy = require('./algos/sliding-window-counter-strategy');
const TokenBucketStrategy = require('./algos/token-bucket-strategy');

// route handlers
const routes = {
  '/fixed-window': require('./routes/fixed-window'),
  '/sliding-window-log': require('./routes/sliding-window-log'),
  '/sliding-window-counter': require('./routes/sliding-window-counter'),
  '/token-bucket': require('./routes/token-bucket'),
  '/check': require('./routes/check')
};

const strategies = {
  fixedWindow: new FixedWindowStrategy(),
  slidingWindowLog: new SlidingWindowLogStrategy(),
  slidingWindowCounter: new SlidingWindowCounterStrategy(),
  tokenBucket: new TokenBucketStrategy()
};

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
});
redisClient.on('error', error => console.error('Redis client error:', error.message));
const stores = new RedisStore(redisClient);

function getClientKey(req) {
  return req.headers['x-client-id'] || req.headers['x-user-id'] || req.socket.remoteAddress || 'anonymous';
}

async function server(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathName = url.pathname;

  if (pathName === '/') {
    res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Rate limiter learning service. Try /fixed-window, /sliding-window-log, /sliding-window-counter, or /token-bucket');
    return;
  }

  const routeHandler = routes[pathName];
  if (routeHandler) {
    // delegate to route handler, passing dependencies (including strategies)
   
    try {
      await routeHandler(req, res, { stores, strategies, getClientKey });
    } catch (error) {
      res.writeHead(500, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  res.writeHead(404, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
}


const app = http.createServer(server);
redisClient.connect().then(() => {
  app.listen(PORT, () => {
    console.log(`Rate limiter service listening on http://127.0.0.1:${PORT}`);
    console.log(`Redis state store connected at ${process.env.REDIS_URL || 'redis://127.0.0.1:6379'}`);
  });
  console.log('Try:');
  console.log(`  - http://127.0.0.1:${PORT}/fixed-window`);
  console.log(`  - http://127.0.0.1:${PORT}/sliding-window-log`);
  console.log(`  - http://127.0.0.1:${PORT}/sliding-window-counter`);
  console.log(`  - http://127.0.0.1:${PORT}/token-bucket`);
  console.log(`  - http://127.0.0.1:${PORT}/check  (POST JSON { clientId, ip, endpoint } or GET params)`);
}).catch(error => {
  console.error('Could not connect to Redis:', error.message);
  process.exitCode = 1;
});
