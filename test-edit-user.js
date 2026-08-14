import dotenv from 'dotenv';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
dotenv.config();

async function testEditUserPassword() {
  console.log('--- TESTING EDIT USER INFO & CHANGE PASSWORD API ---');

  try {
    const res = await fetch('http://localhost:5000/api/security/users/operator_lahore', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Lahore Senior RVM Operations Lead',
        email: 'lahore.lead@rvm-dash.io',
        password: 'NewSecurePassword123!',
        roleId: 'fleet_operator',
        assignedMachines: ['RVM-PK-01', 'RVM-PK-02', 'RVM-PK-03'],
        status: 'active'
      })
    });

    const json = await res.json();
    console.log('Edit User Response:', json);

    // Fetch users list to verify update
    const usersRes = await fetch('http://localhost:5000/api/security/users');
    const users = await usersRes.json();
    const updated = users.find(u => u.username === 'operator_lahore');
    console.log('\nVerified Updated User in Database:');
    console.log('  Username:', updated.username);
    console.log('  Full Name:', updated.fullName);
    console.log('  Email:', updated.email);
    console.log('  Assigned Machines:', updated.assignedMachines);
    console.log('  Password Updated At:', updated.passwordUpdatedAt);
  } catch (err) {
    console.error('Test Edit Error:', err.message);
  }
}

testEditUserPassword();
