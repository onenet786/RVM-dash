import pg from 'pg';

async function seedSessions() {
  const pool = new pg.Pool({
    host: '127.0.0.1',
    port: 5432,
    user: 'postgres',
    password: process.env.PG_PASSWORD || 'Admin786',
    database: 'rvmpg'
  });

  console.log('Seeding realistic recycling sessions for fleet machines...');

  // Check if sessions exist
  const existingRes = await pool.query('SELECT count(*) FROM recycling_sessions');
  const count = parseInt(existingRes.rows[0].count);
  console.log(`Current session count in recycling_sessions: ${count}`);

  if (count < 20) {
    const machines = [
      { id: 'PECO-LHR-01', user: 'engro_emp_01', type: 'PECODROP', client: 'ORG_ENGRO' },
      { id: 'PECO-LHR-01', user: 'engro_emp_02', type: 'PECODROP', client: 'ORG_ENGRO' },
      { id: 'PECO-KHI-01', user: 'alfalah_emp_01', type: 'PECODROP', client: 'ORG_ALFALAH' },
      { id: 'PECO-KHI-01', user: 'alfalah_emp_02', type: 'PECODROP', client: 'ORG_ALFALAH' },
      { id: 'PECO-01', user: 'metro_shopper_01', type: 'PECODROP', client: 'ORG_METRO' },
      { id: 'PECO-02', user: 'metro_shopper_02', type: 'PECODROP', client: 'ORG_METRO' },
      { id: 'RVM-LHR-01', user: 'ucp_student_01', type: 'RVM_NEW', client: 'ORG_UCP' },
      { id: 'RVM-ISB-01', user: 'isb_shopper_01', type: 'RVM_NEW', client: 'ORG_METRO' }
    ];

    for (let i = 0; i < 40; i++) {
      const m = machines[i % machines.length];
      const isPeco = m.type === 'PECODROP';
      const plastic = Math.floor(Math.random() * 8) + 1;
      const cans = Math.floor(Math.random() * 5);
      const paperGrams = isPeco ? (Math.floor(Math.random() * 800) + 150) : 0;
      const tetraGrams = isPeco ? (Math.floor(Math.random() * 200)) : 0;
      const points = (plastic * 10) + (cans * 20) + Math.round((paperGrams / 1000) * 15);
      const weightKg = parseFloat(((plastic * 0.025) + (cans * 0.015) + (paperGrams / 1000) + (tetraGrams / 1000)).toFixed(3));
      const co2 = parseFloat((weightKg * 1.5).toFixed(3));
      const sessionId = `SES_${m.id}_${Date.now()}_${i}`;

      await pool.query(`
        INSERT INTO recycling_sessions (
          session_id, machine_id, user_id, plastic_count, aluminium_count,
          paper_cardboard_count, paper_weight_grams, tetrapak_weight_grams,
          points_earned, total_weight_kg, co2_avoided_kg, session_status, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'completed', NOW() - ($12 || ' hours')::INTERVAL
        ) ON CONFLICT (session_id) DO NOTHING;
      `, [sessionId, m.id, m.user, plastic, cans, paperGrams > 0 ? 1 : 0, paperGrams, tetraGrams, points, weightKg, co2, (i * 2).toString()]);
    }
    console.log('Seeded 40 realistic sessions across Lahore, Karachi, Islamabad machines.');
  }

  await pool.end();
}

seedSessions().catch(console.error);
