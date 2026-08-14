import dotenv from 'dotenv';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
dotenv.config();

async function testMachineDropdownAssignment() {
  console.log('--- TESTING RVM MACHINE DROPDOWN MULTI-SELECT ASSIGNMENT ---');

  try {
    const res = await fetch('http://localhost:5000/api/security/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'operator_multiselect',
        fullName: 'Multi-Machine Fleet Specialist',
        email: 'multi.ops@rvm-dash.io',
        roleId: 'fleet_operator',
        assignedMachines: ['RVM-PK-01', 'RVM-PK-02', 'RVM-001', 'RVM-KHI-01']
      })
    });

    const json = await res.json();
    console.log('Create User with Dropdown Machines Response:', json);
  } catch (err) {
    console.error('Test Error:', err.message);
  }
}

testMachineDropdownAssignment();
