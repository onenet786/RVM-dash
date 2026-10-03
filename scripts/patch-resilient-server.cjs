const fs = require('fs');

// 1. Patch server/migrate.js
let migrateCode = fs.readFileSync('server/migrate.js', 'utf8');

const targetMigrate = `      -- 2. Ensure organizations table has personalized dashboard and machine fields
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS theme VARCHAR(50) DEFAULT 'isp-portal';
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS welcome_msg TEXT;
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS dashboard_title VARCHAR(255);
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS primary_color VARCHAR(50) DEFAULT '#0B5D3B';
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS assigned_machines TEXT[] DEFAULT '{}';`;

const replacementMigrate = `      -- 2. Ensure organizations table has personalized dashboard and machine fields
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
      ON CONFLICT (org_id, employee_id) DO NOTHING;`;

const normalize = s => s.replace(/\r\n/g, '\n');

let normMigrate = normalize(migrateCode);
if (normMigrate.includes(normalize(targetMigrate))) {
  normMigrate = normMigrate.replace(normalize(targetMigrate), normalize(replacementMigrate));
  fs.writeFileSync('server/migrate.js', normMigrate, 'utf8');
  console.log('1. Patched server/migrate.js successfully.');
} else {
  console.warn('Could not find targetMigrate in server/migrate.js');
}

// 2. Patch server/index.js startup schema
let serverCode = fs.readFileSync('server/index.js', 'utf8');

const targetStartup = `      CREATE TABLE IF NOT EXISTS organizations (
        org_id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        domain VARCHAR(255) UNIQUE NOT NULL,
        logo_url TEXT,
        contact_email VARCHAR(255),
        contact_phone VARCHAR(100),
        monthly_budget INT DEFAULT 100000,
        monthly_target_kg NUMERIC(10, 2) DEFAULT 1000.00,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );`;

const replacementStartup = `      CREATE TABLE IF NOT EXISTS organizations (
        org_id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        domain VARCHAR(255) UNIQUE NOT NULL,
        logo_url TEXT,
        contact_email VARCHAR(255),
        contact_phone VARCHAR(100),
        monthly_budget INT DEFAULT 100000,
        monthly_target_kg NUMERIC(10, 2) DEFAULT 1000.00,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS company_code VARCHAR(100);
      UPDATE organizations SET company_code = 'ALFALAH' WHERE org_id = 'ORG_ALFALAH' AND (company_code IS NULL OR company_code = '');
      UPDATE organizations SET company_code = 'ENGRO' WHERE org_id = 'ORG_ENGRO' AND (company_code IS NULL OR company_code = '');
      UPDATE organizations SET company_code = 'UCP' WHERE org_id = 'ORG_UCP' AND (company_code IS NULL OR company_code = '');
      UPDATE organizations SET company_code = 'METRO' WHERE org_id = 'ORG_METRO' AND (company_code IS NULL OR company_code = '');

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
      ON CONFLICT (org_id, employee_id) DO NOTHING;`;

let normServer = normalize(serverCode);
if (normServer.includes(normalize(targetStartup))) {
  normServer = normServer.replace(normalize(targetStartup), normalize(replacementStartup));
  console.log('2. Patched server/index.js startup schema.');
} else {
  console.warn('Could not find targetStartup in server/index.js');
}

// 3. Patch handleGetPublicOrganizations to be 100% resilient
const targetGetPub = `async function handleGetPublicOrganizations(req, res) {
  try {
    const pool = getPgPool();
    if (pool) {
      const orgRes = await pool.query(
        "SELECT org_id, name, domain, logo_url, company_code FROM organizations WHERE status = 'active' ORDER BY name ASC"
      );
      return res.json({ success: true, organizations: orgRes.rows });
    }
    res.json({ success: true, organizations: [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}`;

const replacementGetPub = `async function handleGetPublicOrganizations(req, res) {
  try {
    const pool = getPgPool();
    if (pool) {
      // 1. Proactively auto-heal column if missing
      try {
        await pool.query("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS company_code VARCHAR(100);");
      } catch (_) {}

      // 2. Query with fallback so it never fails even if column is temporarily missing
      let orgRows = [];
      try {
        const orgRes = await pool.query(
          "SELECT org_id, name, domain, logo_url, COALESCE(company_code, REPLACE(org_id, 'ORG_', '')) AS company_code FROM organizations WHERE status = 'active' ORDER BY name ASC"
        );
        orgRows = orgRes.rows;
      } catch (colErr) {
        console.warn('[Fallback organizations query without company_code column]:', colErr.message);
        const fallbackRes = await pool.query(
          "SELECT org_id, name, domain, logo_url, REPLACE(org_id, 'ORG_', '') AS company_code FROM organizations WHERE status = 'active' ORDER BY name ASC"
        );
        orgRows = fallbackRes.rows;
      }

      return res.json({ success: true, organizations: orgRows });
    }
    res.json({ success: true, organizations: [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}`;

if (normServer.includes(normalize(targetGetPub))) {
  normServer = normServer.replace(normalize(targetGetPub), normalize(replacementGetPub));
  console.log('3. Patched handleGetPublicOrganizations with defensive fallback.');
} else {
  console.warn('Could not find targetGetPub in server/index.js');
}

// 4. Patch handleLinkCorporate query with defensive fallback
const targetLinkQuery = `    // 1. Locate Organization
    let matchedOrg = null;
    if (pool) {
      const orgRes = await pool.query(\`
        SELECT * FROM organizations 
        WHERE LOWER(org_id) = $1 
           OR LOWER(org_id) = 'org_' || $1
           OR LOWER(domain) = $1
           OR LOWER(domain) = $1 || '.com'
           OR LOWER(domain) = $1 || '.pk'
           OR LOWER(name) ILIKE '%' || $1 || '%'
           OR (company_code IS NOT NULL AND LOWER(company_code) = $1)
        LIMIT 1;
      \`, [cleanCode]);
      if (orgRes.rows.length > 0) {
        matchedOrg = orgRes.rows[0];
      }
    }`;

const replacementLinkQuery = `    // 1. Proactively auto-heal schema if needed
    if (pool) {
      try {
        await pool.query("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS company_code VARCHAR(100);");
      } catch (_) {}
    }

    // 1. Locate Organization (defensive query)
    let matchedOrg = null;
    if (pool) {
      let orgRes = null;
      try {
        orgRes = await pool.query(\`
          SELECT * FROM organizations 
          WHERE LOWER(org_id) = $1 
             OR LOWER(org_id) = 'org_' || $1
             OR LOWER(domain) = $1
             OR LOWER(domain) = $1 || '.com'
             OR LOWER(domain) = $1 || '.pk'
             OR LOWER(name) ILIKE '%' || $1 || '%'
             OR (company_code IS NOT NULL AND LOWER(company_code) = $1)
          LIMIT 1;
        \`, [cleanCode]);
      } catch (qErr) {
        // Fallback without company_code column
        orgRes = await pool.query(\`
          SELECT * FROM organizations 
          WHERE LOWER(org_id) = $1 
             OR LOWER(org_id) = 'org_' || $1
             OR LOWER(domain) = $1
             OR LOWER(domain) = $1 || '.com'
             OR LOWER(domain) = $1 || '.pk'
             OR LOWER(name) ILIKE '%' || $1 || '%'
          LIMIT 1;
        \`, [cleanCode]);
      }

      if (orgRes && orgRes.rows.length > 0) {
        matchedOrg = orgRes.rows[0];
      }
    }`;

if (normServer.includes(normalize(targetLinkQuery))) {
  normServer = normServer.replace(normalize(targetLinkQuery), normalize(replacementLinkQuery));
  console.log('4. Patched handleLinkCorporate with defensive query fallback.');
} else {
  console.warn('Could not find targetLinkQuery in server/index.js');
}

fs.writeFileSync('server/index.js', normServer, 'utf8');
console.log('Done saving all files!');
