import dotenv from 'dotenv';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
dotenv.config();

async function testPostgresBackupRestore() {
  console.log('--- TESTING POSTGRESQL BACKUP & RESTORE DUAL-ENGINE logic ---');

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
    console.log('Switch to rvmpg Status:', switchRes.status);

    // 2. Execute GET /api/db/backup for PostgreSQL
    const backupRes = await fetch('http://localhost:5009/api/db/backup');
    const backupJson = await backupRes.json();
    console.log('PostgreSQL Backup Response:', {
      success: backupJson.success,
      message: backupJson.message,
      database: backupJson.database,
      databaseType: backupJson.databaseType,
      serverHost: backupJson.serverHost,
      totalDocuments: backupJson.totalDocuments,
      collectionsStatsCount: backupJson.collectionsStats ? backupJson.collectionsStats.length : 0
    });

    // 3. Test POST /api/db/restore for PostgreSQL
    const restoreRes = await fetch('http://localhost:5009/api/db/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        backupData: backupJson.backupData,
        mode: 'replace'
      })
    });
    const restoreJson = await restoreRes.json();
    console.log('PostgreSQL Restore Response:', {
      success: restoreJson.success,
      message: restoreJson.message,
      targetDatabase: restoreJson.targetDatabase,
      databaseType: restoreJson.databaseType,
      serverHost: restoreJson.serverHost,
      totalRestoredDocs: restoreJson.totalRestoredDocs
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
    console.error('Backup & Restore Test Error:', err.message);
  }
}

testPostgresBackupRestore();
