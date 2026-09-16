const pg = require('pg');
require('dotenv').config();

const pool = new pg.Pool({
  host: process.env.PG_HOST || '127.0.0.1',
  port: parseInt(process.env.PG_PORT || '5432'),
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'Admin786',
  database: process.env.PG_DATABASE || 'rvmpg'
});

async function test() {
  try {
    const dbs = await pool.query("SELECT datname FROM pg_database WHERE datistemplate = false");
    console.log('Postgres databases:', dbs.rows.map(r => r.datname));

    const tables = await pool.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ('information_schema', 'pg_catalog')");
    console.log('Tables in rvmpg:', tables.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}
test();
