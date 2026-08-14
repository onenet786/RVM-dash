import dotenv from 'dotenv';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
dotenv.config();

async function testPostgresSingleIdCheck() {
  console.log('--- TESTING SINGLE _ID PROPERTY FOR POSTGRESQL USERS ---');

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

    // 2. Create User test_single_id
    const createRes = await fetch('http://localhost:5009/api/security/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'test_single_id',
        fullName: 'Test Single ID User',
        email: 'singleid@123.co',
        roleId: 'fleet_operator',
        assignedMachines: ['RVM-001']
      })
    });
    const createData = await createRes.json();
    console.log('Created User Object Keys:', Object.keys(createData.user));
    console.log('User _id:', createData.user._id);
    console.log('User id:', createData.user.id);

    // 3. Delete test_single_id user
    await fetch('http://localhost:5009/api/security/users/test_single_id', { method: 'DELETE' });

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
    console.error('Test Error:', err.message);
  }
}

testPostgresSingleIdCheck();
