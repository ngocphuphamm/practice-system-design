'use strict';

const BaseStrategy = require('./base-strategy');

class TokenBucketStrategy extends BaseStrategy {
  // Token bucket: tokens accumulate over time up to a maximum. Each accepted
  // request spends one token, allowing short bursts while limiting the average rate.
  constructor() {
    super('tokenBucket', { limit: 3, windowMs: 15_000 }, 'Good for bursty traffic with a steady long-term average.');
  }

  allow(state, now) {
    const maxTokens = this.config.limit;
    const refillRate = maxTokens / (this.config.windowMs / 1000);
    
    if (!state) {
      // A new client starts with a full bucket, so it can use its initial burst.
      state = { tokens: maxTokens, last_refill: now };
    }

    const elapsed = (now - state.last_refill) / 1000;
    // Refill proportionally to elapsed time, but never exceed bucket capacity.
    state.tokens = Math.min(maxTokens, state.tokens + elapsed * refillRate);
    state.last_refill = now;

    if (state.tokens < 1) {
      // No complete token is available, so the request must wait for a refill.
      return { allowed: false, remaining: 0, state };
    }

    // An accepted request consumes one token.
    state.tokens -= 1;
    return {
      allowed: true,
      remaining: Math.max(0, Math.floor(state.tokens)),
      state
    };
  }
}

module.exports = TokenBucketStrategy;
