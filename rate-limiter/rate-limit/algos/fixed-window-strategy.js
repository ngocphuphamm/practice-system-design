'use strict';

const BaseStrategy = require('./base-strategy');

class FixedWindowStrategy extends BaseStrategy {
  constructor() {
    super('fixedWindow', { limit: 3, windowMs: 15_000 }, 'Simple and easy to understand. Good for MVPs.');
  }

  allow(state, now) {
    const windowStart = Math.floor(now / this.config.windowMs) * this.config.windowMs;
    const nextState = (!state || state.windowStart !== windowStart)
      ? { count: 0, windowStart }
      : state;

    if (nextState.count >= this.config.limit) {
      return { allowed: false, remaining: 0, state: nextState };
    }

    nextState.count += 1;
    return {
      allowed: true,
      remaining: this.config.limit - nextState.count,
      state: nextState
    };
  }
}

module.exports = FixedWindowStrategy;
