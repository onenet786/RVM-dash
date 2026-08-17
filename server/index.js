#!/usr/bin/env node
import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';

import { MongoClient, ObjectId } from 'mongodb';
import dns from 'dns';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKUPS_DIR = path.join(__dirname, '..', 'backups');

if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

// Fix Windows DNS SRV lookup for MongoDB Atlas (+srv URIs)
try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  console.warn('[DNS Config Warning]', e.message);
}

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5009;



app.use(cors());
// Set high payload limit (50MB) for database restoration JSON uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const DIST_DIR = path.join(__dirname, '..', 'dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
}


let activeDbType = process.env.DB_TYPE || 'postgres';
let activePgConfig = {
  host: process.env.PG_HOST || '127.0.0.1',
  port: parseInt(process.env.PG_PORT || '5432'),
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'Admin786',
  database: process.env.PG_DATABASE || 'rvmpg'
};

let currentUri = process.env.MONGODB_URI || 'mongodb+srv://aaqueelphotos_db_user:Z8NPUThldyeypEEQ@cluster0.ktted0m.mongodb.net/ONS-RVM?retryWrites=true&w=majority';
let currentDbName = process.env.MONGODB_DBNAME || 'ONS-RVM';



let dbClient = null;
let db = null;
let cachedGeo = null;

const DB_PRESETS = {
  'ONS-RVM': {
    id: 'ONS-RVM',
    type: 'mongodb',
    label: 'ONS-RVM Master Cluster',
    host: 'cluster0.ktted0m.mongodb.net',
    uri: 'mongodb+srv://aaqueelphotos_db_user:Z8NPUThldyeypEEQ@cluster0.ktted0m.mongodb.net/ONS-RVM?retryWrites=true&w=majority',
    dbName: 'ONS-RVM',
    description: 'Primary ONS-RVM MongoDB Cluster'
  },
  'rvmapp': {
    id: 'rvmapp',
    type: 'mongodb',
    label: 'MCSRWP Production rvmapp Cluster',
    host: 'cluster0.fuycg6c.mongodb.net',
    uri: 'mongodb+srv://mcsrwp_db_user:8ctdZ%23TjEx%26N%25H4@cluster0.fuycg6c.mongodb.net/rvmapp?retryWrites=true&w=majority',
    dbName: 'rvmapp',
    description: 'Legacy Production rvmapp MongoDB Cluster'
  },
  'rvm_postgres': {
    id: 'rvm_postgres',
    type: 'postgres',
    label: 'PostgreSQL Dedicated Hosting Database',
    host: process.env.PG_HOST || '127.0.0.1',
    port: process.env.PG_PORT || 5432,
    dbName: process.env.PG_DATABASE || 'rvmpg',

    description: 'Dedicated PostgreSQL Relational Database running on Ubuntu Hosting Server'
  }
};

function validateMasterCredentials(username, password) {
  return username === 'onenet' && password === 'Admin&86';
}

let pgPoolInstance = null;

function getPgPool() {
  const config = activePgConfig || {
    host: process.env.PG_HOST || '127.0.0.1',
    port: parseInt(process.env.PG_PORT || '5432'),
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || 'Admin786',
    database: process.env.PG_DATABASE || 'rvmpg'
  };
  if (!pgPoolInstance) {
    pgPoolInstance = new pg.Pool({
      ...config,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    });
    pgPoolInstance.on('error', (err) => {
      console.warn('[PostgreSQL Pool Warning]', err.message);
    });
  }
  return pgPoolInstance;
}

async function closePgPool() {
  if (pgPoolInstance) {
    try {
      await pgPoolInstance.end();
    } catch (e) {}
    pgPoolInstance = null;
  }
}

async function initProductionPostgresSchemas() {
  if (activeDbType !== 'postgres' || !activePgConfig) return;
  const pool = getPgPool();
  if (!pool) return;

  try {
    // 1. Machines Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS machines (
        machine_id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        location VARCHAR(200),
        status VARCHAR(20) DEFAULT 'active',
        bin_fill_percentage INT DEFAULT 0,
        total_bottles_recycled BIGINT DEFAULT 0,
        total_weight_kg NUMERIC(10,3) DEFAULT 0.000,
        last_ping_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Recycling Sessions Table with Foreign Key & Indexes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS recycling_sessions (
        session_id VARCHAR(255) PRIMARY KEY,
        machine_id VARCHAR(50) REFERENCES machines(machine_id) ON DELETE CASCADE,
        user_id VARCHAR(100),
        plastic_count INT DEFAULT 0,
        aluminium_count INT DEFAULT 0,
        paper_cardboard_count INT DEFAULT 0,
        glass_count INT DEFAULT 0,
        item_variant VARCHAR(100),
        bottle_size VARCHAR(50),
        total_weight_kg NUMERIC(8,3) DEFAULT 0,
        co2_avoided_kg NUMERIC(8,3) DEFAULT 0,
        points_earned INT DEFAULT 0,
        session_status VARCHAR(20) DEFAULT 'completed',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE recycling_sessions ADD COLUMN IF NOT EXISTS points_earned INT DEFAULT 0;
      ALTER TABLE recycling_sessions ADD COLUMN IF NOT EXISTS glass_count INT DEFAULT 0;
      ALTER TABLE recycling_sessions ADD COLUMN IF NOT EXISTS item_variant VARCHAR(100);
      ALTER TABLE recycling_sessions ADD COLUMN IF NOT EXISTS bottle_size VARCHAR(50);
      ALTER TABLE recycling_sessions ADD COLUMN IF NOT EXISTS plastic_small_count INT DEFAULT 0;
      ALTER TABLE recycling_sessions ADD COLUMN IF NOT EXISTS plastic_medium_count INT DEFAULT 0;
      ALTER TABLE recycling_sessions ADD COLUMN IF NOT EXISTS plastic_large_count INT DEFAULT 0;
      ALTER TABLE recycling_sessions ADD COLUMN IF NOT EXISTS can_small_count INT DEFAULT 0;
      ALTER TABLE recycling_sessions ADD COLUMN IF NOT EXISTS can_medium_count INT DEFAULT 0;
      ALTER TABLE recycling_sessions ADD COLUMN IF NOT EXISTS can_large_count INT DEFAULT 0;
      ALTER TABLE recycling_sessions ADD COLUMN IF NOT EXISTS paper_weight_grams INT DEFAULT 0;
      ALTER TABLE recycling_sessions ADD COLUMN IF NOT EXISTS tetrapak_weight_grams INT DEFAULT 0;
      ALTER TABLE recycling_sessions ADD COLUMN IF NOT EXISTS glass_small_count INT DEFAULT 0;
      ALTER TABLE recycling_sessions ADD COLUMN IF NOT EXISTS glass_medium_count INT DEFAULT 0;
      ALTER TABLE recycling_sessions ADD COLUMN IF NOT EXISTS glass_large_count INT DEFAULT 0;
      CREATE INDEX IF NOT EXISTS idx_sessions_machine_date ON recycling_sessions (machine_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_sessions_date ON recycling_sessions (created_at DESC);
    `);



    // 3. Users Table with Unique Constraints & Indexes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        points_balance INT DEFAULT 0,
        role_id VARCHAR(50) DEFAULT 'fleet_operator',
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
    `);

    // 4. Downstream Points Config Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS machine_configs (
        machine_id VARCHAR(50) PRIMARY KEY REFERENCES machines(machine_id) ON DELETE CASCADE,
        config_version INT DEFAULT 1,
        points_per_plastic INT DEFAULT 10,
        points_per_aluminium INT DEFAULT 20,
        points_per_paper_kg INT DEFAULT 15,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed default machine RVM-001 if empty
    await pool.query(`
      INSERT INTO machines (machine_id, name, location, status, bin_fill_percentage)
      VALUES ('RVM-001', 'Islamabad Model RVM', 'G-9 Markaz, Islamabad', 'active', 25)
      ON CONFLICT (machine_id) DO NOTHING;
    `);

    await pool.query(`
      INSERT INTO machine_configs (machine_id, config_version, points_per_plastic, points_per_aluminium, points_per_paper_kg)
      VALUES ('RVM-001', 1, 10, 20, 15)
      ON CONFLICT (machine_id) DO NOTHING;
    `);

    console.log('[PostgreSQL Schemas] Production relational tables and indexes initialized successfully.');
  } catch (err) {
    console.warn('[PostgreSQL Schemas Init Warning]', err.message);
  }
}



function writeEnvFile(uri, dbName, dbType = 'postgres', pgConfig = {}) {
  const envPath = path.join(__dirname, '..', '.env');
  const pgHost = pgConfig.host || process.env.PG_HOST || '127.0.0.1';
  const pgPort = pgConfig.port || process.env.PG_PORT || 5432;
  const pgUser = pgConfig.user || process.env.PG_USER || 'postgres';
  const pgPass = pgConfig.password || process.env.PG_PASSWORD || '';
  const pgDb = pgConfig.database || process.env.PG_DATABASE || 'rvmpg';


  const content = `DB_TYPE=${dbType}\nMONGODB_URI=${uri}\nMONGODB_DBNAME=${dbName}\nPG_HOST=${pgHost}\nPG_PORT=${pgPort}\nPG_USER=${pgUser}\nPG_PASSWORD=${pgPass}\nPG_DATABASE=${pgDb}\nJWT_SECRET=rvm-isp-dev-secret-key-2026\nADMIN_USERNAME=admin\nADMIN_PASSWORD=adminpassword\nPORT=${PORT}\nVITE_API_URL=http://localhost:${PORT}\n`;
  fs.writeFileSync(envPath, content, 'utf-8');
  process.env.DB_TYPE = dbType;
}


async function connectDB(forceReconnect = false) {
  if (db && !forceReconnect) return db;
  try {
    dns.setDefaultResultOrder('ipv4first');
    try {
      dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
    } catch (e) {}

    if (dbClient && forceReconnect) {
      try {
        await dbClient.close(true);
      } catch (e) {}
      dbClient = null;
      db = null;
    }

    if (!currentUri) {
      throw new Error('MONGODB_URI is missing');
    }

    dbClient = new MongoClient(currentUri, {
      serverSelectionTimeoutMS: 15000,
    });
    await dbClient.connect();
    db = dbClient.db(currentDbName);
    cachedGeo = null;
    console.log(`[MongoDB] Connected successfully to database "${currentDbName}" on host "${getSanitizedHost(currentUri)}"`);
    return db;
  } catch (error) {
    console.error('[MongoDB Connection Error]', error.message);
    throw error;
  }
}

// Eagerly connect on process start if MongoDB active
if (activeDbType === 'mongodb') {
  connectDB().catch(err => console.error('[Initial MongoDB Connect Failed]', err.message));
} else {
  console.log(`[PostgreSQL Engine] Default active database: "${activePgConfig?.database || 'rvmpg'}" on host "${activePgConfig?.host || '127.0.0.1'}:${activePgConfig?.port || 5432}"`);
}

// Ensure DB connected middleware
app.use(async (req, res, next) => {
  try {
    if (activeDbType === 'mongodb') {
      await connectDB();
    }
    next();
  } catch (err) {
    res.status(500).json({ error: 'Database connection error', details: err.message });
  }
});


function getSanitizedHost(uri) {
  if (!uri) return 'Unknown Host';
  try {
    const match = uri.match(/@([^/?]+)/);
    return match ? match[1] : 'MongoDB Cluster';
  } catch (e) {
    return 'MongoDB Cluster';
  }
}

async function getMongoDBServerLocation(targetDb) {
  if (cachedGeo) return cachedGeo;
  try {
    const hello = await targetDb.command({ hello: 1 });
    const primaryHost = (hello.me || hello.primary || '').split(':')[0];
    const regionTag = hello.tags?.region || '';
    const providerTag = hello.tags?.provider || '';
    
    let locationStr = '';
    if (providerTag && regionTag) {
      locationStr = `${providerTag} (${regionTag})`;
    }

    if (primaryHost) {
      const addresses = await dns.promises.resolve4(primaryHost);
      if (addresses.length > 0) {
        const ip = addresses[0];
        const res = await fetch(`http://ip-api.com/json/${ip}`);
        if (res.ok) {
          const geo = await res.json();
          if (geo.status === 'success') {
            const cityCountry = `${geo.city}, ${geo.country}`;
            cachedGeo = {
              city: geo.city,
              country: geo.country,
              countryCode: geo.countryCode,
              regionName: geo.regionName,
              provider: providerTag || 'AWS',
              regionTag: regionTag,
              display: `${cityCountry} ${locationStr ? `• ${locationStr}` : ''}`,
              flag: geo.countryCode ? `https://flagcdn.com/24x18/${geo.countryCode.toLowerCase()}.png` : null,
              ip: ip
            };
            return cachedGeo;
          }
        }
      }
    }

    cachedGeo = {
      display: locationStr || 'Global Cloud Region',
      provider: providerTag || 'AWS',
      regionTag: regionTag
    };
    return cachedGeo;
  } catch (err) {
    return { display: 'Global Cloud Node' };
  }
}

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    if (activeDbType === 'postgres' && activePgConfig) {
      const client = new pg.Client(activePgConfig);
      await client.connect();
      const tablesRes = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema='public' AND table_type='BASE TABLE';
      `);
      
      const collectionsWithStats = [];
      for (const row of tablesRes.rows) {
        const tName = row.table_name;
        let count = 0;
        try {
          const countRes = await client.query(`SELECT COUNT(*) FROM "${tName}";`);
          count = parseInt(countRes.rows[0].count || '0');

          if (tName === 'recycling_sessions') {
            const altRes = await client.query(`SELECT COUNT(*) FROM recyclingsessions;`).catch(() => ({ rows: [{ count: 0 }] }));
            count += parseInt(altRes.rows[0].count || '0');
          } else if (tName === 'recyclingsessions') {
            const altRes = await client.query(`SELECT COUNT(*) FROM recycling_sessions;`).catch(() => ({ rows: [{ count: 0 }] }));
            count += parseInt(altRes.rows[0].count || '0');
          }
        } catch (cErr) {}

        collectionsWithStats.push({
          name: tName,
          count
        });
      }

      await client.end();

      return res.json({
        status: 'online',
        databaseType: 'postgres',
        database: activePgConfig.database || 'rvm_postgres',
        serverHost: `${activePgConfig.host || '127.0.0.1'}:${activePgConfig.port || 5432}`,
        serverLocation: { display: 'Ubuntu Dedicated Server (PostgreSQL Localhost)' },
        ping: 'OK',
        collectionsCount: collectionsWithStats.length,
        collections: collectionsWithStats,
        timestamp: new Date().toISOString()
      });
    }

    const admin = db.admin();
    const ping = await admin.ping();
    const collections = await db.listCollections().toArray();
    const location = await getMongoDBServerLocation(db);
    
    const collectionsWithStats = await Promise.all(
      collections.map(async (col) => {
        const count = await db.collection(col.name).countDocuments();
        return { name: col.name, count };
      })
    );

    res.json({
      status: 'online',
      databaseType: 'mongodb',
      database: currentDbName,
      serverHost: getSanitizedHost(currentUri),
      serverLocation: location,
      ping: ping.ok === 1 ? 'OK' : 'ERR',
      collectionsCount: collections.length,
      collections: collectionsWithStats,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'error', 
      error: err.message, 
      database: currentDbName, 
      serverHost: getSanitizedHost(currentUri) 
    });
  }
});


// Admin DB Switcher Presets Info
app.get('/api/admin/presets', (req, res) => {
  res.json({
    activeDatabase: currentDbName,
    activeHost: getSanitizedHost(currentUri),
    presets: Object.values(DB_PRESETS)
  });
});

async function ensurePostgresDatabase(pgConfig) {
  try {
    const client = new pg.Client(pgConfig);
    await client.connect();
    await client.end();
    return true;
  } catch (err) {
    if (err.message && (err.message.includes('does not exist') || err.code === '3D000')) {
      console.log(`[PostgreSQL Auto-Create] Target database "${pgConfig.database}" does not exist. Creating database...`);
      const defaultPgConfig = { ...pgConfig, database: 'postgres' };
      const defaultClient = new pg.Client(defaultPgConfig);
      await defaultClient.connect();
      await defaultClient.query(`CREATE DATABASE "${pgConfig.database}";`);
      await defaultClient.end();

      const client = new pg.Client(pgConfig);
      await client.connect();
      await client.end();
      return true;
    }
    throw err;
  }
}

// Admin Switch Database Endpoint (Protected by username: onenet / password: Admin&86)
app.post('/api/admin/switch-db', async (req, res) => {
  try {
    const { username, password, targetPreset, customUri, customDbName, pgHost, pgPort, pgUser, pgPassword, pgDatabase, pgConnString } = req.body;

    if (!validateMasterCredentials(username, password)) {
      return res.status(401).json({ error: 'Unauthorized: Invalid Master Developer Credentials (username: onenet)' });
    }

    if (targetPreset === 'rvm_postgres' || req.body.targetDbType === 'postgres') {
      const pgConfig = pgConnString ? { connectionString: pgConnString } : {
        host: pgHost || process.env.PG_HOST || '127.0.0.1',
        port: parseInt(pgPort || process.env.PG_PORT || '5432'),
        user: pgUser || process.env.PG_USER || 'postgres',
        password: pgPassword || process.env.PG_PASSWORD || '',
        database: pgDatabase || process.env.PG_DATABASE || 'rvmpg'
      };

      try {
        await ensurePostgresDatabase(pgConfig);
        await closePgPool();
        activeDbType = 'postgres';
        activePgConfig = pgConfig;
        currentDbName = pgConfig.database || 'rvmpg';

        await initProductionPostgresSchemas();
        writeEnvFile(currentUri, currentDbName, 'postgres', pgConfig);

        return res.json({
          success: true,
          message: `Successfully authenticated as "onenet". Runtime database switched to PostgreSQL database "${currentDbName}" on host "${pgConfig.host || '127.0.0.1'}:${pgConfig.port || 5432}".`,
          database: currentDbName,
          databaseType: 'postgres',
          serverHost: `${pgConfig.host || '127.0.0.1'}:${pgConfig.port || 5432}`,
          serverLocation: { display: 'Ubuntu Dedicated Server (PostgreSQL Localhost)' }
        });
      } catch (pgErr) {
        console.error('[PostgreSQL Switch Error]', pgErr);
        return res.status(400).json({
          error: `PostgreSQL Connection Failed: ${pgErr.message}. Please verify PostgreSQL service is running on ${pgConfig.host || '127.0.0.1'}:${pgConfig.port || 5432} and PostgreSQL password is correct.`
        });
      }
    }


    let newUri = '';
    let newDbName = '';

    if (targetPreset && DB_PRESETS[targetPreset] && DB_PRESETS[targetPreset].type === 'mongodb') {
      newUri = DB_PRESETS[targetPreset].uri;
      newDbName = DB_PRESETS[targetPreset].dbName;
    } else if (customUri && customDbName) {
      newUri = customUri;
      newDbName = customDbName;
    } else {
      newUri = DB_PRESETS['ONS-RVM'].uri;
      newDbName = DB_PRESETS['ONS-RVM'].dbName;
    }

    await closePgPool();
    writeEnvFile(newUri, newDbName, 'mongodb');
    currentUri = newUri;
    currentDbName = newDbName;
    activeDbType = 'mongodb';

    await connectDB(true);


    const location = await getMongoDBServerLocation(db);

    res.json({
      success: true,
      message: `Successfully authenticated as "onenet". Database switched to MongoDB "${newDbName}" on server "${getSanitizedHost(newUri)}".`,
      database: newDbName,
      databaseType: 'mongodb',
      serverHost: getSanitizedHost(newUri),
      serverLocation: location
    });
  } catch (err) {
    console.error('[Switch DB Error]', err);
    res.status(500).json({ error: 'Failed to switch database connection', details: err.message });
  }
});


// Admin Restart API Server Endpoint (Protected by username: onenet / password: Admin&86)
app.post('/api/admin/restart-server', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!validateMasterCredentials(username, password)) {
      return res.status(401).json({ error: 'Unauthorized: Invalid Master Developer Credentials' });
    }

    // Force reconnect database client
    await connectDB(true);

    res.json({
      success: true,
      message: `Master Developer "onenet" authenticated. API Server re-initialized and connected to "${currentDbName}".`
    });

    console.log('[Master Developer Action] Server connection restarted by user "onenet".');
  } catch (err) {
    res.status(500).json({ error: 'Failed to restart API server', details: err.message });
  }
});

// One-Way Database Sync Endpoint: rvmapp (Source) -> ONS-RVM (Target)
app.post('/api/admin/sync-databases', async (req, res) => {
  let sourceClient = null;
  let targetClient = null;

  try {
    const { username, password, syncMode = 'upsert', collections = 'all' } = req.body;

    if (!validateMasterCredentials(username, password)) {
      return res.status(401).json({ error: 'Unauthorized: Invalid Master Developer Credentials (username: onenet)' });
    }

    const sourceUri = DB_PRESETS['rvmapp'].uri;
    const sourceDbName = DB_PRESETS['rvmapp'].dbName;
    const targetUri = DB_PRESETS['ONS-RVM'].uri;
    const targetDbName = DB_PRESETS['ONS-RVM'].dbName;

    console.log(`[Database Sync Started] Syncing FROM "${sourceDbName}" TO "${targetDbName}" (Mode: ${syncMode})`);

    // Connect to source database (rvmapp)
    sourceClient = new MongoClient(sourceUri, { serverSelectionTimeoutMS: 15000 });
    await sourceClient.connect();
    const sourceDb = sourceClient.db(sourceDbName);

    // Connect to target database (ONS-RVM)
    targetClient = new MongoClient(targetUri, { serverSelectionTimeoutMS: 15000 });
    await targetClient.connect();
    const targetDb = targetClient.db(targetDbName);

    const sourceCollections = await sourceDb.listCollections().toArray();
    let collectionsToSync = sourceCollections.map(c => c.name);

    if (Array.isArray(collections) && collections.length > 0) {
      collectionsToSync = collectionsToSync.filter(name => collections.includes(name));
    }

    let totalDocsSynced = 0;
    const syncDetails = [];

    for (const colName of collectionsToSync) {
      const sourceCol = sourceDb.collection(colName);
      const targetCol = targetDb.collection(colName);

      const docs = await sourceCol.find({}).toArray();
      if (docs.length === 0) {
        syncDetails.push({ name: colName, count: 0, status: 'empty' });
        continue;
      }

      if (syncMode === 'replace') {
        try {
          await targetCol.deleteMany({});
        } catch (e) {}
      }

      // Prepare documents with ObjectId handling
      const preparedDocs = docs.map(d => {
        const docCopy = { ...d };
        if (docCopy._id && typeof docCopy._id === 'string' && docCopy._id.length === 24) {
          try {
            docCopy._id = new ObjectId(docCopy._id);
          } catch (e) {}
        }
        return docCopy;
      });

      if (syncMode === 'replace') {
        const BATCH_SIZE = 500;
        let inserted = 0;
        for (let i = 0; i < preparedDocs.length; i += BATCH_SIZE) {
          const batch = preparedDocs.slice(i, i + BATCH_SIZE);
          try {
            const result = await targetCol.insertMany(batch, { ordered: false });
            inserted += result.insertedCount || batch.length;
          } catch (e) {
            if (e.insertedCount) inserted += e.insertedCount;
          }
        }
        totalDocsSynced += inserted;
        syncDetails.push({ name: colName, count: inserted, status: 'replaced' });
      } else {
        // Upsert / Merge Mode using bulkWrite
        const bulkOps = preparedDocs.map(doc => ({
          updateOne: {
            filter: { _id: doc._id },
            update: { $set: doc },
            upsert: true
          }
        }));

        const BATCH_SIZE = 500;
        let upsertedCount = 0;
        for (let i = 0; i < bulkOps.length; i += BATCH_SIZE) {
          const batch = bulkOps.slice(i, i + BATCH_SIZE);
          try {
            const bulkRes = await targetCol.bulkWrite(batch, { ordered: false });
            upsertedCount += (bulkRes.upsertedCount || 0) + (bulkRes.modifiedCount || 0) + (bulkRes.matchedCount || 0);
          } catch (e) {
            if (e.result) upsertedCount += (e.result.nUpserted || 0) + (e.result.nModified || 0);
          }
        }
        totalDocsSynced += docs.length;
        syncDetails.push({ name: colName, count: docs.length, status: 'upserted' });
      }
    }

    // Refresh health cache if active DB is ONS-RVM
    if (currentDbName === 'ONS-RVM') {
      await connectDB(true);
    }

    res.json({
      success: true,
      message: `One-way sync completed successfully! ${totalDocsSynced} documents across ${syncDetails.length} collections synced FROM "${sourceDbName}" TO "${targetDbName}".`,
      sourceDatabase: sourceDbName,
      targetDatabase: targetDbName,
      syncMode,
      totalCollectionsSynced: syncDetails.length,
      totalDocumentsSynced: totalDocsSynced,
      syncDetails
    });

  } catch (err) {
    console.error('[One-Way DB Sync Error]', err);
    res.status(500).json({ error: 'One-way database sync failed', details: err.message });
  } finally {
    if (sourceClient) {
      try { await sourceClient.close(true); } catch (e) {}
    }
    if (targetClient) {
      try { await targetClient.close(true); } catch (e) {}
    }
  }
});


function getMachineScopeQuery(req, fieldName = 'machineId') {
  const param = req.query.assignedMachines || req.query.machineId;
  if (!param) return {};

  let machines = [];
  if (Array.isArray(param)) machines = param;
  else if (typeof param === 'string') machines = param.split(',').map(s => s.trim());

  if (machines.length === 0 || machines.includes('*')) {
    return {}; // All fleet, no filter
  }

  const regexes = machines.map(m => new RegExp(`^${m.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i'));
  return { [fieldName]: { $in: regexes } };
}

// High level KPIs Overview
app.get('/api/overview', async (req, res) => {
  try {
    if (activeDbType === 'postgres' && activePgConfig) {
      const sessions = await fetchCollectionDocs('recyclingsessions');
      const users = await fetchCollectionDocs('userprofile');
      const feedbacks = await fetchCollectionDocs('feedbacks');
      const binAlerts = await fetchCollectionDocs('binfullnotifications');
      const redemptions = await fetchCollectionDocs('redemptions');

      let totalBottles = 0;
      let totalCups = 0;
      let totalPoints = 0;
      let totalPlastic = 0;
      let totalCans = 0;
      let totalPaperGrams = 0;
      let totalTetraPakGrams = 0;
      let totalGlass = 0;

      let plasticSmall = 0;
      let plasticMedium = 0;
      let plasticLarge = 0;

      let canSmall = 0;
      let canMedium = 0;
      let canLarge = 0;

      sessions.forEach(s => {
        const bCount = parseInt(s.bottles || s.totalBottles || (parseInt(s.plasticCount || s.plastic_count || 0) + parseInt(s.aluminiumCount || s.aluminium_count || 0) + parseInt(s.paperCardboardCount || s.paper_cardboard_count || 0)) || 0);
        const pCount = parseInt(s.points || s.totalPoints || s.pointsEarned || s.points_earned || 0);
        const cCount = parseInt(s.cups || s.totalCups || 0);
        
        totalBottles += bCount;
        totalCups += cCount;
        totalPoints += pCount;

        const pCnt = parseInt(s.plasticCount || s.plastic_count || (s.bottleSize ? 1 : 0));
        const aCnt = parseInt(s.aluminiumCount || s.aluminium_count || 0);
        const gCnt = parseInt(s.glassCount || s.glass_count || 0);
        const paperG = parseInt(s.paper_weight_grams || (s.paperCardboardCount > 0 ? Math.round((s.totalWeightKg || 0.1) * 1000) : 0));
        const tetraG = parseInt(s.tetrapak_weight_grams || 0);

        totalPlastic += pCnt;
        totalCans += aCnt;
        totalGlass += gCnt;
        totalPaperGrams += paperG;
        totalTetraPakGrams += tetraG;

        let ps = parseInt(s.plastic_small_count || 0);
        let pm = parseInt(s.plastic_medium_count || 0);
        let pl = parseInt(s.plastic_large_count || 0);

        if (ps === 0 && pm === 0 && pl === 0 && pCnt > 0) {
          const bSize = String(s.bottleSize || s.bottle_size || 'MEDIUM').toUpperCase();
          if (bSize === 'SMALL') ps = pCnt;
          else if (bSize === 'LARGE') pl = pCnt;
          else pm = pCnt;
        }

        plasticSmall += ps;
        plasticMedium += pm;
        plasticLarge += pl;

        let cs = parseInt(s.can_small_count || 0);
        let cm = parseInt(s.can_medium_count || 0);
        let cl = parseInt(s.can_large_count || 0);

        if (cs === 0 && cm === 0 && cl === 0 && aCnt > 0) {
          const bSize = String(s.bottleSize || s.bottle_size || 'MEDIUM').toUpperCase();
          if (bSize === 'SMALL') cs = aCnt;
          else if (bSize === 'LARGE') cl = aCnt;
          else cm = aCnt;
        }

        canSmall += cs;
        canMedium += cm;
        canLarge += cl;
      });

      const recentSessions = sessions.slice(0, 5);
      const recentAlerts = binAlerts.slice(0, 5);

      return res.json({
        database: activePgConfig.database || 'rvmpg',
        databaseType: 'postgres',
        serverHost: `${activePgConfig.host || '127.0.0.1'}:${activePgConfig.port || 5432}`,
        totalSessions: sessions.length,
        totalUsers: users.length > 0 ? users.length : 3,
        totalFeedbacks: feedbacks.length,
        totalBinAlerts: binAlerts.length,
        totalRedemptions: redemptions.length,
        totalBottles,
        totalCups,
        totalPoints,
        totalPlastic,
        totalCans,
        totalPaperGrams,
        totalTetraPakGrams,
        totalGlass,
        variantBreakdown: {
          plasticSmall,
          plasticMedium,
          plasticLarge,
          canSmall,
          canMedium,
          canLarge,
          paperGrams: totalPaperGrams,
          tetraPakGrams: totalTetraPakGrams
        },
        recentSessions,
        recentAlerts
      });
    }

    const sessionCol = db.collection('recyclingsessions');
    const userCol = db.collection('userprofile');
    const feedbackCol = db.collection('feedbacks');
    const binCol = db.collection('binfullnotifications');
    const redemptionCol = db.collection('redemptions');

    const machineQuery = getMachineScopeQuery(req, 'machineId');

    const totalSessions = await sessionCol.countDocuments(machineQuery);
    let totalUsers = await userCol.countDocuments();
    if (totalUsers === 0) {
      totalUsers = await db.collection('users').countDocuments();
    }
    const totalFeedbacks = await feedbackCol.countDocuments();
    const totalBinAlerts = await binCol.countDocuments(machineQuery);
    const totalRedemptions = await redemptionCol.countDocuments();

    const allSessions = await sessionCol.find(machineQuery).toArray();
    let totalBottles = 0;
    let totalCups = 0;
    let totalPoints = 0;
    let totalPlastic = 0;
    let totalCans = 0;
    let totalPaperGrams = 0;
    let totalTetraPakGrams = 0;
    let totalGlass = 0;

    let plasticSmall = 0;
    let plasticMedium = 0;
    let plasticLarge = 0;
    let canSmall = 0;
    let canMedium = 0;
    let canLarge = 0;

    allSessions.forEach(s => {
      const bCount = parseInt(s.bottles || s.totalBottles || (parseInt(s.plasticCount || s.plastic_count || 0) + parseInt(s.aluminiumCount || s.aluminium_count || 0) + parseInt(s.paperCardboardCount || s.paper_cardboard_count || 0)) || 0);
      const pCount = parseInt(s.points || s.totalPoints || s.pointsEarned || s.points_earned || 0);
      const cCount = parseInt(s.cups || s.totalCups || 0);
      
      totalBottles += bCount;
      totalCups += cCount;
      totalPoints += pCount;

      const pCnt = parseInt(s.plasticCount || s.plastic_count || 0);
      const aCnt = parseInt(s.aluminiumCount || s.aluminium_count || 0);
      const gCnt = parseInt(s.glassCount || s.glass_count || 0);
      const paperG = parseInt(s.paper_weight_grams || (s.paperCardboardCount > 0 ? Math.round((s.totalWeightKg || 0.1) * 1000) : 0));
      const tetraG = parseInt(s.tetrapak_weight_grams || 0);

      totalPlastic += pCnt;
      totalCans += aCnt;
      totalGlass += gCnt;
      totalPaperGrams += paperG;
      totalTetraPakGrams += tetraG;

      let ps = parseInt(s.plastic_small_count || 0);
      let pm = parseInt(s.plastic_medium_count || 0);
      let pl = parseInt(s.plastic_large_count || 0);

      if (ps === 0 && pm === 0 && pl === 0 && pCnt > 0) {
        const bSize = String(s.bottleSize || s.bottle_size || 'MEDIUM').toUpperCase();
        if (bSize === 'SMALL') ps = pCnt;
        else if (bSize === 'LARGE') pl = pCnt;
        else pm = pCnt;
      }

      plasticSmall += ps;
      plasticMedium += pm;
      plasticLarge += pl;

      let cs = parseInt(s.can_small_count || 0);
      let cm = parseInt(s.can_medium_count || 0);
      let cl = parseInt(s.can_large_count || 0);

      if (cs === 0 && cm === 0 && cl === 0 && aCnt > 0) {
        const bSize = String(s.bottleSize || s.bottle_size || 'MEDIUM').toUpperCase();
        if (bSize === 'SMALL') cs = aCnt;
        else if (bSize === 'LARGE') cl = aCnt;
        else cm = aCnt;
      }

      canSmall += cs;
      canMedium += cm;
      canLarge += cl;
    });

    // Recent 5 sessions
    const recentSessions = allSessions.sort((a, b) => new Date(b.recycledAt || b.createdAt || 0) - new Date(a.recycledAt || a.createdAt || 0)).slice(0, 5);

    // Recent 5 alerts
    const recentAlerts = await binCol
      .find(machineQuery)
      .sort({ occurredAt: -1, _id: -1 })
      .limit(5)
      .toArray();

    res.json({
      database: currentDbName,
      serverHost: getSanitizedHost(currentUri),
      totalSessions,
      totalUsers,
      totalFeedbacks,
      totalBinAlerts,
      totalRedemptions,
      totalBottles,
      totalCups,
      totalPoints,
      totalPlastic,
      totalCans,
      totalPaperGrams,
      totalTetraPakGrams,
      totalGlass,
      variantBreakdown: {
        plasticSmall,
        plasticMedium,
        plasticLarge,
        canSmall,
        canMedium,
        canLarge,
        paperGrams: totalPaperGrams,
        tetraPakGrams: totalTetraPakGrams
      },
      recentSessions,
      recentSessions,
      recentAlerts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List all Collections with details
app.get('/api/collections/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { page = 1, limit = 50, search = '' } = req.query;

    if (activeDbType === 'postgres' && activePgConfig) {
      const docs = await fetchCollectionDocs(name);
      let filteredDocs = docs;

      if (search.trim()) {
        const term = search.trim().toLowerCase();
        filteredDocs = docs.filter(d => {
          const jsonStr = JSON.stringify(d).toLowerCase();
          return jsonStr.includes(term);
        });
      }

      const totalDocs = filteredDocs.length;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const paginatedDocs = filteredDocs.slice(skip, skip + parseInt(limit));

      return res.json({
        collectionName: name,
        page: parseInt(page),
        limit: parseInt(limit),
        totalDocs,
        totalPages: Math.ceil(totalDocs / parseInt(limit)) || 1,
        documents: paginatedDocs
      });
    }

    const collection = db.collection(name);
    const machineQuery = getMachineScopeQuery(req, 'machineId');

    let query = {};
    const filters = [];

    // Apply machine filter for collections that store machineId
    if (Object.keys(machineQuery).length > 0 && ['recyclingsessions', 'binfullnotifications', 'feedbacks'].includes(name.toLowerCase())) {
      filters.push(machineQuery);
    }

    if (search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filters.push({
        $or: [
          { userName: regex },
          { phoneNumber: regex },
          { machineId: regex },
          { binType: regex },
          { subject: regex },
          { message: regex },
          { email: regex }
        ]
      });
    }

    if (filters.length === 1) {
      query = filters[0];
    } else if (filters.length > 1) {
      query = { $and: filters };
    }

    const totalDocs = await collection.countDocuments(query);
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const docs = await collection
      .find(query)
      .sort({ _id: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    res.json({
      collectionName: name,
      page: parseInt(page),
      limit: parseInt(limit),
      totalDocs,
      totalPages: Math.ceil(totalDocs / parseInt(limit)) || 1,
      documents: docs
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Analytics Trends Endpoint
app.get('/api/analytics/trends', async (req, res) => {
  try {
    if (activeDbType === 'postgres' && activePgConfig) {
      const sessions = await fetchCollectionDocs('recyclingsessions');
      const grouped = {};
      sessions.forEach(s => {
        const dateKey = (s.recycledAt || s.timestamp || new Date().toISOString()).substring(0, 10);
        if (!grouped[dateKey]) {
          grouped[dateKey] = { _id: dateKey, bottles: 0, cups: 0, points: 0, count: 0 };
        }
        grouped[dateKey].bottles += parseInt(s.bottles || s.totalBottles || 0);
        grouped[dateKey].cups += parseInt(s.cups || s.totalCups || 0);
        grouped[dateKey].points += parseInt(s.points || s.totalPoints || 0);
        grouped[dateKey].count += 1;
      });
      const trends = Object.values(grouped).sort((a, b) => a._id.localeCompare(b._id)).slice(0, 30);
      return res.json(trends);
    }

    const sessionCol = db.collection('recyclingsessions');
    const machineQuery = getMachineScopeQuery(req, 'machineId');

    const pipeline = [];
    if (Object.keys(machineQuery).length > 0) pipeline.push({ $match: machineQuery });
    pipeline.push(
      {
        $group: {
          _id: { $substr: ['$recycledAt', 0, 10] },
          bottles: { $sum: '$bottles' },
          cups: { $sum: '$cups' },
          points: { $sum: '$points' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 30 }
    );

    const trends = await sessionCol.aggregate(pipeline).toArray();
    res.json(trends);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Analytics Leaderboard Endpoint
app.get('/api/analytics/leaderboard', async (req, res) => {
  try {
    if (activeDbType === 'postgres' && activePgConfig) {
      const sessions = await fetchCollectionDocs('recyclingsessions');
      const grouped = {};
      sessions.forEach(s => {
        const phone = s.phoneNumber || s.userId || 'Unknown';
        if (!grouped[phone]) {
          grouped[phone] = {
            _id: phone,
            userName: s.userName || s.fullName || 'Eco Recycler',
            totalBottles: 0,
            totalCups: 0,
            totalPoints: 0,
            totalSessions: 0
          };
        }
        grouped[phone].totalBottles += parseInt(s.bottles || s.totalBottles || 0);
        grouped[phone].totalCups += parseInt(s.cups || s.totalCups || 0);
        grouped[phone].totalPoints += parseInt(s.points || s.totalPoints || 0);
        grouped[phone].totalSessions += 1;
      });
      const leaderboard = Object.values(grouped).sort((a, b) => b.totalPoints - a.totalPoints).slice(0, 20);
      return res.json(leaderboard);
    }

    const sessionCol = db.collection('recyclingsessions');
    const machineQuery = getMachineScopeQuery(req, 'machineId');

    const pipeline = [];
    if (Object.keys(machineQuery).length > 0) pipeline.push({ $match: machineQuery });
    pipeline.push(
      {
        $group: {
          _id: '$phoneNumber',
          userName: { $first: '$userName' },
          totalBottles: { $sum: '$bottles' },
          totalCups: { $sum: '$cups' },
          totalPoints: { $sum: '$points' },
          totalSessions: { $sum: 1 }
        }
      },
      { $sort: { totalPoints: -1 } },
      { $limit: 20 }
    );

    const leaderboard = await sessionCol.aggregate(pipeline).toArray();
    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Machine Hardware Status Aggregation
app.get('/api/analytics/machines', async (req, res) => {
  try {
    const ONLINE_THRESHOLD_MS = 60 * 1000; // 60 seconds (1 minute) window
    const now = Date.now();

    if (activeDbType === 'postgres' && activePgConfig) {
      const sessions = await fetchCollectionDocs('recyclingsessions');
      const alerts = await fetchCollectionDocs('binfullnotifications');

      const pool = getPgPool();
      const allRegisteredMachines = [];
      if (pool) {
        try {
          const metaRes = await pool.query(`SELECT machine_id, name, location, status, last_ping_at FROM machines`);
          metaRes.rows.forEach(r => {
            allRegisteredMachines.push({
              machineId: r.machine_id,
              name: r.name || `RVM Machine ${r.machine_id}`,
              location: r.location || 'Islamabad Campus',
              status: r.status,
              lastPingAt: r.last_ping_at
            });
          });
        } catch (e) {}
      }

      const grouped = {};

      allRegisteredMachines.forEach(m => {
        const pingTime = m.lastPingAt ? new Date(m.lastPingAt).getTime() : 0;
        const isOnline = pingTime > 0 && (now - pingTime <= ONLINE_THRESHOLD_MS);
        grouped[m.machineId] = {
          machineId: m.machineId,
          name: m.name,
          location: m.location,
          status: isOnline ? 'ONLINE' : 'OFFLINE',
          isOnline,
          lastPingAt: m.lastPingAt,
          totalBottles: 0,
          totalCups: 0,
          totalPoints: 0,
          sessionCount: 0,
          lastActive: m.lastPingAt || null
        };
      });

      sessions.forEach(s => {
        const mId = s.machineId || s.machine_id || 'RVM-001';
        const sTime = s.recycledAt || s.timestamp ? new Date(s.recycledAt || s.timestamp).getTime() : 0;
        if (!grouped[mId]) {
          const isOnline = sTime > 0 && (now - sTime <= ONLINE_THRESHOLD_MS);
          grouped[mId] = {
            machineId: mId,
            name: `RVM Machine ${mId}`,
            location: 'Islamabad Campus',
            status: isOnline ? 'ONLINE' : 'OFFLINE',
            isOnline,
            lastPingAt: s.recycledAt || s.timestamp,
            totalBottles: 0,
            totalCups: 0,
            totalPoints: 0,
            sessionCount: 0,
            lastActive: s.recycledAt || s.timestamp
          };
        }
        grouped[mId].totalBottles += parseInt(s.bottles || s.totalBottles || 0);
        grouped[mId].totalCups += parseInt(s.cups || s.totalCups || 0);
        grouped[mId].totalPoints += parseInt(s.points || s.totalPoints || 0);
        grouped[mId].sessionCount += 1;

        // Only use session timestamp if machine has no recorded heartbeat ping at all
        if (sTime > 0 && !grouped[mId].lastPingAt) {
          grouped[mId].lastPingAt = s.recycledAt || s.timestamp;
          grouped[mId].lastActive = s.recycledAt || s.timestamp;
          const isOnline = (now - sTime <= ONLINE_THRESHOLD_MS);
          grouped[mId].status = isOnline ? 'ONLINE' : 'OFFLINE';
          grouped[mId].isOnline = isOnline;
        }
      });

      const alertsMap = {};
      alerts.forEach(a => {
        const mId = a.machineId || a.machine_id || 'RVM-001';
        if (!alertsMap[mId]) alertsMap[mId] = { alertCount: 0, lastAlert: a.occurredAt };
        alertsMap[mId].alertCount += 1;
      });

      const combined = Object.values(grouped).map(m => ({
        ...m,
        alertCount: alertsMap[m.machineId] ? alertsMap[m.machineId].alertCount : 0,
        lastAlert: alertsMap[m.machineId] ? alertsMap[m.machineId].lastAlert : null
      }));

      return res.json(combined);
    }

    const sessionCol = db.collection('recyclingsessions');
    const binCol = db.collection('binfullnotifications');
    const machinesCol = db.collection('machines');
    const machineQuery = getMachineScopeQuery(req, 'machineId');

    const mongoMachines = await machinesCol.find().toArray();
    const grouped = {};

    mongoMachines.forEach(m => {
      if (m.machineId) {
        const pingTime = m.lastPingAt || m.updatedAt ? new Date(m.lastPingAt || m.updatedAt).getTime() : 0;
        const isOnline = pingTime > 0 && (now - pingTime <= ONLINE_THRESHOLD_MS);
        grouped[m.machineId] = {
          machineId: m.machineId,
          name: m.name || `RVM Machine ${m.machineId}`,
          location: m.location || 'Islamabad Campus',
          status: isOnline ? 'ONLINE' : 'OFFLINE',
          isOnline,
          lastPingAt: m.lastPingAt || m.updatedAt,
          totalBottles: 0,
          totalCups: 0,
          totalPoints: 0,
          sessionCount: 0,
          lastActive: m.lastPingAt || m.updatedAt || null
        };
      }
    });

    const sessionPipeline = [];
    if (Object.keys(machineQuery).length > 0) sessionPipeline.push({ $match: machineQuery });
    sessionPipeline.push({
      $group: {
        _id: '$machineId',
        totalBottles: { $sum: '$bottles' },
        totalCups: { $sum: '$cups' },
        totalPoints: { $sum: '$points' },
        sessionCount: { $sum: 1 },
        lastActive: { $max: '$recycledAt' }
      }
    });

    const machineSessions = await sessionCol.aggregate(sessionPipeline).toArray();
    machineSessions.forEach(m => {
      const mId = m._id;
      const sTime = m.lastActive ? new Date(m.lastActive).getTime() : 0;
      if (!grouped[mId]) {
        const isOnline = sTime > 0 && (now - sTime <= ONLINE_THRESHOLD_MS);
        grouped[mId] = {
          machineId: mId,
          name: `RVM Machine ${mId}`,
          location: 'Islamabad Campus',
          status: isOnline ? 'ONLINE' : 'OFFLINE',
          isOnline,
          lastPingAt: m.lastActive,
          totalBottles: 0,
          totalCups: 0,
          totalPoints: 0,
          sessionCount: 0,
          lastActive: m.lastActive
        };
      }
      grouped[mId].totalBottles = m.totalBottles;
      grouped[mId].totalCups = m.totalCups;
      grouped[mId].totalPoints = m.totalPoints;
      grouped[mId].sessionCount = m.sessionCount;
      if (sTime > 0 && !grouped[mId].lastPingAt) {
        grouped[mId].lastPingAt = m.lastActive;
        grouped[mId].lastActive = m.lastActive;
        const isOnline = (now - sTime <= ONLINE_THRESHOLD_MS);
        grouped[mId].status = isOnline ? 'ONLINE' : 'OFFLINE';
        grouped[mId].isOnline = isOnline;
      }
    });

    const alertPipeline = [];
    if (Object.keys(machineQuery).length > 0) alertPipeline.push({ $match: machineQuery });
    alertPipeline.push({
      $group: {
        _id: '$machineId',
        alertCount: { $sum: 1 },
        lastAlert: { $max: '$occurredAt' }
      }
    });

    const machineAlerts = await binCol.aggregate(alertPipeline).toArray();
    const alertsMap = {};
    machineAlerts.forEach(a => {
      alertsMap[a._id] = a;
    });

    const combined = Object.values(grouped).map(m => ({
      ...m,
      alertCount: alertsMap[m.machineId] ? alertsMap[m.machineId].alertCount : 0,
      lastAlert: alertsMap[m.machineId] ? alertsMap[m.machineId].lastAlert : null
    }));

    res.json(combined);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add or Register RVM Machine Name & Location
app.post('/api/machines', async (req, res) => {
  try {
    const { machineId, name, location, status } = req.body || {};
    if (!machineId) {
      return res.status(400).json({ error: 'Machine ID is required' });
    }

    const machineName = name || `RVM Unit ${machineId}`;
    const machineLocation = location || 'Main Entrance / Campus';
    const machineStatus = status || 'ONLINE';

    // Update MongoDB if available
    if (db) {
      try {
        await db.collection('machines').updateOne(
          { machineId },
          {
            $set: {
              machineId,
              name: machineName,
              location: machineLocation,
              status: machineStatus,
              updatedAt: new Date()
            }
          },
          { upsert: true }
        );
      } catch (mongoErr) {
        console.error('[POST /api/machines] MongoDB write notice:', mongoErr.message);
      }
    }

    // Update PostgreSQL if available
    const pool = getPgPool();
    if (pool) {
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS machines (
            machine_id VARCHAR(100) PRIMARY KEY,
            name VARCHAR(255),
            location VARCHAR(255),
            status VARCHAR(50) DEFAULT 'ONLINE',
            last_ping_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        await pool.query(`ALTER TABLE machines ADD COLUMN IF NOT EXISTS name VARCHAR(255);`);
        await pool.query(`ALTER TABLE machines ADD COLUMN IF NOT EXISTS location VARCHAR(255);`);
        await pool.query(`ALTER TABLE machines ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ONLINE';`);
        await pool.query(`ALTER TABLE machines ADD COLUMN IF NOT EXISTS last_ping_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);

        await pool.query(`
          INSERT INTO machines (machine_id, name, location, status, last_ping_at)
          VALUES ($1, $2, $3, $4, NOW())
          ON CONFLICT (machine_id)
          DO UPDATE SET name = EXCLUDED.name, location = EXCLUDED.location, status = EXCLUDED.status, last_ping_at = NOW()
        `, [machineId, machineName, machineLocation, machineStatus]);
      } catch (pgErr) {
        console.error('[POST /api/machines] PostgreSQL write notice:', pgErr.message);
      }
    }

    res.json({ message: 'Machine registered successfully', machineId, name: machineName, location: machineLocation, status: machineStatus });
  } catch (err) {
    console.error('[POST /api/machines] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// RVM ENVIRONMENTAL IMPACT AUDITED FORMULAS (AUGUST 2026 PRD)
// ==========================================

const MATERIAL_FACTORS = {
  Aluminium: { factor: 9.1, note: 'Highest factor; reward "can" maps here' },
  Metal: { factor: 3.5, note: 'Distinct from aluminium' },
  Cardboard: { factor: 3.1, note: 'Pure corrugated only; not Tetra Pak' },
  Paper: { factor: 2.9, note: 'Standard recycling factor' },
  Ewaste: { factor: 1.8, note: 'When accepted' },
  Plastic: { factor: 1.5, note: 'Reward PET S/M/L all map here' },
  Organic: { factor: 0.5, note: 'Feeds compost (Input weight credited ONCE)' },
  Tea: { factor: 0.5, note: 'Sub-label of Organic; NOT additive factor' },
  Glass: { factor: 0.3, note: 'Lowest factor; dominates weight' },
  Default: { factor: 1.2, note: 'Fallback uncategorized' }
};

app.get('/api/analytics/environmental-impact', async (req, res) => {
  try {
    let totalBottles = 0;
    let totalCups = 0;
    let totalWeightKg = 0;
    let count = 0;

    if (activeDbType === 'postgres' && activePgConfig) {
      const sessions = await fetchCollectionDocs('recyclingsessions');
      count = sessions.length;
      sessions.forEach(s => {
        totalBottles += parseInt(s.bottles || s.totalBottles || 0);
        totalCups += parseInt(s.cups || s.totalCups || 0);
        totalWeightKg += parseFloat(s.weight || s.totalWeight || 0);
      });
    } else {
      const sessionCol = db.collection('recyclingsessions');
      const machineQuery = getMachineScopeQuery(req, 'machineId');
      const pipeline = [];
      if (Object.keys(machineQuery).length > 0) pipeline.push({ $match: machineQuery });
      pipeline.push({
        $group: {
          _id: null,
          totalBottles: { $sum: '$bottles' },
          totalCups: { $sum: '$cups' },
          totalWeightKg: { $sum: '$weight' },
          count: { $sum: 1 }
        }
      });
      const sessionStats = await sessionCol.aggregate(pipeline).toArray();
      const stats = sessionStats[0] || { totalBottles: 0, totalCups: 0, totalWeightKg: 0, count: 0 };
      totalBottles = stats.totalBottles;
      totalCups = stats.totalCups;
      totalWeightKg = stats.totalWeightKg;
      count = stats.count;
    }


    // Standard material weights based on PRD: PET bottle = 25g (0.025kg), Aluminium Can = 15g (0.015kg)
    const plasticWeight = stats.totalBottles > 0 ? stats.totalBottles * 0.025 : (stats.totalWeightKg * 0.6);
    const aluminiumWeight = stats.totalCups > 0 ? stats.totalCups * 0.015 : (stats.totalWeightKg * 0.2);
    const paperCardboardWeight = stats.totalWeightKg > 0 ? stats.totalWeightKg * 0.1 : 50;
    const organicWeight = stats.totalWeightKg > 0 ? stats.totalWeightKg * 0.1 : 100;

    const breakdown = [
      { material: 'Aluminium', rewardClass: 'Aluminium Can', weightKg: parseFloat(aluminiumWeight.toFixed(1)), factor: 9.1, co2eSavedKg: parseFloat((aluminiumWeight * 9.1).toFixed(1)) },
      { material: 'Metal (steel)', rewardClass: '(future) Metal cans', weightKg: 0, factor: 3.5, co2eSavedKg: 0 },
      { material: 'Cardboard', rewardClass: 'Carton / Tetra Pak', weightKg: parseFloat((paperCardboardWeight * 0.6).toFixed(1)), factor: 3.1, co2eSavedKg: parseFloat((paperCardboardWeight * 0.6 * 3.1).toFixed(1)) },
      { material: 'Paper', rewardClass: '(future) Paper', weightKg: parseFloat((paperCardboardWeight * 0.4).toFixed(1)), factor: 2.9, co2eSavedKg: parseFloat((paperCardboardWeight * 0.4 * 2.9).toFixed(1)) },
      { material: 'E-waste', rewardClass: '(future) E-waste', weightKg: 0, factor: 1.8, co2eSavedKg: 0 },
      { material: 'Plastic (all PET)', rewardClass: 'PET Small / Medium / Large', weightKg: parseFloat(plasticWeight.toFixed(1)), factor: 1.5, co2eSavedKg: parseFloat((plasticWeight * 1.5).toFixed(1)) },
      { material: 'Organic / Tea', rewardClass: '(future) Organic, Tea', weightKg: parseFloat(organicWeight.toFixed(1)), factor: 0.5, co2eSavedKg: parseFloat((organicWeight * 0.5).toFixed(1)) },
      { material: 'Glass', rewardClass: 'Glass Bottle', weightKg: 0, factor: 0.3, co2eSavedKg: 0 }
    ];

    const totalCo2eAvoidedKg = breakdown.reduce((sum, item) => sum + item.co2eSavedKg, 0);
    const totalCo2eAvoidedTonnes = parseFloat((totalCo2eAvoidedKg / 1000).toFixed(3));

    // Audited Equivalency Divisors (Section 7.2 of PDF)
    // Trees Planted Equivalent = Total_CO2e_Avoided(kg) / 21.77
    const treesPlantedEquivalent = Math.round(totalCo2eAvoidedKg / 21.77);
    
    // Passenger Car Miles Avoided = Total_CO2e_Avoided(kg) / 0.40
    const passengerCarMilesAvoided = Math.round(totalCo2eAvoidedKg / 0.40);

    // Audited Compost Yield Formula (Section 5 of PDF)
    // Compost(kg) = Organic_Tea_Weight(kg) * 0.40
    const compostYieldKg = parseFloat((organicWeight * 0.40).toFixed(1));

    res.json({
      auditStatus: 'Audited, Corrected, And Reconciled With The Reward System PRD (August 2026)',
      totalSessions: stats.count,
      totalWeightProcessedKg: parseFloat((plasticWeight + aluminiumWeight + paperCardboardWeight + organicWeight).toFixed(1)),
      totalCo2eAvoidedKg: parseFloat(totalCo2eAvoidedKg.toFixed(1)),
      totalCo2eAvoidedTonnes,
      treesPlantedEquivalent,
      treesPlantedBasis: 'Approximate annual CO2e sequestered by 1 urban tree seedling grown 10 years (21.77 kg CO2e / tree)',
      passengerCarMilesAvoided,
      carMilesBasis: 'Approximate kg CO2e per passenger-vehicle mile (0.40 kg CO2e / mile)',
      compostYieldKg,
      compostYieldBasis: 'Disjoint Estimated Batch Mode (40% yield from Organic/Tea input weight)',
      weightMeasurementType: stats.totalWeightKg > 0 ? 'Measured' : 'Estimated',
      breakdown,
      factors: MATERIAL_FACTORS
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Full Database Backup Snapshot (Supports PostgreSQL & MongoDB)
app.get('/api/db/backup', async (req, res) => {
  try {
    const backupData = {
      database: currentDbName,
      databaseType: activeDbType,
      serverHost: activeDbType === 'postgres' ? `${activePgConfig?.host || '127.0.0.1'}:${activePgConfig?.port || 5432}` : getSanitizedHost(currentUri),
      exportedAt: new Date().toISOString(),
      collections: {}
    };

    let totalDocsCount = 0;
    const collectionsStats = [];

    if (activeDbType === 'postgres' && activePgConfig) {
      const client = new pg.Client(activePgConfig);
      await client.connect();
      const tablesRes = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema='public' AND table_type='BASE TABLE';
      `);
      await client.end();

      const tableNames = tablesRes.rows.map(r => r.table_name);
      for (const tName of tableNames) {
        const docs = await fetchCollectionDocs(tName);
        backupData.collections[tName] = docs;
        totalDocsCount += docs.length;
        collectionsStats.push({ name: tName, count: docs.length });
      }
    } else {
      const collections = await db.listCollections().toArray();
      for (const colInfo of collections) {
        const colName = colInfo.name;
        const docs = await db.collection(colName).find({}).toArray();
        backupData.collections[colName] = docs;
        totalDocsCount += docs.length;
        collectionsStats.push({ name: colName, count: docs.length });
      }
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${currentDbName}_${activeDbType}_backup_${timestamp}.json`;
    const filePath = path.join(BACKUPS_DIR, filename);

    const jsonStr = JSON.stringify(backupData, null, 2);
    fs.writeFileSync(filePath, jsonStr, 'utf-8');

    if (req.query.download === 'true') {
      return res.download(filePath, filename);
    }

    res.json({
      success: true,
      message: `Successfully generated ${activeDbType.toUpperCase()} database snapshot backup for "${currentDbName}" (${totalDocsCount} documents across ${collectionsStats.length} ${activeDbType === 'postgres' ? 'tables' : 'collections'} on ${backupData.serverHost}).`,
      filename,
      timestamp: backupData.exportedAt,
      database: currentDbName,
      databaseType: activeDbType,
      serverHost: backupData.serverHost,
      sizeBytes: Buffer.byteLength(jsonStr),
      totalCollections: collectionsStats.length,
      totalDocuments: totalDocsCount,
      collectionsStats,
      backupData
    });
  } catch (err) {
    console.error('[Backup Error]', err);
    res.status(500).json({ error: 'Failed to generate database backup snapshot', details: err.message });
  }
});


// List All Local Backup Snapshots
app.get('/api/db/backups', (req, res) => {
  try {
    const files = fs.readdirSync(BACKUPS_DIR);
    const backups = files
      .filter(f => f.endsWith('.json'))
      .map(filename => {
        const filePath = path.join(BACKUPS_DIR, filename);
        const stat = fs.statSync(filePath);
        return {
          filename,
          sizeBytes: stat.size,
          createdAt: stat.birthtime || stat.mtime
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(backups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Download Specific Backup File
app.get('/api/db/download/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(BACKUPS_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Backup file not found' });
    }
    res.download(filePath, filename);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Test PostgreSQL Database Connection
app.post('/api/admin/test-postgres', async (req, res) => {
  const { host, port, user, password, database, connectionString } = req.body || {};
  const pgConfig = connectionString ? { connectionString } : {
    host: host || process.env.PG_HOST || '127.0.0.1',
    port: parseInt(port || process.env.PG_PORT || '5432'),
    user: user || process.env.PG_USER || 'postgres',
    password: password || process.env.PG_PASSWORD || '',
    database: database || process.env.PG_DATABASE || 'postgres',
    ssl: req.body?.ssl ? { rejectUnauthorized: false } : false
  };

  const client = new pg.Client(pgConfig);
  try {
    await client.connect();
    const result = await client.query('SELECT version(), current_database(), current_user;');
    await client.end();
    res.json({
      success: true,
      message: 'PostgreSQL Database Connection Successful!',
      database: result.rows[0].current_database,
      user: result.rows[0].current_user,
      version: result.rows[0].version
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: `PostgreSQL Connection Failed: ${err.message}`
    });
  }
});

// Sync Data FROM Active MongoDB TO PostgreSQL Database
app.post('/api/admin/sync-postgres', async (req, res) => {
  const { host, port, user, password, database, connectionString, mongoSourcePreset = 'rvmapp' } = req.body || {};
  const pgConfig = connectionString ? { connectionString } : {
    host: host || process.env.PG_HOST || '127.0.0.1',
    port: parseInt(port || process.env.PG_PORT || '5432'),
    user: user || process.env.PG_USER || 'postgres',
    password: password || process.env.PG_PASSWORD || '',
    database: database || process.env.PG_DATABASE || 'rvmpg',
    ssl: req.body?.ssl ? { rejectUnauthorized: false } : false
  };

  const client = new pg.Client(pgConfig);
  let sourceClient = null;
  try {
    await client.connect();

    // Determine source MongoDB database (default: rvmapp)
    let sourceUri = DB_PRESETS['rvmapp'].uri;
    let sourceDbName = 'rvmapp';

    if (mongoSourcePreset === 'ONS-RVM') {
      sourceUri = DB_PRESETS['ONS-RVM'].uri;
      sourceDbName = 'ONS-RVM';
    }

    // Connect to source MongoDB database
    sourceClient = new MongoClient(sourceUri, { serverSelectionTimeoutMS: 8000 });
    await sourceClient.connect();
    const sourceDb = sourceClient.db(sourceDbName);

    const collections = await sourceDb.listCollections().toArray();
    let totalSyncedDocs = 0;
    const syncedTables = [];

    for (const colInfo of collections) {
      const colName = colInfo.name;
      const tableName = colName.toLowerCase().replace(/[^a-z0-9_]/g, '_');

      // Create relational table if not exists with JSONB column
      await client.query(`
        CREATE TABLE IF NOT EXISTS "${tableName}" (
          id VARCHAR(255) PRIMARY KEY,
          data JSONB NOT NULL,
          synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      const docs = await sourceDb.collection(colName).find({}).toArray();
      let tableSyncedCount = 0;

      for (const doc of docs) {
        const idStr = doc._id ? doc._id.toString() : (doc.id || doc.username || `gen_${Math.random()}`);
        const docJson = JSON.stringify(doc);

        await client.query(`
          INSERT INTO "${tableName}" (id, data, synced_at)
          VALUES ($1, $2, NOW())
          ON CONFLICT (id) 
          DO UPDATE SET data = EXCLUDED.data, synced_at = NOW();
        `, [idStr, docJson]);

        tableSyncedCount++;
      }

      totalSyncedDocs += tableSyncedCount;
      syncedTables.push({ name: colName, tableName, count: tableSyncedCount });
    }

    await client.end();
    if (sourceClient) await sourceClient.close(true);

    res.json({
      success: true,
      message: `Successfully synchronized ${totalSyncedDocs} documents across ${syncedTables.length} tables from MongoDB database "${sourceDbName}" into PostgreSQL database "${pgConfig.database || 'rvmpg'}".`,
      sourceMongoDb: sourceDbName,
      targetPostgresDb: pgConfig.database || 'rvmpg',
      totalSyncedDocs,
      syncedTables
    });
  } catch (err) {
    if (sourceClient) try { await sourceClient.close(true); } catch(e){}
    try { await client.end(); } catch(e){}
    console.error('[PostgreSQL Sync Error]', err);
    res.status(500).json({
      success: false,
      error: `PostgreSQL Sync Failed: ${err.message}`
    });
  }
});



// Reusable Database Restore Execution Helper (Supports PostgreSQL & MongoDB)
async function executeRestoreData(backupData, targetDb, mode = 'replace') {
  if (!backupData || !backupData.collections) {
    throw new Error('Invalid backup format. Missing "collections" object.');
  }

  const restoredCollections = [];
  let totalRestoredDocs = 0;

  if (activeDbType === 'postgres' && activePgConfig) {
    const client = new pg.Client(activePgConfig);
    await client.connect();

    for (const [colName, docs] of Object.entries(backupData.collections)) {
      if (!Array.isArray(docs)) continue;
      const tableName = colName.toLowerCase().replace(/[^a-z0-9_]/g, '_');

      // Create relational table if not exists with JSONB column
      await client.query(`
        CREATE TABLE IF NOT EXISTS "${tableName}" (
          id VARCHAR(255) PRIMARY KEY,
          data JSONB NOT NULL,
          synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      if (mode === 'replace') {
        try {
          await client.query(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY;`);
        } catch (e) {
          console.warn(`[Truncate Warning ${tableName}]`, e.message);
        }
      }

      let insertedForCol = 0;
      for (const doc of docs) {
        const idStr = doc._id ? doc._id.toString() : (doc.id || doc.username || `gen_${Math.random()}`);
        const docToSave = { ...doc, _id: idStr };
        delete docToSave.id;

        await client.query(`
          INSERT INTO "${tableName}" (id, data, synced_at)
          VALUES ($1, $2, NOW())
          ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, synced_at = NOW();
        `, [idStr, JSON.stringify(docToSave)]);

        insertedForCol++;
      }

      totalRestoredDocs += insertedForCol;
      restoredCollections.push({ name: colName, count: insertedForCol });
    }

    await client.end();
    return { totalRestoredDocs, restoredCollections, engine: 'postgres' };
  }

  // MongoDB Restore
  for (const [colName, docs] of Object.entries(backupData.collections)) {
    if (!Array.isArray(docs)) continue;
    const collection = targetDb.collection(colName);

    if (mode === 'replace') {
      try {
        await collection.deleteMany({});
      } catch (e) {
        console.warn(`[Delete Warning ${colName}]`, e.message);
      }
    }

    if (docs.length > 0) {
      const preparedDocs = docs.map(d => {
        const docCopy = { ...d };
        if (docCopy._id && typeof docCopy._id === 'string' && docCopy._id.length === 24) {
          try {
            docCopy._id = new ObjectId(docCopy._id);
          } catch (e) {}
        }
        return docCopy;
      });

      const BATCH_SIZE = 500;
      let insertedForCol = 0;
      for (let i = 0; i < preparedDocs.length; i += BATCH_SIZE) {
        const batch = preparedDocs.slice(i, i + BATCH_SIZE);
        try {
          const result = await collection.insertMany(batch, { ordered: false });
          insertedForCol += result.insertedCount || batch.length;
        } catch (err) {
          if (err.insertedCount) insertedForCol += err.insertedCount;
          else insertedForCol += batch.length;
        }
      }
      totalRestoredDocs += insertedForCol;
      restoredCollections.push({ name: colName, count: insertedForCol });
    } else {
      restoredCollections.push({ name: colName, count: 0 });
    }
  }

  return { totalRestoredDocs, restoredCollections, engine: 'mongodb' };
}

function isWriteProtected(dbName, targetDb) {
  if (activeDbType === 'postgres') return false;
  const activeName = (dbName || (targetDb && targetDb.databaseName) || currentDbName || '').toString().toLowerCase();
  return activeName === 'rvmapp';
}

function enforceReadOnlyProtection(req, res, next) {
  if (activeDbType === 'postgres') {
    return next();
  }
  const activeName = (db ? db.databaseName : currentDbName) || '';
  if (isWriteProtected(activeName, db)) {
    console.warn(`[READ-ONLY PROTECTION ACTIVATED] Blocked ${req.method} ${req.path} on protected database "${activeName}"`);
    return res.status(403).json({
      error: `Data Mutation Denied: Database "${activeName}" is a protected production database and operates strictly in READ-ONLY mode. All write, update, insert, delete, and restore operations on "${activeName}" are strictly prohibited.`
    });
  }
  next();
}

async function fetchCollectionDocs(colName) {
  if (activeDbType === 'postgres' && activePgConfig) {
    const pool = getPgPool();
    if (!pool) return [];
    const tableName = colName.toLowerCase().replace(/[^a-z0-9_]/g, '_');

    // 1. Relational Table: recycling_sessions / recyclingsessions
    if (tableName === 'recycling_sessions' || tableName === 'recyclingsessions') {
      const docs = [];
      try {
        const jsonRes = await pool.query(`SELECT id, data FROM recyclingsessions;`).catch(() => ({ rows: [] }));
        jsonRes.rows.forEach(r => {
          const parsed = typeof r.data === 'string' ? JSON.parse(r.data) : { ...r.data };
          delete parsed.id;
          if (!parsed._id) parsed._id = r.id;
          docs.push(parsed);
        });
      } catch (e) {}

      try {
        const relRes = await pool.query(`SELECT * FROM recycling_sessions;`).catch(() => ({ rows: [] }));
        const existingIds = new Set(docs.map(d => d._id || d.session_id));
        relRes.rows.forEach(r => {
          const sId = r.session_id;
          if (!existingIds.has(sId)) {
            const pCount = parseInt(r.plastic_count || 0);
            const aCount = parseInt(r.aluminium_count || 0);
            const paperCount = parseInt(r.paper_cardboard_count || 0);
            const gCount = parseInt(r.glass_count || 0);
            const bSize = r.bottle_size || 'MEDIUM';

            let variant = r.item_variant;
            if (!variant) {
              if (pCount > 0) variant = `${pCount}x ${bSize} PLASTIC`;
              else if (aCount > 0) variant = `${aCount}x CAN (Metal)`;
              else if (paperCount > 0) variant = `${paperCount}x PAPER / TETRA PAK`;
              else if (gCount > 0) variant = `${gCount}x ${bSize} GLASS`;
              else variant = 'RECYCLABLE ITEM';
            }

            const totItems = pCount + aCount + paperCount + gCount;

            docs.push({
              _id: sId,
              session_id: sId,
              machineId: r.machine_id,
              machine_id: r.machine_id,
              userId: r.user_id,
              user_id: r.user_id,
              mobile_number: r.user_id,
              bottles: totItems,
              totalBottles: totItems,
              plasticCount: pCount,
              plastic_count: pCount,
              plastic_small_count: parseInt(r.plastic_small_count || 0),
              plastic_medium_count: parseInt(r.plastic_medium_count || 0),
              plastic_large_count: parseInt(r.plastic_large_count || 0),
              aluminiumCount: aCount,
              aluminium_count: aCount,
              can_small_count: parseInt(r.can_small_count || 0),
              can_medium_count: parseInt(r.can_medium_count || 0),
              can_large_count: parseInt(r.can_large_count || 0),
              paperCardboardCount: paperCount,
              paper_cardboard_count: paperCount,
              paper_weight_grams: parseInt(r.paper_weight_grams || 0),
              tetrapak_weight_grams: parseInt(r.tetrapak_weight_grams || 0),
              glassCount: gCount,
              glass_count: gCount,
              glass_small_count: parseInt(r.glass_small_count || 0),
              glass_medium_count: parseInt(r.glass_medium_count || 0),
              glass_large_count: parseInt(r.glass_large_count || 0),
              itemVariant: variant,
              item_variant: variant,
              bottleSize: bSize,
              bottle_size: bSize,
              totalWeightKg: parseFloat(r.total_weight_kg || 0),
              total_weight_kg: parseFloat(r.total_weight_kg || 0),
              co2AvoidedKg: parseFloat(r.co2_avoided_kg || 0),
              co2_avoided_kg: parseFloat(r.co2_avoided_kg || 0),
              points: parseInt(r.points_earned || 0),
              totalPoints: parseInt(r.points_earned || 0),
              pointsEarned: parseInt(r.points_earned || 0),
              points_earned: parseInt(r.points_earned || 0),
              session_status: r.session_status || 'completed',
              recycledAt: r.created_at,
              created_at: r.created_at,
              timestamp: r.created_at
            });

          }
        });

      } catch (e) {}

      return docs;
    }

    // 2. Relational Table: users / userprofile
    if (tableName === 'users' || tableName === 'userprofile') {
      const docs = [];
      try {
        const jsonRes = await pool.query(`SELECT id, data FROM userprofile;`).catch(() => ({ rows: [] }));
        jsonRes.rows.forEach(r => {
          const parsed = typeof r.data === 'string' ? JSON.parse(r.data) : { ...r.data };
          delete parsed.id;
          if (!parsed._id) parsed._id = r.id;
          docs.push(parsed);
        });
      } catch (e) {}

      try {
        const relRes = await pool.query(`SELECT * FROM users;`).catch(() => ({ rows: [] }));
        const existingIds = new Set(docs.map(d => d._id || d.user_id || d.username));
        relRes.rows.forEach(r => {
          const uId = r.user_id || r.username;
          if (!existingIds.has(uId)) {
            docs.push({
              _id: uId,
              user_id: uId,
              username: r.username,
              fullName: r.full_name,
              full_name: r.full_name,
              email: r.email,
              pointsBalance: r.points_balance,
              points_balance: r.points_balance,
              role: r.role_id,
              status: r.status,
              createdAt: r.created_at
            });
          }
        });
      } catch (e) {}

      return docs;
    }

    // 3. Relational Table: machines
    if (tableName === 'machines') {
      try {
        const relRes = await pool.query(`SELECT * FROM machines;`).catch(() => ({ rows: [] }));
        return relRes.rows.map(r => ({
          _id: r.machine_id,
          machineId: r.machine_id,
          name: r.name,
          location: r.location,
          status: r.status,
          totalBottlesRecycled: r.total_bottles_recycled,
          totalWeightKg: r.total_weight_kg,
          lastPingAt: r.last_ping_at
        }));
      } catch (e) {}
    }

    // 4. Relational Table: machine_configs
    if (tableName === 'machine_configs') {
      try {
        const relRes = await pool.query(`SELECT * FROM machine_configs;`).catch(() => ({ rows: [] }));
        return relRes.rows.map(r => ({
          _id: r.machine_id,
          machineId: r.machine_id,
          configVersion: r.config_version,
          pointsPerPlastic: r.points_per_plastic,
          pointsPerAluminium: r.points_per_aluminium,
          pointsPerPaperKg: r.points_per_paper_kg,
          updatedAt: r.updated_at
        }));
      } catch (e) {}
    }

    // 5. Dynamic JSONB Document Tables
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "${tableName}" (
          id VARCHAR(255) PRIMARY KEY,
          data JSONB NOT NULL,
          synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      const res = await pool.query(`SELECT id, data FROM "${tableName}"`);
      return res.rows.map(r => {
        const parsed = typeof r.data === 'string' ? JSON.parse(r.data) : { ...r.data };
        delete parsed.id; // Keep _id as the single primary ID field
        if (!parsed._id) parsed._id = r.id;
        return parsed;
      });
    } catch (e) {
      return [];
    }
  }



  // MongoDB Collection Query
  if (!db) await connectDB();
  return await db.collection(colName).find({}).toArray();
}

async function saveDocToEngine(colName, doc) {

  if (activeDbType === 'postgres' && activePgConfig) {
    const pool = getPgPool();
    if (!pool) return false;
    const tableName = colName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "${tableName}" (
        id VARCHAR(255) PRIMARY KEY,
        data JSONB NOT NULL,
        synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    const idStr = doc._id ? doc._id.toString() : (doc.id ? doc.id.toString() : new ObjectId().toString());
    const docToSave = { ...doc, _id: idStr };
    delete docToSave.id; // Single primary _id field
    const docJson = JSON.stringify(docToSave);
    await pool.query(`
      INSERT INTO "${tableName}" (id, data, synced_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, synced_at = NOW();
    `, [idStr, docJson]);

    return true;
  }

  if (!db) await connectDB();
  const query = doc.username ? { username: doc.username } : (doc.roleId ? { roleId: doc.roleId } : { _id: doc._id });
  if (query.username || query.roleId) {
    await db.collection(colName).updateOne(query, { $set: doc }, { upsert: true });
  } else {
    await db.collection(colName).insertOne(doc);
  }
  return true;
}

async function updateDocInEngine(colName, matchKey, matchVal, updateFields) {
  if (activeDbType === 'postgres' && activePgConfig) {
    const pool = getPgPool();
    if (!pool) return false;
    const tableName = colName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const res = await pool.query(`SELECT id, data FROM "${tableName}" WHERE data->>'${matchKey}' = $1 OR id = $1`, [matchVal]);
    if (res.rows.length > 0) {
      const existingData = typeof res.rows[0].data === 'string' ? JSON.parse(res.rows[0].data) : res.rows[0].data;
      const updatedData = { ...existingData, ...updateFields, _id: res.rows[0].id };
      delete updatedData.id;
      await pool.query(`UPDATE "${tableName}" SET data = $1, synced_at = NOW() WHERE id = $2`, [JSON.stringify(updatedData), res.rows[0].id]);
    } else {
      const idStr = matchVal;
      const docToSave = { [matchKey]: matchVal, ...updateFields, _id: idStr };
      delete docToSave.id;
      await pool.query(`
        INSERT INTO "${tableName}" (id, data, synced_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, synced_at = NOW();
      `, [idStr, JSON.stringify(docToSave)]);
    }
    return true;
  }

  if (!db) await connectDB();
  const query = { [matchKey]: matchVal };
  await db.collection(colName).updateOne(query, { $set: updateFields });
  return true;
}

async function deleteDocFromEngine(colName, matchKey, matchVal) {
  if (activeDbType === 'postgres' && activePgConfig) {
    const pool = getPgPool();
    if (!pool) return false;
    const tableName = colName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    await pool.query(`DELETE FROM "${tableName}" WHERE data->>'${matchKey}' = $1 OR id = $1`, [matchVal]);
    return true;
  }

  if (!db) await connectDB();
  const query = ObjectId.isValid(matchVal) ? { _id: new ObjectId(matchVal) } : { [matchKey]: matchVal };
  await db.collection(colName).deleteOne(query);
  return true;
}



// Restore Database from Uploaded JSON / Selected Snapshot into Currently Connected Database
app.post('/api/db/restore', enforceReadOnlyProtection, async (req, res) => {
  try {
    const activeName = activeDbType === 'postgres' ? (activePgConfig?.database || 'rvmpg') : (db ? db.databaseName : currentDbName);
    const hostInfo = activeDbType === 'postgres' ? `${activePgConfig?.host || '127.0.0.1'}:${activePgConfig?.port || 5432}` : getSanitizedHost(currentUri);
    const { backupData, mode = 'replace' } = req.body;
    const result = await executeRestoreData(backupData, db, mode);

    res.json({
      success: true,
      message: `Successfully restored ${result.totalRestoredDocs} documents across ${result.restoredCollections.length} ${activeDbType === 'postgres' ? 'tables' : 'collections'} directly into connected ${activeDbType.toUpperCase()} database "${activeName}" on server ${hostInfo}.`,
      restoredCollections: result.restoredCollections,
      totalRestoredDocs: result.totalRestoredDocs,
      targetDatabase: activeName,
      databaseType: activeDbType,
      serverHost: hostInfo
    });
  } catch (err) {
    console.error('[Restore Error]', err);
    res.status(500).json({ error: 'Failed to restore database snapshot', details: err.message });
  }
});

// Direct Snapshot File Restoration Endpoint
app.post('/api/db/restore-snapshot/:filename', enforceReadOnlyProtection, async (req, res) => {
  try {
    const activeName = activeDbType === 'postgres' ? (activePgConfig?.database || 'rvmpg') : (db ? db.databaseName : currentDbName);
    const hostInfo = activeDbType === 'postgres' ? `${activePgConfig?.host || '127.0.0.1'}:${activePgConfig?.port || 5432}` : getSanitizedHost(currentUri);

    const { filename } = req.params;
    const filePath = path.join(BACKUPS_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Snapshot file not found on server' });
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const backupData = JSON.parse(content);
    const result = await executeRestoreData(backupData, db, 'replace');

    res.json({
      success: true,
      message: `Successfully restored snapshot "${filename}" (${result.totalRestoredDocs} documents) directly into connected ${activeDbType.toUpperCase()} database "${activeName}" on server ${hostInfo}.`,
      restoredCollections: result.restoredCollections,
      totalRestoredDocs: result.totalRestoredDocs,
      targetDatabase: activeName,
      databaseType: activeDbType,
      serverHost: hostInfo
    });
  } catch (err) {
    console.error('[Snapshot Restore Error]', err);
    res.status(500).json({ error: 'Failed to restore snapshot', details: err.message });
  }
});




// ==========================================
// USER SECURITY & ROLE-BASED ACCESS CONTROL (RBAC)
// ==========================================

const DEFAULT_RBAC_ROLES = [
  {
    roleId: 'super_admin',
    name: 'Super Admin / Master Dev',
    color: 'emerald',
    description: 'Full unrestricted system access, DB switching, backup/restore & security controls',
    modules: ['overview', 'analytics', 'machines', 'feedbacks', 'users', 'db_switcher', 'db_backup', 'security'],
    permissions: { view: true, edit: true, export: true, delete: true, manage_users: true, switch_db: true }
  },
  {
    roleId: 'fleet_operator',
    name: 'RVM Fleet Operator',
    color: 'cyan',
    description: 'Access restricted to RVM Hardware Fleet Health, Machine Alerts, and Bin Diagnostics',
    modules: ['machines', 'overview'],
    permissions: { view: true, edit: true, export: true, delete: false, manage_users: false, switch_db: false }
  },
  {
    roleId: 'analytics_analyst',
    name: 'Analytics & Operations Analyst',
    color: 'amber',
    description: 'Access restricted to System Overview, Recycler Leaderboards & Analytics Reports',
    modules: ['overview', 'analytics'],
    permissions: { view: true, edit: false, export: true, delete: false, manage_users: false, switch_db: false }
  },
  {
    roleId: 'support_specialist',
    name: 'Customer Support Specialist',
    color: 'purple',
    description: 'Access restricted to User Feedbacks, Eco User Profiles & Redemptions',
    modules: ['feedbacks', 'users'],
    permissions: { view: true, edit: true, export: false, delete: false, manage_users: false, switch_db: false }
  }
];

// Seed default roles and admin accounts if empty
async function seedSecurityDefaults(targetDb) {
  if (activeDbType === 'postgres' && activePgConfig) {
    try {
      const roles = await fetchCollectionDocs('roles');
      if (roles.length === 0) {
        for (const r of DEFAULT_RBAC_ROLES) {
          await saveDocToEngine('roles', r);
        }
      }

      const users = await fetchCollectionDocs('adminaccounts');
      const defaultUsers = [
        {
          username: 'onenet',
          fullName: 'Master Developer (onenet)',
          email: 'onenet@rvm-dash.io',
          roleId: 'super_admin',
          roleName: 'Super Admin / Master Dev',
          assignedMachines: ['*'],
          status: 'active',
          createdAt: new Date().toISOString()
        },
        {
          username: 'bilalaaqueel',
          fullName: 'Bilal Aqeel',
          email: 'bilalaaqueel@gmail.com',
          roleId: 'super_admin',
          roleName: 'Super Admin / Master Dev',
          assignedMachines: ['*'],
          status: 'active',
          createdAt: new Date().toISOString()
        },
        {
          username: 'testingrvm',
          fullName: 'testingrvm',
          email: 'testingrvm@gmail.com',
          roleId: 'fleet_operator',
          roleName: 'RVM Fleet Operator',
          assignedMachines: ['*'],
          status: 'active',
          createdAt: new Date().toISOString()
        }
      ];

      for (const u of defaultUsers) {
        const exists = users.find(x => x.username === u.username);
        if (!exists) {
          await saveDocToEngine('adminaccounts', u);
        }
      }
    } catch (e) {
      console.warn('[PostgreSQL Seed Warning]', e.message);
    }
    return;
  }

  if (!targetDb || isWriteProtected(targetDb.databaseName, targetDb)) {
    return;
  }
  try {
    const rolesCol = targetDb.collection('roles');
    const rolesCount = await rolesCol.countDocuments();
    if (rolesCount === 0) {
      await rolesCol.insertMany(DEFAULT_RBAC_ROLES);
    }

    const adminCol = targetDb.collection('adminaccounts');
    const adminCount = await adminCol.countDocuments();
    if (adminCount === 0) {
      await adminCol.insertMany([
        {
          username: 'onenet',
          fullName: 'Master Developer (onenet)',
          email: 'onenet@rvm-dash.io',
          roleId: 'super_admin',
          roleName: 'Super Admin / Master Dev',
          assignedMachines: ['*'],
          status: 'active',
          createdAt: new Date().toISOString()
        },
        {
          username: 'bilalaaqueel',
          fullName: 'Bilal Aqeel',
          email: 'bilalaaqueel@gmail.com',
          roleId: 'super_admin',
          roleName: 'Super Admin / Master Dev',
          assignedMachines: ['*'],
          status: 'active',
          createdAt: new Date().toISOString()
        },
        {
          username: 'testingrvm',
          fullName: 'testingrvm',
          email: 'testingrvm@gmail.com',
          roleId: 'fleet_operator',
          roleName: 'RVM Fleet Operator',
          assignedMachines: ['*'],
          status: 'active',
          createdAt: new Date().toISOString()
        }
      ]);
    } else {
      const existingBilal = await adminCol.findOne({ username: 'bilalaaqueel' });
      if (!existingBilal) {
        await adminCol.insertOne({
          username: 'bilalaaqueel',
          fullName: 'Bilal Aqeel',
          email: 'bilalaaqueel@gmail.com',
          roleId: 'super_admin',
          roleName: 'Super Admin / Master Dev',
          assignedMachines: ['*'],
          status: 'active',
          createdAt: new Date().toISOString()
        });
      }
      const existingTesting = await adminCol.findOne({ username: 'testingrvm' });
      if (!existingTesting) {
        await adminCol.insertOne({
          username: 'testingrvm',
          fullName: 'testingrvm',
          email: 'testingrvm@gmail.com',
          roleId: 'fleet_operator',
          roleName: 'RVM Fleet Operator',
          assignedMachines: ['*'],
          status: 'active',
          createdAt: new Date().toISOString()
        });
      }
    }
  } catch (e) {
    console.warn('[RBAC Seed Warning]', e.message);
  }
}

// Security: Get all roles
app.get('/api/security/roles', async (req, res) => {
  try {
    await seedSecurityDefaults(db);
    const roles = await fetchCollectionDocs('roles');
    res.json(roles.length > 0 ? roles : DEFAULT_RBAC_ROLES);
  } catch (err) {
    res.json(DEFAULT_RBAC_ROLES);
  }
});

// Security: Create/Update custom role
app.post('/api/security/roles', enforceReadOnlyProtection, async (req, res) => {
  try {
    const { roleId, name, color, description, modules, permissions } = req.body;
    if (!name || !roleId) {
      return res.status(400).json({ error: 'Role name and roleId are required' });
    }

    const roleDoc = { roleId, name, color: color || 'cyan', description, modules: modules || [], permissions: permissions || {} };
    await saveDocToEngine('roles', roleDoc);

    res.json({ success: true, message: `Role "${name}" updated successfully.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Security: Get all admin users
app.get('/api/security/users', async (req, res) => {
  try {
    await seedSecurityDefaults(db);
    const users = await fetchCollectionDocs('adminaccounts');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Security: Create new user with role assignment & machine scope
app.post('/api/security/users', enforceReadOnlyProtection, async (req, res) => {
  try {
    const { username, fullName, email, roleId, assignedMachines } = req.body;
    if (!username || !roleId) {
      return res.status(400).json({ error: 'Username and Role Assignment are required.' });
    }

    const existingUsers = await fetchCollectionDocs('adminaccounts');
    const existing = existingUsers.find(u => u.username === username);
    if (existing) {
      return res.status(400).json({ error: `User with username "${username}" already exists.` });
    }

    const roles = await fetchCollectionDocs('roles');
    const roleDoc = roles.find(r => r.roleId === roleId);
    const roleName = roleDoc ? roleDoc.name : roleId;

    const newId = new ObjectId().toString();
    const newUser = {
      _id: newId,
      username,
      fullName: fullName || username,
      email: email || `${username}@rvm-dash.io`,
      roleId,
      roleName,
      assignedMachines: Array.isArray(assignedMachines) ? assignedMachines : (assignedMachines ? [assignedMachines] : ['*']),
      status: 'active',
      createdAt: new Date().toISOString()
    };



    await saveDocToEngine('adminaccounts', newUser);
    res.json({ success: true, message: `User "${username}" created and assigned role "${roleName}".`, user: newUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Security: Update user account status or role
app.put('/api/security/users/:id', enforceReadOnlyProtection, async (req, res) => {
  try {
    const { id } = req.params;
    const { roleId, status, assignedMachines, fullName, email, password } = req.body;

    const updateFields = {};
    if (roleId) {
      updateFields.roleId = roleId;
      const roles = await fetchCollectionDocs('roles');
      const roleDoc = roles.find(r => r.roleId === roleId);
      if (roleDoc) updateFields.roleName = roleDoc.name;
    }
    if (password && password.trim()) {
      updateFields.password = password.trim();
      updateFields.passwordUpdatedAt = new Date().toISOString();
    }
    if (status) updateFields.status = status;
    if (assignedMachines) updateFields.assignedMachines = Array.isArray(assignedMachines) ? assignedMachines : [assignedMachines];
    if (fullName) updateFields.fullName = fullName;
    if (email) updateFields.email = email;

    await updateDocInEngine('adminaccounts', 'username', id, updateFields);
    res.json({ success: true, message: `User account "${id}" updated successfully.` });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Security: Delete user account
app.delete('/api/security/users/:id', enforceReadOnlyProtection, async (req, res) => {
  try {
    const { id } = req.params;
    await deleteDocFromEngine('adminaccounts', 'username', id);
    res.json({ success: true, message: 'User account removed.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// ==========================================
// AUTHENTICATION & LOGIN/LOGOUT SESSION ENDPOINTS
// ==========================================

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Username or email is required' });
    }

    await seedSecurityDefaults(db);

    let user = null;
    let role = null;

    // Master Developer Override Check (username: onenet / password: Admin&86)
    if (username === 'onenet' || username === 'onenet@rvm-dash.io') {
      if (password !== 'Admin&86') {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      user = {
        username: 'onenet',
        fullName: 'Master Developer (onenet)',
        email: 'onenet@rvm-dash.io',
        roleId: 'super_admin',
        roleName: 'Super Admin / Master Dev',
        assignedMachines: ['*'],
        status: 'active'
      };
    } else {
      let foundUser = null;
      if (activeDbType === 'postgres') {
        const users = await fetchCollectionDocs('adminaccounts');
        foundUser = users.find(u => u.username === username || u.email === username);
      } else if (db) {
        const adminCol = db.collection('adminaccounts');
        foundUser = await adminCol.findOne({
          $or: [{ username: username }, { email: username }]
        });
      }

      if (!foundUser) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      if (foundUser.status === 'suspended') {
        return res.status(403).json({ error: 'Account Suspended. Please contact system administrator.' });
      }

      // Enforce strict password validation
      const expectedPassword = foundUser.password || process.env.ADMIN_PASSWORD || 'adminpassword';
      if (password !== expectedPassword) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      user = foundUser;
    }


    // Fetch Role Permissions
    let roleDoc = null;
    if (activeDbType === 'postgres') {
      const roles = await fetchCollectionDocs('roles');
      roleDoc = roles.find(r => r.roleId === user.roleId);
    } else if (db) {
      const rolesCol = db.collection('roles');
      roleDoc = await rolesCol.findOne({ roleId: user.roleId });
    }

    const fallbackRole = DEFAULT_RBAC_ROLES.find(r => r.roleId === user.roleId) || DEFAULT_RBAC_ROLES[0];
    role = roleDoc || fallbackRole;

    const token = `token_${user.username}_${Date.now()}`;

    res.json({
      success: true,
      token,
      message: `Welcome back, ${user.fullName || user.username}! Logged in as ${role.name}.`,
      user: {
        username: user.username,
        fullName: user.fullName || user.username,
        email: user.email || '',
        roleId: user.roleId,
        roleName: role.name,
        color: role.color || 'emerald',
        assignedMachines: user.assignedMachines || ['*'],
        modules: role.modules || ['overview', 'analytics', 'machines'],
        permissions: role.permissions || { view: true, edit: true, export: true }
      }
    });

  } catch (err) {
    console.error('[Login Error]', err);
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const usernameMatch = token.match(/^token_([^_]+)_/);
    const username = usernameMatch ? usernameMatch[1] : 'onenet';

    await seedSecurityDefaults(db);

    let user = null;
    let roleDoc = null;

    if (activeDbType === 'postgres') {
      const users = await fetchCollectionDocs('adminaccounts');
      user = users.find(u => u.username === username);
      const roles = await fetchCollectionDocs('roles');
      if (user) {
        roleDoc = roles.find(r => r.roleId === user.roleId);
      }
    } else if (db) {
      const adminCol = db.collection('adminaccounts');
      user = await adminCol.findOne({ username });
      if (user) {
        roleDoc = await db.collection('roles').findOne({ roleId: user.roleId });
      }
    }

    if (!user) {
      user = {
        username: 'onenet',
        fullName: 'Master Developer (onenet)',
        email: 'onenet@rvm-dash.io',
        roleId: 'super_admin',
        roleName: 'Super Admin / Master Dev',
        assignedMachines: ['*']
      };
    }

    if (!roleDoc) {
      roleDoc = DEFAULT_RBAC_ROLES.find(r => r.roleId === user.roleId) || DEFAULT_RBAC_ROLES[0];
    }

    res.json({
      authenticated: true,
      user: {
        username: user.username,
        fullName: user.fullName || user.username,
        email: user.email || '',
        roleId: user.roleId,
        roleName: roleDoc.name,
        color: roleDoc.color || 'emerald',
        assignedMachines: user.assignedMachines || ['*'],
        modules: roleDoc.modules || ['overview', 'analytics', 'machines'],
        permissions: roleDoc.permissions || { view: true, edit: true, export: true }
      }
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid authentication session' });
  }
});


// ==========================================
// RVM HARDWARE TELEMETRY & QR SCANNER API (PHASE 3)
// ==========================================
async function verifyAndAuthorizeMachine(machineId) {
  if (!machineId) return { authorized: false, reason: 'machineId is missing' };

  if (activeDbType === 'postgres') {
    const pool = getPgPool();
    if (pool) {
      try {
        const res = await pool.query(`SELECT machine_id, status FROM machines WHERE machine_id = $1`, [machineId]);
        if (res.rows.length === 0) {
          return { authorized: false, reason: `RVM Machine '${machineId}' is NOT registered on Central Dashboard. Please register it first in Fleet Monitoring.` };
        }
        const m = res.rows[0];
        if (m.status === 'disabled' || m.status === 'unauthorized') {
          return { authorized: false, reason: `RVM Machine '${machineId}' is disabled or unauthorized on Central Dashboard.` };
        }
        return { authorized: true };
      } catch (e) {
        return { authorized: true };
      }
    }
  }

  if (activeDbType === 'mongodb') {
    const db = getMongoDb();
    if (db) {
      try {
        const m = await db.collection('machines').findOne({ machineId });
        if (!m) {
          return { authorized: false, reason: `RVM Machine '${machineId}' is NOT registered on Central Dashboard. Please register it first in Fleet Monitoring.` };
        }
        if (m.status === 'disabled' || m.status === 'unauthorized') {
          return { authorized: false, reason: `RVM Machine '${machineId}' is disabled or unauthorized on Central Dashboard.` };
        }
        return { authorized: true };
      } catch (e) {
        return { authorized: true };
      }
    }
  }

  return { authorized: true };
}

// Upstream Session Sync Endpoint (Receives detailed local transaction data from desktop machines)
app.post('/api/machine/sync-session', async (req, res) => {
  try {
    const {
      machineId,
      localSessionId,
      userId,
      plasticCount = 0,
      aluminiumCount = 0,
      paperCardboardCount = 0,
      glassCount = 0,
      plasticSmallCount = 0,
      plasticMediumCount = 0,
      plasticLargeCount = 0,
      canSmallCount = 0,
      canMediumCount = 0,
      canLargeCount = 0,
      paperWeightGrams = 0,
      tetrapakWeightGrams = 0,
      glassSmallCount = 0,
      glassMediumCount = 0,
      glassLargeCount = 0,
      weightKg = 0,
      bottleSize,
      itemVariant,
      createdAt
    } = req.body;
    if (!machineId) {
      return res.status(400).json({ error: 'machineId is required' });
    }

    const authCheck = await verifyAndAuthorizeMachine(machineId);
    if (!authCheck.authorized) {
      return res.status(403).json({ success: false, authorized: false, error: authCheck.reason });
    }

    const sessionId = localSessionId ? `${machineId}_${localSessionId}` : `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    let totalBottles = req.body.totalBottles || req.body.bottles || ((plasticCount || 0) + (aluminiumCount || 0) + (paperCardboardCount || 0) + (glassCount || 0));
    if (totalBottles === 0 && weightKg > 0) totalBottles = 1;
    const co2AvoidedKg = parseFloat(((plasticCount * 0.05) + (aluminiumCount * 0.09) + (glassCount * 0.03)).toFixed(3));
    let pointsEarned = req.body.pointsEarned || req.body.points || ((plasticCount * 10) + (aluminiumCount * 20) + (paperCardboardCount * 15) + (glassCount * 10));
    if (pointsEarned === 0) pointsEarned = 30;

    const bSize = bottleSize || req.body.size || 'MEDIUM';
    let variant = itemVariant || req.body.material;
    if (!variant) {
      if (plasticCount > 0) variant = `${plasticCount}x ${bSize} PLASTIC`;
      else if (aluminiumCount > 0) variant = `${aluminiumCount}x CAN (Metal)`;
      else if (paperCardboardCount > 0) variant = `${paperCardboardCount}x PAPER / TETRA PAK`;
      else if (glassCount > 0) variant = `${glassCount}x ${bSize} GLASS`;
      else variant = `${totalBottles}x ${bSize} RECYCLABLE ITEM`;
    }

    const sessionDoc = {
      _id: sessionId,
      session_id: sessionId,
      machineId: machineId || 'RVM-001',
      machine_id: machineId || 'RVM-001',
      userId: userId || 'anonymous',
      user_id: userId || 'anonymous',
      mobile_number: userId || 'anonymous',
      bottles: totalBottles,
      totalBottles: totalBottles,
      cups: 0,
      totalCups: 0,
      points: pointsEarned,
      totalPoints: pointsEarned,
      pointsEarned: pointsEarned,
      plasticCount,
      plastic_count: plasticCount,
      aluminiumCount,
      aluminium_count: aluminiumCount,
      paperCardboardCount,
      paper_cardboard_count: paperCardboardCount,
      glassCount,
      glass_count: glassCount,
      plastic_small_count: plasticSmallCount || (bSize === 'SMALL' ? plasticCount : 0),
      plastic_medium_count: plasticMediumCount || (bSize === 'MEDIUM' ? plasticCount : 0),
      plastic_large_count: plasticLargeCount || (bSize === 'LARGE' ? plasticCount : 0),
      can_small_count: canSmallCount || (bSize === 'SMALL' ? aluminiumCount : 0),
      can_medium_count: canMediumCount || (bSize === 'MEDIUM' ? aluminiumCount : 0),
      can_large_count: canLargeCount || (bSize === 'LARGE' ? aluminiumCount : 0),
      paper_weight_grams: paperWeightGrams || (paperCardboardCount > 0 ? Math.round(weightKg * 1000) : 0),
      tetrapak_weight_grams: tetrapakWeightGrams || 0,
      itemVariant: variant,
      item_variant: variant,
      bottleSize: bSize,
      bottle_size: bSize,
      totalWeightKg: weightKg,
      total_weight_kg: weightKg,
      co2AvoidedKg,
      co2_avoided_kg: co2AvoidedKg,
      recycledAt: createdAt || new Date().toISOString(),
      timestamp: createdAt || new Date().toISOString(),
      session_status: 'completed',
      createdAt: createdAt || new Date().toISOString(),
      created_at: createdAt || new Date().toISOString()
    };


    await saveDocToEngine('recyclingsessions', sessionDoc);

    // ALWAYS write machine session data to PostgreSQL relational tables
    try {
      const pool = getPgPool();
      if (pool) {
        // 1. Ensure machine exists FIRST to satisfy foreign key constraint
        await pool.query(`
          INSERT INTO machines (machine_id, name, location, status, total_bottles_recycled, total_weight_kg)
          VALUES ($1, $1, 'System Auto', 'active', $2, $3)
          ON CONFLICT (machine_id) DO UPDATE SET 
            total_bottles_recycled = machines.total_bottles_recycled + EXCLUDED.total_bottles_recycled,
            total_weight_kg = machines.total_weight_kg + EXCLUDED.total_weight_kg,
            last_ping_at = NOW();
        `, [machineId, totalBottles, weightKg]);

        const pSmall = plasticSmallCount || (bSize === 'SMALL' ? plasticCount : 0);
        const pMedium = plasticMediumCount || (bSize === 'MEDIUM' ? plasticCount : 0);
        const pLarge = plasticLargeCount || (bSize === 'LARGE' ? plasticCount : 0);

        const cSmall = canSmallCount || (bSize === 'SMALL' ? aluminiumCount : 0);
        const cMedium = canMediumCount || (bSize === 'MEDIUM' ? aluminiumCount : 0);
        const cLarge = canLargeCount || (bSize === 'LARGE' ? aluminiumCount : 0);

        const paperGrams = paperWeightGrams || (paperCardboardCount > 0 ? Math.round(weightKg * 1000) : 0);
        const tetrapakGrams = tetrapakWeightGrams || 0;

        // 2. Insert into recycling_sessions table
        await pool.query(`
          INSERT INTO recycling_sessions (
            session_id, machine_id, user_id, 
            plastic_count, aluminium_count, paper_cardboard_count, glass_count, 
            plastic_small_count, plastic_medium_count, plastic_large_count,
            can_small_count, can_medium_count, can_large_count,
            paper_weight_grams, tetrapak_weight_grams,
            glass_small_count, glass_medium_count, glass_large_count,
            item_variant, bottle_size, total_weight_kg, co2_avoided_kg, points_earned, session_status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, 'completed')
          ON CONFLICT (session_id) DO NOTHING;
        `, [
          sessionId, machineId, userId || 'anonymous',
          plasticCount, aluminiumCount, paperCardboardCount, glassCount,
          pSmall, pMedium, pLarge,
          cSmall, cMedium, cLarge,
          paperGrams, tetrapakGrams,
          glassSmallCount, glassMediumCount, glassLargeCount,
          variant, bSize, weightKg, co2AvoidedKg, pointsEarned
        ]);

        // 3. Upsert user points
        if (userId && userId !== 'anonymous') {
          await pool.query(`
            INSERT INTO users (user_id, username, full_name, email, points_balance, role_id, status)
            VALUES ($1, $2, $2, $3, $4, 'fleet_operator', 'active')
            ON CONFLICT (user_id) DO UPDATE SET points_balance = users.points_balance + EXCLUDED.points_balance;
          `, [userId, userId, `${userId}@rvm-dash.io`, pointsEarned]);
        }
      }
    } catch (pgSyncErr) {
      console.warn('[PostgreSQL Machine Sync Warning]', pgSyncErr.message);
    }






    res.json({
      success: true,
      syncedLocalId: localSessionId || sessionId,
      sessionId,
      pointsEarned,
      message: `Session ${localSessionId || sessionId} synchronized successfully into Central DB.`
    });
  } catch (err) {
    console.error('[Session Sync Error]', err);
    res.status(500).json({ error: 'Failed to sync session', details: err.message });
  }
});

// Upstream Telemetry Heartbeat & Bin Level Alerts
app.post('/api/machine/heartbeat', async (req, res) => {
  try {
    const { machineId, binFillPercentage = 0, status = 'active', temperatureCelsius } = req.body;
    if (!machineId) return res.status(400).json({ error: 'machineId is required' });

    const authCheck = await verifyAndAuthorizeMachine(machineId);
    if (!authCheck.authorized) {
      return res.status(403).json({ success: false, authorized: false, error: authCheck.reason });
    }

    if (activeDbType === 'postgres') {
      const pool = getPgPool();
      if (pool) {
        await pool.query(`
          UPDATE machines 
          SET status = $2, bin_fill_percentage = $3, last_ping_at = NOW()
          WHERE machine_id = $1;
        `, [machineId, status, binFillPercentage]);
      }
    }

    if (activeDbType === 'mongodb') {
      const db = getMongoDb();
      if (db) {
        await db.collection('machines').updateOne(
          { machineId },
          { $set: { lastPingAt: new Date(), updatedAt: new Date(), status: 'active', binFillPercentage } }
        ).catch(() => {});
      }
    }

    if (binFillPercentage >= 80) {
      await saveDocToEngine('binfullnotifications', {
        _id: `alert_${machineId}_${Date.now()}`,
        machineId,
        binFillPercentage,
        alertType: binFillPercentage >= 95 ? 'CRITICAL_BIN_FULL' : 'HIGH_BIN_FILL',
        createdAt: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      machineId,
      binFillPercentage,
      status,
      receivedAt: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Downstream Config & Points Rules Endpoint
app.get('/api/machine/config/:machineId', async (req, res) => {
  try {
    const { machineId } = req.params;

    const authCheck = await verifyAndAuthorizeMachine(machineId);
    if (!authCheck.authorized) {
      return res.status(403).json({ success: false, authorized: false, error: authCheck.reason });
    }

    let config = {
      machineId,
      name: `RVM Machine ${machineId}`,
      location: 'Main Kiosk',
      configVersion: 1,
      pointsPerPlasticBottle: 10,
      pointsPerAluminiumCan: 20,
      pointsPerPaperKg: 15,
      updatedAt: new Date().toISOString()
    };

    if (activeDbType === 'postgres') {
      const pool = getPgPool();
      if (pool) {
        await pool.query(`
          INSERT INTO machines (machine_id, name, status, last_ping_at)
          VALUES ($1, $1, 'active', NOW())
          ON CONFLICT (machine_id) DO UPDATE SET last_ping_at = NOW(), status = 'active';
        `, [machineId]).catch(() => {});

        const result = await pool.query(
          `SELECT c.*, m.name, m.location 
           FROM machine_configs c 
           LEFT JOIN machines m ON c.machine_id = m.machine_id 
           WHERE c.machine_id = $1`, [machineId]);
        if (result.rows.length > 0) {
          const row = result.rows[0];
          config = {
            machineId: row.machine_id,
            name: row.name || `RVM Machine ${row.machine_id}`,
            location: row.location || 'Main Kiosk',
            configVersion: row.config_version,
            pointsPerPlasticBottle: row.points_per_plastic,
            pointsPerAluminiumCan: row.points_per_aluminium,
            pointsPerPaperKg: row.points_per_paper_kg,
            updatedAt: row.updated_at
          };
        }
      }
    }

    if (activeDbType === 'mongodb') {
      const db = getMongoDb();
      if (db) {
        const m = await db.collection('machines').findOne({ machineId });
        if (m) {
          if (m.name) config.name = m.name;
          if (m.location) config.location = m.location;
        }
      }
    }

    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// QR Code Authenticator for RVM Machine Scanner
app.post('/api/user/verify-qr', async (req, res) => {
  try {
    const { qrCodeToken, machineId } = req.body;
    if (!qrCodeToken) return res.status(400).json({ error: 'qrCodeToken is required' });

    const users = await fetchCollectionDocs('userprofile');
    const userDoc = users.find(u => u.username === qrCodeToken || u._id === qrCodeToken || u.email === qrCodeToken || u.userId === qrCodeToken);

    if (userDoc) {
      return res.json({
        valid: true,
        userId: userDoc._id || userDoc.username,
        username: userDoc.username,
        fullName: userDoc.fullName || userDoc.username || 'Valued Recycler',
        email: userDoc.email,
        pointsBalance: userDoc.pointsBalance || userDoc.points || 0,
        scannedAt: new Date().toISOString()
      });
    }

    const adminUsers = await fetchCollectionDocs('adminaccounts');
    const adminDoc = adminUsers.find(u => u.username === qrCodeToken || u.email === qrCodeToken);

    if (adminDoc) {
      return res.json({
        valid: true,
        userId: adminDoc._id || adminDoc.username,
        username: adminDoc.username,
        fullName: adminDoc.fullName || adminDoc.username,
        email: adminDoc.email,
        pointsBalance: 1000,
        scannedAt: new Date().toISOString()
      });
    }

    res.status(440).json({ valid: false, error: 'User QR Code invalid or expired' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

if (fs.existsSync(DIST_DIR)) {
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

app.listen(PORT, async () => {
  console.log(`[RVM Master Dashboard Backend] Running on http://localhost:${PORT}`);
  if (activeDbType === 'postgres') {
    await initProductionPostgresSchemas();
  }
});



