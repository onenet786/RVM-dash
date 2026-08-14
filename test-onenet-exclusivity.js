import dotenv from 'dotenv';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
dotenv.config();

async function testOnenetExclusivity() {
  console.log('--- TESTING MASTER DEVELOPER ONENET EXCLUSIVITY RULES ---');

  // 1. Test Login as Operator
  try {
    const resOp = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'operator_lahore' })
    });
    const opData = await resOp.json();
    console.log('Operator Login Success:', opData.success);
    console.log('Operator Username:', opData.user?.username);
    console.log('Is Master Dev (onenet):', opData.user?.username === 'onenet');
    console.log('Operator Allowed Modules:', opData.user?.modules);
  } catch (e) {
    console.error('Operator login error:', e.message);
  }

  // 2. Test Login as Master Dev (onenet)
  try {
    console.log('\n2. Testing Master Developer "onenet" Login...');
    const resMaster = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'onenet', password: 'Admin&86' })
    });
    const masterData = await resMaster.json();
    console.log('Master Dev Login Success:', masterData.success);
    console.log('Master Dev Username:', masterData.user?.username);
    console.log('Is Master Dev (onenet):', masterData.user?.username === 'onenet');
    console.log('Master Dev Allowed Modules:', masterData.user?.modules);
  } catch (e) {
    console.error('Master login error:', e.message);
  }
}

testOnenetExclusivity();
