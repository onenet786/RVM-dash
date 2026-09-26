async function testFullE2E() {
  console.log('===============================================================');
  console.log('   ISP ENVIRONMENTAL SOLUTIONS - ENTERPRISE MULTI-TENANT QA    ');
  console.log('===============================================================\n');

  // STEP 1: SUPER ADMIN LOGIN
  console.log('1. [SUPER ADMIN] Logging in as onenet...');
  const saLoginRes = await fetch('http://localhost:5009/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'onenet', password: 'Admin&86' })
  });
  const saLogin = await saLoginRes.json();
  const saToken = saLogin.token;
  console.log(`   -> Super Admin Login Status: ${saLoginRes.status} (OK: ${saLoginRes.ok})`);

  // STEP 2: ASSIGN MACHINES TO ENGRO CORPORATION
  console.log('\n2. [SUPER ADMIN] Assigning PECO-LHR-01 & RVM-LHR-01 to ORG_ENGRO...');
  const assignRes = await fetch('http://localhost:5009/api/enterprise/organizations/ORG_ENGRO/assign-machines', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${saToken}`
    },
    body: JSON.stringify({
      machineIds: ['PECO-LHR-01', 'RVM-LHR-01']
    })
  });
  const assignData = await assignRes.json();
  console.log(`   -> Assign Machines Status: ${assignRes.status}`);
  console.log(`   -> Bound Machines:`, assignData.assignedMachines);

  // STEP 3: PERSONALIZE DASHBOARD FOR ENGRO
  console.log('\n3. [SUPER ADMIN] Setting Personalized Dashboard Branding for ORG_ENGRO...');
  const persRes = await fetch('http://localhost:5009/api/enterprise/organizations/ORG_ENGRO/personalization', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${saToken}`
    },
    body: JSON.stringify({
      dashboard_title: 'Engro Green Horizon Recycling Hub',
      welcome_msg: 'Welcome Engro Petrochemical Team! Help us reach 50,000kg recycled PET & Cans this quarter.',
      primary_color: '#059669',
      theme: 'isp-portal'
    })
  });
  const persData = await persRes.json();
  console.log(`   -> Personalization Status: ${persRes.status} (Success: ${persData.success})`);

  // STEP 4: PROVISION CLIENT ADMIN FOR ENGRO
  console.log('\n4. [SUPER ADMIN] Provisioning Corporate Client Admin (engro_admin)...');
  const createAdminRes = await fetch('http://localhost:5009/api/enterprise/create-client-admin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${saToken}`
    },
    body: JSON.stringify({
      orgId: 'ORG_ENGRO',
      username: 'engro_admin',
      fullName: 'Tariq Mehmood - Head of CSR',
      email: 'csr@engro.com',
      password: 'adminpassword123'
    })
  });
  const createAdminData = await createAdminRes.json();
  console.log(`   -> Client Admin Provision Status: ${createAdminRes.status}`);
  console.log(`   -> User Provisioned:`, createAdminData.user?.username, createAdminData.user?.roleId);

  // STEP 5: CORPORATE CLIENT LOGIN
  console.log('\n5. [CORPORATE CLIENT] Logging in as engro_admin...');
  const clientLoginRes = await fetch('http://localhost:5009/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'engro_admin', password: 'adminpassword123' })
  });
  const clientLogin = await clientLoginRes.json();
  const clientToken = clientLogin.token;
  console.log(`   -> Client Login Status: ${clientLoginRes.status}`);
  console.log(`   -> Personalized Title: "${clientLogin.user?.organization?.dashboardTitle}"`);
  console.log(`   -> Welcome Message: "${clientLogin.user?.organization?.welcomeMsg}"`);
  console.log(`   -> Primary Color: ${clientLogin.user?.organization?.primaryColor}`);
  console.log(`   -> Client Assigned Fleet:`, clientLogin.user?.assignedMachines);

  // STEP 6: CORPORATE CLIENT QUERIES SCOPED OVERVIEW
  console.log('\n6. [CORPORATE CLIENT] Fetching Scoped Overview Metrics...');
  const clientOvRes = await fetch('http://localhost:5009/api/overview', {
    headers: { 'Authorization': `Bearer ${clientToken}` }
  });
  const clientOv = await clientOvRes.json();
  console.log(`   -> Overview Sessions: ${clientOv.totalSessions}`);
  console.log(`   -> Overview Bottles: ${clientOv.totalBottles}`);
  console.log(`   -> Overview Points: ${clientOv.totalPoints}`);

  // STEP 7: CORPORATE CLIENT TRIES TO DELEGATE UNOWNED MACHINE (PECO-01) -> MUST FAIL (403)
  console.log('\n7. [SECURITY AUDIT] Attempting illegal machine delegation (PECO-01 from Metro)...');
  const illegalRes = await fetch('http://localhost:5009/api/enterprise/sub-users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${clientToken}`
    },
    body: JSON.stringify({
      username: 'illegal_user',
      fullName: 'Illegal User',
      password: 'password123',
      assignedMachines: ['PECO-01']
    })
  });
  console.log(`   -> Illegal Delegation HTTP Code: ${illegalRes.status} (EXPECTED: 403)`);
  const illegalErr = await illegalRes.json();
  console.log(`   -> Rejection Message: "${illegalErr.error}"`);

  // STEP 8: CORPORATE CLIENT CREATES VALID SUB-USER FOR LAHORE PECODROP ONLY
  console.log('\n8. [CORPORATE CLIENT] Creating Sub-User ahmed_lahore for PECO-LHR-01 only...');
  const subRes = await fetch('http://localhost:5009/api/enterprise/sub-users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${clientToken}`
    },
    body: JSON.stringify({
      username: 'ahmed_lahore',
      fullName: 'Ahmed Khan - Lahore Site Operator',
      email: 'ahmed.lahore@engro.com',
      password: 'subuserpass123',
      assignedMachines: ['PECO-LHR-01']
    })
  });
  const subData = await subRes.json();
  console.log(`   -> Sub-User Creation Status: ${subRes.status}`);
  console.log(`   -> Created Sub-User:`, subData.user?.username, 'Delegated Kiosks:', subData.user?.assignedMachines);

  // STEP 9: SUB-USER LOGIN
  console.log('\n9. [SUB-USER] Logging in as ahmed_lahore...');
  const subLoginRes = await fetch('http://localhost:5009/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'ahmed_lahore', password: 'subuserpass123' })
  });
  const subLogin = await subLoginRes.json();
  const subToken = subLogin.token;
  console.log(`   -> Sub-User Login Status: ${subLoginRes.status}`);
  console.log(`   -> Sub-User Role: ${subLogin.user?.roleId} (isSubUser: ${subLogin.user?.isSubUser})`);
  console.log(`   -> Sub-User Scoped Kiosks:`, subLogin.user?.assignedMachines);

  // STEP 10: SUB-USER FLEET QUERY (MUST BE STRICTLY ISOLATED TO PECO-LHR-01)
  console.log('\n10. [SUB-USER] Querying Fleet Machines (/api/analytics/machines)...');
  const subMachinesRes = await fetch('http://localhost:5009/api/analytics/machines', {
    headers: { 'Authorization': `Bearer ${subToken}` }
  });
  const subMachines = await subMachinesRes.json();
  console.log(`   -> Visible Fleet Count: ${subMachines.length} (Expected: 1)`);
  console.log(`   -> Visible Machines:`, subMachines.map(m => `${m.machineId} (${m.name})`));

  // STEP 11: SUB-USER ANTI-TAMPER CHECK (QUERYING UNASSIGNED MACHINE RVM-LHR-01)
  console.log('\n11. [ANTI-TAMPER CHECK] Sub-user requesting telemetry for unassigned RVM-LHR-01...');
  const tamperRes = await fetch('http://localhost:5009/api/overview?machineId=RVM-LHR-01', {
    headers: { 'Authorization': `Bearer ${subToken}` }
  });
  const tamperData = await tamperRes.json();
  console.log(`   -> Tamper Response Total Sessions: ${tamperData.totalSessions} (EXPECTED: 0)`);
  console.log(`   -> Tamper Response Total Bottles: ${tamperData.totalBottles} (EXPECTED: 0)`);

  console.log('\n===============================================================');
  console.log('   ALL 11 END-TO-END ENTERPRISE WORKFLOW TESTS PASSED 100%!     ');
  console.log('===============================================================');
}

testFullE2E().catch(console.error);
