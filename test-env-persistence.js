import dotenv from 'dotenv';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
dotenv.config();

async function testEnvPersistence() {
  console.log('--- TESTING POSTGRESQL .ENV PERSISTENCE ---');

  try {
    // 1. Switch to PostgreSQL Engine
    const switchRes = await fetch('http://localhost:5009/api/admin/switch-db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'onenet',
        password: 'Admin&86',
        targetPreset: 'rvm_postgres',
        pgHost: '127.0.0.1',
        pgPort: '5432',
        pgUser: 'postgres',
        pgPassword: 'test_password',
        pgDatabase: 'rvm_postgres'
      })
    });
    const switchData = await switchRes.json();
    console.log('Switch to PostgreSQL Engine Status:', switchRes.status, switchData.message);

    // 2. Query Health endpoint to verify DB engine type
    const healthRes = await fetch('http://localhost:5009/api/health');
    const healthData = await healthRes.json();
    console.log('Health Check Database Type:', healthData.databaseType, 'Database Name:', healthData.database);

    // 3. Switch back to ONS-RVM
    await fetch('http://localhost:5009/api/admin/switch-db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'onenet',
        password: 'Admin&86',
        targetPreset: 'ONS-RVM'
      })
    });
    console.log('Switched back to ONS-RVM cleanly.');

  } catch (err) {
    console.error('Test Error:', err.message);
  }
}

testEnvPersistence();
