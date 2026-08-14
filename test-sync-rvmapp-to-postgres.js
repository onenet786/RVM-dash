import dotenv from 'dotenv';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
dotenv.config();

async function testSyncRvmappToPostgres() {
  console.log('--- TESTING SYNC FROM MONGODB "rvmapp" TO POSTGRESQL "rvmpg" ---');

  try {
    const syncRes = await fetch('http://localhost:5009/api/admin/sync-postgres', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pgHost: '127.0.0.1',
        pgPort: '5432',
        pgUser: 'postgres',
        pgPassword: 'test_password',
        pgDatabase: 'rvmpg',
        mongoSourcePreset: 'rvmapp'
      })
    });

    const syncData = await syncRes.json();
    console.log('Sync Status:', syncRes.status);
    console.log('Sync Response Message:', syncData.message);
    console.log('Synced Tables:', JSON.stringify(syncData.syncedTables, null, 2));

  } catch (err) {
    console.error('Sync Test Error:', err.message);
  }
}

testSyncRvmappToPostgres();
