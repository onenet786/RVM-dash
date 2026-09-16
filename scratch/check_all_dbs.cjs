const pg = require('pg');

async function check(dbName) {
  const pool = new pg.Pool({
    host: '127.0.0.1',
    port: 5432,
    user: 'postgres',
    password: 'Admin786',
    database: dbName
  });
  try {
    const res = await pool.query("SELECT schemaname, tablename FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema')");
    console.log(`Tables in ${dbName}:`, res.rows);
  } catch (err) {
    console.log(`Error in ${dbName}:`, err.message);
  } finally {
    await pool.end();
  }
}

async function run() {
  await check('rvmpg');
  await check('postgres');
  await check('hr_payroll');
}
run();
