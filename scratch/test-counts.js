import pg from 'pg';

async function main() {
  const pool = new pg.Pool({
    host: '127.0.0.1',
    port: 5432,
    user: 'postgres',
    password: process.env.PG_PASSWORD || 'Admin786',
    database: 'rvmpg'
  });

  const tRes = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
  for (const row of tRes.rows) {
    try {
      const cRes = await pool.query(`SELECT count(*) FROM "${row.table_name}"`);
      console.log(`${row.table_name}: ${cRes.rows[0].count}`);
    } catch (e) {
      console.log(`${row.table_name}: error ${e.message}`);
    }
  }
  await pool.end();
}

main().catch(console.error);
