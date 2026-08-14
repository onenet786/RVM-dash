import dotenv from 'dotenv';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
dotenv.config();

async function testDatabaseSwitcher() {
  console.log('--- TESTING MASTER ADMIN DATABASE SWITCHER ---');

  // 1. Test invalid credentials
  try {
    const resBad = await fetch('http://localhost:5000/api/admin/switch-db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'wronguser', password: 'wrongpassword', targetPreset: 'ONS-RVM' })
    });
    console.log('Bad Auth Status:', resBad.status);
    const badJson = await resBad.json();
    console.log('Bad Auth Response:', badJson);
  } catch (err) {
    console.error('Bad Auth Error:', err.message);
  }

  // 2. Test valid credentials switching to ONS-RVM
  try {
    console.log('\n--- Switching to ONS-RVM with credentials onenet / Admin&86 ---');
    const resOns = await fetch('http://localhost:5000/api/admin/switch-db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'onenet', password: 'Admin&86', targetPreset: 'ONS-RVM' })
    });
    const onsJson = await resOns.json();
    console.log('ONS-RVM Switch Response:', onsJson);
  } catch (err) {
    console.error('ONS-RVM Switch Error:', err.message);
  }

  // 3. Test valid credentials switching to rvmapp
  try {
    console.log('\n--- Switching to rvmapp with credentials onenet / Admin&86 ---');
    const resRvm = await fetch('http://localhost:5000/api/admin/switch-db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'onenet', password: 'Admin&86', targetPreset: 'rvmapp' })
    });
    const rvmJson = await resRvm.json();
    console.log('rvmapp Switch Response:', rvmJson);
  } catch (err) {
    console.error('rvmapp Switch Error:', err.message);
  }

  // 4. Test API Server Restart
  try {
    console.log('\n--- Testing API Server Restart with credentials onenet / Admin&86 ---');
    const resRest = await fetch('http://localhost:5000/api/admin/restart-server', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'onenet', password: 'Admin&86' })
    });
    const restJson = await resRest.json();
    console.log('Restart Response:', restJson);
  } catch (err) {
    console.error('Restart Error:', err.message);
  }
}

testDatabaseSwitcher();
