const fs = require('fs');

let code = fs.readFileSync('src/components/EnterpriseClientsTab.jsx', 'utf8');

const oldClaim = `                                <td className="py-2.5 px-3 text-center">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30" title="Touchless Web SSO via standard phone camera">
                                    <span>⚡</span> Web Claim (No App)
                                  </span>
                                </td>`;

const newClaim = `                                <td className="py-2.5 px-3 text-center">
                                  {emp.isClaimed ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" title="Account verified and linked">
                                      <span>✓</span> Linked / Active
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30" title="Pre-authorized on company whitelist, pending employee claim">
                                      <span>⏳</span> Roster Whitelist
                                    </span>
                                  )}
                                </td>`;

const normalize = s => s.replace(/\r\n/g, '\n');

let normCode = normalize(code);
if (normCode.includes(normalize(oldClaim))) {
  normCode = normCode.replace(normalize(oldClaim), normalize(newClaim));
  fs.writeFileSync('src/components/EnterpriseClientsTab.jsx', normCode, 'utf8');
  console.log('Patched claim badge in EnterpriseClientsTab.jsx');
} else {
  console.warn('Could not find oldClaim in EnterpriseClientsTab.jsx');
}
