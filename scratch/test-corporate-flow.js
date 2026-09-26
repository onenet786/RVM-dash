async function runCorporateWorkflowTest() {
  console.log('=== 1. LOGGING IN AS CORPORATE CLIENT (engro_admin) ===');
  const loginRes = await fetch('http://localhost:5009/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'engro_admin', password: 'adminpassword' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('Login status:', loginRes.status, 'Client Admin Org:', loginData.user?.organization?.name);
  console.log('Assigned Machines:', loginData.user?.assignedMachines);

  console.log('\n=== 2. QUERYING OVERVIEW WITH CORPORATE CLIENT TOKEN ===');
  const ovRes = await fetch('http://localhost:5009/api/overview', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const ovData = await ovRes.json();
  console.log('Overview Metrics for Engro (PECO-LHR-01 only):');
  console.log('  • Scoped Sessions:', ovData.totalSessions);
  console.log('  • Scoped Bottles:', ovData.totalBottles);
  console.log('  • Scoped Points:', ovData.totalPoints);
  console.log('  • Scoped Paper (g):', ovData.totalPaperGrams);

  console.log('\n=== 3. CORPORATE CLIENT ASSIGNING ILLEGAL MACHINE (PECO-01 from Metro) ===');
  const illegalRes = await fetch('http://localhost:5009/api/enterprise/sub-users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      username: 'hacker_subuser',
      fullName: 'Intruder',
      email: 'intruder@test.com',
      password: 'password123',
      assignedMachines: ['PECO-01'] // NOT owned by Engro!
    })
  });
  const illegalData = await illegalRes.json();
  console.log('Illegal delegation status:', illegalRes.status, 'Expected: 403');
  console.log('Response error message:', illegalData.error);

  console.log('\n=== 4. CORPORATE CLIENT CREATING VALID SUB-USER (ahmed_lahore -> PECO-LHR-01) ===');
  const validSubRes = await fetch('http://localhost:5009/api/enterprise/sub-users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      username: 'ahmed_lahore',
      fullName: 'Ahmed Khan - Lahore Site Operator',
      email: 'ahmed.lahore@engro.com',
      password: 'subuserpass123',
      assignedMachines: ['PECO-LHR-01']
    })
  });
  const validSubData = await validSubRes.json();
  console.log('Valid sub-user creation status:', validSubRes.status);
  console.log('Sub-User created:', validSubData.user);

  console.log('\n=== 5. SUB-USER LOGGING IN (ahmed_lahore) ===');
  const subLoginRes = await fetch('http://localhost:5009/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'ahmed_lahore', password: 'subuserpass123' })
  });
  const subLoginData = await subLoginRes.json();
  const subToken = subLoginData.token;
  console.log('Sub-User logged in! Role:', subLoginData.user?.roleId, 'isSubUser:', subLoginData.user?.isSubUser);
  console.log('Sub-User assigned machines:', subLoginData.user?.assignedMachines);

  console.log('\n=== 6. SUB-USER QUERYING FLEET MACHINES (Should see ONLY PECO-LHR-01) ===');
  const subMRes = await fetch('http://localhost:5009/api/analytics/machines', {
    headers: { 'Authorization': `Bearer ${subToken}` }
  });
  const subMachines = await subMRes.json();
  console.log('Sub-User visible machines:', subMachines.map(m => `${m.machineId} (${m.name})`));

  console.log('\n=== 7. SUB-USER ATTEMPTING TO QUERY METRO MACHINE (Anti-tamper test) ===');
  const tamperRes = await fetch('http://localhost:5009/api/overview?machineId=PECO-01', {
    headers: { 'Authorization': `Bearer ${subToken}` }
  });
  const tamperData = await tamperRes.json();
  console.log('Tamper overview total sessions (Expected 0):', tamperData.totalSessions);
  console.log('Tamper overview total bottles (Expected 0):', tamperData.totalBottles);
}

runCorporateWorkflowTest().catch(console.error);
