import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const file = path.join(__dirname, '..', 'mobile_app', 'screens', 'DashboardScreen.jsx');

let content = fs.readFileSync(file, 'utf8');

// 1. Set real initial state for availableOrgs
const oldState = `const [availableOrgs, setAvailableOrgs] = useState([]);`;
const newState = `const [availableOrgs, setAvailableOrgs] = useState([
    { org_id: 'ORG_ALLIED@ALLIED_5092', name: 'Allied Bank Pvt Ltd', code: 'ALLIED' },
    { org_id: 'ORG_UCP', name: 'University of Central Punjab', code: 'UCP' },
    { org_id: 'ORG_ZONG@ZONG_9961', name: 'ZONG PAKISTAN', code: 'ZONG' }
  ]);`;

if (content.includes(oldState)) {
  content = content.replace(oldState, newState);
  console.log('Updated initial availableOrgs state with real active database clients');
}

// 2. Add useEffect to fetch live active organizations
const fetchEffect = `
  // Live Active Corporate Partners Fetch
  useEffect(() => {
    axios.get(\`\${API_BASE_URL}/corporate/organizations\`)
      .then(res => {
        if (res.data?.success && Array.isArray(res.data.organizations) && res.data.organizations.length > 0) {
          setAvailableOrgs(res.data.organizations.map(o => {
            let code = o.org_id ? o.org_id.replace('ORG_', '').split('@')[0].split('_')[0] : '';
            if (!code && o.domain) code = o.domain.split('.')[0].toUpperCase();
            return {
              ...o,
              code: code || o.name
            };
          }));
        }
      })
      .catch(e => console.warn('Fetch corporate orgs note:', e.message));
  }, []);
`;

const anchorEffect = `fetchLastBackup();\n  }, []);`;
if (!content.includes('/corporate/organizations')) {
  content = content.replace(anchorEffect, anchorEffect + fetchEffect);
  console.log('Inserted corporate organizations fetch useEffect');
}

// 3. Update placeholder in Modal
content = content.replace(
  'placeholder="e.g. ENGRO, ALFALAH, UCP, METRO or engro.com"',
  'placeholder="e.g. ALLIED, UCP, ZONG or ucp.edu.pk"'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully fixed DashboardScreen.jsx! New file size:', fs.statSync(file).size);
