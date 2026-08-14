import dotenv from 'dotenv';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
dotenv.config();

async function testPostgresSwitch() {
  console.log('--- TESTING POSTGRESQL SWITCH DATABASE ENDPOINT ---');

  try {
    const res = await fetch('http://localhost:5009/api/admin/switch-db', {
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
    const data = await res.json();
    console.log('POST /api/admin/switch-db Status:', res.status);
    console.log('Response Payload:', data);
  } catch (err) {
    console.error('PostgreSQL Switch Test Error:', err.message);
  }
}

testPostgresSwitch();
