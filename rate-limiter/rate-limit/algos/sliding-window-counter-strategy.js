'use strict';

const BaseStrategy = require('./base-strategy');

class SlidingWindowCounterStrategy extends BaseStrategy {
  constructor() {
    super('slidingWindowCounter', { limit: 3, windowMs: 15_000 }, 'Balanced accuracy and memory usage.');
  }

  allow(state, now) {
    const currentWindow = Math.floor(now / this.config.windowMs) * this.config.windowMs;

    if (!state || state.currentWindow !== currentWindow) {
      state = {
        currentWindow,
        currentCount: 0,
        previousWindow: state ? state.currentWindow : currentWindow - this.config.windowMs,
        previousCount: state ? state.currentCount : 0
      };
    }

    const elapsed = now - currentWindow;
    const ratio = Math.min(1, elapsed / this.config.windowMs);
    const estimated = state.previousCount * (1 - ratio) + state.currentCount;

    if (estimated >= this.config.limit) {
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
