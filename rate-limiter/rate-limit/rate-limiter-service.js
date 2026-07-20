'use strict';

const http = require('http');
const path = require('path');

const FixedWindowStrategy = require('./algos/fixed-window-strategy');
const SlidingWindowLogStrategy = require('./algos/sliding-window-log-strategy');
const SlidingWindowCounterStrategy = require('./algos/sliding-window-counter-strategy');
const TokenBucketStrategy = require('./algos/token-bucket-strategy');

const PORT = process.env.PORT || 3000;

const strategies = {
  fixedWindow: new FixedWindowStrategy(),
  slidingWindowLog: new SlidingWindowLogStrategy(),
  slidingWindowCounter: new SlidingWindowCounterStrategy(),
  tokenBucket: new TokenBucketStrategy()
};

const stores = new Map();

function getClientKey(req) {
  return req.headers['x-client-id'] || req.headers['x-user-id'] || req.socket.remoteAddress || 'anonymous';
}

function handleRateLimit(req, res, key, algorithm) {
  const now = Date.now();
  const strategy = strategies[algorithm];
  const state = stores.get(`${algorithm}:${key}`);
  const result = strategy.allow(state, now);

  stores.set(`${algorithm}:${key}`, result.state);

  const response = {
    algorithm,
    client: key,
    allowed: result.allowed,
    remaining: result.remaining,
    description: strategy.description,
    limit: strategy.config.limit,
    timestamp: now
  };

  res.writeHead(result.allowed ? 200 : 429, { 'content-type': 'application/json' });
  res.end(JSON.stringify(response));
}

function server(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathName = url.pathname;

  if (pathName === '/') {
    res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Rate limiter learning service. Try /fixed-window, /sliding-window-log, /sliding-window-counter, or /token-bucket');
    return;
  }

  const routeMap = {
    '/fixed-window': 'fixedWindow',
    '/sliding-window-log': 'slidingWindowLog',
    '/sliding-window-counter': 'slidingWindowCounter',
    '/token-bucket': 'tokenBucket'
  };

  const algorithm = routeMap[pathName];
  if (algorithm) {
    handleRateLimit(req, res, getClientKey(req), algorithm);
    return;
  }

  res.writeHead(404, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
}

const app = http.createServer(server);
app.listen(PORT, () => {
  console.log(`Rate limiter service listening on http://127.0.0.1:${PORT}`);
  console.log('Try:');
  console.log(`  - http://127.0.0.1:${PORT}/fixed-window`);
  console.log(`  - http://127.0.0.1:${PORT}/sliding-window-log`);
  console.log(`  - http://127.0.0.1:${PORT}/sliding-window-counter`);
  console.log(`  - http://127.0.0.1:${PORT}/token-bucket`);
});
