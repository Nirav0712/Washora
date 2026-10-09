export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 4000,
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/washora',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'washora_access_default_secret_key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'washora_refresh_default_secret_key',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
});
