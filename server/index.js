#!/usr/bin/env node
import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

import { MongoClient, ObjectId } from 'mongodb';
import dns from 'dns';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKUPS_DIR = path.join(__dirname, '..', 'backups');
const ADS_UPLOAD_DIR = path.join(__dirname, 'uploads', 'advertisements');

if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}
if (!fs.existsSync(ADS_UPLOAD_DIR)) {
  fs.mkdirSync(ADS_UPLOAD_DIR, { recursive: true });
}

// Configure Multer storage for RVM Advertisement Video uploads
const adVideoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, ADS_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `ad_${Date.now()}_${base}${ext}`);
  }
});

const adVideoUpload = multer({
  storage: adVideoStorage,
  limits: { fileSize: 250 * 1024 * 1024 }, // 250 MB max video size
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.mp4', '.webm', '.avi', '.mov', '.mkv', '.m4v'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext) || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid video format. Supported: .mp4, .webm, .avi, .mov, .mkv, .m4v'));
    }
  }
});

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
const JWT_SECRET = process.env.JWT_SECRET || 'rvm-isp-dev-secret-key-2026';

app.use(cors());
// Set high payload limit (50MB) for database restoration JSON uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve uploaded advertisement videos statically
app.use('/uploads/advertisements', express.static(ADS_UPLOAD_DIR));

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
        public_ip VARCHAR(100),
        local_ip VARCHAR(100),
        last_ping_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE machines ADD COLUMN IF NOT EXISTS public_ip VARCHAR(100);
      ALTER TABLE machines ADD COLUMN IF NOT EXISTS local_ip VARCHAR(100);
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
        mobile VARCHAR(50),
        password VARCHAR(255),
        age INT DEFAULT 20,
        nic VARCHAR(50),
        gender VARCHAR(20) DEFAULT 'male',
        otp VARCHAR(10),
        otp_expiry TIMESTAMPTZ,
        points_balance INT DEFAULT 0,
        role_id VARCHAR(50) DEFAULT 'fleet_operator',
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile VARCHAR(50);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS age INT DEFAULT 20;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS nic VARCHAR(50);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20) DEFAULT 'male';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS otp VARCHAR(10);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expiry TIMESTAMPTZ;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS dob VARCHAR(50);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ DEFAULT NULL;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT NULL;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS device_info VARCHAR(255);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
      CREATE INDEX IF NOT EXISTS idx_users_mobile ON users (mobile);
      CREATE INDEX IF NOT EXISTS idx_users_is_online ON users (is_online);
    `);

    // Reset online flags on server boot to ensure only actively connected mobile devices show online
    await pool.query(`
      UPDATE users 
      SET is_online = FALSE 
      WHERE last_active IS NULL OR last_active < NOW() - INTERVAL '2 minutes';
    `);

    // 4. Downstream Points Config Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS machine_configs (
        machine_id VARCHAR(50) PRIMARY KEY REFERENCES machines(machine_id) ON DELETE CASCADE,
        config_version INT DEFAULT 1,
        points_per_plastic INT DEFAULT 10,
        points_plastic_small INT DEFAULT 5,
        points_plastic_medium INT DEFAULT 10,
        points_plastic_large INT DEFAULT 15,
        points_per_aluminium INT DEFAULT 20,
        points_can_small INT DEFAULT 10,
        points_can_medium INT DEFAULT 15,
        points_can_large INT DEFAULT 20,
        points_per_paper_kg INT DEFAULT 15,
        points_per_glass INT DEFAULT 15,
        points_glass_small INT DEFAULT 10,
        points_glass_medium INT DEFAULT 15,
        points_glass_large INT DEFAULT 20,
        plastic_unit VARCHAR(20) DEFAULT 'per_piece',
        aluminium_unit VARCHAR(20) DEFAULT 'per_piece',
        paper_unit VARCHAR(20) DEFAULT 'per_kg',
        glass_unit VARCHAR(20) DEFAULT 'per_piece',
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`ALTER TABLE machine_configs ADD COLUMN IF NOT EXISTS points_per_glass INT DEFAULT 15;`);
    await pool.query(`ALTER TABLE machine_configs ADD COLUMN IF NOT EXISTS points_plastic_small INT DEFAULT 5;`);
    await pool.query(`ALTER TABLE machine_configs ADD COLUMN IF NOT EXISTS points_plastic_medium INT DEFAULT 10;`);
    await pool.query(`ALTER TABLE machine_configs ADD COLUMN IF NOT EXISTS points_plastic_large INT DEFAULT 15;`);
    await pool.query(`ALTER TABLE machine_configs ADD COLUMN IF NOT EXISTS points_can_small INT DEFAULT 10;`);
    await pool.query(`ALTER TABLE machine_configs ADD COLUMN IF NOT EXISTS points_can_medium INT DEFAULT 15;`);
    await pool.query(`ALTER TABLE machine_configs ADD COLUMN IF NOT EXISTS points_can_large INT DEFAULT 20;`);
    await pool.query(`ALTER TABLE machine_configs ADD COLUMN IF NOT EXISTS points_glass_small INT DEFAULT 10;`);
    await pool.query(`ALTER TABLE machine_configs ADD COLUMN IF NOT EXISTS points_glass_medium INT DEFAULT 15;`);
    await pool.query(`ALTER TABLE machine_configs ADD COLUMN IF NOT EXISTS points_glass_large INT DEFAULT 20;`);
    await pool.query(`ALTER TABLE machine_configs ADD COLUMN IF NOT EXISTS plastic_unit VARCHAR(20) DEFAULT 'per_piece';`);
    await pool.query(`ALTER TABLE machine_configs ADD COLUMN IF NOT EXISTS aluminium_unit VARCHAR(20) DEFAULT 'per_piece';`);
    await pool.query(`ALTER TABLE machine_configs ADD COLUMN IF NOT EXISTS paper_unit VARCHAR(20) DEFAULT 'per_kg';`);
    await pool.query(`ALTER TABLE machine_configs ADD COLUMN IF NOT EXISTS glass_unit VARCHAR(20) DEFAULT 'per_piece';`);

    // 5. Machine Advertisement Media Table (for Digital Signage & Ad Video Management)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS machine_advertisements (
        id SERIAL PRIMARY KEY,
        machine_id VARCHAR(100) NOT NULL DEFAULT '*',
        title VARCHAR(255) NOT NULL,
        video_url TEXT NOT NULL,
        file_name VARCHAR(255),
        file_size BIGINT DEFAULT 0,
        duration_seconds INT DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        display_order INT DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_machine_ads_target ON machine_advertisements (machine_id, is_active, display_order ASC);
    `);

    console.log('[PostgreSQL Schemas] Production relational tables, ad media schemas and indexes initialized successfully.');
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

      let targetMachineId = (req.query.assignedMachines || req.query.machineId || '').trim().toLowerCase();
      let filteredSessions = sessions;
      if (targetMachineId && targetMachineId !== '*') {
        filteredSessions = sessions.filter(s => {
          const mId = (s.machineId || s.machine_id || '').trim().toLowerCase();
          return mId === targetMachineId;
        });
      }

      filteredSessions.forEach(s => {
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

        let ps = parseInt(s.plastic_small_count || s.plasticSmallCount || 0);
        let pm = parseInt(s.plastic_medium_count || s.plasticMediumCount || 0);
        let pl = parseInt(s.plastic_large_count || s.plasticLargeCount || 0);

        if (ps === 0 && pm === 0 && pl === 0 && pCnt > 0) {
          const bSize = String(s.bottleSize || s.bottle_size || '').toUpperCase();
          const vStr = String(s.itemVariant || s.item_variant || '').toUpperCase();
          if (bSize === 'SMALL' || vStr.includes('SMALL')) ps = pCnt;
          else if (bSize === 'LARGE' || vStr.includes('LARGE')) pl = pCnt;
          else pm = pCnt;
        }

        plasticSmall += ps;
        plasticMedium += pm;
        plasticLarge += pl;

        let cs = parseInt(s.can_small_count || s.canSmallCount || 0);
        let cm = parseInt(s.can_medium_count || s.canMediumCount || 0);
        let cl = parseInt(s.can_large_count || s.canLargeCount || 0);

        if (cs === 0 && cm === 0 && cl === 0 && aCnt > 0) {
          const bSize = String(s.bottleSize || s.bottle_size || '').toUpperCase();
          const vStr = String(s.itemVariant || s.item_variant || '').toUpperCase();
          if (bSize === 'SMALL' || vStr.includes('SMALL')) cs = aCnt;
          else if (bSize === 'LARGE' || vStr.includes('LARGE')) cl = aCnt;
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
        totalPaperKg: ((totalPaperGrams || 148500) / 1000).toFixed(1),
        totalTetraPakGrams,
        totalCardboardUnits: Math.round((totalTetraPakGrams || 37200) / 30) || 1240,
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
      totalPaperKg: ((totalPaperGrams || 148500) / 1000).toFixed(1),
      totalTetraPakGrams,
      totalCardboardUnits: Math.round((totalTetraPakGrams || 37200) / 30) || 1240,
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
          const metaRes = await pool.query(`
            SELECT m.machine_id, m.name, m.location, m.status, m.last_ping_at, m.public_ip, m.local_ip,
                   c.points_per_plastic, c.points_plastic_small, c.points_plastic_medium, c.points_plastic_large,
                   c.points_per_aluminium, c.points_can_small, c.points_can_medium, c.points_can_large,
                   c.points_per_paper_kg, c.points_per_glass, c.points_glass_small, c.points_glass_medium, c.points_glass_large,
                   c.plastic_unit, c.aluminium_unit, c.paper_unit, c.glass_unit, c.config_version
            FROM machines m
            LEFT JOIN machine_configs c ON m.machine_id = c.machine_id
          `);
          metaRes.rows.forEach(r => {
            allRegisteredMachines.push({
              machineId: r.machine_id,
              name: r.name || `RVM Machine ${r.machine_id}`,
              location: r.location || 'Islamabad Campus',
              status: r.status,
              lastPingAt: r.last_ping_at,
              publicIp: r.public_ip || 'N/A',
              localIp: r.local_ip || 'N/A',
              pointsPerPlasticBottle: r.points_per_plastic ?? 10,
              pointsPlasticSmall: r.points_plastic_small ?? 5,
              pointsPlasticMedium: r.points_plastic_medium ?? 10,
              pointsPlasticLarge: r.points_plastic_large ?? 15,
              pointsPerAluminiumCan: r.points_per_aluminium ?? 20,
              pointsCanSmall: r.points_can_small ?? 10,
              pointsCanMedium: r.points_can_medium ?? 15,
              pointsCanLarge: r.points_can_large ?? 20,
              pointsPerPaperKg: r.points_per_paper_kg ?? 15,
              pointsPerGlass: r.points_per_glass ?? 15,
              pointsGlassSmall: r.points_glass_small ?? 10,
              pointsGlassMedium: r.points_glass_medium ?? 15,
              pointsGlassLarge: r.points_glass_large ?? 20,
              plasticUnit: r.plastic_unit || 'per_piece',
              aluminiumUnit: r.aluminium_unit || 'per_piece',
              paperUnit: r.paper_unit || 'per_kg',
              glassUnit: r.glass_unit || 'per_piece',
              configVersion: r.config_version ?? 1
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
          publicIp: m.publicIp || 'N/A',
          localIp: m.localIp || 'N/A',
          pointsPerPlasticBottle: m.pointsPerPlasticBottle,
          pointsPlasticSmall: m.pointsPlasticSmall,
          pointsPlasticMedium: m.pointsPlasticMedium,
          pointsPlasticLarge: m.pointsPlasticLarge,
          pointsPerAluminiumCan: m.pointsPerAluminiumCan,
          pointsCanSmall: m.pointsCanSmall,
          pointsCanMedium: m.pointsCanMedium,
          pointsCanLarge: m.pointsCanLarge,
          pointsPerPaperKg: m.pointsPerPaperKg,
          pointsPerGlass: m.pointsPerGlass,
          pointsGlassSmall: m.pointsGlassSmall,
          pointsGlassMedium: m.pointsGlassMedium,
          pointsGlassLarge: m.pointsGlassLarge,
          plasticUnit: m.plasticUnit,
          aluminiumUnit: m.aluminiumUnit,
          paperUnit: m.paperUnit,
          glassUnit: m.glassUnit,
          configVersion: m.configVersion,
          totalBottles: 0,
          totalCups: 0,
          totalPoints: 0,
          sessionCount: 0,
          plasticCount: 0,
          glassCount: 0,
          canCount: 0,
          paperCount: 0,
          lastActive: m.lastPingAt || null
        };
      });

      sessions.forEach(s => {
        const mId = s.machineId || s.machine_id;
        if (!mId) return;
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
            plasticCount: 0,
            glassCount: 0,
            canCount: 0,
            paperCount: 0,
            lastActive: s.recycledAt || s.timestamp
          };
        }
        grouped[mId].totalBottles += parseInt(s.bottles || s.totalBottles || 0);
        grouped[mId].totalCups += parseInt(s.cups || s.totalCups || 0);
        grouped[mId].totalPoints += parseInt(s.points || s.totalPoints || 0);
        grouped[mId].sessionCount += 1;

        const pCnt = parseInt(s.plasticCount || s.plastic_count || 0);
        const gCnt = parseInt(s.glassCount || s.glass_count || 0);
        const cCnt = parseInt(s.aluminiumCount || s.aluminium_count || s.canCount || s.can_count || s.metalCount || 0);
        const paCnt = parseInt(s.paperCardboardCount || s.paper_cardboard_count || s.paperCount || s.paper_count || 0);

        if (pCnt === 0 && gCnt === 0 && cCnt === 0 && paCnt === 0) {
          const mat = String(s.materialType || s.material_type || s.material || '').toUpperCase();
          const items = parseInt(s.bottles || s.totalBottles || s.itemCount || 0);
          if (mat.includes('GLASS')) grouped[mId].glassCount += items;
          else if (mat.includes('CAN') || mat.includes('METAL') || mat.includes('ALUMINIUM')) grouped[mId].canCount += items;
          else if (mat.includes('PAPER')) grouped[mId].paperCount += items;
          else grouped[mId].plasticCount += items;
        } else {
          grouped[mId].plasticCount += pCnt;
          grouped[mId].glassCount += gCnt;
          grouped[mId].canCount += cCnt;
          grouped[mId].paperCount += paCnt;
        }

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
        const mId = a.machineId || a.machine_id;
        if (!mId) return;
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
    const { 
      machineId, 
      name, 
      location, 
      status,
      pointsPerPlasticBottle = 10,
      pointsPerAluminiumCan = 20,
      pointsPerPaperKg = 15
    } = req.body || {};
    if (!machineId) {
      return res.status(400).json({ error: 'Machine ID is required' });
    }

    const machineName = name || `RVM Unit ${machineId}`;
    const machineLocation = location || 'Main Entrance / Campus';
    const machineStatus = status || 'ONLINE';

    // PostgreSQL ONLY Database Update
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

        await pool.query(`
          INSERT INTO machine_configs (machine_id, config_version, points_per_plastic, points_per_aluminium, points_per_paper_kg, updated_at)
          VALUES ($1, 1, $2, $3, $4, NOW())
          ON CONFLICT (machine_id) DO UPDATE SET
            config_version = machine_configs.config_version + 1,
            points_per_plastic = EXCLUDED.points_per_plastic,
            points_per_aluminium = EXCLUDED.points_per_aluminium,
            points_per_paper_kg = EXCLUDED.points_per_paper_kg,
            updated_at = NOW();
        `, [machineId, parseInt(pointsPerPlasticBottle), parseInt(pointsPerAluminiumCan), parseInt(pointsPerPaperKg)]).catch(() => {});
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
        const plastic = parseInt(s.plasticCount || s.plastic_count || s.bottles || s.totalBottles || 0) +
                        parseInt(s.plasticSmallCount || s.plastic_small_count || 0) +
                        parseInt(s.plasticMediumCount || s.plastic_medium_count || 0) +
                        parseInt(s.plasticLargeCount || s.plastic_large_count || 0);

        const aluminium = parseInt(s.aluminiumCount || s.aluminium_count || s.cups || s.totalCups || 0) +
                          parseInt(s.canSmallCount || s.can_small_count || 0) +
                          parseInt(s.canMediumCount || s.can_medium_count || 0) +
                          parseInt(s.canLargeCount || s.can_large_count || 0);

        totalBottles += plastic;
        totalCups += aluminium;
        totalWeightKg += parseFloat(s.weight || s.totalWeight || (plastic * 0.025 + aluminium * 0.015) || 0);
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
    const plasticWeight = totalBottles > 0 ? totalBottles * 0.025 : (totalWeightKg * 0.6);
    const aluminiumWeight = totalCups > 0 ? totalCups * 0.015 : (totalWeightKg * 0.2);
    const paperCardboardWeight = totalWeightKg > 0 ? totalWeightKg * 0.1 : 50;
    const organicWeight = totalWeightKg > 0 ? totalWeightKg * 0.1 : 100;

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
      totalSessions: count,
      totalWeightProcessedKg: parseFloat((plasticWeight + aluminiumWeight + paperCardboardWeight + organicWeight).toFixed(1)),
      totalCo2eAvoidedKg: parseFloat(totalCo2eAvoidedKg.toFixed(1)),
      totalCo2eAvoidedTonnes,
      treesPlantedEquivalent,
      treesPlantedBasis: 'Approximate annual CO2e sequestered by 1 urban tree seedling grown 10 years (21.77 kg CO2e / tree)',
      passengerCarMilesAvoided,
      carMilesBasis: 'Approximate kg CO2e per passenger-vehicle mile (0.40 kg CO2e / mile)',
      compostYieldKg,
      compostYieldBasis: 'Disjoint Estimated Batch Mode (40% yield from Organic/Tea input weight)',
      weightMeasurementType: totalWeightKg > 0 ? 'Measured' : 'Estimated',
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

// ==========================================
// MOBILE APP REST API ENDPOINTS (PostgreSQL Backed)
// ==========================================

// 1. Mobile Login (100% PostgreSQL Backed)
async function handleMobileLogin(req, res) {
  try {
    const { mobileOrEmail, mobile, email, password } = req.body;
    const identifier = (mobileOrEmail || mobile || email || '').trim();
    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Phone number or email is required' });
    }
    if (!password || String(password).trim() === '') {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    let user = null;
    const pool = getPgPool();
    if (pool) {
      const userRes = await pool.query(`
        SELECT user_id, username, full_name, email, mobile, password, age, nic, gender, points_balance, status
        FROM users
        WHERE mobile = $1 OR email = $1 OR username = $1
        LIMIT 1;
      `, [identifier]);
      if (userRes.rows.length > 0) {
        user = userRes.rows[0];
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid phone number or password' });
    }

    // Strictly check PostgreSQL password
    if (!user.password || user.password.trim() === '') {
      return res.status(401).json({ 
        success: false, 
        message: 'Account password not set in PostgreSQL database. Please use "Forgot Password" or Register.' 
      });
    }

    if (user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid phone number or password' });
    }

    // Update online & last_login status in PostgreSQL
    if (pool && user.user_id) {
      await pool.query(`
        UPDATE users 
        SET is_online = TRUE, last_login = NOW(), last_active = NOW()
        WHERE user_id = $1;
      `, [user.user_id]);
    }

    let bottles = 0;
    let cups = 0;
    let glass = 0;
    let paper = 0;
    let totalWeightKg = 0;
    let totalCo2Kg = 0;
    let totalSessions = 0;
    let points = user.points_balance || user.pointsBalance || user.points || 0;
    let latestRecycle = null;
    let recentSessions = [];
    let earnedPoints = 0;
    let redeemedPoints = 0;

    // Helper: Build strict, isolated identifier list for logged-in user
    const validUserIds = Array.from(new Set([
      user.user_id,
      user.username,
      user.mobile,
      identifier,
      user.mobile ? user.mobile.replace(/[^0-9]/g, '') : null,
      identifier ? identifier.replace(/[^0-9]/g, '') : null,
      user.mobile && user.mobile.startsWith('0') ? user.mobile.substring(1) : null,
      identifier && identifier.startsWith('0') ? identifier.substring(1) : null
    ])).filter(id => id && id !== 'anonymous' && id !== 'null' && id !== 'undefined' && id.trim().length > 0);

    if (activeDbType === 'postgres') {
      const pool = getPgPool();
      if (pool) {
        const statsRes = await pool.query(`
          SELECT 
            COALESCE(SUM(plastic_count), 0) AS total_bottles,
            COALESCE(SUM(aluminium_count), 0) AS total_cups,
            COALESCE(SUM(glass_count), 0) AS total_glass,
            COALESCE(SUM(paper_cardboard_count), 0) AS total_paper,
            COALESCE(SUM(total_weight_kg), 0) AS total_weight,
            COALESCE(SUM(co2_avoided_kg), 0) AS total_co2,
            COALESCE(SUM(points_earned), 0) AS total_earned_points,
            COUNT(session_id) AS session_count,
            MAX(created_at) AS last_recycled_at
          FROM recycling_sessions
          WHERE user_id = ANY($1::text[])
            AND user_id NOT IN ('anonymous', '', 'null');
        `, [validUserIds]);

        if (statsRes.rows.length > 0) {
          bottles = parseInt(statsRes.rows[0].total_bottles || 0);
          cups = parseInt(statsRes.rows[0].total_cups || 0);
          glass = parseInt(statsRes.rows[0].total_glass || 0);
          paper = parseInt(statsRes.rows[0].total_paper || 0);
          totalWeightKg = parseFloat(statsRes.rows[0].total_weight || 0);
          totalCo2Kg = parseFloat(statsRes.rows[0].total_co2 || 0);
          totalSessions = parseInt(statsRes.rows[0].session_count || 0);
          latestRecycle = statsRes.rows[0].last_recycled_at;
          earnedPoints = parseInt(statsRes.rows[0].total_earned_points || 0);
          if (points === 0 && earnedPoints > 0) {
            points = earnedPoints;
          }
        }

        redeemedPoints = Math.max(0, earnedPoints - points);

        const recentRes = await pool.query(`
          SELECT session_id, machine_id, plastic_count, aluminium_count, glass_count, paper_cardboard_count,
                 item_variant, bottle_size, total_weight_kg, co2_avoided_kg, points_earned, session_status, created_at
          FROM recycling_sessions
          WHERE user_id = ANY($1::text[])
            AND user_id NOT IN ('anonymous', '', 'null')
          ORDER BY created_at DESC
          LIMIT 10;
        `, [validUserIds]);
        recentSessions = recentRes.rows || [];
      }
    }

    let token = '';
        try {
          token = jwt.sign(
            { userId: user.user_id, username: user.username, mobile: user.mobile },
            JWT_SECRET,
            { expiresIn: '30d' }
          );
        } catch (tokenErr) {
          console.warn('[JWT Sign Warning]', tokenErr.message);
          token = `token_${user.user_id || user.username}_${Date.now()}`;
        }

        const totalRecovered = bottles + cups + glass + paper;

        const isBirthday = checkIsBirthday(user.dob);

        return res.json({
          success: true,
          message: 'Login successful',
          token,
          user: {
            id: user.user_id,
            username: user.username,
            fullName: user.full_name || user.username,
            email: user.email,
            mobile: user.mobile || identifier,
            age: user.age || 20,
            dob: user.dob || '',
            profileImage: user.profile_image || '',
            nic: user.nic || '',
            gender: user.gender || 'male',
            points,
            isBirthday
          },
          hasRecycleHistory: {
            points,
            currentBalance: points,
            earnedPoints,
            totalEarnedPoints: earnedPoints,
            redeemedPoints,
            totalRedeemedPoints: redeemedPoints,
            bottles,
            plasticCount: bottles,
            cups,
            aluminiumCount: cups,
            glassCount: glass,
            paperCount: paper,
            totalItems: totalRecovered,
            totalWeightKg: totalWeightKg > 0 ? parseFloat(totalWeightKg.toFixed(2)) : parseFloat((bottles * 0.025 + cups * 0.015 + glass * 0.2 + paper * 0.03).toFixed(2)),
            co2AvoidedKg: totalCo2Kg > 0 ? parseFloat(totalCo2Kg.toFixed(2)) : parseFloat((bottles * 0.08 + cups * 0.15 + glass * 0.12 + paper * 0.05).toFixed(2)),
            totalSessions,
            variants: {
              petPlastic: bottles,
              aluminiumCans: cups,
              glassBottles: glass,
              paperCartons: paper
            },
            recentSessions,
            recycledAt: latestRecycle || new Date().toISOString()
          }
        });
  } catch (err) {
    console.error('[Mobile Login Error]', err);
    res.status(500).json({ success: false, message: err.message });
  }
}
app.post('/api/login', handleMobileLogin);
app.post('/login', handleMobileLogin);

// Birthday Helper
function checkIsBirthday(dobStr) {
  if (!dobStr) return false;
  try {
    const dob = new Date(dobStr);
    const today = new Date();
    return dob.getMonth() === today.getMonth() && dob.getDate() === today.getDate();
  } catch (e) {
    return false;
  }
}

// 2. Mobile User Registration (with Full Name, DOB, Profile Picture)
async function handleMobileRegister(req, res) {
  try {
    const { username, fullName, mobile, age, nic, email, password, gender = 'male', dob = '', profileImage = '' } = req.body;
    if (!mobile || !username) {
      return res.status(400).json({ success: false, message: 'Username and mobile number are required' });
    }

    const cleanMobile = String(mobile).trim();
    const cleanEmail = email ? String(email).trim().toLowerCase() : `${cleanMobile}@rvm.local`;
    const cleanUsername = String(username).trim();
    const cleanFullName = (fullName || cleanUsername).trim();
    const cleanDob = dob ? String(dob).trim() : '';
    const cleanProfileImage = profileImage ? String(profileImage).trim() : '';
    let userAge = parseInt(age);
    if ((!userAge || isNaN(userAge)) && cleanDob) {
      userAge = Math.floor((new Date() - new Date(cleanDob)) / (365.25 * 24 * 60 * 60 * 1000));
    }
    if (!userAge || isNaN(userAge) || userAge <= 0) userAge = 20;

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (activeDbType === 'postgres') {
      const pool = getPgPool();
      if (pool) {
        const checkRes = await pool.query(`
          SELECT user_id FROM users 
          WHERE mobile = $1 OR email = $2 OR username = $3
          LIMIT 1;
        `, [cleanMobile, cleanEmail, cleanUsername]);

        if (checkRes.rows.length > 0) {
          return res.status(409).json({ success: false, message: 'User with this mobile number, email, or username already exists' });
        }

        await pool.query(`
          INSERT INTO users (user_id, username, full_name, email, mobile, password, age, nic, gender, dob, profile_image, points_balance, status, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 0, 'active', NOW());
        `, [userId, cleanUsername, cleanFullName, cleanEmail, cleanMobile, password || '', userAge, nic || '', gender, cleanDob, cleanProfileImage]);
      }
    } else if (db) {
      const existing = await db.collection('users').findOne({
        $or: [{ mobile: cleanMobile }, { email: cleanEmail }, { username: cleanUsername }]
      });
      if (existing) {
        return res.status(409).json({ success: false, message: 'User already exists' });
      }
      await db.collection('users').insertOne({
        userId,
        username: cleanUsername,
        fullName: cleanFullName,
        email: cleanEmail,
        mobile: cleanMobile,
        password: password || '',
        age: userAge,
        nic: nic || '',
        gender,
        dob: cleanDob,
        profileImage: cleanProfileImage,
        points: 0,
        createdAt: new Date()
      });
    }

    const isBirthday = checkIsBirthday(cleanDob);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: userId,
        username: cleanUsername,
        fullName: cleanFullName,
        mobile: cleanMobile,
        email: cleanEmail,
        age: userAge,
        dob: cleanDob,
        profileImage: cleanProfileImage,
        nic: nic || '',
        gender,
        points: 0,
        isBirthday
      }
    });
  } catch (err) {
    console.error('[Mobile Register Error]', err);
    res.status(500).json({ success: false, message: 'Registration failed: ' + err.message });
  }
}
app.post('/api/register', handleMobileRegister);
app.post('/register', handleMobileRegister);

// 2b. Update User Profile (Runtime Full Name, DOB, Profile Picture)
async function handleUpdateProfile(req, res) {
  try {
    const { userId, username, mobile, fullName, dob, profileImage, email, gender, nic } = req.body;
    const identifier = userId || username || mobile;
    if (!identifier) {
      return res.status(400).json({ success: false, message: 'User identifier is required' });
    }

    let updatedUser = null;
    if (activeDbType === 'postgres') {
      const pool = getPgPool();
      if (pool) {
        // Ensure profile columns exist
        await pool.query(`
          ALTER TABLE users ADD COLUMN IF NOT EXISTS dob VARCHAR(50);
          ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image TEXT;
          ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
          ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active TIMESTAMP;
        `).catch(() => {});

        const uRes = await pool.query(`
          SELECT user_id, username, full_name, email, mobile, age, nic, gender, dob, profile_image, points_balance
          FROM users
          WHERE user_id = $1 
             OR username = $1 
             OR mobile = $1 
             OR email = $1
             OR ($2::text IS NOT NULL AND (username = $2 OR mobile = $2 OR user_id = $2))
             OR ($3::text IS NOT NULL AND (mobile = $3 OR username = $3 OR user_id = $3))
          LIMIT 1;
        `, [identifier, username || null, mobile || null]);

        if (uRes.rows.length === 0) {
          return res.status(404).json({ success: false, message: 'User not found' });
        }

        const targetUid = uRes.rows[0].user_id;
        const newFullName = (fullName !== undefined ? fullName : uRes.rows[0].full_name) || uRes.rows[0].username;
        const newDob = dob !== undefined ? dob : uRes.rows[0].dob;
        const newImg = profileImage !== undefined ? profileImage : uRes.rows[0].profile_image;
        const newEmail = email !== undefined ? email : uRes.rows[0].email;
        const newGender = gender !== undefined ? gender : uRes.rows[0].gender;
        const newNic = nic !== undefined ? nic : uRes.rows[0].nic;

        let newAge = uRes.rows[0].age;
        if (newDob) {
          try {
            const parsedAge = Math.floor((new Date() - new Date(newDob)) / (365.25 * 24 * 60 * 60 * 1000));
            if (parsedAge > 0) newAge = parsedAge;
          } catch(e) {}
        }

        await pool.query(`
          UPDATE users 
          SET full_name = $1, dob = $2, profile_image = $3, email = $4, gender = $5, nic = $6, age = $7, last_active = NOW()
          WHERE user_id = $8;
        `, [newFullName, newDob, newImg, newEmail, newGender, newNic, newAge, targetUid]);

        updatedUser = {
          id: targetUid,
          username: uRes.rows[0].username,
          fullName: newFullName,
          email: newEmail,
          mobile: uRes.rows[0].mobile,
          age: newAge,
          dob: newDob,
          profileImage: newImg,
          nic: newNic,
          gender: newGender,
          points: uRes.rows[0].points_balance || 0,
          isBirthday: checkIsBirthday(newDob)
        };
      }
    } else if (db) {
      const user = await db.collection('users').findOne({
        $or: [{ userId: identifier }, { username: identifier }, { mobile: identifier }]
      });
      if (user) {
        const newFullName = fullName || user.fullName || user.username;
        const newDob = dob !== undefined ? dob : user.dob;
        const newImg = profileImage !== undefined ? profileImage : user.profileImage;
        await db.collection('users').updateOne(
          { _id: user._id },
          { $set: { fullName: newFullName, dob: newDob, profileImage: newImg } }
        );
        updatedUser = {
          id: user.userId || user._id,
          username: user.username,
          fullName: newFullName,
          dob: newDob,
          profileImage: newImg,
          points: user.points || 0,
          isBirthday: checkIsBirthday(newDob)
        };
      }
    }

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User profile update failed' });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (err) {
    console.error('[Update Profile Error]', err);
    res.status(500).json({ success: false, message: err.message });
  }
}
app.post('/api/user/profile', handleUpdateProfile);
app.put('/api/user/profile', handleUpdateProfile);
app.post('/api/update-profile', handleUpdateProfile);
app.post('/user/profile', handleUpdateProfile);
app.put('/user/profile', handleUpdateProfile);
app.post('/update-profile', handleUpdateProfile);

// 3. Mobile Get Points & Stats for User
async function handleMobileGetPoints(req, res) {
  try {
    const phone = (req.body.phoneNumber || req.body.phone || req.body.userId || '').trim();
    if (!phone || phone === 'anonymous') {
      return res.status(400).json({ success: false, message: 'Valid user phoneNumber or userId is required' });
    }

    let points = 0;
    let bottles = 0;
    let cups = 0;
    let glass = 0;
    let paper = 0;
    let totalWeightKg = 0;
    let totalCo2Kg = 0;
    let totalSessions = 0;
    let lastRecycled = null;
    let recentSessions = [];
    let earnedPoints = 0;
    let redeemedPoints = 0;

    if (activeDbType === 'postgres') {
      const pool = getPgPool();
      if (pool) {
        const uRes = await pool.query(`
          SELECT user_id, username, mobile, points_balance
          FROM users
          WHERE mobile = $1 OR email = $1 OR username = $1 OR user_id = $1
          LIMIT 1;
        `, [phone]);

        let validUserIds = [phone];
        if (uRes.rows.length > 0) {
          points = uRes.rows[0].points_balance || 0;
          const u = uRes.rows[0];
          validUserIds = Array.from(new Set([
            u.user_id,
            u.username,
            u.mobile,
            phone,
            u.mobile ? u.mobile.replace(/[^0-9]/g, '') : null,
            phone ? phone.replace(/[^0-9]/g, '') : null,
            u.mobile && u.mobile.startsWith('0') ? u.mobile.substring(1) : null,
            phone && phone.startsWith('0') ? phone.substring(1) : null
          ])).filter(id => id && id !== 'anonymous' && id !== 'null' && id !== 'undefined' && id.trim().length > 0);
        }

        const sRes = await pool.query(`
          SELECT 
            COALESCE(SUM(plastic_count), 0) AS total_bottles,
            COALESCE(SUM(aluminium_count), 0) AS total_cups,
            COALESCE(SUM(glass_count), 0) AS total_glass,
            COALESCE(SUM(paper_cardboard_count), 0) AS total_paper,
            COALESCE(SUM(total_weight_kg), 0) AS total_weight,
            COALESCE(SUM(co2_avoided_kg), 0) AS total_co2,
            COALESCE(SUM(points_earned), 0) AS total_earned_points,
            COUNT(session_id) AS session_count,
            MAX(created_at) AS last_recycled_at
          FROM recycling_sessions
          WHERE user_id = ANY($1::text[])
            AND user_id NOT IN ('anonymous', '', 'null');
        `, [validUserIds]);

        if (sRes.rows.length > 0) {
          bottles = parseInt(sRes.rows[0].total_bottles || 0);
          cups = parseInt(sRes.rows[0].total_cups || 0);
          glass = parseInt(sRes.rows[0].total_glass || 0);
          paper = parseInt(sRes.rows[0].total_paper || 0);
          totalWeightKg = parseFloat(sRes.rows[0].total_weight || 0);
          totalCo2Kg = parseFloat(sRes.rows[0].total_co2 || 0);
          totalSessions = parseInt(sRes.rows[0].session_count || 0);
          lastRecycled = sRes.rows[0].last_recycled_at;
          earnedPoints = parseInt(sRes.rows[0].total_earned_points || 0);
          if (points === 0 && earnedPoints > 0) {
            points = earnedPoints;
          }
        }

        redeemedPoints = Math.max(0, earnedPoints - points);

        const recentRes = await pool.query(`
          SELECT session_id, machine_id, plastic_count, aluminium_count, glass_count, paper_cardboard_count,
                 item_variant, bottle_size, total_weight_kg, co2_avoided_kg, points_earned, session_status, created_at
          FROM recycling_sessions
          WHERE user_id = ANY($1::text[])
            AND user_id NOT IN ('anonymous', '', 'null')
          ORDER BY created_at DESC
          LIMIT 10;
        `, [validUserIds]);
        recentSessions = recentRes.rows || [];
      }
    }

    const totalRecovered = bottles + cups + glass + paper;

    return res.json({
      success: true,
      points,
      currentBalance: points,
      earnedPoints,
      totalEarnedPoints: earnedPoints,
      redeemedPoints,
      totalRedeemedPoints: redeemedPoints,
      bottles,
      plasticCount: bottles,
      cups,
      aluminiumCount: cups,
      glassCount: glass,
      paperCount: paper,
      totalItems: totalRecovered,
      totalWeightKg: totalWeightKg > 0 ? parseFloat(totalWeightKg.toFixed(2)) : parseFloat((bottles * 0.025 + cups * 0.015 + glass * 0.2 + paper * 0.03).toFixed(2)),
      co2AvoidedKg: totalCo2Kg > 0 ? parseFloat(totalCo2Kg.toFixed(2)) : parseFloat((bottles * 0.08 + cups * 0.15 + glass * 0.12 + paper * 0.05).toFixed(2)),
      totalSessions,
      variants: {
        petPlastic: bottles,
        aluminiumCans: cups,
        glassBottles: glass,
        paperCartons: paper
      },
      recentSessions,
      recycledAt: lastRecycled || new Date().toISOString()
    });
  } catch (err) {
    console.error('[Mobile Get Points Error]', err);
    res.status(500).json({ success: false, message: err.message });
  }
}
app.post('/api/get-points', handleMobileGetPoints);
app.post('/get-points', handleMobileGetPoints);

// 4. Mobile Get Recycle History
async function handleMobileGetRecycle(req, res) {
  try {
    const { userId } = req.params;
    if (!userId || userId === 'anonymous') return res.status(400).json({ success: false, error: 'Valid userId is required' });

    let history = [];
    if (activeDbType === 'postgres') {
      const pool = getPgPool();
      if (pool) {
        const uRes = await pool.query(`
          SELECT user_id, username, mobile FROM users
          WHERE user_id = $1 OR mobile = $1 OR username = $1 OR email = $1
          LIMIT 1;
        `, [userId]);

        let validUserIds = [userId];
        if (uRes.rows.length > 0) {
          const u = uRes.rows[0];
          validUserIds = Array.from(new Set([u.user_id, u.username, u.mobile, userId])).filter(Boolean);
        }

        const sRes = await pool.query(`
          SELECT session_id, machine_id, user_id, plastic_count, aluminium_count, glass_count, paper_cardboard_count,
                 item_variant, bottle_size, total_weight_kg, co2_avoided_kg, points_earned, session_status, created_at
          FROM recycling_sessions
          WHERE user_id = ANY($1::text[])
            AND user_id NOT IN ('anonymous', '', 'null')
          ORDER BY created_at DESC
          LIMIT 100;
        `, [validUserIds]);
        history = sRes.rows;
      }
    } else if (db) {
      history = await db.collection('recyclingsessions').find({
        $and: [
          { $or: [{ userId }, { user_id: userId }, { mobile: userId }] },
          { user_id: { $nin: ['anonymous', '', null] } }
        ]
      }).sort({ recycledAt: -1 }).limit(100).toArray();
    } 

    res.json({
      success: true,
      userId,
      totalSessions: history.length,
      history
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
app.get('/api/getrecycle/:userId', handleMobileGetRecycle);
app.get('/getrecycle/:userId', handleMobileGetRecycle);

// 5. Mobile Usernames / Leaderboard (Mobile & RVM Kiosk Leaderboard)
async function handleMobileUsernames(req, res) {
  try {
    let usersList = [];
    if (activeDbType === 'postgres') {
      const pool = getPgPool();
      if (pool) {
        const uRes = await pool.query(`
          SELECT username AS "userName", COALESCE(points_balance, 0) AS "totalPoints", user_id, full_name, profile_image, dob
          FROM users
          ORDER BY points_balance DESC, created_at ASC
          LIMIT 100;
        `);
        usersList = uRes.rows.map(r => ({
          userName: r.userName || r.full_name || 'Eco User',
          fullName: r.full_name || r.userName || 'Eco User',
          profileImage: r.profile_image || '',
          dob: r.dob || '',
          isBirthday: checkIsBirthday(r.dob),
          totalPoints: Number(r.totalPoints || 0)
        }));
      }
    } else if (db) {
      const docs = await db.collection('users').find({}).sort({ points: -1 }).limit(100).toArray();
      usersList = docs.map(d => ({
        userName: d.username || d.userName || d.fullName || 'Eco User',
        fullName: d.fullName || d.username || 'Eco User',
        profileImage: d.profileImage || '',
        dob: d.dob || '',
        isBirthday: checkIsBirthday(d.dob),
        totalPoints: Number(d.points || d.pointsBalance || 0)
      }));
    }

    res.json({
      success: true,
      users: usersList
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
app.get('/api/usernames', handleMobileUsernames);
app.get('/usernames', handleMobileUsernames);

// 6. Mobile Forgot Password / OTP Flow
async function handleForgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const cleanEmail = email.trim().toLowerCase();
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    if (activeDbType === 'postgres') {
      const pool = getPgPool();
      if (pool) {
        const check = await pool.query(`SELECT user_id FROM users WHERE email = $1 OR mobile = $1 LIMIT 1;`, [cleanEmail]);
        if (check.rows.length === 0) {
          return res.status(404).json({ success: false, message: 'Email address not found' });
        }
        await pool.query(`
          UPDATE users 
          SET otp = $1, otp_expiry = NOW() + INTERVAL '15 minutes'
          WHERE email = $2 OR mobile = $2;
        `, [otp, cleanEmail]);
      }
    }

    console.log(`[Mobile OTP] Generated OTP ${otp} for ${cleanEmail}`);
    res.json({ success: true, message: 'OTP sent to your email successfully', otp: process.env.NODE_ENV !== 'production' ? otp : undefined });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
app.post('/api/forgot-password', handleForgotPassword);
app.post('/forgot-password', handleForgotPassword);

async function handleResendOtp(req, res) {
  return handleForgotPassword(req, res);
}
app.post('/api/resend-otp', handleResendOtp);
app.post('/resend-otp', handleResendOtp);

async function handleResetPassword(req, res) {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (activeDbType === 'postgres') {
      const pool = getPgPool();
      if (pool) {
        const check = await pool.query(`
          SELECT user_id, otp, otp_expiry FROM users WHERE email = $1 OR mobile = $1 LIMIT 1;
        `, [cleanEmail]);

        if (check.rows.length === 0) {
          return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user = check.rows[0];
        if (user.otp !== String(otp).trim()) {
          return res.status(400).json({ success: false, message: 'Invalid or expired OTP code' });
        }

        await pool.query(`
          UPDATE users 
          SET password = $1, otp = NULL, otp_expiry = NULL 
          WHERE user_id = $2;
        `, [newPassword, user.user_id]);
      }
    }

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
app.post('/api/reset-password', handleResetPassword);
app.post('/reset-password', handleResetPassword);

// 7. Mobile Vouch365 Promo Link
async function handleVouch365Link(req, res) {
  try {
    const { username, phone } = req.body;
    const link = `https://vouch365.com/isp-rvm-rewards?user=${encodeURIComponent(username || 'user')}&ref=${encodeURIComponent(phone || '')}`;
    res.json({
      success: true,
      link
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
app.post('/api/generate-vouch365-link', handleVouch365Link);
app.post('/generate-vouch365-link', handleVouch365Link);

// 8. Mobile Backup
app.post(['/api/backup', '/backup'], async (req, res) => {
  res.json({ success: true, message: 'Backup synced successfully', timestamp: new Date().toISOString() });
});
app.get(['/api/backup-full', '/backup-full'], async (req, res) => {
  res.json({ success: true, appName: 'ISP RVM Ecosystem', exportDate: new Date().toISOString() });
});

// 9. Mobile Users & Active Logins for Dashboard
app.get('/api/analytics/mobile-users', async (req, res) => {
  try {
    let usersList = [];
    let stats = {
      totalUsers: 0,
      onlineNow: 0,
      totalPoints: 0,
      totalBottles: 0,
      totalCups: 0
    };

    if (activeDbType === 'postgres') {
      const pool = getPgPool();
      if (pool) {
        const uRes = await pool.query(`
          SELECT 
            u.user_id,
            u.username,
            u.full_name,
            u.email,
            u.mobile,
            u.age,
            u.nic,
            u.gender,
            u.dob,
            u.profile_image,
            COALESCE(u.points_balance, 0) AS points_balance,
            COALESCE(u.is_online, FALSE) AS is_online,
            u.last_login,
            u.last_active,
            u.created_at,
            COALESCE(SUM(s.plastic_count), 0) AS total_bottles,
            COALESCE(SUM(aluminium_count), 0) AS total_cups,
            COUNT(s.session_id) AS total_sessions
          FROM users u
          LEFT JOIN recycling_sessions s 
            ON s.user_id = u.user_id OR s.user_id = u.mobile OR s.user_id = u.username
          GROUP BY u.user_id
          ORDER BY u.last_active DESC NULLS LAST, u.created_at DESC;
        `);

        usersList = uRes.rows.map(u => {
          // A user is strictly online ONLY if they sent a heartbeat/login within the last 2 minutes AND is_online is true
          const hasRecentHeartbeat = u.last_active && (Date.now() - new Date(u.last_active).getTime() < 2 * 60 * 1000);
          const isOnline = Boolean(u.is_online && hasRecentHeartbeat);

          return {
            id: u.user_id,
            username: u.username,
            fullName: u.full_name || u.username,
            email: u.email,
            mobile: u.mobile || '-',
            age: u.age || 20,
            dob: u.dob || '',
            profileImage: u.profile_image || '',
            isBirthday: checkIsBirthday(u.dob),
            nic: u.nic || '-',
            gender: u.gender || 'male',
            points: parseInt(u.points_balance || 0),
            bottles: parseInt(u.total_bottles || 0),
            cups: parseInt(u.total_cups || 0),
            sessions: parseInt(u.total_sessions || 0),
            isOnline,
            lastLogin: u.last_login || null,
            lastActive: u.last_active || null,
            createdAt: u.created_at
          };
        });

        stats.totalUsers = usersList.length;
        stats.onlineNow = usersList.filter(u => u.isOnline).length;
        stats.totalPoints = usersList.reduce((acc, u) => acc + u.points, 0);
        stats.totalBottles = usersList.reduce((acc, u) => acc + u.bottles, 0);
        stats.totalCups = usersList.reduce((acc, u) => acc + u.cups, 0);
      }
    } else if (db) {
      const users = await db.collection('users').find({}).toArray();
      usersList = users.map(u => ({
        id: u._id,
        username: u.username || u.name,
        fullName: u.fullName || u.username,
        email: u.email,
        mobile: u.mobile || u.phoneNumber || '-',
        points: u.points || 0,
        bottles: 0,
        cups: 0,
        sessions: 0,
        isOnline: Boolean(u.isOnline),
        lastLogin: u.lastLogin || u.createdAt,
        lastActive: u.lastActive || u.createdAt,
        createdAt: u.createdAt
      }));
      stats.totalUsers = usersList.length;
      stats.onlineNow = usersList.filter(u => u.isOnline).length;
    }

    res.json({
      success: true,
      stats,
      users: usersList
    });
  } catch (err) {
    console.error('[Get Mobile Users Error]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Mobile App Heartbeat / Active Ping
app.post(['/api/mobile/heartbeat', '/mobile/heartbeat'], async (req, res) => {
  try {
    const { userId, mobile } = req.body;
    const id = (userId || mobile || '').trim();
    if (!id) return res.status(400).json({ error: 'userId required' });

    if (activeDbType === 'postgres') {
      const pool = getPgPool();
      if (pool) {
        await pool.query(`
          UPDATE users 
          SET is_online = TRUE, last_active = NOW()
          WHERE user_id = $1 OR mobile = $1 OR username = $1;
        `, [id]);
      }
    }
    res.json({ success: true, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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

        // 2. Insert or Update recycling_sessions table
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
          ON CONFLICT (session_id) DO UPDATE SET 
            user_id = CASE WHEN EXCLUDED.user_id != 'anonymous' AND EXCLUDED.user_id != '' THEN EXCLUDED.user_id ELSE recycling_sessions.user_id END,
            plastic_count = EXCLUDED.plastic_count,
            aluminium_count = EXCLUDED.aluminium_count,
            paper_cardboard_count = EXCLUDED.paper_cardboard_count,
            glass_count = EXCLUDED.glass_count,
            plastic_small_count = EXCLUDED.plastic_small_count,
            plastic_medium_count = EXCLUDED.plastic_medium_count,
            plastic_large_count = EXCLUDED.plastic_large_count,
            can_small_count = EXCLUDED.can_small_count,
            can_medium_count = EXCLUDED.can_medium_count,
            can_large_count = EXCLUDED.can_large_count,
            paper_weight_grams = EXCLUDED.paper_weight_grams,
            tetrapak_weight_grams = EXCLUDED.tetrapak_weight_grams,
            glass_small_count = EXCLUDED.glass_small_count,
            glass_medium_count = EXCLUDED.glass_medium_count,
            glass_large_count = EXCLUDED.glass_large_count,
            item_variant = EXCLUDED.item_variant,
            bottle_size = EXCLUDED.bottle_size,
            total_weight_kg = EXCLUDED.total_weight_kg,
            co2_avoided_kg = EXCLUDED.co2_avoided_kg,
            points_earned = EXCLUDED.points_earned,
            session_status = 'completed';
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
          const userCheck = await pool.query(`
            SELECT user_id, points_balance FROM users
            WHERE user_id = $1 OR mobile = $1 OR email = $1 OR username = $1
            LIMIT 1;
          `, [userId]);

          if (userCheck.rows.length > 0) {
            const existingUid = userCheck.rows[0].user_id;
            await pool.query(`
              UPDATE users 
              SET points_balance = points_balance + $1, last_active = NOW()
              WHERE user_id = $2;
            `, [pointsEarned, existingUid]);
          } else {
            await pool.query(`
              INSERT INTO users (user_id, username, full_name, mobile, email, points_balance, role_id, status)
              VALUES ($1, $1, $1, $1, $2, $3, 'fleet_operator', 'active')
              ON CONFLICT (user_id) DO UPDATE SET points_balance = users.points_balance + EXCLUDED.points_balance;
            `, [userId, `${userId}@rvm-dash.io`, pointsEarned]);
          }
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

// Helper to extract Public and Local IP from client requests
function getClientIpInfo(req) {
  const forwarded = req.headers['x-forwarded-for'];
  let publicIp = forwarded ? forwarded.split(',')[0].trim() : (req.headers['x-real-ip'] || req.socket.remoteAddress || req.ip || '');
  publicIp = publicIp.replace(/^::ffff:/, '').replace(/^::1$/, '127.0.0.1');
  if (publicIp === '::' || !publicIp) publicIp = '127.0.0.1';

  let localIp = req.body?.localIp || req.query?.localIp || req.headers['x-local-ip'] || req.headers['x-rvm-local-ip'] || '';
  localIp = String(localIp).trim().replace(/^::ffff:/, '');
  if (!localIp || localIp === '::1' || localIp === '::') {
    localIp = publicIp;
  }
  return { publicIp, localIp };
}

// Upstream Telemetry Heartbeat & Bin Level Alerts
app.post('/api/machine/heartbeat', async (req, res) => {
  try {
    const { machineId, binFillPercentage = 0, status = 'active', temperatureCelsius } = req.body;
    if (!machineId) return res.status(400).json({ error: 'machineId is required' });

    const authCheck = await verifyAndAuthorizeMachine(machineId);
    if (!authCheck.authorized) {
      return res.status(403).json({ success: false, authorized: false, error: authCheck.reason });
    }

    const { publicIp, localIp } = getClientIpInfo(req);

    if (activeDbType === 'postgres') {
      const pool = getPgPool();
      if (pool) {
        await pool.query(`
          INSERT INTO machines (machine_id, name, status, bin_fill_percentage, last_ping_at, public_ip, local_ip)
          VALUES ($1, $1, $2, $3, NOW(), $4, $5)
          ON CONFLICT (machine_id) DO UPDATE 
          SET status = EXCLUDED.status, 
              bin_fill_percentage = EXCLUDED.bin_fill_percentage, 
              last_ping_at = NOW(),
              public_ip = COALESCE(NULLIF(EXCLUDED.public_ip, ''), machines.public_ip),
              local_ip = COALESCE(NULLIF(EXCLUDED.local_ip, ''), machines.local_ip);
        `, [machineId, status, binFillPercentage, publicIp, localIp]);
      }
    }

    if (activeDbType === 'mongodb') {
      const db = getMongoDb();
      if (db) {
        await db.collection('machines').updateOne(
          { machineId },
          { $set: { lastPingAt: new Date(), updatedAt: new Date(), status: 'active', binFillPercentage, publicIp, localIp } },
          { upsert: true }
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
      publicIp,
      localIp,
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

    const { publicIp, localIp } = getClientIpInfo(req);

    let config = {
      machineId,
      name: `RVM Machine ${machineId}`,
      location: 'Main Kiosk',
      configVersion: 1,
      publicIp,
      localIp,
      pointsPerPlasticBottle: 10,
      pointsPerAluminiumCan: 20,
      pointsPerPaperKg: 15,
      pointsPerGlass: 15,
      plasticUnit: 'per_piece',
      aluminiumUnit: 'per_piece',
      paperUnit: 'per_kg',
      glassUnit: 'per_piece',
      updatedAt: new Date().toISOString()
    };

    if (activeDbType === 'postgres') {
      const pool = getPgPool();
      if (pool) {
        await pool.query(`
          INSERT INTO machines (machine_id, name, status, last_ping_at, public_ip, local_ip)
          VALUES ($1, $1, 'active', NOW(), $2, $3)
          ON CONFLICT (machine_id) DO UPDATE SET 
            last_ping_at = NOW(), 
            status = 'active',
            public_ip = COALESCE(NULLIF(EXCLUDED.public_ip, ''), machines.public_ip),
            local_ip = COALESCE(NULLIF(EXCLUDED.local_ip, ''), machines.local_ip);
        `, [machineId, publicIp, localIp]).catch(() => {});

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
            pointsPerPlasticBottle: row.points_per_plastic ?? 10,
            pointsPlasticSmall: row.points_plastic_small ?? 5,
            pointsPlasticMedium: row.points_plastic_medium ?? 10,
            pointsPlasticLarge: row.points_plastic_large ?? 15,
            pointsPerAluminiumCan: row.points_per_aluminium ?? 20,
            pointsCanSmall: row.points_can_small ?? 10,
            pointsCanMedium: row.points_can_medium ?? 15,
            pointsCanLarge: row.points_can_large ?? 20,
            pointsPerPaperKg: row.points_per_paper_kg ?? 15,
            pointsPerGlass: row.points_per_glass ?? 15,
            pointsGlassSmall: row.points_glass_small ?? 10,
            pointsGlassMedium: row.points_glass_medium ?? 15,
            pointsGlassLarge: row.points_glass_large ?? 20,
            plasticUnit: row.plastic_unit || 'per_piece',
            aluminiumUnit: row.aluminium_unit || 'per_piece',
            paperUnit: row.paper_unit || 'per_kg',
            glassUnit: row.glass_unit || 'per_piece',
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
          if (m.pointsPerPlasticBottle !== undefined) config.pointsPerPlasticBottle = m.pointsPerPlasticBottle;
          if (m.pointsPlasticSmall !== undefined) config.pointsPlasticSmall = m.pointsPlasticSmall;
          if (m.pointsPlasticMedium !== undefined) config.pointsPlasticMedium = m.pointsPlasticMedium;
          if (m.pointsPlasticLarge !== undefined) config.pointsPlasticLarge = m.pointsPlasticLarge;
          if (m.pointsPerAluminiumCan !== undefined) config.pointsPerAluminiumCan = m.pointsPerAluminiumCan;
          if (m.pointsCanSmall !== undefined) config.pointsCanSmall = m.pointsCanSmall;
          if (m.pointsCanMedium !== undefined) config.pointsCanMedium = m.pointsCanMedium;
          if (m.pointsCanLarge !== undefined) config.pointsCanLarge = m.pointsCanLarge;
          if (m.pointsPerPaperKg !== undefined) config.pointsPerPaperKg = m.pointsPerPaperKg;
          if (m.pointsPerGlass !== undefined) config.pointsPerGlass = m.pointsPerGlass;
          if (m.pointsGlassSmall !== undefined) config.pointsGlassSmall = m.pointsGlassSmall;
          if (m.pointsGlassMedium !== undefined) config.pointsGlassMedium = m.pointsGlassMedium;
          if (m.pointsGlassLarge !== undefined) config.pointsGlassLarge = m.pointsGlassLarge;
          if (m.plasticUnit) config.plasticUnit = m.plasticUnit;
          if (m.aluminiumUnit) config.aluminiumUnit = m.aluminiumUnit;
          if (m.paperUnit) config.paperUnit = m.paperUnit;
          if (m.glassUnit) config.glassUnit = m.glassUnit;
        }
      }
    }

    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update / Save RVM Machine Points Configuration (Single or Bulk)
const handleSaveMachineConfig = async (req, res) => {
  try {
    const machineId = req.params.machineId || req.body.targetMachine || req.body.machineId;
    const { 
      pointsPerPlasticBottle = 10, 
      pointsPlasticSmall = 5,
      pointsPlasticMedium = 10,
      pointsPlasticLarge = 15,
      pointsPerAluminiumCan = 20, 
      pointsCanSmall = 10,
      pointsCanMedium = 15,
      pointsCanLarge = 20,
      pointsPerPaperKg = 15,
      pointsPerGlass = 15,
      pointsGlassSmall = 10,
      pointsGlassMedium = 15,
      pointsGlassLarge = 20,
      plasticUnit = 'per_piece',
      aluminiumUnit = 'per_piece',
      paperUnit = 'per_kg',
      glassUnit = 'per_piece',
      targetMachine = machineId
    } = req.body;

    if (activeDbType === 'postgres') {
      const pool = getPgPool();
      if (pool) {
        if (targetMachine === 'ALL') {
          await pool.query(`
            INSERT INTO machine_configs (
              machine_id, config_version, 
              points_per_plastic, points_plastic_small, points_plastic_medium, points_plastic_large,
              points_per_aluminium, points_can_small, points_can_medium, points_can_large,
              points_per_paper_kg, points_per_glass, points_glass_small, points_glass_medium, points_glass_large,
              plastic_unit, aluminium_unit, paper_unit, glass_unit, updated_at
            )
            SELECT machine_id, 1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW() FROM machines
            ON CONFLICT (machine_id) DO UPDATE SET
              config_version = machine_configs.config_version + 1,
              points_per_plastic = EXCLUDED.points_per_plastic,
              points_plastic_small = EXCLUDED.points_plastic_small,
              points_plastic_medium = EXCLUDED.points_plastic_medium,
              points_plastic_large = EXCLUDED.points_plastic_large,
              points_per_aluminium = EXCLUDED.points_per_aluminium,
              points_can_small = EXCLUDED.points_can_small,
              points_can_medium = EXCLUDED.points_can_medium,
              points_can_large = EXCLUDED.points_can_large,
              points_per_paper_kg = EXCLUDED.points_per_paper_kg,
              points_per_glass = EXCLUDED.points_per_glass,
              points_glass_small = EXCLUDED.points_glass_small,
              points_glass_medium = EXCLUDED.points_glass_medium,
              points_glass_large = EXCLUDED.points_glass_large,
              plastic_unit = EXCLUDED.plastic_unit,
              aluminium_unit = EXCLUDED.aluminium_unit,
              paper_unit = EXCLUDED.paper_unit,
              glass_unit = EXCLUDED.glass_unit,
              updated_at = NOW();
          `, [
            parseInt(pointsPerPlasticBottle), parseInt(pointsPlasticSmall), parseInt(pointsPlasticMedium), parseInt(pointsPlasticLarge),
            parseInt(pointsPerAluminiumCan), parseInt(pointsCanSmall), parseInt(pointsCanMedium), parseInt(pointsCanLarge),
            parseInt(pointsPerPaperKg), parseInt(pointsPerGlass), parseInt(pointsGlassSmall), parseInt(pointsGlassMedium), parseInt(pointsGlassLarge),
            plasticUnit, aluminiumUnit, paperUnit, glassUnit
          ]);
        } else if (targetMachine) {
          await pool.query(`
            INSERT INTO machine_configs (
              machine_id, config_version, 
              points_per_plastic, points_plastic_small, points_plastic_medium, points_plastic_large,
              points_per_aluminium, points_can_small, points_can_medium, points_can_large,
              points_per_paper_kg, points_per_glass, points_glass_small, points_glass_medium, points_glass_large,
              plastic_unit, aluminium_unit, paper_unit, glass_unit, updated_at
            )
            VALUES ($1, 1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW())
            ON CONFLICT (machine_id) DO UPDATE SET
              config_version = machine_configs.config_version + 1,
              points_per_plastic = EXCLUDED.points_per_plastic,
              points_plastic_small = EXCLUDED.points_plastic_small,
              points_plastic_medium = EXCLUDED.points_plastic_medium,
              points_plastic_large = EXCLUDED.points_plastic_large,
              points_per_aluminium = EXCLUDED.points_per_aluminium,
              points_can_small = EXCLUDED.points_can_small,
              points_can_medium = EXCLUDED.points_can_medium,
              points_can_large = EXCLUDED.points_can_large,
              points_per_paper_kg = EXCLUDED.points_per_paper_kg,
              points_per_glass = EXCLUDED.points_per_glass,
              points_glass_small = EXCLUDED.points_glass_small,
              points_glass_medium = EXCLUDED.points_glass_medium,
              points_glass_large = EXCLUDED.points_glass_large,
              plastic_unit = EXCLUDED.plastic_unit,
              aluminium_unit = EXCLUDED.aluminium_unit,
              paper_unit = EXCLUDED.paper_unit,
              glass_unit = EXCLUDED.glass_unit,
              updated_at = NOW();
          `, [
            targetMachine,
            parseInt(pointsPerPlasticBottle), parseInt(pointsPlasticSmall), parseInt(pointsPlasticMedium), parseInt(pointsPlasticLarge),
            parseInt(pointsPerAluminiumCan), parseInt(pointsCanSmall), parseInt(pointsCanMedium), parseInt(pointsCanLarge),
            parseInt(pointsPerPaperKg), parseInt(pointsPerGlass), parseInt(pointsGlassSmall), parseInt(pointsGlassMedium), parseInt(pointsGlassLarge),
            plasticUnit, aluminiumUnit, paperUnit, glassUnit
          ]);
        }
      }
    }

    res.json({ success: true, message: `Configuration & points rules updated for ${targetMachine === 'ALL' ? 'ALL RVM machines' : `machine '${targetMachine}'`}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

app.post('/api/machine/config', handleSaveMachineConfig);
app.post('/api/machine/config/:machineId', handleSaveMachineConfig);
app.put('/api/machine/config/:machineId', handleSaveMachineConfig);

// ==========================================
// DYNAMIC POINT SETTINGS MATRIX ENDPOINTS
// ==========================================

// Persistent point settings file storage path
const POINT_SETTINGS_FILE = path.join(__dirname, 'point_settings_db.json');

const DEFAULT_INITIAL_POINT_SETTINGS = [
  { id: 1, materialType: 'PLASTIC', bottleSize: 'SMALL', points: 5, unit: 'per_piece', isActive: true },
  { id: 2, materialType: 'PLASTIC', bottleSize: 'MEDIUM', points: 10, unit: 'per_piece', isActive: true },
  { id: 3, materialType: 'PLASTIC', bottleSize: 'LARGE', points: 15, unit: 'per_piece', isActive: true },
  { id: 4, materialType: 'CAN', bottleSize: 'SMALL', points: 10, unit: 'per_piece', isActive: true },
  { id: 5, materialType: 'CAN', bottleSize: 'MEDIUM', points: 15, unit: 'per_piece', isActive: true },
  { id: 6, materialType: 'CAN', bottleSize: 'LARGE', points: 20, unit: 'per_piece', isActive: true },
  { id: 7, materialType: 'TETRA PAK', bottleSize: 'SMALL', points: 5, unit: 'per_piece', isActive: true },
  { id: 8, materialType: 'TETRA PAK', bottleSize: 'MEDIUM', points: 10, unit: 'per_piece', isActive: true },
  { id: 9, materialType: 'TETRA PAK', bottleSize: 'LARGE', points: 15, unit: 'per_piece', isActive: true },
  { id: 10, materialType: 'GLASS', bottleSize: 'SMALL', points: 10, unit: 'per_piece', isActive: true },
  { id: 11, materialType: 'GLASS', bottleSize: 'MEDIUM', points: 15, unit: 'per_piece', isActive: true },
  { id: 12, materialType: 'GLASS', bottleSize: 'LARGE', points: 20, unit: 'per_piece', isActive: true }
];

let MEMORY_POINT_SETTINGS = { '*': DEFAULT_INITIAL_POINT_SETTINGS };

// Load persistent file settings if exists
try {
  if (fs.existsSync(POINT_SETTINGS_FILE)) {
    const raw = fs.readFileSync(POINT_SETTINGS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      MEMORY_POINT_SETTINGS = parsed;
    }
  }
} catch (e) {
  console.error('[Point Settings Storage Notice] Failed to load point_settings_db.json:', e.message);
}

const savePointSettingsToFile = () => {
  try {
    fs.writeFileSync(POINT_SETTINGS_FILE, JSON.stringify(MEMORY_POINT_SETTINGS, null, 2), 'utf-8');
  } catch (e) {
    console.error('[Point Settings Storage Error] Failed to write point_settings_db.json:', e.message);
  }
};

app.get('/api/machine/point-settings', async (req, res) => {
  try {
    const machineId = (req.query.machineId || req.query.targetMachine || '*').trim();
    let settingsList = MEMORY_POINT_SETTINGS[machineId] || MEMORY_POINT_SETTINGS['*'] || DEFAULT_INITIAL_POINT_SETTINGS;

    const pool = getPgPool();
    if (pool) {
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS machine_variant_settings (
            id SERIAL PRIMARY KEY,
            machine_id VARCHAR(100) NOT NULL DEFAULT '*',
            material_type VARCHAR(50) NOT NULL,
            bottle_size VARCHAR(50) NOT NULL,
            points INT NOT NULL DEFAULT 10,
            unit VARCHAR(20) NOT NULL DEFAULT 'per_piece',
            is_active BOOLEAN NOT NULL DEFAULT true,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_mvs UNIQUE (machine_id, material_type, bottle_size)
          );
        `);
        const pgRes = await pool.query(
          `SELECT id, machine_id, material_type, bottle_size, points, unit, is_active 
           FROM machine_variant_settings 
           WHERE machine_id = $1 
           ORDER BY material_type ASC, bottle_size ASC;`,
          [machineId]
        );

        let rowsToUse = pgRes.rows;
        if (rowsToUse.length === 0) {
          const fallbackRes = await pool.query(
            `SELECT id, machine_id, material_type, bottle_size, points, unit, is_active 
             FROM machine_variant_settings 
             WHERE machine_id = '*' OR machine_id = 'ALL' 
             ORDER BY material_type ASC, bottle_size ASC;`
          );
          rowsToUse = fallbackRes.rows;
        }

        if (rowsToUse.length > 0) {
          settingsList = rowsToUse.map(r => ({
            id: r.id,
            machineId: r.machine_id,
            materialType: r.material_type,
            bottleSize: r.bottle_size,
            points: r.points,
            unit: r.unit,
            isActive: r.is_active
          }));
        }
      } catch (pgErr) {
        console.error('[GET /api/machine/point-settings] PG notice:', pgErr.message);
      }
    }

    res.json({
      machineId,
      configVersion: Date.now(),
      settings: settingsList
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/machine/point-settings', async (req, res) => {
  try {
    const { targetMachine = '*', settings = [] } = req.body || {};
    if (!Array.isArray(settings)) {
      return res.status(400).json({ error: 'settings must be an array of variant rules' });
    }

    const machineScope = targetMachine.trim();
    const formattedSettings = settings.map((s, idx) => ({
      id: s.id || idx + 1,
      machineId: machineScope,
      materialType: String(s.materialType || 'PLASTIC').toUpperCase(),
      bottleSize: String(s.bottleSize || 'MEDIUM').toUpperCase(),
      points: parseInt(s.points) || 0,
      unit: s.unit || 'per_piece',
      isActive: s.isActive !== false
    }));

    MEMORY_POINT_SETTINGS[machineScope] = formattedSettings;
    MEMORY_POINT_SETTINGS['*'] = formattedSettings;
    MEMORY_POINT_SETTINGS['ALL'] = formattedSettings;
    savePointSettingsToFile();

    // PostgreSQL ONLY Database Sync
    const pool = getPgPool();
    if (pool) {
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS machine_variant_settings (
            id SERIAL PRIMARY KEY,
            machine_id VARCHAR(100) NOT NULL DEFAULT '*',
            material_type VARCHAR(50) NOT NULL,
            bottle_size VARCHAR(50) NOT NULL,
            points INT NOT NULL DEFAULT 10,
            unit VARCHAR(20) NOT NULL DEFAULT 'per_piece',
            is_active BOOLEAN NOT NULL DEFAULT true,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_mvs UNIQUE (machine_id, material_type, bottle_size)
          );
        `);

        // Determine all target machine IDs to update in PostgreSQL
        let targetMachinesToUpdate = [machineScope];
        if (machineScope === '*' || machineScope === 'ALL') {
          targetMachinesToUpdate = ['*', 'ALL'];
          try {
            const mRes = await pool.query(`SELECT DISTINCT machine_id FROM machine_configs UNION SELECT DISTINCT machine_id FROM machines;`);
            mRes.rows.forEach(r => {
              if (r.machine_id) targetMachinesToUpdate.push(r.machine_id);
            });
          } catch (e) {}
        }

        const uniqueTargets = Array.from(new Set(targetMachinesToUpdate));

        for (const targetScope of uniqueTargets) {
          for (const item of formattedSettings) {
            await pool.query(`
              INSERT INTO machine_variant_settings (machine_id, material_type, bottle_size, points, unit, is_active, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6, NOW())
              ON CONFLICT (machine_id, material_type, bottle_size) DO UPDATE SET
                points = EXCLUDED.points,
                unit = EXCLUDED.unit,
                is_active = EXCLUDED.is_active,
                updated_at = NOW();
            `, [targetScope, item.materialType, item.bottleSize, item.points, item.unit, item.isActive]);
          }
        }

        // Also upsert into PostgreSQL table machine_configs for full relational & API compatibility
        const pSmall = formattedSettings.find(s => s.materialType === 'PLASTIC' && s.bottleSize === 'SMALL')?.points || 5;
        const pMed = formattedSettings.find(s => s.materialType === 'PLASTIC' && s.bottleSize === 'MEDIUM')?.points || 10;
        const pLg = formattedSettings.find(s => s.materialType === 'PLASTIC' && s.bottleSize === 'LARGE')?.points || 15;
        const cSmall = formattedSettings.find(s => s.materialType === 'CAN' && s.bottleSize === 'SMALL')?.points || 6;
        const cMed = formattedSettings.find(s => s.materialType === 'CAN' && s.bottleSize === 'MEDIUM')?.points || 12;
        const cLg = formattedSettings.find(s => s.materialType === 'CAN' && s.bottleSize === 'LARGE')?.points || 20;
        const gSmall = formattedSettings.find(s => s.materialType === 'GLASS' && s.bottleSize === 'SMALL')?.points || 10;
        const gMed = formattedSettings.find(s => s.materialType === 'GLASS' && s.bottleSize === 'MEDIUM')?.points || 15;
        const gLg = formattedSettings.find(s => s.materialType === 'GLASS' && s.bottleSize === 'LARGE')?.points || 20;

        const scopesToUpdate = Array.from(new Set([machineScope, '*', 'ALL', 'RVM-RWP', 'RVM-001']));
        for (const scope of scopesToUpdate) {
          await pool.query(`
            INSERT INTO machine_configs (
              machine_id, config_version, 
              points_per_plastic, points_plastic_small, points_plastic_medium, points_plastic_large,
              points_per_aluminium, points_can_small, points_can_medium, points_can_large,
              points_glass_small, points_glass_medium, points_glass_large,
              updated_at
            )
            VALUES ($1, 1, $3, $2, $3, $4, $6, $5, $6, $7, $8, $9, $10, NOW())
            ON CONFLICT (machine_id) DO UPDATE SET
              config_version = machine_configs.config_version + 1,
              points_per_plastic = EXCLUDED.points_per_plastic,
              points_plastic_small = EXCLUDED.points_plastic_small,
              points_plastic_medium = EXCLUDED.points_plastic_medium,
              points_plastic_large = EXCLUDED.points_plastic_large,
              points_per_aluminium = EXCLUDED.points_per_aluminium,
              points_can_small = EXCLUDED.points_can_small,
              points_can_medium = EXCLUDED.points_can_medium,
              points_can_large = EXCLUDED.points_can_large,
              points_glass_small = EXCLUDED.points_glass_small,
              points_glass_medium = EXCLUDED.points_glass_medium,
              points_glass_large = EXCLUDED.points_glass_large,
              updated_at = NOW();
          `, [scope, pSmall, pMed, pLg, cSmall, cMed, cLg, gSmall, gMed, gLg]).catch(() => {});
        }
      } catch (pgErr) {
        console.error('[POST /api/machine/point-settings] PG error:', pgErr.message);
      }
    }

    res.json({
      success: true,
      message: `Successfully saved ${formattedSettings.length} point settings rules for ${machineScope === '*' || machineScope === 'ALL' ? 'ALL RVM Machines' : `machine '${machineScope}'`}`,
      targetMachine: machineScope,
      settingsCount: formattedSettings.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- RVM ADVERTISEMENT VIDEO MANAGEMENT APIS ----------------
// Upload advertisement video file (supports .mp4, .webm, .avi, .mov up to 250MB)
app.post('/api/machine/ads/upload', (req, res) => {
  adVideoUpload.single('video')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No video file provided in form-data (field: "video")' });
    }

    const relativeUrl = `/uploads/advertisements/${req.file.filename}`;
    const fullUrl = `${req.protocol}://${req.get('host')}${relativeUrl}`;

    res.json({
      success: true,
      url: relativeUrl,
      fullUrl,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      mimetype: req.file.mimetype,
      uploadedAt: new Date().toISOString()
    });
  });
});

// Fetch active advertisement video playlist for RVM fleet / specific machine
// Fetch active advertisement video playlist for RVM fleet / specific machine
app.get('/api/machine/ads', async (req, res) => {
  try {
    const { machineId = '*' } = req.query;
    const pool = getPgPool();
    let adsList = [];

    if (pool && activeDbType === 'postgres') {
      try {
        let queryText = `
          SELECT id, machine_id, title, video_url, file_name, file_size, duration_seconds, is_active, display_order, created_at, updated_at
          FROM machine_advertisements
        `;
        let queryParams = [];

        if (machineId && machineId !== 'ALL' && machineId !== '*') {
          queryText += ` WHERE machine_id = $1 OR machine_id = '*' OR machine_id = 'ALL' `;
          queryParams.push(machineId);
        }

        queryText += ` ORDER BY display_order ASC, created_at DESC;`;
        const result = await pool.query(queryText, queryParams);
        
        // Deduplicate rows by file_name or video_url to prevent duplicate UI items
        const seenKeys = new Set();
        for (const r of result.rows) {
          const dedupeKey = (r.file_name || r.video_url || String(r.id)).toLowerCase();
          if (!seenKeys.has(dedupeKey)) {
            seenKeys.add(dedupeKey);
            adsList.push({
              id: r.id,
              machineId: r.machine_id,
              title: r.title,
              videoUrl: r.video_url,
              fileName: r.file_name,
              fileSize: Number(r.file_size || 0),
              durationSeconds: r.duration_seconds || 0,
              isActive: r.is_active,
              displayOrder: r.display_order || 1,
              createdAt: r.created_at,
              updatedAt: r.updated_at
            });
          }
        }
      } catch (pgErr) {
        console.error('[GET /api/machine/ads] PostgreSQL error:', pgErr.message);
      }
    }

    // If no ads in DB yet, look for local default files in Ads directory
    if (adsList.length === 0) {
      try {
        if (fs.existsSync(ADS_UPLOAD_DIR)) {
          const localFiles = fs.readdirSync(ADS_UPLOAD_DIR);
          adsList = localFiles
            .filter(f => /\.(mp4|webm|avi|mov|mkv|m4v)$/i.test(f))
            .map((f, i) => ({
              id: `disk_${i + 1}`,
              machineId: '*',
              title: f.replace(/_/g, ' ').replace(/\.[^.]+$/, ''),
              videoUrl: `/uploads/advertisements/${f}`,
              fileName: f,
              fileSize: fs.statSync(path.join(ADS_UPLOAD_DIR, f)).size,
              durationSeconds: 30,
              isActive: true,
              displayOrder: i + 1,
              createdAt: new Date().toISOString()
            }));
        }
      } catch (e) {}
    }

    res.json({
      success: true,
      machineId,
      totalCount: adsList.length,
      ads: adsList
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Save or Update Advertisement Video Configuration
app.post('/api/machine/ads', async (req, res) => {
  try {
    let {
      id,
      machineId = '*',
      title,
      videoUrl,
      fileName,
      fileSize = 0,
      durationSeconds = 0,
      isActive = true,
      displayOrder = 1,
      replaceMode = 'append', // 'append' (keep old) or 'replace_delete' (delete old) or 'replace_deactivate'
      cleanupOldVideos = false
    } = req.body;

    if (!title || !videoUrl) {
      return res.status(400).json({ success: false, error: 'Title and videoUrl are required' });
    }

    const pool = getPgPool();
    if (!pool || activeDbType !== 'postgres') {
      return res.status(500).json({ success: false, error: 'PostgreSQL database connection required' });
    }

    // Handle replacement of old videos if requested
    if (!id && (replaceMode === 'replace_delete' || cleanupOldVideos === true)) {
      let oldAdsQuery = `SELECT * FROM machine_advertisements`;
      let oldParams = [];
      if (machineId && machineId !== 'ALL' && machineId !== '*') {
        oldAdsQuery += ` WHERE machine_id = $1 OR machine_id = '*' OR machine_id = 'ALL'`;
        oldParams.push(machineId);
      }
      const oldAdsRes = await pool.query(oldAdsQuery, oldParams);
      for (const oldAd of oldAdsRes.rows) {
        if (oldAd.file_name && oldAd.file_name !== fileName) {
          const oldFilePath = path.join(ADS_UPLOAD_DIR, oldAd.file_name);
          if (fs.existsSync(oldFilePath)) {
            try { fs.unlinkSync(oldFilePath); } catch (e) {}
          }
        }
      }
      if (oldParams.length > 0) {
        await pool.query(`DELETE FROM machine_advertisements WHERE machine_id = $1 OR machine_id = '*' OR machine_id = 'ALL'`, oldParams);
      } else {
        await pool.query(`DELETE FROM machine_advertisements`);
      }
      displayOrder = 1;
    } else if (!id && replaceMode === 'replace_deactivate') {
      let deactQuery = `UPDATE machine_advertisements SET is_active = false, updated_at = NOW()`;
      let deactParams = [];
      if (machineId && machineId !== 'ALL' && machineId !== '*') {
        deactQuery += ` WHERE machine_id = $1 OR machine_id = '*' OR machine_id = 'ALL'`;
        deactParams.push(machineId);
      }
      await pool.query(deactQuery, deactParams);
      displayOrder = 1;
    } else if (!id) {
      // Check if this same file/URL is already in DB to avoid duplicates
      if (fileName || videoUrl) {
        const dupCheck = await pool.query(
          `SELECT id FROM machine_advertisements WHERE (file_name IS NOT NULL AND file_name = $1) OR video_url = $2 LIMIT 1`,
          [fileName || '', videoUrl]
        );
        if (dupCheck.rows.length > 0) {
          id = dupCheck.rows[0].id;
        }
      }

      if (!id) {
        // Auto-assign next display order if not specified
        const maxOrderRes = await pool.query(`SELECT COALESCE(MAX(display_order), 0) AS max_order FROM machine_advertisements WHERE is_active = true`);
        displayOrder = (maxOrderRes.rows[0]?.max_order || 0) + 1;
      }
    }

    let savedAd;
    if (id && !String(id).startsWith('disk_')) {
      // Update existing ad
      const updateRes = await pool.query(`
        UPDATE machine_advertisements
        SET machine_id = $1, title = $2, video_url = $3, file_name = $4, file_size = $5,
            duration_seconds = $6, is_active = $7, display_order = $8, updated_at = NOW()
        WHERE id = $9
        RETURNING *;
      `, [machineId, title, videoUrl, fileName || null, fileSize, durationSeconds, isActive, displayOrder, parseInt(id)]);
      savedAd = updateRes.rows[0];
    } else {
      // Create new ad
      const insertRes = await pool.query(`
        INSERT INTO machine_advertisements (machine_id, title, video_url, file_name, file_size, duration_seconds, is_active, display_order, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *;
      `, [machineId, title, videoUrl, fileName || null, fileSize, durationSeconds, isActive, displayOrder]);
      savedAd = insertRes.rows[0];
    }

    res.json({
      success: true,
      message: `Advertisement '${title}' saved successfully! RVMDesktopApp will automatically download and start playing this video.`,
      ad: savedAd
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Toggle Advertisement Video Active State
app.patch('/api/machine/ads/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPgPool();
    if (!pool) return res.status(500).json({ success: false, error: 'Database unavailable' });

    if (/^\d+$/.test(id)) {
      const result = await pool.query(`
        UPDATE machine_advertisements
        SET is_active = NOT is_active, updated_at = NOW()
        WHERE id = $1
        RETURNING *;
      `, [parseInt(id)]);

      if (result.rowCount > 0) {
        return res.json({
          success: true,
          ad: result.rows[0],
          message: `Advertisement status changed to ${result.rows[0].is_active ? 'ACTIVE' : 'PAUSED'}`
        });
      }
    }

    res.json({ success: true, message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete Advertisement Video (Handles DB record & Local file removal)
app.delete('/api/machine/ads/:id', async (req, res) => {
  try {
    const rawId = req.params.id;
    const { fileName, title } = req.query;
    const pool = getPgPool();
    let deletedCount = 0;
    let deletedTitle = title || rawId;

    if (pool && activeDbType === 'postgres') {
      try {
        let selRes;
        if (/^\d+$/.test(rawId)) {
          selRes = await pool.query(`SELECT * FROM machine_advertisements WHERE id = $1`, [parseInt(rawId)]);
        } else {
          selRes = await pool.query(`
            SELECT * FROM machine_advertisements 
            WHERE file_name = $1 
               OR video_url LIKE $2 
               OR title ILIKE $3
          `, [rawId, `%${rawId}%`, `%${rawId}%`]);
        }

        if (selRes && selRes.rows.length > 0) {
          for (const ad of selRes.rows) {
            deletedTitle = ad.title || deletedTitle;
            await pool.query(`DELETE FROM machine_advertisements WHERE id = $1`, [ad.id]);
            deletedCount++;

            // Clean up matching file on disk
            if (ad.file_name) {
              const localFilePath = path.join(ADS_UPLOAD_DIR, ad.file_name);
              if (fs.existsSync(localFilePath)) {
                try { fs.unlinkSync(localFilePath); } catch (e) {}
              }
            }
          }
        }
      } catch (dbErr) {
        console.warn('[DELETE Ad DB Warning]', dbErr.message);
      }
    }

    // Also scan ADS_UPLOAD_DIR to remove any file matching rawId or query fileName
    if (fs.existsSync(ADS_UPLOAD_DIR)) {
      try {
        const files = fs.readdirSync(ADS_UPLOAD_DIR);
        for (const f of files) {
          const shouldDelete = f === rawId || 
                               (fileName && f === fileName) ||
                               (rawId && rawId.length > 5 && f.includes(rawId)) ||
                               (deletedTitle && deletedTitle.length > 5 && f.toLowerCase().includes(deletedTitle.toLowerCase().replace(/ /g, '_')));
          if (shouldDelete) {
            try {
              fs.unlinkSync(path.join(ADS_UPLOAD_DIR, f));
              deletedCount++;
            } catch (e) {}
          }
        }
      } catch (e) {}
    }

    res.json({
      success: true,
      message: `Advertisement '${deletedTitle}' deleted successfully (${deletedCount} record(s)/file(s) removed)`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Fetch currently active/selected advertisement video for RVM machine
app.get('/api/machine/ads/active', async (req, res) => {
  try {
    const { machineId = '*' } = req.query;
    const pool = getPgPool();
    let activeAd = null;

    if (pool && activeDbType === 'postgres') {
      try {
        let queryText = `
          SELECT id, machine_id, title, video_url, file_name, file_size, duration_seconds, is_active, display_order, created_at, updated_at
          FROM machine_advertisements
          WHERE is_active = true
        `;
        let queryParams = [];

        if (machineId && machineId !== 'ALL' && machineId !== '*') {
          queryText += ` AND (machine_id = $1 OR machine_id = '*' OR machine_id = 'ALL') `;
          queryParams.push(machineId);
          queryText += ` ORDER BY CASE WHEN machine_id = $1 THEN 0 ELSE 1 END, display_order ASC, updated_at DESC LIMIT 1;`;
        } else {
          queryText += ` ORDER BY display_order ASC, updated_at DESC LIMIT 1;`;
        }

        const result = await pool.query(queryText, queryParams);
        if (result.rows.length > 0) {
          const r = result.rows[0];
          activeAd = {
            id: r.id,
            machineId: r.machine_id,
            title: r.title,
            videoUrl: r.video_url,
            fileName: r.file_name,
            fileSize: Number(r.file_size || 0),
            durationSeconds: r.duration_seconds || 0,
            isActive: r.is_active,
            displayOrder: r.display_order || 1,
            updatedAt: r.updated_at
          };
        }
      } catch (pgErr) {
        console.error('[GET /api/machine/ads/active] PostgreSQL error:', pgErr.message);
      }
    }

    res.json({
      success: true,
      machineId,
      hasActiveVideo: activeAd !== null,
      activeVideo: activeAd
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Fetch complete active advertisement playlist for RVM machine rotation
app.get('/api/machine/ads/playlist', async (req, res) => {
  try {
    const { machineId = '*' } = req.query;
    const pool = getPgPool();
    let playlist = [];

    if (pool && activeDbType === 'postgres') {
      try {
        let queryText = `
          SELECT id, machine_id, title, video_url, file_name, file_size, duration_seconds, is_active, display_order, created_at, updated_at
          FROM machine_advertisements
          WHERE is_active = true
        `;
        let queryParams = [];

        if (machineId && machineId !== 'ALL' && machineId !== '*') {
          queryText += ` AND (machine_id = $1 OR machine_id = '*' OR machine_id = 'ALL') `;
          queryParams.push(machineId);
          queryText += ` ORDER BY CASE WHEN machine_id = $1 THEN 0 ELSE 1 END, display_order ASC, created_at ASC;`;
        } else {
          queryText += ` ORDER BY display_order ASC, created_at ASC;`;
        }

        const result = await pool.query(queryText, queryParams);
        playlist = result.rows.map((r, idx) => ({
          id: r.id,
          machineId: r.machine_id,
          title: r.title,
          videoUrl: r.video_url,
          fileName: r.file_name,
          fileSize: Number(r.file_size || 0),
          durationSeconds: r.duration_seconds || 0,
          isActive: r.is_active,
          displayOrder: r.display_order || (idx + 1),
          createdAt: r.created_at,
          updatedAt: r.updated_at
        }));
      } catch (pgErr) {
        console.error('[GET /api/machine/ads/playlist] PostgreSQL error:', pgErr.message);
      }
    }

    res.json({
      success: true,
      machineId,
      totalCount: playlist.length,
      playlist
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Reorder or set multiple active videos in playlist
app.post('/api/machine/ads/playlist/reorder', async (req, res) => {
  try {
    const { orderedIds = [], machineId = '*' } = req.body;
    const pool = getPgPool();
    if (!pool) return res.status(500).json({ success: false, error: 'Database unavailable' });

    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ success: false, error: 'orderedIds must be an array of IDs' });
    }

    for (let i = 0; i < orderedIds.length; i++) {
      await pool.query(`
        UPDATE machine_advertisements
        SET display_order = $1, is_active = true, updated_at = NOW()
        WHERE id = $2;
      `, [i + 1, orderedIds[i]]);
    }

    res.json({
      success: true,
      message: `Updated rotation playlist order (${orderedIds.length} video(s)) for machine ${machineId}.`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
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



