import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

export async function runMigrations() {
  const pool = new pg.Pool({
    host: process.env.PG_HOST || '127.0.0.1',
    port: parseInt(process.env.PG_PORT || '5432'),
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || 'Admin786',
    database: process.env.PG_DATABASE || 'rvmpg'
  });

  try {
    console.log('[Migration] Verifying and updating database schema...');

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
        dashboard_title = COALESCE(dashboard_title, 'Bank Alfalah Green Corporate Portal'),
        welcome_msg = COALESCE(welcome_msg, 'Welcome to Bank Alfalah Sustainability & ESG Rewards Kiosks. Real-time campus recycling tracking.'),
        theme = COALESCE(theme, 'isp-portal'),
        primary_color = COALESCE(primary_color, '#DC2626'),
        assigned_machines = ARRAY['PECO-KHI-01']
      WHERE org_id = 'ORG_ALFALAH';

      UPDATE organizations SET
        dashboard_title = COALESCE(dashboard_title, 'Engro CSR & Environmental Sustainability Portal'),
        welcome_msg = COALESCE(welcome_msg, 'Welcome Engro Sustainability Officers. Managing corporate PecoDrop and RVM assets.'),
        theme = COALESCE(theme, 'isp-portal'),
        primary_color = COALESCE(primary_color, '#059669'),
        assigned_machines = ARRAY['PECO-LHR-01']
      WHERE org_id = 'ORG_ENGRO';

      UPDATE organizations SET
        dashboard_title = COALESCE(dashboard_title, 'Metro Cash & Carry Smart Recycling Dashboard'),
        welcome_msg = COALESCE(welcome_msg, 'Welcome Metro Mall Facility Managers. Monitoring consumer and staff recycling footprint.'),
        theme = COALESCE(theme, 'isp-portal'),
        primary_color = COALESCE(primary_color, '#D97706'),
        assigned_machines = ARRAY['PECO-01', 'PECO-02', 'RVM-ISB-01']
      WHERE org_id = 'ORG_METRO';

      UPDATE organizations SET
        dashboard_title = COALESCE(dashboard_title, 'UCP Green Campus Initiative Dashboard'),
        welcome_msg = COALESCE(welcome_msg, 'Welcome University of Central Punjab Green Society. Campus recycling metrics & student engagement.'),
        theme = COALESCE(theme, 'isp-portal'),
        primary_color = COALESCE(primary_color, '#2563EB'),
        assigned_machines = ARRAY['RVM-LHR-01']
      WHERE org_id = 'ORG_UCP';
      
      -- 7. High-Performance PostgreSQL Indexes
      CREATE INDEX IF NOT EXISTS idx_recycling_sessions_created_at ON recycling_sessions (created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_recycling_sessions_machine_id ON recycling_sessions (machine_id);
      CREATE INDEX IF NOT EXISTS idx_recycling_sessions_user_id ON recycling_sessions (user_id);
      CREATE INDEX IF NOT EXISTS idx_machines_client_id ON machines (client_id);
      CREATE INDEX IF NOT EXISTS idx_machines_status ON machines (status);
      CREATE INDEX IF NOT EXISTS idx_kiosk_bindings_org ON kiosk_org_bindings (org_id);
      CREATE INDEX IF NOT EXISTS idx_kiosk_bindings_machine ON kiosk_org_bindings (machine_id);
      CREATE INDEX IF NOT EXISTS idx_organizations_domain ON organizations (domain);
    `);

    console.log('[Migration] Database schema, indexes, and seeding verified successfully.');
  } catch (err) {
    console.error('[Migration Error]', err.message);
  } finally {
    await pool.end();
  }
}

if (process.argv[1] && process.argv[1].endsWith('migrate.js')) {
  runMigrations();
}
