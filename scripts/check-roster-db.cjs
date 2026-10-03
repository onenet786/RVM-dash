const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:Admin786@127.0.0.1:5432/rvmpg' });

async function check() {
  try {
    const users = await pool.query("SELECT user_id, full_name, email, mobile, user_type, org_id, dept_id, employee_id FROM users WHERE org_id IS NOT NULL");
    console.log('Users with org_id count:', users.rows.length);
    console.log('Users with org_id:', users.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

check();
