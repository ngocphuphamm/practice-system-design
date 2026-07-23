'use strict';

const DEFAULT_TTL_SECONDS = 60 * 60;

class RedisStore {
  constructor(client, ttlSeconds = DEFAULT_TTL_SECONDS) {
    this.client = client;
    this.ttlSeconds = ttlSeconds;
  }

  async get(key) {
    const fields = await this.client.hGetAll(key);
    if (Object.keys(fields).length === 0) return undefined;

    if (fields.value !== undefined) {
      return JSON.parse(fields.value);
    }

    return Object.fromEntries(Object.entries(fields).map(([field, value]) => [
      field,
      Number.isNaN(Number(value)) ? value : Number(value)
    ]));
  }

  async set(key, state) {
    const fields = Array.isArray(state)
      ? { value: JSON.stringify(state) }
      : Object.fromEntries(Object.entries(state).map(([field, value]) => [
        field,
        String(value)
      ]));

    // Keep state update and expiry in one Redis transaction.
    await this.client.multi()
      .hSet(key, fields)
      .expire(key, this.ttlSeconds)
      .exec();
  }
}

module.exports = RedisStore;