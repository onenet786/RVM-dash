import dotenv from 'dotenv';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
dotenv.config();

async function testPort5009() {
  console.log('--- TESTING API SERVER ON PORT 5009 ---');

  try {
    const res = await fetch('http://localhost:5009/api/health');
    const data = await res.json();
    console.log('API Server Status Code:', res.status);
    console.log('API Status Response:', data.status);
    console.log('Connected Database:', data.database);
    console.log('Server Host:', data.serverHost);
  } catch (err) {
    console.error('Port 5009 Test Error:', err.message);
  }
}

testPort5009();
