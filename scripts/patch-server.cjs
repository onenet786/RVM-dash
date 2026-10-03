const fs = require('fs');

let content = fs.readFileSync('server/index.js', 'utf8');

// 1. Patch bulk-import query
const oldBulk = `          await pool.query(\`
            INSERT INTO users (
              user_id, username, full_name, email, mobile,
              user_type, org_id, dept_id, employee_id,
              auth_provider, role_id, points_balance, is_online, created_at
            ) VALUES (
              $1, $1, $2, $1, $3,
              'ENTERPRISE', $4, $5, $6,
              'enterprise_csv', 'user', 0, FALSE, NOW()
            ) ON CONFLICT (email) DO UPDATE SET
              full_name = EXCLUDED.full_name,
              mobile = COALESCE(EXCLUDED.mobile, users.mobile),
              user_type = 'ENTERPRISE',
              org_id = EXCLUDED.org_id,
              dept_id = EXCLUDED.dept_id,
              employee_id = EXCLUDED.employee_id;
          \`, [email, fullName, mobile, orgId, deptId, employeeId]);`;

const newBulk = `          await pool.query(\`
            INSERT INTO organization_employees (
              org_id, employee_id, full_name, official_email, mobile, dept_id, dept_name
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (org_id, employee_id) DO UPDATE SET
              full_name = EXCLUDED.full_name,
              official_email = COALESCE(EXCLUDED.official_email, organization_employees.official_email),
              mobile = COALESCE(EXCLUDED.mobile, organization_employees.mobile),
              dept_id = COALESCE(EXCLUDED.dept_id, organization_employees.dept_id),
              dept_name = COALESCE(EXCLUDED.dept_name, organization_employees.dept_name);
          \`, [orgId, employeeId, fullName, email || null, mobile, deptId, deptName]);`;

// 2. Patch GET /api/enterprise/employees/:orgId query
const oldGetEmps = `      const q = await pool.query(\`
        SELECT 
          u.user_id, u.username, u.full_name, u.email, u.mobile,
          u.employee_id, u.auth_provider, u.points_balance, u.created_at, u.last_active,
          d.dept_id, d.name AS dept_name,
          COALESCE(SUM(s.plastic_count), 0) AS total_bottles,
          COALESCE(SUM(s.aluminium_count), 0) AS total_cans,
          COALESCE(SUM(s.paper_weight_grams) / 1000.0, 0) AS total_paper_kg
        FROM users u
        LEFT JOIN departments d ON u.dept_id = d.dept_id
        LEFT JOIN recycling_sessions s ON s.user_id = u.user_id
        WHERE u.org_id = $1 OR u.org_id = $2
        GROUP BY u.user_id, u.username, u.full_name, u.email, u.mobile, u.employee_id, u.auth_provider, u.points_balance, u.created_at, u.last_active, d.dept_id, d.name
        ORDER BY u.created_at DESC;
      \`, [orgId, orgId.startsWith('ORG_') ? orgId.replace(/^ORG_/, '') : \`ORG_\${orgId}\`]);

      return res.json({
        success: true,
        employees: q.rows.map(r => ({
          userId: r.user_id,
          username: r.username,
          fullName: r.full_name || r.username,
          email: r.email,
          mobile: r.mobile,
          employeeId: r.employee_id || '-',
          authProvider: r.auth_provider || 'google',
          pointsBalance: Number(r.points_balance) || 0,
          bottles: Number(r.total_bottles) || 0,
          cans: Number(r.total_cans) || 0,
          paperKg: parseFloat(Number(r.total_paper_kg || 0).toFixed(2)),
          deptId: r.dept_id,
          deptName: r.dept_name || 'General',
          lastActive: r.last_active,
          createdAt: r.created_at
        }))
      });`;

const newGetEmps = `      const q = await pool.query(\`
        SELECT 
          oe.roster_id,
          oe.employee_id,
          oe.full_name,
          oe.official_email,
          oe.mobile,
          oe.is_claimed,
          oe.claimed_at,
          oe.claimed_by_user_id,
          d.dept_id,
          COALESCE(oe.dept_name, d.name, 'General') AS dept_name,
          u.user_id,
          u.username,
          u.points_balance,
          u.last_active,
          COALESCE(SUM(s.plastic_count), 0) AS total_bottles,
          COALESCE(SUM(s.aluminium_count), 0) AS total_cans,
          COALESCE(SUM(s.paper_weight_grams) / 1000.0, 0) AS total_paper_kg
        FROM organization_employees oe
        LEFT JOIN departments d ON oe.dept_id = d.dept_id
        LEFT JOIN users u ON oe.claimed_by_user_id = u.user_id
        LEFT JOIN recycling_sessions s ON s.user_id = u.user_id
        WHERE oe.org_id = $1 OR oe.org_id = $2
        GROUP BY 
          oe.roster_id, oe.employee_id, oe.full_name, oe.official_email, oe.mobile,
          oe.is_claimed, oe.claimed_at, oe.claimed_by_user_id, d.dept_id, d.name,
          u.user_id, u.username, u.points_balance, u.last_active
        ORDER BY oe.is_claimed DESC, oe.employee_id ASC;
      \`, [orgId, orgId.startsWith('ORG_') ? orgId.replace(/^ORG_/, '') : \`ORG_\${orgId}\`]);

      return res.json({
        success: true,
        employees: q.rows.map(r => ({
          rosterId: r.roster_id,
          userId: r.user_id,
          username: r.username,
          fullName: r.full_name,
          email: r.official_email || (r.username && r.username.includes('@') ? r.username : '-'),
          mobile: r.mobile,
          employeeId: r.employee_id || '-',
          isClaimed: Boolean(r.is_claimed),
          claimedAt: r.claimed_at,
          claimedByUserId: r.claimed_by_user_id,
          pointsBalance: Number(r.points_balance) || 0,
          bottles: Number(r.total_bottles) || 0,
          cans: Number(r.total_cans) || 0,
          paperKg: parseFloat(Number(r.total_paper_kg || 0).toFixed(2)),
          deptId: r.dept_id,
          deptName: r.dept_name || 'General',
          lastActive: r.last_active
        }))
      });`;

const normalize = str => str.replace(/\r\n/g, '\n');

let normContent = normalize(content);
const normOldBulk = normalize(oldBulk);
const normNewBulk = normalize(newBulk);
const normOldGet = normalize(oldGetEmps);
const normNewGet = normalize(newGetEmps);

let patched = 0;
if (normContent.includes(normOldBulk)) {
  normContent = normContent.replace(normOldBulk, normNewBulk);
  console.log('1. Patched bulk-import query.');
  patched++;
} else {
  console.warn('Could not find oldBulk in server/index.js');
}

if (normContent.includes(normOldGet)) {
  normContent = normContent.replace(normOldGet, normNewGet);
  console.log('2. Patched GET enterprise employees query.');
  patched++;
} else {
  console.warn('Could not find oldGetEmps in server/index.js');
}

if (patched > 0) {
  fs.writeFileSync('server/index.js', normContent, 'utf8');
  console.log(`Saved server/index.js with ${patched} patches applied.`);
}
