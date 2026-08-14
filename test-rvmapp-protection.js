import dotenv from 'dotenv';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
dotenv.config();

async function testRvmappProtection() {
  console.log('--- TESTING RVMAPP RESTORATION DENIED PROTECTION ---');

  // 1. Switch active database to rvmapp
  try {
    console.log('1. Switching to database "rvmapp"...');
    const switchRes = await fetch('http://localhost:5000/api/admin/switch-db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'onenet', password: 'Admin&86', targetPreset: 'rvmapp' })
    });
    console.log('Switch Status:', switchRes.status);
  } catch (e) {
    console.error('Switch error:', e.message);
  }

  // 2. Attempt Restore onto rvmapp
  try {
    console.log('\n2. Attempting Database Restoration on "rvmapp"...');
    const restoreRes = await fetch('http://localhost:5000/api/db/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ backupData: { collections: {} } })
    });

    console.log('Restore HTTP Status Code:', restoreRes.status, '(Expected 403 Forbidden)');
    const restoreJson = await restoreRes.json();
    console.log('Restore Protection Response:', restoreJson);
  } catch (e) {
    console.error('Restore Error:', e.message);
  }

  // 3. Attempt Snapshot File Restore onto rvmapp
  try {
    console.log('\n3. Attempting Snapshot File Restoration on "rvmapp"...');
    const snapshotRes = await fetch('http://localhost:5000/api/db/restore-snapshot/rvmapp_backup.json', {
      method: 'POST'
    });

    console.log('Snapshot Restore HTTP Status Code:', snapshotRes.status, '(Expected 403 Forbidden)');
    const snapshotJson = await snapshotRes.json();
    console.log('Snapshot Protection Response:', snapshotJson);
  } catch (e) {
    console.error('Snapshot Error:', e.message);
  }

  // 4. Switch back to ONS-RVM
  try {
    console.log('\n4. Switching active database back to "ONS-RVM"...');
    await fetch('http://localhost:5000/api/admin/switch-db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'onenet', password: 'Admin&86', targetPreset: 'ONS-RVM' })
    });
    console.log('Switched back to ONS-RVM successfully.');
  } catch (e) {}
}

testRvmappProtection();
