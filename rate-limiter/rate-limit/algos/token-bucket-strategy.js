'use strict';

const BaseStrategy = require('./base-strategy');

class TokenBucketStrategy extends BaseStrategy {
  constructor() {
    super('tokenBucket', { limit: 3, windowMs: 15_000 }, 'Good for bursty traffic with a steady long-term average.');
  }

  allow(state, now) {
    const maxTokens = this.config.limit;
    const refillRate = maxTokens / (this.config.windowMs / 1000);

    if (!state) {
      state = { tokens: maxTokens, lastRefill: now };
    }

    const elapsed = (now - state.lastRefill) / 1000;
    state.tokens = Math.min(maxTokens, state.tokens + elapsed * refillRate);
    state.lastRefill = now;

    if (state.tokens < 1) {
      return { allowed: false, remaining: 0, state };
    }

    state.tokens -= 1;
    return {
      allowed: true,
      remaining: Math.max(0, Math.floor(state.tokens)),
      state
    };
  }
}

module.exports = TokenBucketStrategy;
