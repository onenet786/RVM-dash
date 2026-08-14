import dotenv from 'dotenv';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
dotenv.config();

async function testPostgresCRUD() {
  console.log('--- TESTING POSTGRESQL INSERT, UPDATE, DELETE WRITES ---');

  try {
    // 1. Switch active database engine to PostgreSQL
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

    // 2. Test INSERT on PostgreSQL: Create User
    const createRes = await fetch('http://localhost:5009/api/security/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'pg_operator_test',
        fullName: 'PostgreSQL Test User',
        email: 'pg.test@rvm-dash.io',
        roleId: 'fleet_operator',
        assignedMachines: ['RVM-PK-01']
      })
    });
    const createData = await createRes.json();
    console.log('PostgreSQL INSERT User Status:', createRes.status, createData);

    // 3. Test UPDATE on PostgreSQL: Update User
    const updateRes = await fetch('http://localhost:5009/api/security/users/pg_operator_test', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'PostgreSQL Test User Updated',
        status: 'active'
      })
    });
    const updateData = await updateRes.json();
    console.log('PostgreSQL UPDATE User Status:', updateRes.status, updateData);

    // 4. Test DELETE on PostgreSQL: Delete User
    const deleteRes = await fetch('http://localhost:5009/api/security/users/pg_operator_test', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    const deleteData = await deleteRes.json();
    console.log('PostgreSQL DELETE User Status:', deleteRes.status, deleteData);

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
    console.error('PostgreSQL CRUD Test Error:', err.message);
  }
}

testPostgresCRUD();
