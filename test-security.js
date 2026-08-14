import dotenv from 'dotenv';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
dotenv.config();

async function testSecurityRBAC() {
  console.log('--- TESTING SECURITY & RBAC REST ENDPOINTS ---');

  // 1. Fetch Roles
  try {
    const rolesRes = await fetch('http://localhost:5000/api/security/roles');
    const roles = await rolesRes.json();
    console.log('Roles Count:', roles.length);
    console.log('Sample Role:', roles[0].name, '-> Modules:', roles[0].modules);
  } catch (err) {
    console.error('Fetch Roles Error:', err.message);
  }

  // 2. Fetch User Accounts
  try {
    const usersRes = await fetch('http://localhost:5000/api/security/users');
    const users = await usersRes.json();
    console.log('\nUsers Count:', users.length);
    users.forEach(u => console.log(`  • ${u.username} (${u.fullName}) -> Role: ${u.roleName || u.roleId} | Machines: ${u.assignedMachines?.join(', ')}`));
  } catch (err) {
    console.error('Fetch Users Error:', err.message);
  }

  // 3. Create a new test Operator User
  try {
    console.log('\n--- Creating New RVM Machine Operator Account ---');
    const createRes = await fetch('http://localhost:5000/api/security/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'operator_karachi',
        fullName: 'Karachi Central RVM Technician',
        email: 'karachi.rvm@rvm-dash.io',
        roleId: 'fleet_operator',
        assignedMachines: ['RVM-KHI-01', 'RVM-KHI-02']
      })
    });

    const createJson = await createRes.json();
    console.log('Create User Response:', createJson);
  } catch (err) {
    console.error('Create User Error:', err.message);
  }
}

testSecurityRBAC();
