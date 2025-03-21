import 'dotenv/config';

const envConf = {
  PORT: process.env.PORT || 5000,
  apiBaseUrl: process.env?.API_BASE_URL || 'http://localhost:5000',
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
  STRIPE_WEBHOOK_SECRET: process.env?.STRIPE_WEBHOOK_SECRET || '',
  FRONTEND_URL: process?.env?.FRONTEND_URL || 'http://localhost:3000',
  EXCHANGE_RATES_DATA_API: process.env?.EXCHANGE_RATES_DATA_API || '',

  ethMnemonic: process.env?.ETH_MNEMONIC || '',
  ethWalletAddress: process.env.ETH_WALLET_ADDRESS || '',
  ethRpcUrl: process.env.ETH_RPC_URL || '',
  ethUsdtContractAddress: process.env.ETH_USDT_CONTRACT_ADDRESS || '',
  ethWsUrl: process.env.ETH_WS_URL || '',
  ethBasePath: process.env.ETH_BASE_PATH || '',

  tronFullHost: process.env.TRON_FULL_HOST || '',
  tronFullHostApiKey: process.env.TRON_FULL_HOST_API_KEY || '',
  tronMnemonic: process.env.TRON_MNEMONIC || '',
  tronMainWalletAddress: process.env.TRON_MAIN_WALLET_ADDRESS || '',
  tronUsdtContractAddress: process.env.TRON_USDT_CONTRACT_ADDRESS || '',
  tronBasePath: process.env.TRON_BASE_PATH || '',
  tronPrivateKey: process.env.TRON_PRIVATE_KEY || '',
  bitPay: {
    baseUrl: process.env?.BITPAY_API_URL || '',
    apiKey: process.env?.BITPAY_API_KEY || '',
  },
  coinbase: {
    baseUrl: process.env?.COINBASE_API_URL || '',
    apiKey: process.env?.COINBASE_API_KEY || '',
    webhookKey: process.env?.COINBASE_WEBHOOK_KEY || '',
  },
  pdfAdminPassword: process.env?.PDF_ADMIN_PASSWORD || 'admin@1234',
  aws: {
    s3BucketName: process.env?.AWS_S3_BUCKET_NAME || 'your-s3-bucket-name',
    s3Region: process.env?.AWS_S3_REGION || 'your-s3-region',
    s3AccessKeyId: process.env?.AWS_S3_ACCESS_KEY_ID || 'your-s3-access-key-id',
    s3SecretAccessKey:
      process.env?.AWS_S3_SECRET_ACCESS_KEY || 'your-s3-secret-access-key',
  },

  notification: {
    email: {
      defaultSender:
        process.env.DEFAULT_EMAIL_SENDER ||
        '<HK Solutions infos@hksolutions.com>',
      authUser: process.env?.EMAIL_AUTH_USER || '',
      authPass: process.env?.EMAIL_AUTH_PASSWORD || '',
    },
    sms: {
      sid: process.env?.TWILIOTWILIO_ACCOUNT_SID || '',
      authToken: process.env?.TWILIO_AUTH_TOKEN || '',
      defaultSender: process.env.DEFAULT_SMS_SENDER || '+237588629123',
    },
  },
};

export default envConf;
