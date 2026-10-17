// PM2 process definition for the RVM-dash API server.
// SECURITY: no credentials live in this file. Every secret is read from the server's environment
// (or from the gitignored .env file, which server/index.js loads with dotenv at startup).
// Required on the host: JWT_SECRET (>= 32 random chars), PG_PASSWORD, MASTER_DEV_PASSWORD, KIOSK_API_KEY.
const sharedEnv = {
  NODE_ENV: 'production',
  PORT: process.env.PORT || 5009,
  DB_TYPE: 'postgres',
  SKIP_STARTUP_DB_INIT: process.env.SKIP_STARTUP_DB_INIT || 'true',
  PG_HOST: process.env.PG_HOST || '127.0.0.1',
  PG_PORT: process.env.PG_PORT || 5432,
  PG_USER: process.env.PG_USER || 'postgres',
  PG_PASSWORD: process.env.PG_PASSWORD,
  PG_DATABASE: process.env.PG_DATABASE || 'rvmpg',
  MONGODB_URI_ONS_RVM: process.env.MONGODB_URI_ONS_RVM,
  MONGODB_URI_RVMAPP: process.env.MONGODB_URI_RVMAPP,
  MONGODB_DBNAME: process.env.MONGODB_DBNAME || 'ONS-RVM',
  JWT_SECRET: process.env.JWT_SECRET,
  MASTER_DEV_USERNAME: process.env.MASTER_DEV_USERNAME || 'onenet',
  MASTER_DEV_PASSWORD: process.env.MASTER_DEV_PASSWORD,
  KIOSK_API_KEY: process.env.KIOSK_API_KEY,
  ENFORCE_MOBILE_AUTH: process.env.ENFORCE_MOBILE_AUTH || 'false',
  PUBLIC_BASE_URL: process.env.PUBLIC_BASE_URL || 'https://isprvm.binishaqsoft.com',
  GOOGLE_CLIENT_IDS: process.env.GOOGLE_CLIENT_IDS,
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: process.env.SMTP_PORT || '465',
  SMTP_SECURE: process.env.SMTP_SECURE || 'true',
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM: process.env.SMTP_FROM
};

module.exports = {
  apps: [
    {
      name: 'rvm-dash',
      script: './server/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: sharedEnv,
      env_production: sharedEnv
    }
  ]
};
