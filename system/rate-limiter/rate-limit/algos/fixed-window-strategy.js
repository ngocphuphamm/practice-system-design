'use strict';

const BaseStrategy = require('./base-strategy');

class FixedWindowStrategy extends BaseStrategy {
  // Fixed window: count requests inside one fixed time interval. The counter
  // resets when the clock moves into the next interval.
  constructor() {
    super('fixedWindow', { limit: 3, windowMs: 15_000 }, 'Simple and easy to understand. Good for MVPs.');
  }

  allow(state, now) {
    console.log(state);
    // Align the timestamp to the beginning of its fixed-size window.
    const windowStart = Math.floor(now / this.config.windowMs) * this.config.windowMs;

    // A new window starts with an empty counter; otherwise keep the old state.
    const nextState = (!state || state.windowStart !== windowStart)
      ? { count: 0, windowStart }
      : state;

    if (nextState.count >= this.config.limit) {
      // Once the counter reaches the limit, reject requests until the window changes.
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
