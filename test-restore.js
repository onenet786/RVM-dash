import dotenv from 'dotenv';
import dns from 'dns';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
dotenv.config();

async function runTestRestore() {
  const backupsDir = path.join(__dirname, 'backups');
  const files = fs.readdirSync(backupsDir).filter(f => f.endsWith('.json'));

  // Find a snapshot file with documents
  let targetFile = files.find(f => f.includes('rvmapp_backup'));
  if (!targetFile) targetFile = files[0];

  console.log(`[Test Restore] Using snapshot: ${targetFile}`);

  const filePath = path.join(backupsDir, targetFile);
  const backupData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  console.log(`[Test Restore] Restoring ${Object.keys(backupData.collections).length} collections into active database "${process.env.MONGODB_DBNAME}"...`);

  try {
    const res = await fetch('http://localhost:5000/api/db/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ backupData, mode: 'replace' })
    });

    const json = await res.json();
    console.log('[Restore Response]:', json);

    // Verify health
    const healthRes = await fetch('http://localhost:5000/api/health');
    const health = await healthRes.json();
    console.log('\n--- VERIFIED HEALTH STATUS AFTER RESTORE ---');
    console.log('Database Name:', health.database);
    console.log('Server Host:', health.serverHost);
    console.log('Server Location:', health.serverLocation.display);
    console.log('Collections Count:', health.collectionsCount);
    console.log('Collections Stats:', health.collections);
  } catch (err) {
    console.error('[Restore Test Failed]:', err.message);
  }
}

runTestRestore();
