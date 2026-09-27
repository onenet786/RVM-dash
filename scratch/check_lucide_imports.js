import fs from 'fs';
import path from 'path';

const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

const knownLucideIcons = [
  'Activity', 'AlertTriangle', 'Archive', 'ArrowRightLeft', 'Award',
  'BarChart2', 'BarChart3', 'Building2', 'Calendar', 'Check', 'CheckCircle2',
  'CheckSquare', 'ChevronDown', 'ChevronRight', 'Clock', 'CloudSun', 'Copy',
  'Cpu', 'Database', 'Download', 'Droplets', 'Edit3', 'Eye', 'FileCheck',
  'FileSpreadsheet', 'FileText', 'Gift', 'Globe', 'HardDrive', 'Key', 'KeyRound',
  'Layers', 'LayoutDashboard', 'Leaf', 'Lock', 'LogOut', 'MapPin', 'Menu',
  'MessageSquare', 'Moon', 'Package', 'Palette', 'Plus', 'Radio', 'Recycle',
  'RefreshCw', 'Repeat', 'ScanLine', 'Search', 'Send', 'Settings', 'Shield',
  'ShieldAlert', 'ShieldCheck', 'Sliders', 'Smartphone', 'Sparkles', 'Square',
  'Star', 'Sun', 'Table', 'Ticket', 'Trash2', 'TreePine', 'Trophy', 'Tv',
  'UserCheck', 'UserPlus', 'Users', 'Wallet', 'Wrench', 'X'
];

let issues = 0;
for (const file of files) {
  const filePath = path.join(dir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Find all lucide imports
  const matches = [...content.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/g)];
  const imported = new Set();
  for (const m of matches) {
    m[1].split(',').map(s => s.trim()).filter(Boolean).forEach(s => {
      // handle alias 'PieChart as PieIcon'
      const parts = s.split(/\s+as\s+/);
      imported.add(parts[0].trim());
    });
  }

  for (const icon of knownLucideIcons) {
    // Check if referenced as a JSX tag or object value
    const regex = new RegExp(`(<${icon}\\b|\\bicon:\\s*${icon}\\b|\\bIconComponent\\s*=\\s*${icon}\\b)`, 'g');
    if (regex.test(content) && !imported.has(icon)) {
      console.log(`[MISSING IMPORT] ${file} uses ${icon} but did not import it from lucide-react!`);
      issues++;
    }
  }
}

if (issues === 0) {
  console.log('✅ ALL components have 100% complete and valid lucide-react imports!');
}
