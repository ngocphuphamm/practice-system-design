'use strict';

const fs = require('fs');
const path = require('path');

module.exports = async function handleCheck(req, res, deps) {
  const { stores, strategies, getClientKey } = deps;
  const method = req.method || 'GET';
  try {
    const rulesPath = path.join(__dirname, '..', 'rules.json');
    const raw = fs.readFileSync(rulesPath, 'utf8');
    const rules = JSON.parse(raw);

    let payload = {};
    if (method === 'POST') {
      payload = await new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          try { resolve(body ? JSON.parse(body) : {}); } catch (e) { reject(e); }
        });
        req.on('error', reject);
      });
    } else {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      payload.clientId = url.searchParams.get('clientId') || undefined;
      payload.ip = url.searchParams.get('ip') || undefined;
      payload.endpoint = url.searchParams.get('endpoint') || undefined;
    }

    const clientKey = payload.clientId || getClientKey(req);
    const ip = payload.ip || req.socket.remoteAddress;
    const endpoint = payload.endpoint || '/';

    const now = Date.now();
    const results = [];
    let overallAllowed = true;

    for (const rule of rules) {
      let matches = false;
      switch (rule.type) {
        case 'per-user':
          matches = !rule.userId || rule.userId === clientKey;
          break;
        case 'per-ip':
          matches = !rule.ip || rule.ip === ip;
          break;
        case 'endpoint':
          matches = !rule.endpoint || rule.endpoint === endpoint;
          break;
        case 'global':
          matches = true;
          break;
        default:
          matches = false;
      }

      if (!matches) continue;

          const algorithm = rule.algorithm || 'fixedWindow';
          const strategy = strategies[algorithm];
          if (!strategy) {
            results.push({ ruleId: rule.id, error: `Unknown algorithm: ${algorithm}` });
            continue;
          }

          let scopeKey = 'global';
          if (rule.type === 'per-user') scopeKey = clientKey || 'anonymous';
          else if (rule.type === 'per-ip') scopeKey = ip || 'unknown-ip';
          else if (rule.type === 'endpoint') scopeKey = clientKey || ip || 'anonymous';

          const storeKey = `${algorithm}:rule:${rule.id}:${scopeKey}`;
          const state = stores.get(storeKey);

          const StrategyClass = strategy.constructor;
          const tempStrategy = new StrategyClass();
          if (rule.config) tempStrategy.config = Object.assign({}, tempStrategy.config, rule.config);

          const result = tempStrategy.allow(state, now);
          stores.set(storeKey, result.state);

          results.push(Object.assign({ ruleId: rule.id, type: rule.type }, result));
          if (!result.allowed) overallAllowed = false;
    }

    const response = { allowed: overallAllowed, results, timestamp: now };
    res.writeHead(overallAllowed ? 200 : 429, { 'content-type': 'application/json' });
    res.end(JSON.stringify(response));
  } catch (err) {
    res.writeHead(500, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
};
