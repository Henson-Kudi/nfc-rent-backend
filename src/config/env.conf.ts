import 'dotenv/config';

const envConf = {
  PORT: process.env.PORT || 5000,
  rootDir: process.cwd(),
  NODE_ENV: process.env.NODE_ENV || 'development',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  ACCESS_TOKEN_PRIVATE_KEY:
    process.env.ACCESS_TOKEN_PRIVATE_KEY || 'ACCESS_TOKEN_PRIVATE_KEY',
  REFRESH_TOKEN_PRIVATE_KEY:
    process.env.REFRESH_TOKEN_PRIVATE_KEY || 'REFRESH_TOKEN_PRIVATE_KEY',
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m', // 15 minutes
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d', // 7 days
  google: {
    oauthClientId: process.env.GOOGLE_AUTH_CLIENT_ID || '',
    oauthClientSecret: process.env.GOOGLE_AUTH_CLIENT_SECRET || '',
  },
  NOTIFICATION: {
    DEFAULT_EMAIL_SENDER: process.env?.DEFAULT_EMAIL_SENDER || '',
    DEFAULT_SMS_SENDER: process.env?.DEFAULT_SMS_SENDER || '',
    DEFAULT_WHATSAPP_SENDER: process.env?.DEFAULT_WHATSAPP_SENDER || '',
  },
  CRYPTO_ENCRYPTION_KEY:
    process.env?.CRYPTO_ENCRYPTION_KEY ||
    'YzIffRyYQGbp1oDbrk1eyW5xUiUUv40RY7PBFC730oE=',
  DATABASE_URL: process?.env?.DATABASE_URL || '',
  STRIPE_SECRET_KEY: process.env?.STRIPE_SECRET_KEY || '',
  FRONTEND_URL: process?.env?.FRONTEND_URL || '',
  EXCHANGE_RATES_DATA_API: process.env?.EXCHANGE_RATES_DATA_API || ''
};

export default envConf;
