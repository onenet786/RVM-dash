import dotenv from 'dotenv';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
dotenv.config();

async function testPort3131() {
  console.log('--- TESTING API SERVER ON PORT 3131 ---');

  try {
    const res = await fetch('http://localhost:3131/api/health');
    const data = await res.json();
    console.log('API Server Status Code:', res.status);
    console.log('API Status Response:', data.status);
    console.log('Connected Database:', data.database);
    console.log('Server Host:', data.serverHost);
  } catch (err) {
    console.error('Port 3131 Test Error:', err.message);
  }
}

testPort3131();
