import dotenv from 'dotenv';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
dotenv.config();

async function testPostgresEndpoints() {
  console.log('--- TESTING POSTGRESQL SYNC ENDPOINTS ---');

  try {
    // Test 1: Test Connection Endpoint
    const testRes = await fetch('http://localhost:5009/api/admin/test-postgres', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: '127.0.0.1',
        port: 5432,
        user: 'postgres',
        password: 'fake_password',
        database: 'test_db'
      })
    });
    const testData = await testRes.json();
    console.log('POST /api/admin/test-postgres Response Status:', testRes.status);
    console.log('Response Payload:', testData);

    // Test 2: Sync Endpoint Structure Test
    const syncRes = await fetch('http://localhost:5009/api/admin/sync-postgres', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: '127.0.0.1',
        port: 5432,
        user: 'postgres',
        password: 'fake_password',
        database: 'test_db'
      })
    });
    const syncData = await syncRes.json();
    console.log('POST /api/admin/sync-postgres Response Status:', syncRes.status);
    console.log('Sync Response Payload:', syncData);
  } catch (err) {
    console.error('PostgreSQL Endpoint Test Error:', err.message);
  }
}

testPostgresEndpoints();
