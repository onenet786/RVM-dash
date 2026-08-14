# Production Deployment PRD: RVM Master Developer Dashboard
**Target Infrastructure**: Dedicated Ubuntu Linux Server with aaPanel Control Panel  
**Application Stack**: Node.js ES Modules (Express API), MongoDB Atlas Cluster, Vite React Frontend (SPA), PM2 Process Manager, Nginx Reverse Proxy  
**Document Version**: 4.0 (August 2026 - Port 5009 Update)

---

## 1. Architectural Topology Overview

```
[ Web Browser Client ] 
        │ 
        │ HTTPS (Port 443) / Let's Encrypt SSL
        ▼
[ Ubuntu Dedicated Server + aaPanel ]
  ├── Nginx Reverse Proxy (Ports 80/443)
  │     ├── Static Frontend Bundle (/www/wwwroot/rvm-dash/dist)
  │     └── Reverse Proxy /api/ ➔ http://127.0.0.1:5009
  │
  ├── aaPanel Node Project Manager (PM2 Engine)
  │     └── [rvm-master-dashboard] process running server/index.js (Port 5009)
  │
  └── Environment Connections
        ├── Primary Master Cluster: ONS-RVM (cluster0.ktted0m.mongodb.net)
        └── Production Source Cluster: rvmapp (cluster0.fuycg6c.mongodb.net)
```

---

## 2. Server Requirements & Prerequisites

| Component | Requirement | aaPanel Setup Location |
| :--- | :--- | :--- |
| **OS** | Ubuntu 20.04 / 22.04 LTS Dedicated Server | Host OS |
| **Control Panel** | aaPanel Linux Panel v6.8+ | System Panel |
| **Node.js Environment** | Node.js v18.x or v20.x LTS | aaPanel App Store ➔ Node.js Version Manager |
| **Process Manager** | PM2 Process Manager v5.x | Integrated in aaPanel Node Project Manager |
| **Web Server** | Nginx 1.22+ | aaPanel App Store ➔ Nginx |
| **SSL Certificate** | Let's Encrypt Free SSL | aaPanel Site Manager ➔ SSL Certificate |
| **Database** | MongoDB Atlas Cloud Clusters (`ONS-RVM` & `rvmapp`) | Remote DNS SRV (Port 27017 outbound open) |

---

## 3. Step-by-Step Production Hosting Guide via aaPanel GUI

### Step 1: Upload / Clone Project Code to aaPanel via Web Authentication

#### Option A: aaPanel Web GUI File Manager (Recommended)
1. Open aaPanel in your browser: `https://YOUR_SERVER_IP:8888`.
2. Navigate to **Files** ➔ Go to `/www/wwwroot/`.
3. Click the **Git** button on the top toolbar ➔ Select **Clone Repository**.
4. Fill in Web Authentication credentials:
   - **Repository URL**: `https://github.com/onenet786/RVM-dash.git`
   - **Auth Type**: Web Token / Account Password
   - **Username**: `onenet786`
   - **Password / Token**: `YOUR_GITHUB_PERSONAL_ACCESS_TOKEN` (`ghp_xxxxxxxxxxxx`)
   - **Target Directory**: `rvm-dash`

#### Option B: aaPanel Web Terminal / SSH Command (Web Token Authenticated - Branch B2)
```bash
cd /www/wwwroot
# Clone branch B2 using your GitHub Web Personal Access Token (PAT):
git clone -b B2 https://YOUR_GITHUB_TOKEN@github.com/onenet786/RVM-dash.git rvm-dash
cd rvm-dash
npm install --production=false
npm run build
```

---

### Step 2: Configure aaPanel Node Project Manager (GUI Method)

1. Open aaPanel ➔ Click **Website** in the left sidebar menu.
2. Select the **Node project** tab at the top.
3. Click the **Add Node Project** button to open the configuration modal:

#### Exact Modal Input Values:

| aaPanel Form Field | Exact Value to Enter / Select | Notes / Purpose |
| :--- | :--- | :--- |
| **Path** | `/www/wwwroot/rvm-dash` | Project root folder |
| **Node Version** | `v18.x` or `v20.x` | Select version installed in Node Version Manager |
| **Name** | `rvm-master-dashboard` | PM2 Process Display Name |
| **Run Opt / Start Command** | `node server/index.js` (or `npm run start`) | **IMPORTANT**: Type `node server/index.js` to ensure Node interpreter invocation |
| **Project Port** | `5009` | Internal Express backend API port |
| **User** | `www` (or `root`) | Linux process execution user |
| **Auto Start** | `Enabled` / `Checked` | Ensures auto-restart on server reboot |
| **Domain Name** | `rvm.yourdomain.com` | Domain name bound to this Node site |

4. Click **Submit** / **OK** to save and launch the PM2 process.

---

### Step 3: Set Environment Variables in aaPanel Node Project

1. Under the **Node project** list, find `rvm-master-dashboard`.
2. Click **Settings** (or **Environment Variables** / **Env** tab).
3. Add the following environment keys:

```ini
NODE_ENV=production
PORT=5009
MONGODB_URI=mongodb+srv://aaqueelphotos_db_user:Z8NPUThldyeypEEQ@cluster0.ktted0m.mongodb.net/ONS-RVM?retryWrites=true&w=majority
MONGODB_DBNAME=ONS-RVM
JWT_SECRET=rvm-isp-production-secret-key-2026-aapanel
```

---

### Step 4: Configure Nginx Reverse Proxy & SSL in aaPanel

1. Go to aaPanel ➔ **Website** ➔ Click on your site (`rvm.yourdomain.com`) ➔ **Settings**.
2. **Set Root Directory**:
   - Go to **Site directory** tab.
   - Set **Site Directory**: `/www/wwwroot/rvm-dash/dist` (serves compiled Vite production bundle).
   - Click **Save**.

3. **Configure Nginx Rules**:
   - Go to **Config** (or **Nginx Configuration**) tab.
   - Paste the provided configuration from `nginx-aapanel.conf`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name isprvm.binishaqsoft.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name isprvm.binishaqsoft.com;

    ssl_certificate /www/server/panel/vhost/cert/isprvm.binishaqsoft.com/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/isprvm.binishaqsoft.com/privkey.pem;

    root /www/wwwroot/rvm-dash/dist;
    index index.html;
    client_max_body_size 50M;

    # Backend API Reverse Proxy (Port 5009)
    location /api/ {
        proxy_pass http://127.0.0.1:5009/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SPA Client Fallback (Prevents 404 Not Found)
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

4. **Enable Free SSL**:
   - Open Site Settings ➔ **SSL** ➔ Select **Let's Encrypt** tab.
   - Select domain `isprvm.binishaqsoft.com` ➔ Click **Apply**.
   - Enable **Force HTTPS** toggle.


---

### Step 5: Automated Production Updates (`deploy-aapanel.sh`)

Whenever updates are pulled to the server, run the automated deployment script:

```bash
cd /www/wwwroot/rvm-dash
bash deploy-aapanel.sh
```

---

## 4. Verification & Health Monitoring

1. **Verify Backend API**:
   ```bash
   curl http://127.0.0.1:5009/api/health
   ```
   *Expected Output*: `{ "status": "online", "database": "ONS-RVM", ... }`

2. **Verify Node Process in aaPanel**:
   Go to aaPanel ➔ **Website** ➔ **Node project** ➔ Status should be green **Running**.

3. **Verify Dashboard Web Access**:
   Open `https://rvm.yourdomain.com` in your browser.

---

## 5. Troubleshooting & Common Notices

### Q: How to resolve `dist/index.html` or `dist/assets` merge conflicts during `git pull`?
- **Root Cause**: Build assets generated by `npm run build` locally on the server conflict with incoming git branch changes.
- **Solution**: Run `git clean -fd dist/` and `git checkout -- .` before pulling:
  ```bash
  cd /www/wwwroot/rvm-dash
  git clean -fd dist/
  git checkout -- .
  git pull origin B2
  npm run build
  ```
  *Or force reset to match branch B2*:
  ```bash
  cd /www/wwwroot/rvm-dash
  git fetch origin B2
  git reset --hard origin/B2
  npm run build
  ```


### Q: How to resolve `502 Bad Gateway` error on `https://isprvm.binishaqsoft.com`?
- **Root Cause**: Nginx cannot connect to the Node.js backend on `http://127.0.0.1:5009` because the process is stopped or port `5009` is mismatched.
- **Solution 1 (aaPanel GUI)**:
  - Go to aaPanel ➔ **Website** ➔ **Node project** tab.
  - Find `rvm-master-dashboard` (or `isprvm.binishaqsoft.com`).
  - If status is **Stopped**, click **Start** or **Restart**.
  - Click **Settings**: Verify **Project Port** is set to `5009`.
- **Solution 2 (Server Terminal PM2 Command)**:
  ```bash
  cd /www/wwwroot/rvm-dash
  pm2 reload ecosystem.config.cjs --env production || pm2 start ecosystem.config.cjs --env production
  pm2 save
  ```

---




## 6. Security Firewall Rules (aaPanel Security Tab)

| Port | Protocol | Usage | aaPanel Security Action |
| :--- | :--- | :--- | :--- |
| **80** | TCP | HTTP (Redirects to HTTPS) | **Accept** / **Allow** |
| **443** | TCP | HTTPS Dashboard Access | **Accept** / **Allow** |
| **5009** | TCP | Node Express Backend Internal API | **Internal Only** (Keep blocked externally) |
| **27017** | TCP | MongoDB Atlas Outbound SRV | **Outbound Accept** |

---

## 7. Summary of Deployed Features

- 👑 **Master Developer Security & Auth Portal** (`onenet` / `Admin&86`)
- 🛡️ **Role-Based Access Control (RBAC)** (*Super Admin*, *Fleet Operator*, *Analytics Analyst*, *Support Specialist*)
- 🤖 **Dynamic RVM Machine Dropdown & Multi-Select Picker**
- 🔒 **`rvmapp` Restoration Denial Protection Rule** (Read-Only Source Protection)
- 🔄 **One-Way Database Sync Engine** (`rvmapp` ➔ `ONS-RVM`)
- 🌿 **Audited ESG Environmental Carbon Impact & Equivalency Calculators** (Trees Planted & Car Miles Avoided)
