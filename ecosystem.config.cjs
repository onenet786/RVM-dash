module.exports = {
  apps: [
    {
      name: 'rvm-dash',
      script: './server/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 5009,
        DB_TYPE: 'postgres',
        PG_HOST: '127.0.0.1',
        PG_PORT: 5432,
        PG_USER: 'postgres',
        PG_PASSWORD: 'Admin786',
        PG_DATABASE: 'rvmpg',
        MONGODB_URI: 'mongodb+srv://aaqueelphotos_db_user:Z8NPUThldyeypEEQ@cluster0.ktted0m.mongodb.net/ONS-RVM?retryWrites=true&w=majority',
        MONGODB_DBNAME: 'ONS-RVM',
        JWT_SECRET: 'rvm-isp-production-secret-key-2026-aapanel'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5009,
        DB_TYPE: 'postgres',
        PG_HOST: '127.0.0.1',
        PG_PORT: 5432,
        PG_USER: 'postgres',
        PG_PASSWORD: 'Admin786',
        PG_DATABASE: 'rvmpg',
        MONGODB_URI: 'mongodb+srv://aaqueelphotos_db_user:Z8NPUThldyeypEEQ@cluster0.ktted0m.mongodb.net/ONS-RVM?retryWrites=true&w=majority',
        MONGODB_DBNAME: 'ONS-RVM',
        JWT_SECRET: 'rvm-isp-production-secret-key-2026-aapanel'
      }
    }
  ]
};
