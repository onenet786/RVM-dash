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
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS company_code VARCHAR(100);

      UPDATE organizations SET company_code = 'ALFALAH' WHERE org_id = 'ORG_ALFALAH' AND (company_code IS NULL OR company_code = '');
      UPDATE organizations SET company_code = 'ENGRO' WHERE org_id = 'ORG_ENGRO' AND (company_code IS NULL OR company_code = '');
      UPDATE organizations SET company_code = 'UCP' WHERE org_id = 'ORG_UCP' AND (company_code IS NULL OR company_code = '');
      UPDATE organizations SET company_code = 'METRO' WHERE org_id = 'ORG_METRO' AND (company_code IS NULL OR company_code = '');

      -- 2b. Ensure authoritative organization_employees whitelist roster exists
      CREATE TABLE IF NOT EXISTS organization_employees (
        roster_id SERIAL PRIMARY KEY,
        org_id VARCHAR(100) NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
        employee_id VARCHAR(100) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        official_email VARCHAR(255),
        mobile VARCHAR(50),
        dept_id VARCHAR(100) REFERENCES departments(dept_id) ON DELETE SET NULL,
        dept_name VARCHAR(255),
        is_claimed BOOLEAN DEFAULT FALSE,
        claimed_by_user_id VARCHAR(255),
        claimed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(org_id, employee_id)
      );

      CREATE INDEX IF NOT EXISTS idx_org_emp_lookup ON organization_employees(org_id, employee_id);
      CREATE INDEX IF NOT EXISTS idx_org_emp_email ON organization_employees(org_id, LOWER(official_email));
      CREATE INDEX IF NOT EXISTS idx_org_emp_claimed ON organization_employees(claimed_by_user_id);

      -- Seed sample employees if table is empty
      INSERT INTO organization_employees (org_id, employee_id, full_name, official_email, mobile, dept_id, dept_name)
      VALUES
        ('ORG_ALFALAH', 'BA-1001', 'Ahmed Khan', 'ahmed.khan@bankalfalah.com', '03001234561', 'DEPT_BA_OPS', 'Operations & Clearing'),
        ('ORG_ALFALAH', 'BA-1002', 'Fatima Noor', 'fatima.noor@bankalfalah.com', '03001234562', 'DEPT_BA_FIN', 'Finance & Accounts'),
        ('ORG_ALFALAH', 'BA-1003', 'Bilal Tariq', 'bilal.tariq@bankalfalah.com', '03001234563', 'DEPT_BA_HR', 'Human Resources'),
        ('ORG_ALFALAH', 'BA-1004', 'Zainab Ali', 'zainab.ali@bankalfalah.com', '03001234564', 'DEPT_BA_IT', 'Information Technology'),
        ('ORG_ALFALAH', 'BA-1005', 'Muhammad Usman', 'usman.m@bankalfalah.com', '03001234565', 'DEPT_BA_OPS', 'Operations & Clearing'),
        ('ORG_ENGRO', 'ENG-201', 'Kamran Malik', 'k.malik@engro.com', '03211234561', 'DEPT_ENG_SUST', 'Sustainability & ESG'),
        ('ORG_ENGRO', 'ENG-202', 'Sara Farooq', 's.farooq@engro.com', '03211234562', 'DEPT_ENG_PETRO', 'Petrochemicals Division'),
        ('ORG_ENGRO', 'ENG-203', 'Usman Ghani', 'u.ghani@engro.com', '03211234563', 'DEPT_ENG_CORP', 'Corporate Communications'),
        ('ORG_UCP', 'UCP-501', 'Dr. Hamza Raza', 'hamza.raza@ucp.edu.pk', '03331234561', 'DEPT_UCP_CS', 'Computer Science Dept'),
        ('ORG_UCP', 'UCP-502', 'Ayesha Siddiqui', 'ayesha.s@ucp.edu.pk', '03331234562', 'DEPT_UCP_ENGG', 'Faculty of Engineering'),
        ('ORG_UCP', 'UCP-503', 'Hassan Ali', 'hassan.ali@ucp.edu.pk', '03331234563', 'DEPT_UCP_ADMIN', 'University Administration'),
        ('ORG_METRO', 'MET-301', 'Tariq Mehmood', 'tariq.m@metro.pk', '03451234561', 'DEPT_METRO_OPS', 'Store Operations'),
        ('ORG_METRO', 'MET-302', 'Sadia Bashir', 'sadia.b@metro.pk', '03451234562', 'DEPT_METRO_LOG', 'Supply Chain & Logistics')
      ON CONFLICT (org_id, employee_id) DO NOTHING;

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

      -- 8. Digital Signage Columns & Campaign Seeding
      ALTER TABLE machine_advertisements ADD COLUMN IF NOT EXISTS category_badge VARCHAR(100) DEFAULT 'Public RVM';
      ALTER TABLE machine_advertisements ADD COLUMN IF NOT EXISTS aspect_ratio VARCHAR(100) DEFAULT '16:9 Landscape';
      ALTER TABLE machine_advertisements ADD COLUMN IF NOT EXISTS category_theme VARCHAR(50) DEFAULT 'emerald';
      ALTER TABLE machine_advertisements ADD COLUMN IF NOT EXISTS location VARCHAR(255) DEFAULT 'All Locations (Nationwide)';
      ALTER TABLE machine_advertisements ADD COLUMN IF NOT EXISTS scope VARCHAR(100) DEFAULT 'ALL';
      ALTER TABLE machine_advertisements ADD COLUMN IF NOT EXISTS destinations JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE machine_advertisements ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
      ALTER TABLE machine_advertisements ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Active Loop';

      INSERT INTO machine_advertisements (
        title, video_url, file_name, file_size, duration_seconds, is_active, display_order,
        category_badge, aspect_ratio, category_theme, location, scope, destinations, thumbnail_url, status
      )
      SELECT 
        'PECO Corporate Green Journey',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        'peco_corporate_loop_2026.mp4',
        14889779,
        30,
        true,
        1,
        'PecoDrop Exclusive',
        '16:9 Landscape',
        'purple',
        'Metro Mall',
        'PECODROP',
        '[{"id":"PECO-RWP","label":"PECO-RWP (Metro Mall)","type":"peco"},{"id":"PECO-02","label":"PECO-02 (Corporate HQ)","type":"peco"}]'::jsonb,
        '/uploads/advertisements/ad_peco_green_journey.jpg',
        'Active Loop'
      WHERE NOT EXISTS (SELECT 1 FROM machine_advertisements WHERE title = 'PECO Corporate Green Journey');

      INSERT INTO machine_advertisements (
        title, video_url, file_name, file_size, duration_seconds, is_active, display_order,
        category_badge, aspect_ratio, category_theme, location, scope, destinations, thumbnail_url, status
      )
      SELECT 
        'Pepsi Recycle & Earn PKR 200',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        'pepsi_public_ad_1080p.mp4',
        10276044,
        15,
        true,
        2,
        'Public RVM',
        '16:9 Header Display',
        'emerald',
        'Rawalpindi North Terminal',
        'RVM_NEW',
        '[{"id":"CENTRAL-METRO","label":"Central Metro Station","type":"rvm"},{"id":"RWP-NORTH","label":"Rawalpindi North Terminal","type":"rvm"},{"id":"UCP-CAMPUS","label":"UCP Green Campus","type":"rvm"}]'::jsonb,
        '/uploads/advertisements/ad_pepsi_recycle_earn.jpg',
        'Active Loop'
      WHERE NOT EXISTS (SELECT 1 FROM machine_advertisements WHERE title = 'Pepsi Recycle & Earn PKR 200');

      INSERT INTO machine_advertisements (
        title, video_url, file_name, file_size, duration_seconds, is_active, display_order,
        category_badge, aspect_ratio, category_theme, location, scope, destinations, thumbnail_url, status
      )
      SELECT 
        'University Plastic Bottle Drive',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        'ucp_campus_drive_spring26.mp4',
        25375539,
        45,
        true,
        3,
        'Campus Specific',
        'Single Machine Unit',
        'cyan',
        'UCP Campus',
        'RVM_NEW',
        '[{"id":"UCP-RVM","label":"UCP-RVM (Lahore Campus)","type":"campus"}]'::jsonb,
        '/uploads/advertisements/ad_university_bottle_drive.jpg',
        'Single Spot'
      WHERE NOT EXISTS (SELECT 1 FROM machine_advertisements WHERE title = 'University Plastic Bottle Drive');
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
