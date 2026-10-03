import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Patch server/index.js
const serverPath = path.join(__dirname, '..', 'server', 'index.js');
let serverCode = fs.readFileSync(serverPath, 'utf8');

// Update handleGetPublicOrganizations to be strictly PostgreSQL
const oldGetOrgs = `async function handleGetPublicOrganizations(req, res) {
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
}`;

const newGetOrgs = `async function handleGetPublicOrganizations(req, res) {
  try {
    const pool = getPgPool();
    if (pool) {
      const orgRes = await pool.query(
        "SELECT org_id, name, domain, logo_url FROM organizations WHERE status = 'active' ORDER BY name ASC"
      );
      return res.json({ success: true, organizations: orgRes.rows });
    }
    res.json({ success: true, organizations: [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}`;

if (serverCode.includes(oldGetOrgs)) {
  serverCode = serverCode.replace(oldGetOrgs, newGetOrgs);
}

// Remove inMemoryOrganizations fallback from handleLinkCorporate
const oldFallback = `    if (!matchedOrg && typeof inMemoryOrganizations !== 'undefined') {
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
    }`;

const newStrictMatching = `    // PostgreSQL is the single production source of truth (no mock in-memory fallback)
    if (!matchedOrg) {
      return res.status(404).json({
        success: false,
        message: 'Company Code or Organization not found in the active corporate registry. Please contact your organization administrator.'
      });
    }`;

if (serverCode.includes(oldFallback)) {
  serverCode = serverCode.replace(oldFallback, newStrictMatching);
  console.log('Removed inMemoryOrganizations fallback from handleLinkCorporate');
} else {
  console.warn('oldFallback not found directly, checking regex...');
  const fallbackRegex = /if \(!matchedOrg && typeof inMemoryOrganizations !== 'undefined'\)[\s\S]*?message: 'Invalid Company Code[\s\S]*?\}\);[\s\S]*?\}/;
  if (fallbackRegex.test(serverCode)) {
    serverCode = serverCode.replace(fallbackRegex, newStrictMatching);
    console.log('Replaced fallback via regex');
  }
}

fs.writeFileSync(serverPath, serverCode, 'utf8');
console.log('server/index.js updated. Size:', fs.statSync(serverPath).size);

// 2. Patch mobile_app/screens/DashboardScreen.jsx
const dashboardPath = path.join(__dirname, '..', 'mobile_app', 'screens', 'DashboardScreen.jsx');
let dashCode = fs.readFileSync(dashboardPath, 'utf8');

// Replace default fallback availableOrgs with empty array
const oldOrgsState = `const [availableOrgs, setAvailableOrgs] = useState([
    { org_id: 'ORG_ENGRO', name: 'Engro Corporation', code: 'ENGRO' },
    { org_id: 'ORG_ALFALAH', name: 'Bank Alfalah', code: 'ALFALAH' },
    { org_id: 'ORG_UCP', name: 'Univ. of Central Punjab', code: 'UCP' },
    { org_id: 'ORG_METRO', name: 'Metro Cash & Carry', code: 'METRO' }
  ]);`;

const newOrgsState = `const [availableOrgs, setAvailableOrgs] = useState([]);`;

if (dashCode.includes(oldOrgsState)) {
  dashCode = dashCode.replace(oldOrgsState, newOrgsState);
  console.log('Replaced hardcoded availableOrgs with dynamic state');
}

// Enhance org code extraction in useEffect
const oldFetch = `setAvailableOrgs(res.data.organizations.map(o => ({
            ...o,
            code: o.org_id ? o.org_id.replace('ORG_', '') : o.name
          })));`;

const newFetch = `setAvailableOrgs(res.data.organizations.map(o => {
            let code = o.org_id ? o.org_id.replace('ORG_', '').split('@')[0].split('_')[0] : '';
            if (!code && o.domain) code = o.domain.split('.')[0].toUpperCase();
            return {
              ...o,
              code: code || o.name
            };
          }));`;

if (dashCode.includes(oldFetch)) {
  dashCode = dashCode.replace(oldFetch, newFetch);
  console.log('Enhanced org code extraction in DashboardScreen.jsx');
}

fs.writeFileSync(dashboardPath, dashCode, 'utf8');
console.log('DashboardScreen.jsx updated. Size:', fs.statSync(dashboardPath).size);
