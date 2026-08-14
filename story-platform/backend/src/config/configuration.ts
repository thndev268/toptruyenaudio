export default () => {
  const isProd = process.env.NODE_ENV === 'production';

  const mongodbUri = process.env.MONGODB_URI;
  if (isProd && !mongodbUri) {
    throw new Error('MONGODB_URI environment variable is required in production');
  }

  const accessSecret = process.env.JWT_ACCESS_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;

  if (isProd && (!accessSecret || !refreshSecret)) {
    throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET are required in production');
  }

  return {
    port: parseInt(process.env.PORT || '3001', 10),
    apiPrefix: process.env.API_PREFIX || '/api/v1',
    mongodbUri: mongodbUri || 'mongodb://localhost:27017/story_platform_db',
    jwt: {
      accessSecret: accessSecret || 'dev_access_secret_key_change_in_prod',
      accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
      refreshSecret: refreshSecret || 'dev_refresh_secret_key_change_in_prod',
      refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
    },
    corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
    rateLimit: {
      global: {
        ttl: parseInt(process.env.RATE_LIMIT_TTL_GLOBAL || '60000', 10),
        limit: parseInt(process.env.RATE_LIMIT_LIMIT_GLOBAL || '100', 10),
      },
      auth: {
        ttl: parseInt(process.env.RATE_LIMIT_TTL_AUTH || '60000', 10),
        limit: parseInt(process.env.RATE_LIMIT_LIMIT_AUTH || '5', 10),
      },
      support: {
        ttl: parseInt(process.env.RATE_LIMIT_TTL_SUPPORT || '60000', 10),
        limit: parseInt(process.env.RATE_LIMIT_LIMIT_SUPPORT || '20', 10),
      },
    },
  };
};
