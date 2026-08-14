import dotenv from 'dotenv';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
dotenv.config();

async function testOneWayDatabaseSync() {
  console.log('--- TESTING ONE-WAY DATABASE SYNC (rvmapp -> ONS-RVM) ---');

  try {
    const res = await fetch('http://localhost:5000/api/admin/sync-databases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'onenet',
        password: 'Admin&86',
        syncMode: 'upsert'
      })
    });

    const json = await res.json();
    console.log('Sync Response Status:', res.status);
    console.log('Sync Message:', json.message);
    console.log('Total Collections Synced:', json.totalCollectionsSynced);
    console.log('Total Documents Synced:', json.totalDocumentsSynced);
    console.log('\nCollection Sync Breakdown:');
    if (json.syncDetails) {
      json.syncDetails.forEach(d => console.log(`  • ${d.name.padEnd(25)} | Docs: ${String(d.count).padStart(5)} | Status: ${d.status}`));
    }
  } catch (err) {
    console.error('Test Sync Error:', err.message);
  }
}

testOneWayDatabaseSync();
