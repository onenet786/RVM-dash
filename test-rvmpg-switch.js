import dotenv from 'dotenv';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
dotenv.config();

async function testRvmpgSwitch() {
  console.log('--- TESTING SWITCH TO POSTGRESQL DATABASE "rvmpg" ---');

  try {
    // 1. Switch active database engine to PostgreSQL database "rvmpg"
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
        pgDatabase: 'rvmpg'
      })
    });
    const switchData = await switchRes.json();
    console.log('Switch to rvmpg Status:', switchRes.status, switchData.message);

    // 2. Fetch Users list from rvmpg database
    const usersRes = await fetch('http://localhost:5009/api/security/users');
    const usersData = await usersRes.json();
    console.log('rvmpg Admin Accounts List:', usersData.map(u => ({ username: u.username, email: u.email, role: u.roleName })));

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

testRvmpgSwitch();
