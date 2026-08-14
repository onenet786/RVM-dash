# Production Deployment PRD: RVM Master Developer Dashboard
**Target Infrastructure**: Dedicated Ubuntu Linux Server with aaPanel Control Panel  
**Application Stack**: Node.js ES Modules (Express API), MongoDB Atlas Cluster, Vite React Frontend (SPA), PM2 Process Manager, Nginx Reverse Proxy  
**Document Version**: 2.0 (August 2026 - aaPanel Node Project Manager Spec)

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
  ├── aaPanel Node Project Manager (PM2 Engine)
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

#### Option B: aaPanel Web Terminal / SSH Command (Web Token Authenticated)
```bash
cd /www/wwwroot
# Embed your GitHub Web Personal Access Token (PAT) for seamless non-interactive clone:
git clone https://YOUR_GITHUB_TOKEN@github.com/onenet786/RVM-dash.git rvm-dash
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
| **Run Opt / Start Command** | `server/index.js` (or `npm run start`) | Server entry point script |
| **Project Port** | `5000` | Internal Express backend API port |
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
PORT=5000
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
   - Open Site Settings ➔ **SSL** ➔ Select **Let's Encrypt** tab.
   - Select domain `rvm.yourdomain.com` ➔ Click **Apply**.
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
   curl http://127.0.0.1:5000/api/health
   ```
   *Expected Output*: `{ "status": "online", "database": "ONS-RVM", ... }`

2. **Verify Node Process in aaPanel**:
   Go to aaPanel ➔ **Website** ➔ **Node project** ➔ Status should be green **Running**.

3. **Verify Dashboard Web Access**:
   Open `https://rvm.yourdomain.com` in your browser.

---

## 5. Troubleshooting & Common Notices

### Q: What does `(!) Some chunks are larger than 500 kB after minification` mean during `npm run build`?
- **Answer**: This is a **warning notice (not a fatal error)** informing you that vendor libraries (React, Recharts, Lucide icons) compiled into a bundle size over 500 kB.
- **Fix Applied**: We updated `vite.config.js` with `build.chunkSizeWarningLimit: 1200`.
- **To Apply on Server**: Run the following update commands in your server terminal:
  ```bash
  cd /www/wwwroot/rvm-dash
  git pull origin main
  bash deploy-aapanel.sh
  ```

---

## 6. Security Firewall Rules (aaPanel Security Tab)

| Port | Protocol | Usage | aaPanel Security Action |
| :--- | :--- | :--- | :--- |
| **80** | TCP | HTTP (Redirects to HTTPS) | **Accept** / **Allow** |
| **443** | TCP | HTTPS Dashboard Access | **Accept** / **Allow** |
| **5000** | TCP | Node Express Backend Internal API | **Internal Only** (Keep blocked externally) |
| **27017** | TCP | MongoDB Atlas Outbound SRV | **Outbound Accept** |

---

## 7. Summary of Deployed Features

- 👑 **Master Developer Security & Auth Portal** (`onenet` / `Admin&86`)
- 🛡️ **Role-Based Access Control (RBAC)** (*Super Admin*, *Fleet Operator*, *Analytics Analyst*, *Support Specialist*)
- 🤖 **Dynamic RVM Machine Dropdown & Multi-Select Picker**
- 🔒 **`rvmapp` Restoration Denial Protection Rule** (Read-Only Source Protection)
- 🔄 **One-Way Database Sync Engine** (`rvmapp` ➔ `ONS-RVM`)
- 🌿 **Audited ESG Environmental Carbon Impact & Equivalency Calculators** (Trees Planted & Car Miles Avoided)

