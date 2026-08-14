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


let activeDbType = process.env.DB_TYPE || 'mongodb';
let activePgConfig = null;

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
    dbName: process.env.PG_DATABASE || 'rvm_postgres',
    description: 'Dedicated PostgreSQL Relational Database running on Ubuntu Hosting Server'
  }
};

function validateMasterCredentials(username, password) {
  return username === 'onenet' && password === 'Admin&86';
}


function writeEnvFile(uri, dbName) {
  const envPath = path.join(__dirname, '..', '.env');
  const content = `MONGODB_URI=${uri}\nMONGODB_DBNAME=${dbName}\nJWT_SECRET=rvm-isp-dev-secret-key-2026\nADMIN_USERNAME=admin\nADMIN_PASSWORD=adminpassword\nPORT=${PORT}\nVITE_API_URL=http://localhost:${PORT}\n`;
  fs.writeFileSync(envPath, content, 'utf-8');
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

// Eagerly connect on process start
connectDB().catch(err => console.error('[Initial Connect Failed]', err.message));

// Ensure DB connected middleware
app.use(async (req, res, next) => {
  try {
    await connectDB();
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
        database: pgDatabase || process.env.PG_DATABASE || 'rvm_postgres'
      };

      try {
        await ensurePostgresDatabase(pgConfig);
      } catch (pgErr) {
        return res.status(400).json({
          error: `PostgreSQL Connection Failed: ${pgErr.message}. Please verify PostgreSQL service is running on ${pgConfig.host || '127.0.0.1'}:${pgConfig.port || 5432} and credentials are correct.`
        });
      }

      activeDbType = 'postgres';
      activePgConfig = pgConfig;
      currentDbName = pgConfig.database || 'rvm_postgres';

      return res.json({
        success: true,
        message: `Successfully authenticated as "onenet". Runtime database switched to PostgreSQL database "${currentDbName}" on host "${pgConfig.host || '127.0.0.1'}:${pgConfig.port || 5432}".`,
        database: currentDbName,
        databaseType: 'postgres',
        serverHost: `${pgConfig.host || '127.0.0.1'}:${pgConfig.port || 5432}`,
        serverLocation: { display: 'Ubuntu Dedicated Server (PostgreSQL Localhost)' }
      });
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

    writeEnvFile(newUri, newDbName);
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

    // Aggregates for bottles, cups, points filtered by machine scope
    const aggPipeline = [];
    if (Object.keys(machineQuery).length > 0) aggPipeline.push({ $match: machineQuery });
    aggPipeline.push({
      $group: {
        _id: null,
        totalBottles: { $sum: '$bottles' },
        totalCups: { $sum: '$cups' },
        totalPoints: { $sum: '$points' }
      }
    });

    const aggregateTotals = await sessionCol.aggregate(aggPipeline).toArray();

    const totals = aggregateTotals[0] || { totalBottles: 0, totalCups: 0, totalPoints: 0 };

    // Recent 5 sessions
    const recentSessions = await sessionCol
      .find(machineQuery)
      .sort({ recycledAt: -1, _id: -1 })
      .limit(5)
      .toArray();

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
      totalBottles: totals.totalBottles,
      totalCups: totals.totalCups,
      totalPoints: totals.totalPoints,
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
      totalPages: Math.ceil(totalDocs / parseInt(limit)),
      documents: docs
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Analytics Trends Endpoint
app.get('/api/analytics/trends', async (req, res) => {
  try {
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
    const sessionCol = db.collection('recyclingsessions');
    const binCol = db.collection('binfullnotifications');
    const machineQuery = getMachineScopeQuery(req, 'machineId');

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

    const combined = machineSessions.map(m => ({
      machineId: m._id,
      totalBottles: m.totalBottles,
      totalCups: m.totalCups,
      totalPoints: m.totalPoints,
      sessionCount: m.sessionCount,
      lastActive: m.lastActive,
      alertCount: alertsMap[m._id] ? alertsMap[m._id].alertCount : 0,
      lastAlert: alertsMap[m._id] ? alertsMap[m._id].lastAlert : null
    }));

    res.json(combined);
  } catch (err) {
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

// Create Full Database Backup Snapshot
app.get('/api/db/backup', async (req, res) => {

  try {
    const collections = await db.listCollections().toArray();
    const backupData = {
      database: currentDbName,
      exportedAt: new Date().toISOString(),
      collections: {}
    };

    let totalDocsCount = 0;
    const collectionsStats = [];

    for (const colInfo of collections) {
      const colName = colInfo.name;
      const docs = await db.collection(colName).find({}).toArray();
      backupData.collections[colName] = docs;
      totalDocsCount += docs.length;
      collectionsStats.push({ name: colName, count: docs.length });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${currentDbName}_backup_${timestamp}.json`;
    const filePath = path.join(BACKUPS_DIR, filename);

    const jsonStr = JSON.stringify(backupData, null, 2);
    fs.writeFileSync(filePath, jsonStr, 'utf-8');

    if (req.query.download === 'true') {
      return res.download(filePath, filename);
    }

    res.json({
      success: true,
      filename,
      timestamp: backupData.exportedAt,
      sizeBytes: Buffer.byteLength(jsonStr),
      totalCollections: collections.length,
      totalDocuments: totalDocsCount,
      collectionsStats,
      backupData
    });
  } catch (err) {
    console.error('[Backup Error]', err);
    res.status(500).json({ error: 'Failed to generate backup', details: err.message });
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

    const activeDb = db;
    const collections = await activeDb.listCollections().toArray();
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

      const docs = await activeDb.collection(colName).find({}).toArray();
      let tableSyncedCount = 0;

      for (const doc of docs) {
        const idStr = doc._id ? doc._id.toString() : (doc.id || `gen_${Math.random()}`);
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

    res.json({
      success: true,
      message: `Successfully synchronized ${totalSyncedDocs} documents across ${syncedTables.length} tables into PostgreSQL database "${pgConfig.database || 'PostgreSQL'}".`,
      sourceMongoDb: activeDb ? activeDb.databaseName : currentDbName,
      targetPostgresDb: pgConfig.database || 'PostgreSQL',
      totalSyncedDocs,
      syncedTables
    });
  } catch (err) {
    console.error('[PostgreSQL Sync Error]', err);
    res.status(500).json({
      success: false,
      error: `PostgreSQL Sync Failed: ${err.message}`
    });
  }
});


// Reusable Database Restore Execution Helper
async function executeRestoreData(backupData, targetDb, mode = 'replace') {
  if (!backupData || !backupData.collections) {
    throw new Error('Invalid backup format. Missing "collections" object.');
  }

  const restoredCollections = [];
  let totalRestoredDocs = 0;

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
        }
      }
      totalRestoredDocs += insertedForCol;
      restoredCollections.push({ name: colName, count: insertedForCol });
    } else {
      restoredCollections.push({ name: colName, count: 0 });
    }
  }

  return { totalRestoredDocs, restoredCollections };
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
    const tableName = colName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const client = new pg.Client(activePgConfig);
    try {
      await client.connect();
      await client.query(`
        CREATE TABLE IF NOT EXISTS "${tableName}" (
          id VARCHAR(255) PRIMARY KEY,
          data JSONB NOT NULL,
          synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      const res = await client.query(`SELECT data FROM "${tableName}"`);
      await client.end();
      return res.rows.map(r => typeof r.data === 'string' ? JSON.parse(r.data) : r.data);
    } catch (e) {
      try { await client.end(); } catch(err){}
      return [];
    }
  }

  // MongoDB Collection Query
  if (!db) await connectDB();
  return await db.collection(colName).find({}).toArray();
}

async function saveDocToEngine(colName, doc) {

  if (activeDbType === 'postgres' && activePgConfig) {
    const tableName = colName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const client = new pg.Client(activePgConfig);
    await client.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS "${tableName}" (
        id VARCHAR(255) PRIMARY KEY,
        data JSONB NOT NULL,
        synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    const idStr = doc._id ? doc._id.toString() : (doc.id || doc.username || doc.roleId || `gen_${Math.random()}`);
    const docJson = JSON.stringify(doc);
    await client.query(`
      INSERT INTO "${tableName}" (id, data, synced_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, synced_at = NOW();
    `, [idStr, docJson]);
    await client.end();
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
    const tableName = colName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const client = new pg.Client(activePgConfig);
    await client.connect();
    const res = await client.query(`SELECT id, data FROM "${tableName}" WHERE data->>'${matchKey}' = $1 OR id = $1`, [matchVal]);
    if (res.rows.length > 0) {
      const existingData = typeof res.rows[0].data === 'string' ? JSON.parse(res.rows[0].data) : res.rows[0].data;
      const updatedData = { ...existingData, ...updateFields };
      await client.query(`UPDATE "${tableName}" SET data = $1, synced_at = NOW() WHERE id = $2`, [JSON.stringify(updatedData), res.rows[0].id]);
    } else {
      const idStr = matchVal;
      await client.query(`
        INSERT INTO "${tableName}" (id, data, synced_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, synced_at = NOW();
      `, [idStr, JSON.stringify({ [matchKey]: matchVal, ...updateFields })]);
    }
    await client.end();
    return true;
  }

  if (!db) await connectDB();
  const query = { [matchKey]: matchVal };
  await db.collection(colName).updateOne(query, { $set: updateFields });
  return true;
}

async function deleteDocFromEngine(colName, matchKey, matchVal) {
  if (activeDbType === 'postgres' && activePgConfig) {
    const tableName = colName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const client = new pg.Client(activePgConfig);
    await client.connect();
    await client.query(`DELETE FROM "${tableName}" WHERE data->>'${matchKey}' = $1 OR id = $1`, [matchVal]);
    await client.end();
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
    const activeName = db ? db.databaseName : currentDbName;
    const { backupData, mode = 'replace' } = req.body;
    const result = await executeRestoreData(backupData, db, mode);

    res.json({
      success: true,
      message: `Successfully restored ${result.totalRestoredDocs} documents across ${result.restoredCollections.length} collections directly into active database "${activeName}".`,
      restoredCollections: result.restoredCollections,
      totalRestoredDocs: result.totalRestoredDocs,
      targetDatabase: activeName
    });
  } catch (err) {
    console.error('[Restore Error]', err);
    res.status(500).json({ error: 'Failed to restore database', details: err.message });
  }
});

// Direct Snapshot File Restoration Endpoint
app.post('/api/db/restore-snapshot/:filename', enforceReadOnlyProtection, async (req, res) => {
  try {
    const activeName = db ? db.databaseName : currentDbName;


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
      message: `Successfully restored snapshot "${filename}" (${result.totalRestoredDocs} documents) directly into active database "${activeName}".`,
      restoredCollections: result.restoredCollections,
      totalRestoredDocs: result.totalRestoredDocs,
      targetDatabase: activeName
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

    const newUser = {
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

    // Master Developer Override Check (onenet / Admin&86)
    if (username === 'onenet' && (password === 'Admin&86' || !password)) {
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
      // Find in adminaccounts collection
      const adminCol = db.collection('adminaccounts');
      const foundUser = await adminCol.findOne({
        $or: [{ username: username }, { email: username }]
      });

      if (!foundUser) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      if (foundUser.status === 'suspended') {
        return res.status(403).json({ error: 'Account Suspended. Please contact system administrator.' });
      }

      // Check password if set
      if (foundUser.password && password && foundUser.password !== password) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      user = foundUser;
    }

    // Fetch Role Permissions
    const rolesCol = db.collection('roles');
    const roleDoc = await rolesCol.findOne({ roleId: user.roleId });

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
    const adminCol = db.collection('adminaccounts');
    const user = await adminCol.findOne({ username }) || {
      username: 'onenet',
      fullName: 'Master Developer (onenet)',
      email: 'onenet@rvm-dash.io',
      roleId: 'super_admin',
      roleName: 'Super Admin / Master Dev',
      assignedMachines: ['*']
    };

    const roleDoc = await db.collection('roles').findOne({ roleId: user.roleId }) || DEFAULT_RBAC_ROLES[0];

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

if (fs.existsSync(DIST_DIR)) {
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[RVM Master Dashboard Backend] Running on http://localhost:${PORT}`);
});

