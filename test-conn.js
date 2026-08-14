import dotenv from 'dotenv';
import dns from 'dns';
import { MongoClient } from 'mongodb';

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
dotenv.config();

async function checkConnection() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DBNAME;

  console.log('--- MONGODB CONFIGURATION IN .ENV ---');
  console.log('URI:', uri ? uri.replace(/:([^@]+)@/, ':****@') : 'MISSING');
  console.log('Target Database Name:', dbName || 'MISSING');
  console.log('------------------------------------');

  if (!uri) {
    console.error('No MONGODB_URI found in .env');
    return;
  }

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 12000 });
  try {
    await client.connect();
    console.log('STATUS: Connected Successfully!');
    const db = client.db(dbName);
    const ping = await db.command({ ping: 1 });
    console.log('Ping Response:', ping);

    const collections = await db.listCollections().toArray();
    console.log(`\nDatabase: "${db.databaseName}" contains ${collections.length} collections:`);
    
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`  • ${col.name}: ${count} document(s)`);
    }
  } catch (err) {
    console.error('CONNECTION FAILED:', err.message);
  } finally {
    await client.close();
  }
}

checkConnection();
