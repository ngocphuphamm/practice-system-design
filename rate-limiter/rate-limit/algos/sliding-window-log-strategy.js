'use strict';

const BaseStrategy = require('./base-strategy');

class SlidingWindowLogStrategy extends BaseStrategy {
  // Sliding window log: keep every accepted request timestamp and remove
  // timestamps older than the rolling window before counting requests.
  constructor() {
    super('slidingWindowLog', { limit: 3, windowMs: 15_000 }, 'Accurate, but uses more memory.');
  }

  allow(state, now) {
    const cutoff = now - this.config.windowMs;
    const timestamps = Array.isArray(state) ? state : [];

    // Only timestamps inside the current rolling window count toward the limit.
    const recent = timestamps.filter(ts => ts > cutoff);

    console.log(state)
    console.log(timestamps)
    console.log(recent)
    console.log("==== end ====  ")
    if (recent.length >= this.config.limit) {
      // The log is full, so reject without adding a new timestamp.
      return { allowed: false, remaining: 0, state: recent };
    }

    // Accepted requests are recorded for future rolling-window checks.
    recent.push(now);
    return {
      allowed: true,
      remaining: this.config.limit - recent.length,
      state: recent
    };
  }
}

module.exports = SlidingWindowLogStrategy;
