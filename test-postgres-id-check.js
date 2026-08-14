import dotenv from 'dotenv';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
dotenv.config();

async function testPostgresIdCheck() {
  console.log('--- TESTING POSTGRESQL NON-NULL ID GENERATION & FETCH ---');

  try {
    // 1. Switch to PostgreSQL Engine
    await fetch('http://localhost:5009/api/admin/switch-db', {
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

    // 2. Create User pral
    const createRes = await fetch('http://localhost:5009/api/security/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'pral',
        fullName: 'pral',
        email: 'pral@123.co',
        roleId: 'fleet_operator',
        assignedMachines: ['RVM-001']
      })
    });
    console.log('Create User pral Status:', createRes.status);

    // 3. Fetch Users from PostgreSQL
    const usersRes = await fetch('http://localhost:5009/api/security/users');
    const usersData = await usersRes.json();
    console.log('PostgreSQL Users List IDs:', usersData.map(u => ({ username: u.username, _id: u._id, id: u.id })));

    // 4. Delete pral user
    await fetch('http://localhost:5009/api/security/users/pral', { method: 'DELETE' });

    // 5. Switch back to ONS-RVM
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

testPostgresIdCheck();
