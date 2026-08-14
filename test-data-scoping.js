import dotenv from 'dotenv';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
dotenv.config();

async function testMachineDataScoping() {
  console.log('--- TESTING MACHINE DATA ISOLATION & SCOPING ---');

  // 1. Unrestricted Global Overview
  try {
    const resGlobal = await fetch('http://localhost:5000/api/overview');
    const globalData = await resGlobal.json();
    console.log('Global Overview Total Sessions:', globalData.totalSessions, '| Total Bottles:', globalData.totalBottles);
  } catch (e) {
    console.error('Global Overview Error:', e.message);
  }

  // 2. Filtered Overview for rvm-office
  try {
    const resOffice = await fetch('http://localhost:5000/api/overview?assignedMachines=rvm-office');
    const officeData = await resOffice.json();
    console.log('\nScoped Overview for "rvm-office":');
    console.log('  Total Sessions:', officeData.totalSessions);
    console.log('  Total Bottles:', officeData.totalBottles);
    console.log('  Recent Sessions Count:', officeData.recentSessions?.length);
    if (officeData.recentSessions?.length > 0) {
      console.log('  Recent Session Machine IDs:', officeData.recentSessions.map(s => s.machineId));
    }
  } catch (e) {
    console.error('Scoped Overview Error:', e.message);
  }

  // 3. Filtered Table Query for rvm-office
  try {
    const resCol = await fetch('http://localhost:5000/api/collections/recyclingsessions?assignedMachines=rvm-office');
    const colData = await resCol.json();
    console.log('\nScoped Collection Query for "rvm-office":');
    console.log('  Total Documents Found:', colData.totalDocs);
    const nonMatching = colData.documents.filter(d => d.machineId && d.machineId.toLowerCase() !== 'rvm-office');
    console.log('  Non-matching Leak Count (Should be 0):', nonMatching.length);
  } catch (e) {
    console.error('Scoped Collection Error:', e.message);
  }
}

testMachineDataScoping();
