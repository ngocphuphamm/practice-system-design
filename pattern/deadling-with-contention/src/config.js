function getConfig(environment = process.env) {
  return {
    port: Number(environment.PORT || 3000),
    mysql: {
      host: environment.MYSQL_HOST || '127.0.0.1',
      port: Number(environment.MYSQL_PORT || 3306),
      user: environment.MYSQL_USER || 'root',
      password: environment.MYSQL_PASSWORD || '',
      database: environment.MYSQL_DATABASE || 'contention_cms',
      connectionLimit: Number(environment.MYSQL_CONNECTION_LIMIT || 10)
    },
    maxAttempts: Number(environment.OPTIMISTIC_LOCK_MAX_ATTEMPTS || 3)
  };
}

module.exports = { getConfig };
