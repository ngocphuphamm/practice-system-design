'use strict';

class BaseStrategy {
  // Shared contract for every rate-limiting algorithm. Each strategy stores
  // its own state and returns the updated state with the allow/deny decision.
  constructor(name, config, description) {
    this.name = name;
    this.config = config;
    this.description = description;
  }

  allow(state, now) {
    // Concrete strategies must implement this method. `now` is a timestamp
    // in milliseconds, and `state` is the previous request state for a client.
    throw new Error('allow() must be implemented by the strategy');
  }
}

module.exports = BaseStrategy;
