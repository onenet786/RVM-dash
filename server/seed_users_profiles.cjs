const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:Admin786@127.0.0.1:5432/rvmpg' });

async function run() {
  const users = [
    { id: 'engro_emp_01', username: 'engro_emp_01', fullName: 'Tariq Mehmood', email: 'tariq.emp01@engro.com', mobile: '0300-4146663', userType: 'ENTERPRISE', orgId: 'ORG_ENGRO' },
    { id: 'engro_emp_02', username: 'engro_emp_02', fullName: 'Zainab Bibi', email: 'zainab.emp02@engro.com', mobile: '0321-9876543', userType: 'ENTERPRISE', orgId: 'ORG_ENGRO' },
    { id: 'metro_shopper_01', username: 'metro_shopper_01', fullName: 'Kamran Akmal', email: 'kamran.m01@metro.pk', mobile: '0300-9482110', userType: 'ENTERPRISE', orgId: 'ORG_METRO' },
    { id: 'metro_shopper_02', username: 'metro_shopper_02', fullName: 'Farhan Saeed', email: 'farhan.m02@metro.pk', mobile: '0333-5566778', userType: 'ENTERPRISE', orgId: 'ORG_METRO' },
    { id: 'ucp_student_01', username: 'ucp_student_01', fullName: 'Hamza Shafiq', email: 'hamza.std01@ucp.edu.pk', mobile: '0345-1234567', userType: 'CITIZEN', orgId: 'ORG_UCP' },
    { id: 'alfalah_emp_01', username: 'alfalah_emp_01', fullName: 'Kashif Iqbal', email: 'kashif.emp01@bankalfalah.com', mobile: '0300-8899001', userType: 'ENTERPRISE', orgId: 'ORG_ALFALAH' },
    { id: 'alfalah_emp_02', username: 'alfalah_emp_02', fullName: 'Ahmed Raza', email: 'ahmed.emp02@bankalfalah.com', mobile: '0312-3344556', userType: 'ENTERPRISE', orgId: 'ORG_ALFALAH' },
    { id: 'isb_shopper_01', username: 'isb_shopper_01', fullName: 'Usman Ghani', email: 'usman.isb01@gmail.com', mobile: '0314-7788990', userType: 'CITIZEN', orgId: null },
    { id: '03074146663', username: 'bilal_champion', fullName: 'Bilal Aqueel', email: 'bilal.champion@ispenv.com', mobile: '0307-4146663', userType: 'CITIZEN', orgId: null },
    { id: '03009482110', username: 'rashid_silver', fullName: 'Rashid Khan', email: 'rashid.silver@metro.pk', mobile: '0300-9482110', userType: 'ENTERPRISE', orgId: 'ORG_METRO' },
    { id: '03234350805', username: 'hassan_bronze', fullName: 'Muhammad Hassan', email: 'hassan.bronze@ucp.edu.pk', mobile: '0323-4350805', userType: 'CITIZEN', orgId: 'ORG_UCP' }
  ];

  for (const u of users) {
    await pool.query(`
      INSERT INTO users (user_id, username, full_name, email, mobile, user_type, org_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id) DO UPDATE SET 
        full_name = EXCLUDED.full_name,
        mobile = EXCLUDED.mobile,
        user_type = EXCLUDED.user_type,
        org_id = EXCLUDED.org_id;
    `, [u.id, u.username, u.fullName, u.email, u.mobile, u.userType, u.orgId]);
  }

  console.log('Successfully registered user profiles in PostgreSQL!');
  await pool.end();
}

run().catch(e => { console.error(e); process.exit(1); });
