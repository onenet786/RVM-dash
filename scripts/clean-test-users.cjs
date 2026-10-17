const { Pool } = require('pg');
const pool = new Pool({ connectionString: (process.env.DATABASE_URL || `postgresql://postgres:${encodeURIComponent(process.env.PG_PASSWORD || '')}@127.0.0.1:5432/rvmpg`) });

async function clean() {
  try {
    const res = await pool.query("UPDATE users SET user_type = 'CITIZEN', org_id = NULL, dept_id = NULL, employee_id = NULL WHERE employee_id = '25' OR user_id LIKE 'test_%'");
    console.log('Cleaned leftover test user rows:', res.rowCount);
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
clean();
