module.exports = {
  apps: [
    {
      name: 'rvm-master-dashboard',
      script: './server/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5009,
        MONGODB_URI: 'mongodb+srv://aaqueelphotos_db_user:Z8NPUThldyeypEEQ@cluster0.ktted0m.mongodb.net/ONS-RVM?retryWrites=true&w=majority',
        MONGODB_DBNAME: 'ONS-RVM',
        JWT_SECRET: 'rvm-isp-production-secret-key-2026-aapanel'
      }
    }
  ]
};
