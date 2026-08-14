import dotenv from 'dotenv';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
dotenv.config();

async function testStaticServing() {
  console.log('--- TESTING EXPRESS STATIC & SPA SERVING FOR AAPANEL NODE PROXY ---');

  try {
    // Query root URL /
    const res = await fetch('http://localhost:5009/');
    const htmlText = await res.text();

    console.log('Root Path / HTTP Status:', res.status);
    console.log('Content-Type:', res.headers.get('content-type'));
    console.log('Contains React <div id="root">:', htmlText.includes('<div id="root">'));
  } catch (err) {
    console.error('Static Serving Test Error:', err.message);
  }
}

testStaticServing();
