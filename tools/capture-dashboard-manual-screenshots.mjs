import fs from 'node:fs';
import path from 'node:path';

const base = process.cwd();
const outDir = path.join(base, 'docs', 'web_dashboard_manuals', 'screenshots');
fs.mkdirSync(outDir, { recursive: true });

const targets = await (await fetch('http://127.0.0.1:9224/json')).json();
const target = targets.find(t => t.type === 'page' && t.url.startsWith('http://127.0.0.1:5009'));
if (!target) throw new Error('No Edge page target found');

const ws = new WebSocket(target.webSocketDebuggerUrl);
let nextId = 1;
const pending = new Map();
ws.onmessage = event => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
  }
};
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });

function cdp(method, params = {}) {
  const id = nextId++;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}
const delay = ms => new Promise(r => setTimeout(r, ms));
async function evaluate(expression) {
  return cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
}
async function shot(name) {
  await evaluate('window.scrollTo(0,0)');
  await delay(700);
  const result = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(outDir, name), Buffer.from(result.data, 'base64'));
  console.log(`captured ${name}`);
}
async function clickText(text) {
  const encoded = JSON.stringify(text);
  const result = await evaluate(`(() => {
    const wanted=${encoded}.toLowerCase();
    const nodes=[...document.querySelectorAll('button,a,[role="button"],div,span')]
      .filter(n => n.offsetParent!==null && (n.innerText||'').trim().toLowerCase().includes(wanted))
      .sort((a,b)=>(a.innerText||'').length-(b.innerText||'').length);
    const el=nodes[0];
    if(!el) return false;
    (el.closest('button,a,[role="button"]')||el).click(); return true;
  })()`);
  await delay(1700);
  return result.result?.value;
}

await cdp('Page.enable');
await cdp('Runtime.enable');
await cdp('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
await delay(1200);
await shot('01-login.png');

const source = fs.readFileSync(path.join(base, 'server', 'index.js'), 'utf8');
const credentialMarker = source.match(/Protected by username:\s*onenet\s*\/\s*password:\s*([^\)\r\n]+)/i);
if (!credentialMarker) throw new Error('Local master credential marker was not found');
const password = credentialMarker[1].trim();
const login = `(() => {
  const inputs=[...document.querySelectorAll('input')];
  const user=inputs.find(i=>i.type==='text'||i.type==='email');
  const pass=inputs.find(i=>i.type==='password');
  const set=(el,v)=>{const s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;s.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));};
  set(user,'onenet'); set(pass,${JSON.stringify(password)});
  [...document.querySelectorAll('button')].find(b=>(b.innerText||'').trim()==='SIGN IN')?.click();
})()`;
await evaluate(login);
await delay(3000);
await shot('02-executive-overview.png');

const pages = [
  ['Machine Health & Operations', '03-machine-health.png'],
  ['Digital Signage', '04-digital-signage.png'],
  ['Community & Users', null],
  ['Recycler Community', '05-recycler-community.png'],
  ['Rewards & Leaderboards', '06-rewards-leaderboards.png'],
  ['Commercial & ESG', null],
  ['Enterprise Accounts', '07-enterprise-accounts.png'],
  ['ESG & Carbon Impact', '08-esg-impact.png'],
  ['Intelligence', null],
  ['Analytics & Reports', '09-analytics-reports.png'],
  ['System & Admin', null],
  ['Access & Security (RBAC)', '10-access-security.png'],
  ['Backups & Restore', '11-backups-restore.png']
];
for (const [label, file] of pages) {
  const ok = await clickText(label);
  if (ok && file) await shot(file);
  else console.log(`not found ${label}`);
}
ws.close();
