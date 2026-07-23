const test = require('node:test');
const assert = require('node:assert/strict');
const { getConfig } = require('../src/config');

test('loads MySQL and retry configuration from environment', () => {
  const config = getConfig({
    PORT: '4000',
    MYSQL_HOST: 'mysql',
    MYSQL_PORT: '3307',
    MYSQL_USER: 'cms',
    MYSQL_PASSWORD: 'secret',
    MYSQL_DATABASE: 'cms_test',
    OPTIMISTIC_LOCK_MAX_ATTEMPTS: '5'
  });

  assert.equal(config.port, 4000);
  assert.equal(config.mysql.host, 'mysql');
  assert.equal(config.mysql.port, 3307);
  assert.equal(config.mysql.database, 'cms_test');
  assert.equal(config.maxAttempts, 5);
});
