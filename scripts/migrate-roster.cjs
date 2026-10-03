const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:Admin786@127.0.0.1:5432/rvmpg' });

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Starting migration for organization_employees (Staff Roster Whitelist)...');
    await client.query('BEGIN');

    // 1. Create organization_employees table
    await client.query(`
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
    `);
    console.log('organization_employees table verified/created.');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_org_emp_lookup ON organization_employees(org_id, employee_id);
      CREATE INDEX IF NOT EXISTS idx_org_emp_email ON organization_employees(org_id, LOWER(official_email));
      CREATE INDEX IF NOT EXISTS idx_org_emp_claimed ON organization_employees(claimed_by_user_id);
    `);

    // 2. Ensure company_code column exists on organizations table
    await client.query(`
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS company_code VARCHAR(100);
    `);

    // Update company_codes for existing orgs if missing
    await client.query(`
      UPDATE organizations SET company_code = 'ALFALAH' WHERE org_id = 'ORG_ALFALAH' AND company_code IS NULL;
      UPDATE organizations SET company_code = 'ENGRO' WHERE org_id = 'ORG_ENGRO' AND company_code IS NULL;
      UPDATE organizations SET company_code = 'UCP' WHERE org_id = 'ORG_UCP' AND company_code IS NULL;
      UPDATE organizations SET company_code = 'METRO' WHERE org_id = 'ORG_METRO' AND company_code IS NULL;
    `);

    // 3. Ensure departments exist for each organization
    const sampleDepts = [
      // Bank Alfalah
      { dept_id: 'DEPT_BA_OPS', org_id: 'ORG_ALFALAH', name: 'Operations & Clearing', target: 800 },
      { dept_id: 'DEPT_BA_FIN', org_id: 'ORG_ALFALAH', name: 'Finance & Accounts', target: 600 },
      { dept_id: 'DEPT_BA_HR', org_id: 'ORG_ALFALAH', name: 'Human Resources', target: 400 },
      { dept_id: 'DEPT_BA_IT', org_id: 'ORG_ALFALAH', name: 'Information Technology', target: 500 },
      // Engro
      { dept_id: 'DEPT_ENG_PETRO', org_id: 'ORG_ENGRO', name: 'Petrochemicals Division', target: 900 },
      { dept_id: 'DEPT_ENG_CORP', org_id: 'ORG_ENGRO', name: 'Corporate Communications', target: 500 },
      { dept_id: 'DEPT_ENG_SUST', org_id: 'ORG_ENGRO', name: 'Sustainability & ESG', target: 600 },
      // UCP
      { dept_id: 'DEPT_UCP_ENGG', org_id: 'ORG_UCP', name: 'Faculty of Engineering', target: 700 },
      { dept_id: 'DEPT_UCP_CS', org_id: 'ORG_UCP', name: 'Computer Science Dept', target: 800 },
      { dept_id: 'DEPT_UCP_ADMIN', org_id: 'ORG_UCP', name: 'University Administration', target: 500 },
      // Metro
      { dept_id: 'DEPT_METRO_OPS', org_id: 'ORG_METRO', name: 'Store Operations', target: 700 },
      { dept_id: 'DEPT_METRO_LOG', org_id: 'ORG_METRO', name: 'Supply Chain & Logistics', target: 600 }
    ];

    for (const d of sampleDepts) {
      await client.query(`
        INSERT INTO departments (dept_id, org_id, name, monthly_target_kg)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (dept_id) DO UPDATE SET
          name = EXCLUDED.name,
          org_id = EXCLUDED.org_id,
          monthly_target_kg = EXCLUDED.monthly_target_kg;
      `, [d.dept_id, d.org_id, d.name, d.target]);
    }
    console.log('Sample departments verified/seeded.');

    // 4. Seed authorized employees roster for each organization
    const sampleEmployees = [
      // Bank Alfalah
      { org_id: 'ORG_ALFALAH', employee_id: 'BA-1001', full_name: 'Ahmed Khan', email: 'ahmed.khan@bankalfalah.com', mobile: '03001234561', dept_id: 'DEPT_BA_OPS', dept_name: 'Operations & Clearing' },
      { org_id: 'ORG_ALFALAH', employee_id: 'BA-1002', full_name: 'Fatima Noor', email: 'fatima.noor@bankalfalah.com', mobile: '03001234562', dept_id: 'DEPT_BA_FIN', dept_name: 'Finance & Accounts' },
      { org_id: 'ORG_ALFALAH', employee_id: 'BA-1003', full_name: 'Bilal Tariq', email: 'bilal.tariq@bankalfalah.com', mobile: '03001234563', dept_id: 'DEPT_BA_HR', dept_name: 'Human Resources' },
      { org_id: 'ORG_ALFALAH', employee_id: 'BA-1004', full_name: 'Zainab Ali', email: 'zainab.ali@bankalfalah.com', mobile: '03001234564', dept_id: 'DEPT_BA_IT', dept_name: 'Information Technology' },
      { org_id: 'ORG_ALFALAH', employee_id: 'BA-1005', full_name: 'Muhammad Usman', email: 'usman.m@bankalfalah.com', mobile: '03001234565', dept_id: 'DEPT_BA_OPS', dept_name: 'Operations & Clearing' },

      // Engro
      { org_id: 'ORG_ENGRO', employee_id: 'ENG-201', full_name: 'Kamran Malik', email: 'k.malik@engro.com', mobile: '03211234561', dept_id: 'DEPT_ENG_SUST', dept_name: 'Sustainability & ESG' },
      { org_id: 'ORG_ENGRO', employee_id: 'ENG-202', full_name: 'Sara Farooq', email: 's.farooq@engro.com', mobile: '03211234562', dept_id: 'DEPT_ENG_PETRO', dept_name: 'Petrochemicals Division' },
      { org_id: 'ORG_ENGRO', employee_id: 'ENG-203', full_name: 'Usman Ghani', email: 'u.ghani@engro.com', mobile: '03211234563', dept_id: 'DEPT_ENG_CORP', dept_name: 'Corporate Communications' },

      // UCP
      { org_id: 'ORG_UCP', employee_id: 'UCP-501', full_name: 'Dr. Hamza Raza', email: 'hamza.raza@ucp.edu.pk', mobile: '03331234561', dept_id: 'DEPT_UCP_CS', dept_name: 'Computer Science Dept' },
      { org_id: 'ORG_UCP', employee_id: 'UCP-502', full_name: 'Ayesha Siddiqui', email: 'ayesha.s@ucp.edu.pk', mobile: '03331234562', dept_id: 'DEPT_UCP_ENGG', dept_name: 'Faculty of Engineering' },
      { org_id: 'ORG_UCP', employee_id: 'UCP-503', full_name: 'Hassan Ali', email: 'hassan.ali@ucp.edu.pk', mobile: '03331234563', dept_id: 'DEPT_UCP_ADMIN', dept_name: 'University Administration' },

      // Metro Cash & Carry
      { org_id: 'ORG_METRO', employee_id: 'MET-301', full_name: 'Tariq Mehmood', email: 'tariq.m@metro.pk', mobile: '03451234561', dept_id: 'DEPT_METRO_OPS', dept_name: 'Store Operations' },
      { org_id: 'ORG_METRO', employee_id: 'MET-302', full_name: 'Sadia Bashir', email: 'sadia.b@metro.pk', mobile: '03451234562', dept_id: 'DEPT_METRO_LOG', dept_name: 'Supply Chain & Logistics' }
    ];

    for (const e of sampleEmployees) {
      await client.query(`
        INSERT INTO organization_employees (
          org_id, employee_id, full_name, official_email, mobile, dept_id, dept_name
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (org_id, employee_id) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          official_email = EXCLUDED.official_email,
          mobile = EXCLUDED.mobile,
          dept_id = EXCLUDED.dept_id,
          dept_name = EXCLUDED.dept_name;
      `, [e.org_id, e.employee_id, e.full_name, e.email, e.mobile, e.dept_id, e.dept_name]);
    }
    console.log(`Seeded ${sampleEmployees.length} authorized employees across organizations.`);

    await client.query('COMMIT');
    console.log('Migration successfully completed!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
