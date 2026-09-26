import pg from 'pg';

async function migrate() {
  const pool = new pg.Pool({
    host: '127.0.0.1',
    port: 5432,
    user: 'postgres',
    password: process.env.PG_PASSWORD || 'Admin786',
    database: 'rvmpg'
  });

  console.log('Running Enterprise & Machine Scoping Schema Migration...');

  await pool.query(`
    -- 1. Ensure machines table has latitude, longitude, and client tracking
    ALTER TABLE machines ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7);
    ALTER TABLE machines ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7);
    ALTER TABLE machines ADD COLUMN IF NOT EXISTS client_id VARCHAR(50) DEFAULT 'ISP_MASTER';
    ALTER TABLE machines ADD COLUMN IF NOT EXISTS client_name VARCHAR(100) DEFAULT 'ISP Environmental Master (All Sites)';

    -- 2. Ensure organizations table has personalized dashboard and machine fields
    ALTER TABLE organizations ADD COLUMN IF NOT EXISTS theme VARCHAR(50) DEFAULT 'isp-portal';
    ALTER TABLE organizations ADD COLUMN IF NOT EXISTS welcome_msg TEXT;
    ALTER TABLE organizations ADD COLUMN IF NOT EXISTS dashboard_title VARCHAR(255);
    ALTER TABLE organizations ADD COLUMN IF NOT EXISTS primary_color VARCHAR(50) DEFAULT '#0B5D3B';
    ALTER TABLE organizations ADD COLUMN IF NOT EXISTS assigned_machines TEXT[] DEFAULT '{}';

    -- 3. Ensure kiosk_org_bindings junction table exists
    CREATE TABLE IF NOT EXISTS kiosk_org_bindings (
      machine_id VARCHAR(100) PRIMARY KEY,
      org_id VARCHAR(100) NOT NULL,
      location_note VARCHAR(255),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    -- 4. Seed realistic machines
    INSERT INTO machines (machine_id, name, location, machine_type, client_id, client_name, status, latitude, longitude)
    VALUES 
      ('PECO-LHR-01', 'PecoDrop Smart Kiosk - Lahore Campus', 'Engro Lahore Commercial Centre, Gulberg III', 'PECODROP', 'ORG_ENGRO', 'Engro Corporation', 'ONLINE', 31.5204, 74.3587),
      ('PECO-KHI-01', 'PecoDrop Smart Kiosk - Karachi HQ', 'Bank Alfalah Head Office Tower, I.I. Chundrigar Rd', 'PECODROP', 'ORG_ALFALAH', 'Bank Alfalah Limited', 'ONLINE', 24.8607, 67.0011),
      ('RVM-LHR-01', 'Smart RVM Deposit Station - Lahore', 'UCP Campus Student Centre, Johar Town', 'RVM_NEW', 'ORG_UCP', 'University of Central Punjab', 'ONLINE', 31.4697, 74.2728),
      ('RVM-ISB-01', 'Smart RVM Reverse Kiosk - Islamabad', 'Metro Cash & Carry, I-11/4 Islamabad', 'RVM_NEW', 'ORG_METRO', 'Metro Cash & Carry', 'ONLINE', 33.6515, 73.0232)
    ON CONFLICT (machine_id) DO UPDATE SET
      name = EXCLUDED.name,
      location = EXCLUDED.location,
      machine_type = EXCLUDED.machine_type,
      latitude = EXCLUDED.latitude,
      longitude = EXCLUDED.longitude,
      client_id = EXCLUDED.client_id,
      client_name = EXCLUDED.client_name;

    -- 5. Seed initial kiosk_org_bindings
    INSERT INTO kiosk_org_bindings (machine_id, org_id, location_note)
    VALUES
      ('PECO-01', 'ORG_METRO', 'Metro Mall RWP - Ground Floor'),
      ('PECO-02', 'ORG_METRO', 'Metro Mall RWP - Food Court 3F'),
      ('PECO-LHR-01', 'ORG_ENGRO', 'Engro Lahore Commercial Centre'),
      ('PECO-KHI-01', 'ORG_ALFALAH', 'Bank Alfalah Head Office Tower'),
      ('RVM-LHR-01', 'ORG_UCP', 'UCP Campus Student Centre'),
      ('RVM-ISB-01', 'ORG_METRO', 'Metro Cash & Carry Islamabad')
    ON CONFLICT (machine_id) DO UPDATE SET
      org_id = EXCLUDED.org_id,
      location_note = EXCLUDED.location_note;

    -- 6. Update organizations with initial dashboard personalization
    UPDATE organizations SET
      dashboard_title = 'Bank Alfalah Green Corporate Portal',
      welcome_msg = 'Welcome to Bank Alfalah Sustainability & ESG Rewards Kiosks. Real-time campus recycling tracking.',
      theme = 'isp-portal',
      primary_color = '#DC2626',
      assigned_machines = ARRAY['PECO-KHI-01']
    WHERE org_id = 'ORG_ALFALAH';

    UPDATE organizations SET
      dashboard_title = 'Engro CSR & Environmental Sustainability Portal',
      welcome_msg = 'Welcome Engro Sustainability Officers. Managing corporate PecoDrop and RVM assets.',
      theme = 'isp-portal',
      primary_color = '#059669',
      assigned_machines = ARRAY['PECO-LHR-01']
    WHERE org_id = 'ORG_ENGRO';

    UPDATE organizations SET
      dashboard_title = 'Metro Cash & Carry Smart Recycling Dashboard',
      welcome_msg = 'Welcome Metro Mall Facility Managers. Monitoring consumer and staff recycling footprint.',
      theme = 'isp-portal',
      primary_color = '#D97706',
      assigned_machines = ARRAY['PECO-01', 'PECO-02', 'RVM-ISB-01']
    WHERE org_id = 'ORG_METRO';

    UPDATE organizations SET
      dashboard_title = 'UCP Green Campus Initiative Dashboard',
      welcome_msg = 'Welcome University of Central Punjab Green Society. Campus recycling metrics & student engagement.',
      theme = 'isp-portal',
      primary_color = '#2563EB',
      assigned_machines = ARRAY['RVM-LHR-01']
    WHERE org_id = 'ORG_UCP';
  `);

  console.log('Enterprise & Machine Scoping Schema Migration successfully completed!');
  await pool.end();
}

migrate().catch(console.error);
