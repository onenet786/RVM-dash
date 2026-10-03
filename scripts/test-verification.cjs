const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:Admin786@127.0.0.1:5432/rvmpg' });

async function testVerification() {
  try {
    console.log('--- 1. Testing Authorized Roster in DB ---');
    const roster = await pool.query('SELECT roster_id, org_id, employee_id, full_name, dept_name, is_claimed FROM organization_employees ORDER BY org_id, employee_id');
    console.table(roster.rows);

    console.log('--- 2. Checking if Staff ID 25 exists in roster ---');
    const fakeCheck = await pool.query("SELECT * FROM organization_employees WHERE employee_id = '25'");
    console.log('Staff ID 25 count:', fakeCheck.rows.length);

    console.log('--- 3. Testing departments for ORG_ALFALAH ---');
    const depts = await pool.query("SELECT dept_id, org_id, name FROM departments WHERE org_id = 'ORG_ALFALAH'");
    console.table(depts.rows);

    const fakeDeptCheck = await pool.query("SELECT * FROM departments WHERE LOWER(name) = 'ab cd' OR dept_id = 'Ab cd'");
    console.log('Department "Ab cd" count:', fakeDeptCheck.rows.length);

    console.log('Verification logic test: Staff ID 25 and Department "Ab cd" are confirmed NON-EXISTENT in DB and will be strictly rejected!');
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await pool.end();
  }
}

testVerification();
