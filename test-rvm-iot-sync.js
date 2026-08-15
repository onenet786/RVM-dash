import dotenv from 'dotenv';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
dotenv.config();

async function testRvmIotSync() {
  console.log('--- TESTING PHASE 1, 2, AND 3 IOT HARDWARE & POSTGRESQL POOL ---');

  try {
    // 1. Switch to PostgreSQL Engine
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
        pgDatabase: 'rvmpg'
      })
    });
    console.log('1. Switch DB Status:', switchRes.status);

    // 2. Test QR Scanner Verification (POST /api/user/verify-qr)
    const qrRes = await fetch('http://localhost:5009/api/user/verify-qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        qrCodeToken: 'onenet',
        machineId: 'RVM-001'
      })
    });
    const qrData = await qrRes.json();
    console.log('2. QR Scan Verification:', qrData);

    // 3. Test Downstream Points Config Pull (GET /api/machine/config/RVM-001)
    const configRes = await fetch('http://localhost:5009/api/machine/config/RVM-001');
    const configData = await configRes.json();
    console.log('3. Downstream Config Rules:', configData);

    // 4. Test Upstream Heartbeat (POST /api/machine/heartbeat)
    const hbRes = await fetch('http://localhost:5009/api/machine/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        machineId: 'RVM-001',
        binFillPercentage: 85,
        status: 'active',
        temperatureCelsius: 31.5
      })
    });
    const hbData = await hbRes.json();
    console.log('4. Machine Heartbeat Ping:', hbData);

    // 5. Test Upstream Session Sync (POST /api/machine/sync-session)
    const syncRes = await fetch('http://localhost:5009/api/machine/sync-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        machineId: 'RVM-001',
        localSessionId: 99401,
        userId: 'onenet',
        plasticCount: 5,
        aluminiumCount: 3,
        paperCardboardCount: 1,
        weightKg: 0.450
      })
    });
    const syncData = await syncRes.json();
    console.log('5. Session Sync Response:', syncData);

    // 6. Switch back to ONS-RVM
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
    console.error('Test Error:', err.message);
  }
}

testRvmIotSync();
