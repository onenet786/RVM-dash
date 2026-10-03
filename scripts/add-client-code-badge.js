import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const file = path.join(__dirname, '..', 'src', 'components', 'EnterpriseClientsTab.jsx');

let content = fs.readFileSync(file, 'utf8');

const target = '@{org.domain}';
const idx = content.indexOf(target);

if (idx !== -1) {
  const closingSpan = content.indexOf('</span>', idx);
  const badgeCode = `\n                        <span className="inline-flex items-center gap-1 text-[10.5px] font-mono font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/25" title="Employee Mobile App Linking Code">\n                          Code: {org.org_id ? org.org_id.replace('ORG_', '').split('@')[0].split('_')[0] : org.name}\n                        </span>`;
  
  if (!content.includes('Employee Mobile App Linking Code')) {
    content = content.substring(0, closingSpan + 7) + badgeCode + content.substring(closingSpan + 7);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Successfully added Company Code badge to EnterpriseClientsTab.jsx!');
  } else {
    console.log('Badge already present.');
  }
} else {
  console.error('Target not found in EnterpriseClientsTab.jsx');
}
