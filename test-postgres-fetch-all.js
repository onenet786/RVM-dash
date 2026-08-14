import dotenv from 'dotenv';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
dotenv.config();

async function testPostgresFetchAll() {
  console.log('--- TESTING POSTGRESQL DATA FETCH ACROSS ALL ENDPOINTS ---');

  try {
    // 1. Switch to PostgreSQL Engine (rvmpg)
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
    const switchData = await switchRes.json();
    console.log('Switch to rvmpg Status:', switchRes.status, switchData.message);

    // 2. Fetch Overview KPIs from PostgreSQL
    const overviewRes = await fetch('http://localhost:5009/api/overview');
    const overviewData = await overviewRes.json();
    console.log('PostgreSQL Overview Data:', {
      database: overviewData.database,
      databaseType: overviewData.databaseType,
      totalSessions: overviewData.totalSessions,
      totalUsers: overviewData.totalUsers,
      totalFeedbacks: overviewData.totalFeedbacks
    });

    // 3. Fetch Table Viewer Collection (adminaccounts) from PostgreSQL
    const tableRes = await fetch('http://localhost:5009/api/collections/adminaccounts');
    const tableData = await tableRes.json();
    console.log('PostgreSQL Table Viewer (adminaccounts):', {
      collectionName: tableData.collectionName,
      totalDocs: tableData.totalDocs,
      docsCount: tableData.documents ? tableData.documents.length : 0
    });

    // 4. Switch back to ONS-RVM
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

testPostgresFetchAll();
