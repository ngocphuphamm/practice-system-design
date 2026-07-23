'use strict';

const BaseStrategy = require('./base-strategy');

class SlidingWindowCounterStrategy extends BaseStrategy {
  // Sliding window counter: keep counts for the current and previous fixed
  // windows, then weight the previous count by how much of it still overlaps.
  constructor() {
    super('slidingWindowCounter', { limit: 3, windowMs: 15_000 }, 'Balanced accuracy and memory usage.');
  }

  allow(state, now) {
    // The current fixed window is used as a compact time reference.
    const currentWindow = Math.floor(now / this.config.windowMs) * this.config.windowMs;

    if (!state || state.currentWindow !== currentWindow) {
      // Move the old current count into the previous-window slot as time advances.
      state = {
        currentWindow,
        currentCount: 0,
        previousWindow: state ? state.currentWindow : currentWindow - this.config.windowMs,
        previousCount: state ? state.currentCount : 0
      };
    }

    const elapsed = now - currentWindow;
    const ratio = Math.min(1, elapsed / this.config.windowMs);
    // As the current window progresses, less of the previous window is counted.
    const estimated = state.previousCount * (1 - ratio) + state.currentCount;

    if (estimated >= this.config.limit) {
      // The weighted estimate has reached the configured request limit.
      return { allowed: false, remaining: 0, state };
    }

    state.currentCount += 1;
    return {
      allowed: true,
      remaining: Math.max(0, this.config.limit - Math.ceil(estimated + 1)),
      state
    };
  }
}

module.exports = SlidingWindowCounterStrategy;
