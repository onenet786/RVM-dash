import pg from 'pg';

const activePgConfig = {
  host: process.env.PG_HOST || '127.0.0.1',
  port: parseInt(process.env.PG_PORT || '5432'),
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'Admin786',
  database: process.env.PG_DATABASE || 'rvmpg'
};

async function testFix() {
  const pool = new pg.Pool(activePgConfig);
  try {
    console.log('Ensuring columns on machines table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS machines (
        machine_id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255),
        location VARCHAR(255),
        status VARCHAR(50) DEFAULT 'ONLINE',
        last_ping_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`ALTER TABLE machines ADD COLUMN IF NOT EXISTS name VARCHAR(255);`);
    await pool.query(`ALTER TABLE machines ADD COLUMN IF NOT EXISTS location VARCHAR(255);`);
    await pool.query(`ALTER TABLE machines ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ONLINE';`);
    await pool.query(`ALTER TABLE machines ADD COLUMN IF NOT EXISTS last_ping_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);

    console.log('Updating RVM-001 with test values...');
    await pool.query(`
      INSERT INTO machines (machine_id, name, location, status, last_ping_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (machine_id)
      DO UPDATE SET name = EXCLUDED.name, location = EXCLUDED.location, status = EXCLUDED.status, last_ping_at = NOW()
    `, ['RVM-001', 'ISP Main Campus Entrance Unit #1', 'Sector H-8/4, Islamabad', 'ONLINE']);

    const res = await pool.query('SELECT * FROM machines WHERE machine_id = $1;', ['RVM-001']);
    console.log('QueryResult for RVM-001:', res.rows[0]);
  } catch (err) {
    console.error('Postgres error:', err);
  } finally {
    await pool.end();
  }
}

testFix();
