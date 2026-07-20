'use strict';

const BaseStrategy = require('./base-strategy');

class SlidingWindowLogStrategy extends BaseStrategy {
  constructor() {
    super('slidingWindowLog', { limit: 3, windowMs: 15_000 }, 'Accurate, but uses more memory.');
  }

  allow(state, now) {
    const cutoff = now - this.config.windowMs;
    const timestamps = Array.isArray(state) ? state : [];
    const recent = timestamps.filter(ts => ts > cutoff);

    if (recent.length >= this.config.limit) {
      return { allowed: false, remaining: 0, state: recent };
    }

    recent.push(now);
    return {
      allowed: true,
      remaining: this.config.limit - recent.length,
      state: recent
    };
  }
}

module.exports = SlidingWindowLogStrategy;
