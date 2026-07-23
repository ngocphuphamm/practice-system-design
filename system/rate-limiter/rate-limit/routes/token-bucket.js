'use strict';

module.exports = async function handleTokenBucket(req, res, deps) {
  const { stores, strategies, getClientKey } = deps;
  const algorithm = 'tokenBucket';
  const key = getClientKey(req);
  const now = Date.now();
  const strategy = strategies[algorithm];
  const storeKey = `${algorithm}:${key}`;
  const state = await stores.get(storeKey);
  const result = strategy.allow(state, now);
  console.log(result.state);
  await stores.set(storeKey, result.state);

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
};
