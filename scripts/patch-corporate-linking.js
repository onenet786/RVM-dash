import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverIndexPath = path.join(__dirname, '..', 'server', 'index.js');

let content = fs.readFileSync(serverIndexPath, 'utf8');

const corporateCodeBlock = `
// ==========================================
// CORPORATE WORKPLACE LINKING & VERIFICATION API
// ==========================================

// Get list of active partner organizations for mobile corporate chooser
async function handleGetPublicOrganizations(req, res) {
  try {
    const pool = getPgPool();
    if (pool) {
      const orgRes = await pool.query(
        "SELECT org_id, name, domain, logo_url FROM organizations WHERE status = 'active' ORDER BY name ASC"
      );
      return res.json({ success: true, organizations: orgRes.rows });
    }
    res.json({ success: true, organizations: inMemoryOrganizations || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
app.get('/api/corporate/organizations', handleGetPublicOrganizations);
app.get('/corporate/organizations', handleGetPublicOrganizations);

// Link Citizen user to Corporate Workplace using Company Code & Employee ID
async function handleLinkCorporate(req, res) {
  try {
    const { userId, companyCode, employeeId, department } = req.body;
    if (!userId || !companyCode) {
      return res.status(400).json({ success: false, message: 'User identifier and Company Code are required' });
    }

    const cleanCode = String(companyCode).trim().toLowerCase();
    const cleanEmpId = (employeeId || '').trim();
    const pool = getPgPool();

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
        LIMIT 1;
      \`, [cleanCode]);
      if (orgRes.rows.length > 0) {
        matchedOrg = orgRes.rows[0];
      }
    }

    if (!matchedOrg && typeof inMemoryOrganizations !== 'undefined') {
      matchedOrg = inMemoryOrganizations.find(o => 
        o.org_id.toLowerCase() === cleanCode ||
        o.org_id.toLowerCase() === \`org_\${cleanCode}\` ||
        o.domain.toLowerCase() === cleanCode ||
        o.name.toLowerCase().includes(cleanCode)
      );
    }

    if (!matchedOrg) {
      return res.status(404).json({
        success: false,
        message: 'Invalid Company Code. Registered partner codes include ENGRO, ALFALAH, UCP, and METRO.'
      });
    }

    // Match department or pick first department of organization
    let deptId = null;
    let deptName = (department || '').trim() || 'General Office';
    if (pool) {
      try {
        let deptRes = null;
        if (department && department.trim()) {
          deptRes = await pool.query(
            'SELECT * FROM departments WHERE org_id = $1 AND LOWER(name) ILIKE $2 LIMIT 1',
            [matchedOrg.org_id, \`%\${department.trim().toLowerCase()}%\`]
          );
        }
        if (!deptRes || deptRes.rows.length === 0) {
          deptRes = await pool.query(
            'SELECT * FROM departments WHERE org_id = $1 ORDER BY dept_id ASC LIMIT 1',
            [matchedOrg.org_id]
          );
        }
        if (deptRes && deptRes.rows.length > 0) {
          deptId = deptRes.rows[0].dept_id;
          deptName = deptRes.rows[0].name;
        }
      } catch (deptErr) {
        console.warn('[Department Match Warning]', deptErr.message);
      }
    }

    const finalEmpId = cleanEmpId || \`EMP-\${Math.floor(1000 + Math.random() * 9000)}\`;

    if (pool) {
      await pool.query(\`
        UPDATE users 
        SET user_type = 'ENTERPRISE',
            org_id = $1,
            dept_id = $2,
            employee_id = $3,
            last_active = NOW()
        WHERE user_id = $4 OR username = $4 OR email = $4 OR mobile = $4;
      \`, [matchedOrg.org_id, deptId, finalEmpId, String(userId).trim()]);
    }

    if (typeof invalidateMobileUserCaches === 'function') {
      invalidateMobileUserCaches(userId);
    }

    console.log(\`[Corporate Linked] User \${userId} linked to \${matchedOrg.name} (Org: \${matchedOrg.org_id}, Emp: \${finalEmpId})\`);

    res.json({
      success: true,
      message: \`Congratulations! You are now verified as an Enterprise member at \${matchedOrg.name}.\`,
      user: {
        id: userId,
        userId: userId,
        userType: 'ENTERPRISE',
        orgId: matchedOrg.org_id,
        orgName: matchedOrg.name,
        domain: matchedOrg.domain,
        department: deptName,
        deptId: deptId,
        employeeId: finalEmpId,
        organization: {
          orgId: matchedOrg.org_id,
          name: matchedOrg.name,
          domain: matchedOrg.domain,
          logoUrl: matchedOrg.logo_url,
          department: deptName
        }
      }
    });
  } catch (err) {
    console.error('[Link Corporate Error]', err);
    res.status(500).json({ success: false, message: err.message });
  }
}
app.post('/api/user/link-corporate', handleLinkCorporate);
app.post('/user/link-corporate', handleLinkCorporate);

// Unlink Corporate Workplace (reverts back to Citizen)
async function handleUnlinkCorporate(req, res) {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User identifier is required' });
    }

    const pool = getPgPool();
    if (pool) {
      await pool.query(\`
        UPDATE users 
        SET user_type = 'CITIZEN',
            org_id = NULL,
            dept_id = NULL,
            employee_id = NULL,
            last_active = NOW()
        WHERE user_id = $1 OR username = $1 OR email = $1 OR mobile = $1;
      \`, [String(userId).trim()]);
    }

    if (typeof invalidateMobileUserCaches === 'function') {
      invalidateMobileUserCaches(userId);
    }

    console.log(\`[Corporate Unlinked] User \${userId} unlinked. Reverted to CITIZEN.\`);

    res.json({
      success: true,
      message: 'Corporate workplace unlinked. Switched to Citizen account.',
      user: {
        id: userId,
        userId: userId,
        userType: 'CITIZEN',
        orgId: null,
        orgName: null,
        department: null,
        deptId: null,
        employeeId: null,
        organization: null
      }
    });
  } catch (err) {
    console.error('[Unlink Corporate Error]', err);
    res.status(500).json({ success: false, message: err.message });
  }
}
app.post('/api/user/unlink-corporate', handleUnlinkCorporate);
app.post('/user/unlink-corporate', handleUnlinkCorporate);
`;

const anchor = "app.post('/update-profile', handleUpdateProfile);";
if (!content.includes(anchor)) {
  console.error("Anchor not found in server/index.js");
  process.exit(1);
}

if (!content.includes("handleLinkCorporate")) {
  content = content.replace(anchor, anchor + "\n" + corporateCodeBlock);
  fs.writeFileSync(serverIndexPath, content, 'utf8');
  console.log("Successfully patched server/index.js with Corporate Linking endpoints! Size:", fs.statSync(serverIndexPath).size);
} else {
  console.log("Corporate linking already present in server/index.js");
}
