async function testApi() {
  const BASE = 'http://localhost:5009/api';

  console.log('\n--- 1. Testing GET /corporate/organizations ---');
  try {
    const orgRes = await fetch(`${BASE}/corporate/organizations`);
    const data = await orgRes.json();
    console.log('Organizations returned:', data.organizations.map(o => ({ org_id: o.org_id, name: o.name, code: o.company_code })));
  } catch (e) {
    console.error('Org error:', e.message);
  }

  console.log('\n--- 2. Testing GET /corporate/departments/ORG_ALFALAH ---');
  try {
    const deptRes = await fetch(`${BASE}/corporate/departments/ORG_ALFALAH`);
    const data = await deptRes.json();
    console.log('Departments returned:', data.departments.map(d => ({ dept_id: d.dept_id, name: d.name })));
  } catch (e) {
    console.error('Dept error:', e.message);
  }

  console.log('\n--- 3. Testing Fake Staff ID 25 and Fake Dept "Ab cd" (MUST BE REJECTED) ---');
  try {
    const res = await fetch(`${BASE}/user/link-corporate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'test_intruder_user',
        companyCode: 'ALFALAH',
        employeeId: '25',
        department: 'Ab cd'
      })
    });
    const data = await res.json();
    if (res.status === 403) {
      console.log('SUCCESS! Fake Staff ID 25 was STRICTLY REJECTED with 403 Forbidden:');
      console.log('Message:', data.message);
    } else {
      console.error('Unexpected status:', res.status, data);
    }
  } catch (e) {
    console.error('Error:', e.message);
  }

  console.log('\n--- 4. Testing Genuine Staff ID BA-1001 (MUST BE VERIFIED) ---');
  try {
    const res = await fetch(`${BASE}/user/link-corporate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'test_valid_user_1',
        companyCode: 'ALFALAH',
        employeeId: 'BA-1001',
        department: 'Operations & Clearing'
      })
    });
    const data = await res.json();
    if (res.ok) {
      console.log('SUCCESS! Verified genuinely:', data.message);
      console.log('Linked user details:', data.user);
    } else {
      console.error('Genuine link error:', data);
    }
  } catch (e) {
    console.error('Error:', e.message);
  }

  console.log('\n--- 5. Testing Re-Claiming Same Staff ID BA-1001 by Another User (MUST BE REJECTED 409) ---');
  try {
    const res = await fetch(`${BASE}/user/link-corporate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'test_second_intruder',
        companyCode: 'ALFALAH',
        employeeId: 'BA-1001'
      })
    });
    const data = await res.json();
    if (res.status === 409) {
      console.log('SUCCESS! Duplicate claim rejected with 409 Conflict:');
      console.log('Message:', data.message);
    } else {
      console.error('Unexpected duplicate status:', res.status, data);
    }
  } catch (e) {
    console.error('Error:', e.message);
  }

  console.log('\n--- 6. Clean up: Unlink test user ---');
  try {
    const res = await fetch(`${BASE}/user/unlink-corporate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'test_valid_user_1' })
    });
    const data = await res.json();
    console.log('Unlink result:', data.message);
  } catch (e) {
    console.error('Unlink error:', e.message);
  }
}

testApi();
