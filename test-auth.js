import dotenv from 'dotenv';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
dotenv.config();

async function testAuthenticationFlow() {
  console.log('--- TESTING AUTHENTICATION & LOGIN/LOGOUT REST APIS ---');

  // 1. Test Master Developer Login
  try {
    console.log('1. Logging in as Master Developer (onenet / Admin&86)...');
    const resMaster = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'onenet', password: 'Admin&86' })
    });
    const masterJson = await resMaster.json();
    console.log('Master Dev Login Response:', masterJson.success, '| User:', masterJson.user?.username, '| Role:', masterJson.user?.roleName);
  } catch (err) {
    console.error('Master Login Error:', err.message);
  }

  // 2. Test Fleet Operator Login
  try {
    console.log('\n2. Logging in as Fleet Operator (operator_lahore)...');
    const resOp = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'operator_lahore' })
    });
    const opJson = await resOp.json();
    console.log('Operator Login Response:', opJson.success, '| User:', opJson.user?.username, '| Role:', opJson.user?.roleName, '| Modules:', opJson.user?.modules);
  } catch (err) {
    console.error('Operator Login Error:', err.message);
  }

  // 3. Test Invalid Credentials
  try {
    console.log('\n3. Testing invalid password credentials...');
    const resBad = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'invalid_user_account', password: 'wrongpassword' })
    });
    console.log('Bad Login Status:', resBad.status, '(Expected 401)');
    const badJson = await resBad.json();
    console.log('Bad Login Response:', badJson);
  } catch (err) {
    console.error('Bad Login Error:', err.message);
  }

  // 4. Test Logout
  try {
    console.log('\n4. Testing Logout...');
    const resOut = await fetch('http://localhost:5000/api/auth/logout', { method: 'POST' });
    const outJson = await resOut.json();
    console.log('Logout Response:', outJson);
  } catch (err) {
    console.error('Logout Error:', err.message);
  }
}

testAuthenticationFlow();
