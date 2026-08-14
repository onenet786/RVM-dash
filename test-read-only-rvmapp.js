import dotenv from 'dotenv';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
dotenv.config();

async function testReadOnlyRvmapp() {
  console.log('--- TESTING READ-ONLY PROTECTION ON RVMAPP ---');

  try {
    // 1. Switch active database to rvmapp
    const switchRes = await fetch('http://localhost:5009/api/admin/switch-db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'onenet',
        password: 'Admin&86',
        targetPreset: 'rvmapp'
      })
    });
    const switchData = await switchRes.json();
    console.log('Switch to rvmapp Status:', switchRes.status, switchData.message);

    // 2. Attempt to create a user on rvmapp (MUST BE BLOCKED 403)
    const userRes = await fetch('http://localhost:5009/api/security/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'illegal_user_test',
        roleId: 'fleet_operator'
      })
    });
    const userData = await userRes.json();
    console.log('Create User on rvmapp Status (EXPECT 403):', userRes.status, userData);

    // 3. Attempt to restore database on rvmapp (MUST BE BLOCKED 403)
    const restoreRes = await fetch('http://localhost:5009/api/db/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        backupData: { collections: {} }
      })
    });
    const restoreData = await restoreRes.json();
    console.log('Restore Database on rvmapp Status (EXPECT 403):', restoreRes.status, restoreData);

    // 4. Switch back to ONS-RVM
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
    console.error('Read-Only Test Error:', err.message);
  }
}

testReadOnlyRvmapp();
