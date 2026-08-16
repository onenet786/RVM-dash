import pg from 'pg';
import { MongoClient } from 'mongodb';

const activePgConfig = {
  host: process.env.PG_HOST || '127.0.0.1',
  port: parseInt(process.env.PG_PORT || '5432'),
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'Admin786',
  database: process.env.PG_DATABASE || 'rvmpg'
};

const currentUri = process.env.MONGODB_URI || 'mongodb+srv://aaqueelphotos_db_user:Z8NPUThldyeypEEQ@cluster0.ktted0m.mongodb.net/ONS-RVM?retryWrites=true&w=majority';

async function checkDbs() {
  console.log('=== CHECKING POSTGRESQL "rvmpg" ===');
  const pool = new pg.Pool(activePgConfig);
  try {
    const pgRes = await pool.query('SELECT * FROM machines;');
    console.log('Postgres machines table rows count:', pgRes.rows.length);
    console.log('Postgres machines rows:', pgRes.rows);
  } catch (err) {
    console.log('Postgres query error/notice:', err.message);
  } finally {
    await pool.end();
  }

  console.log('\n=== CHECKING MONGODB "ONS-RVM" ===');
  const client = new MongoClient(currentUri);
  try {
    await client.connect();
    const db = client.db('ONS-RVM');
    const mongoDocs = await db.collection('machines').find().toArray();
    console.log('MongoDB machines collection docs count:', mongoDocs.length);
    console.log('MongoDB machines docs:', mongoDocs);
  } catch (err) {
    console.log('MongoDB query error/notice:', err.message);
  } finally {
    await client.close();
  }
}

checkDbs();
