# Production Deployment PRD: RVM Master Developer Dashboard
**Target Infrastructure**: Dedicated Ubuntu Linux Server with aaPanel Control Panel  
**Application Stack**: Node.js ES Modules (Express API), MongoDB Atlas Cluster, Vite React Frontend (SPA), PM2 Process Manager, Nginx Reverse Proxy  
**Document Version**: 1.0 (August 2026)

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
  │     └── Reverse Proxy /api/ ➔ http://127.0.0.1:5000
  │
  ├── PM2 Process Manager (Node.js Engine)
  │     └── [rvm-master-dashboard] process running server/index.js (Port 5000)
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
| **Process Manager** | PM2 Process Manager v5.x | aaPanel App Store / `npm i -g pm2` |
| **Web Server** | Nginx 1.22+ | aaPanel App Store ➔ Nginx |
| **SSL Certificate** | Let's Encrypt Free SSL | aaPanel Site Manager ➔ SSL Certificate |
| **Database** | MongoDB Atlas Cloud Clusters (`ONS-RVM` & `rvmapp`) | Remote DNS SRV (Port 27017 outbound open) |

---

## 3. Step-by-Step Production Hosting Guide (aaPanel)

### Step 1: Upload / Clone Project Code to aaPanel
1. Open aaPanel in browser `https://YOUR_SERVER_IP:8888`.
2. Navigate to **Files** ➔ Go to `/www/wwwroot/`.
3. Create folder `rvm-dash` or clone from Git:
   ```bash
   cd /www/wwwroot
   git clone https://github.com/onenet786/RVM-dash.git rvm-dash
   cd rvm-dash
   ```

---

### Step 2: Configure Environment Variables (`.env`)
Create file `/www/wwwroot/rvm-dash/.env` in aaPanel File Manager or via SSH:

```ini
MONGODB_URI=mongodb+srv://aaqueelphotos_db_user:Z8NPUThldyeypEEQ@cluster0.ktted0m.mongodb.net/ONS-RVM?retryWrites=true&w=majority
MONGODB_DBNAME=ONS-RVM
PORT=5000
JWT_SECRET=rvm-isp-production-secret-key-2026-aapanel
ADMIN_USERNAME=admin
ADMIN_PASSWORD=adminpassword
```

---

### Step 3: Configure PM2 via aaPanel Node Project Manager

1. Go to aaPanel ➔ **Website** ➔ **Node project** tab.
2. Click **Add Node Project**:
   - **Path**: `/www/wwwroot/rvm-dash`
   - **Name**: `rvm-master-dashboard`
   - **Run option**: `npm run start` (or process file `server/index.js`)
   - **Port**: `5000`
   - **User**: `www` (or `root`)
3. Alternatively, launch PM2 directly via SSH using the included `ecosystem.config.cjs`:
   ```bash
   cd /www/wwwroot/rvm-dash
   npm install --production=false
   npm run build
   pm2 start ecosystem.config.cjs --env production
   pm2 save
   ```

---

### Step 4: Create Website & Reverse Proxy in aaPanel

1. Go to aaPanel ➔ **Website** ➔ **Add Site**:
   - **Domain Name**: `rvm.yourdomain.com` (or server IP)
   - **Root Directory**: `/www/wwwroot/rvm-dash/dist`
   - **FTP / Database**: None (handled remotely by MongoDB Atlas & local Node process)
2. Click **Submit**.

3. **Configure Nginx Rules**:
   - Open Site Settings ➔ **Config** (or **URL Rewrite** / **Reverse Proxy**).
   - Paste the provided configuration from `nginx-aapanel.conf`:

```nginx
server {
    listen 80;
    server_name rvm.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name rvm.yourdomain.com;

    ssl_certificate /www/server/panel/vhost/cert/rvm.yourdomain.com/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/rvm.yourdomain.com/privkey.pem;

    root /www/wwwroot/rvm-dash/dist;
    index index.html;
    client_max_body_size 50M;

    # Backend API Reverse Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SPA Client Fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

4. **Enable Free SSL**:
   - Open Site Settings ➔ **SSL** ➔ Select **Let's Encrypt** ➔ Select Domain ➔ Click **Apply**.
   - Enable **Force HTTPS**.

---

### Step 5: Automated Production Updates (`deploy-aapanel.sh`)

Whenever you make updates to the repository, run the automated deployment script on Ubuntu:

```bash
cd /www/wwwroot/rvm-dash
bash deploy-aapanel.sh
```

---

## 4. Verification & Health Monitoring

1. **Verify Backend Status**:
   ```bash
   curl http://127.0.0.1:5000/api/health
   ```
   *Expected Output*: `{ "status": "online", "database": "ONS-RVM", ... }`

2. **Verify PM2 Process**:
   ```bash
   pm2 status
   pm2 logs rvm-master-dashboard
   ```

3. **Verify Dashboard Web Access**:
   Open `https://rvm.yourdomain.com` in your browser.

---

## 5. Security & Firewall Rules (Ubuntu UFW / aaPanel Security)

| Port | Protocol | Usage | aaPanel Security Action |
| :--- | :--- | :--- | :--- |
| **80** | TCP | HTTP (Redirects to HTTPS) | **Allow** |
| **443** | TCP | HTTPS Dashboard Access | **Allow** |
| **5000** | TCP | Node Express Backend Internal API | **Internal Only** (Keep blocked externally) |
| **27017** | TCP | MongoDB Atlas Outbound SRV | **Outbound Allow** |

---

## 6. Enterprise Features Deployed

- 👑 **Master Developer Security & Auth Portal** (`onenet` / `Admin&86`)
- 🛡️ **Role-Based Access Control (RBAC)** (*Super Admin*, *Fleet Operator*, *Analytics Analyst*, *Support Specialist*)
- 🤖 **Dynamic RVM Machine Dropdown & Multi-Select Picker**
- 🔒 **`rvmapp` Restoration Denial Protection Rule** (Read-Only Source Protection)
- 🔄 **One-Way Database Sync Engine** (`rvmapp` ➔ `ONS-RVM`)
- 🌿 **Audited ESG Environmental Carbon Impact & Equivalency Calculators** (Trees Planted & Car Miles Avoided)
