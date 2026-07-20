'use strict';

class BaseStrategy {
  constructor(name, config, description) {
    this.name = name;
    this.config = config;
    this.description = description;
  }

  allow(state, now) {
    throw new Error('allow() must be implemented by the strategy');
  }
}

module.exports = BaseStrategy;
