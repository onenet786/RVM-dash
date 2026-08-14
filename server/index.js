import express from 'express';
import cors from 'cors';
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
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DBNAME || 'rvmapp';

app.use(cors());
app.use(express.json());

let dbClient = null;
let db = null;

async function connectDB() {
  if (db) return db;
  try {
    dns.setDefaultResultOrder('ipv4first');
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    } catch (e) {}

    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is missing in .env');
    }
    dbClient = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
    });
    await dbClient.connect();
    db = dbClient.db(DB_NAME);
    console.log(`[MongoDB] Connected successfully to database "${DB_NAME}"`);
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

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const admin = db.admin();
    const ping = await admin.ping();
    const collections = await db.listCollections().toArray();
    
    const collectionsWithStats = await Promise.all(
      collections.map(async (col) => {
        const count = await db.collection(col.name).countDocuments();
        return { name: col.name, count };
      })
    );

    res.json({
      status: 'online',
      database: DB_NAME,
      ping: ping.ok === 1 ? 'OK' : 'ERR',
      collectionsCount: collections.length,
      collections: collectionsWithStats,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// High level KPIs Overview
app.get('/api/overview', async (req, res) => {
  try {
    const sessionCol = db.collection('recyclingsessions');
    const userCol = db.collection('userprofile');
    const feedbackCol = db.collection('feedbacks');
    const binCol = db.collection('binfullnotifications');
    const redemptionCol = db.collection('redemptions');

    const totalSessions = await sessionCol.countDocuments();
    let totalUsers = await userCol.countDocuments();
    if (totalUsers === 0) {
      totalUsers = await db.collection('users').countDocuments();
    }
    const totalFeedbacks = await feedbackCol.countDocuments();
    const totalBinAlerts = await binCol.countDocuments();
    const totalRedemptions = await redemptionCol.countDocuments();


    // Aggregates for bottles, cups, points
    const aggregateTotals = await sessionCol.aggregate([
      {
        $group: {
          _id: null,
          totalBottles: { $sum: '$bottles' },
          totalCups: { $sum: '$cups' },
          totalPoints: { $sum: '$points' }
        }
      }
    ]).toArray();

    const totals = aggregateTotals[0] || { totalBottles: 0, totalCups: 0, totalPoints: 0 };

    // Recent 5 sessions
    const recentSessions = await sessionCol
      .find({})
      .sort({ recycledAt: -1, _id: -1 })
      .limit(5)
      .toArray();

    // Recent 5 alerts
    const recentAlerts = await binCol
      .find({})
      .sort({ occurredAt: -1, _id: -1 })
      .limit(5)
      .toArray();

    res.json({
      totalSessions,
      totalUsers,
      totalFeedbacks,
      totalBinAlerts,
      totalBottles: totals.totalBottles,
      totalCups: totals.totalCups,
      totalPoints: totals.totalPoints,
      totalItemsRecycled: totals.totalBottles + totals.totalCups,
      recentSessions,
      recentAlerts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List collections
app.get('/api/collections', async (req, res) => {
  try {
    const collections = await db.listCollections().toArray();
    const details = await Promise.all(
      collections.map(async (c) => {
        const count = await db.collection(c.name).countDocuments();
        return { name: c.name, count };
      })
    );
    res.json(details);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dynamic Collection Explorer Endpoint
app.get('/api/collections/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const page = parseInt(req.query.page || '1', 10);
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || '_id';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const collection = db.collection(name);
    
    // Build search filter query
    let query = {};
    if (search.trim()) {
      const s = search.trim();
      const regex = new RegExp(s, 'i');
      
      // Determine collection specific fields or generic text search
      if (name === 'recyclingsessions') {
        query = {
          $or: [
            { phoneNumber: regex },
            { userName: regex },
            { machineId: regex }
          ]
        };
      } else if (name === 'users') {
        query = {
          $or: [
            { username: regex },
            { phoneNumber: regex },
            { gender: regex }
          ]
        };
      } else if (name === 'feedbacks') {
        query = {
          $or: [
            { phoneNumber: regex },
            { feedback: regex },
            { machineId: regex }
          ]
        };
      } else if (name === 'binfullnotifications') {
        query = {
          $or: [
            { machineId: regex },
            { binType: regex }
          ]
        };
      } else {
        query = {
          $or: [
            { _id: s.length === 24 ? new ObjectId(s) : undefined },
            { username: regex },
            { phoneNumber: regex },
            { name: regex }
          ].filter(Boolean)
        };
      }
    }

    const totalDocs = await collection.countDocuments(query);
    const totalPages = Math.ceil(totalDocs / limit) || 1;

    const documents = await collection
      .find(query)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    res.json({
      collectionName: name,
      page,
      limit,
      totalDocs,
      totalPages,
      sortBy,
      sortOrder: sortOrder === 1 ? 'asc' : 'desc',
      documents
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Analytics Trends Endpoint
app.get('/api/analytics/trends', async (req, res) => {
  try {
    const sessionCol = db.collection('recyclingsessions');

    // Aggregate sessions by day
    const trends = await sessionCol.aggregate([
      {
        $project: {
          bottles: 1,
          cups: 1,
          points: 1,
          dateStr: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: {
                $cond: {
                  if: { $eq: [{ $type: '$recycledAt' }, 'date'] },
                  then: '$recycledAt',
                  else: {
                    $cond: {
                      if: { $ne: ['$recycledAt', null] },
                      then: { $toDate: '$recycledAt' },
                      else: { $toDate: '$_id' }
                    }
                  }
                }
              }
            }
          }

        }
      },
      {
        $group: {
          _id: '$dateStr',
          bottles: { $sum: '$bottles' },
          cups: { $sum: '$cups' },
          points: { $sum: '$points' },
          sessions: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray();

    res.json(trends);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Leaderboard Endpoint
app.get('/api/analytics/leaderboard', async (req, res) => {
  try {
    const sessionCol = db.collection('recyclingsessions');
    const leaderboard = await sessionCol.aggregate([
      {
        $group: {
          _id: { $ifNull: ['$phoneNumber', 'Anonymous'] },
          userName: { $first: '$userName' },
          totalBottles: { $sum: '$bottles' },
          totalCups: { $sum: '$cups' },
          totalPoints: { $sum: '$points' },
          totalSessions: { $sum: 1 }
        }
      },
      {
        $addFields: {
          totalItems: { $add: ['$totalBottles', '$totalCups'] }
        }
      },
      { $sort: { totalPoints: -1 } },
      { $limit: 15 }
    ]).toArray();

    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Machine Breakdown Endpoint
app.get('/api/analytics/machines', async (req, res) => {
  try {
    const sessionCol = db.collection('recyclingsessions');
    const binCol = db.collection('binfullnotifications');

    const machineSessions = await sessionCol.aggregate([
      {
        $group: {
          _id: { $ifNull: ['$machineId', 'Default Machine'] },
          totalBottles: { $sum: '$bottles' },
          totalCups: { $sum: '$cups' },
          totalPoints: { $sum: '$points' },
          sessionCount: { $sum: 1 },
          lastActive: { $max: '$recycledAt' }
        }
      },
      { $sort: { sessionCount: -1 } }
    ]).toArray();

    const machineAlerts = await binCol.aggregate([
      {
        $group: {
          _id: '$machineId',
          alertCount: { $sum: 1 },
          lastAlert: { $max: '$occurredAt' }
        }
      }
    ]).toArray();

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
// DATABASE BACKUP & RESTORE UTILITY ENDPOINTS
// ==========================================

// Create Full Database Backup Snapshot
app.get('/api/db/backup', async (req, res) => {

  try {
    const collections = await db.listCollections().toArray();
    const backupData = {
      database: DB_NAME,
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
    const filename = `${DB_NAME}_backup_${timestamp}.json`;
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
      collectionsStats
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

// Restore Database from Uploaded JSON / Selected Snapshot
app.post('/api/db/restore', async (req, res) => {
  try {
    const { backupData, mode = 'replace' } = req.body;

    if (!backupData || !backupData.collections) {
      return res.status(400).json({ error: 'Invalid backup format. Missing "collections" object.' });
    }

    const restoredCollections = [];
    let totalRestoredDocs = 0;

    for (const [colName, docs] of Object.entries(backupData.collections)) {
      if (!Array.isArray(docs)) continue;
      const collection = db.collection(colName);

      if (mode === 'replace') {
        await collection.deleteMany({});
      }

      if (docs.length > 0) {
        // Convert string _id back to ObjectId if applicable
        const preparedDocs = docs.map(d => {
          const docCopy = { ...d };
          if (docCopy._id && typeof docCopy._id === 'string' && docCopy._id.length === 24) {
            try {
              docCopy._id = new ObjectId(docCopy._id);
            } catch (e) {}
          }
          return docCopy;
        });

        await collection.insertMany(preparedDocs);
      }

      restoredCollections.push({ name: colName, count: docs.length });
      totalRestoredDocs += docs.length;
    }

    res.json({
      success: true,
      message: `Successfully restored ${totalRestoredDocs} documents across ${restoredCollections.length} collections.`,
      restoredCollections,
      totalRestoredDocs
    });
  } catch (err) {
    console.error('[Restore Error]', err);
    res.status(500).json({ error: 'Failed to restore database', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[RVM Master Dashboard Backend] Running on http://localhost:${PORT}`);
});

