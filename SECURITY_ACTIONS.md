# Security Hardening & Vulnerability Remediation Report

**Date:** September 11, 2026  
**System:** ISP RVM Central Telemetry & Fleet Management Dashboard (`RVM-dash`)  
**Auditor / Specialist:** Senior Ethical Hacker & Web Security Engineer  

---

## Executive Status Overview

All **Phase 1, Phase 2, and Phase 3** security remediations have been implemented directly into the codebase. This document outlines **Actions Done** (code and configuration fixes applied) and **Actions Needed** (operational steps for the system owner).

---

## Vulnerability & Action Matrix

| Ref # | Vulnerability Description | Severity | Action Status |
|---|---|---|---|
| **SEC-01** | Git tracking of `.env` and production database dumps (`backups/*.json`) | **CRITICAL** | **DONE** (Untracked + `.gitignore` updated) |
| **SEC-02** | Universal Auth Bypass & Privilege Escalation in `/api/auth/me` | **CRITICAL** | **DONE** (Eliminated `super_admin` fallback) |
| **SEC-03** | Missing Authentication across core management REST endpoints | **CRITICAL** | **DONE** (Enforced `authenticateToken` / `requireAdmin`) |
| **SEC-04** | Arbitrary File Download / Path Traversal in `/api/db/download/:filename` | **CRITICAL** | **DONE** (Path resolution & basename whitelist) |
| **SEC-05** | SQL Injection via unescaped `matchKey` in dynamic database engine | **CRITICAL** | **DONE** (Alphanumeric key whitelist sanitization) |
| **SEC-06** | Unauthenticated File Upload & Disk DoS in `/api/machine/ads/upload` | **HIGH** | **DONE** (Admin authentication required) |
| **SEC-07** | Insecure OTP generation, ignored expiry, and OTP leakage in HTTP response | **HIGH** | **DONE** (6-digit `crypto.randomInt`, expiry check enforced, leak removed) |
| **SEC-08** | Predictable string tokens (`token_username_timestamp`) without cryptography | **HIGH** | **DONE** (Genuine 24h HMAC-SHA256 signed JWTs) |
| **SEC-09** | Lack of Brute-Force Rate Limiting on Login & Password Reset | **MEDIUM** | **DONE** (`express-rate-limit` installed and mounted) |
| **SEC-10** | Missing Security HTTP Headers (HSTS, Clickjacking, MIME sniffing) | **MEDIUM** | **DONE** (`helmet` middleware configured and mounted) |
| **SEC-11** | Unbounded Point Forgery on Kiosk Claim Creation | **MEDIUM** | **DONE** (Cryptographic tokens + session caps) |

---

## Detailed Breakdown of Actions Done

### 1. Git Secrets & Database Dump Protection
* **Files Modified:** [`.gitignore`](file:///d:/GIT-HUB/RVM-dash/.gitignore)
* **What was done:**
  * Added `.env`, `*.env`, `backups/`, `*.backup`, `uploads/advertisements/`, and `*.log` to `.gitignore`.
  * Ran `git rm --cached` on `.env` and all files in `backups/` so that credentials, database dumps, and citizen PII are no longer tracked or pushed to GitHub.
  * Local copy of `.env` and local backup archives were preserved.

### 2. Elimination of Authentication Bypass in `/api/auth/me`
* **File Modified:** [`server/index.js`](file:///d:/GIT-HUB/RVM-dash/server/index.js)
* **What was done:**
  * Previously, if any unauthenticated or invalid token was sent, the server defaulted the session to `{ username: 'onenet', roleId: 'super_admin' }`.
  * Removed this fallback entirely.
  * Token signature is now verified cryptographically via `jwt.verify(token, JWT_SECRET)`.
  * Unauthenticated, tampered, or expired tokens immediately return HTTP 401 Unauthorized.

### 3. Central Authentication Middleware on Core Endpoints
* **Files Modified:** [`server/index.js`](file:///d:/GIT-HUB/RVM-dash/server/index.js), [`src/App.jsx`](file:///d:/GIT-HUB/RVM-dash/src/App.jsx)
* **What was done:**
  * Implemented `extractToken(req)`, `authenticateToken(req, res, next)`, and `requireAdmin(req, res, next)`.
  * Protected sensitive API routes:
    * `/api/overview` (KPIs)
    * `/api/collections/:name` (All raw database tables)
    * `/api/analytics/*` (Trends, leaderboard, machines, environmental impact, mobile users)
    * `/api/db/backup`, `/api/db/backups`, `/api/db/download/:filename`, `/api/db/restore`
    * `/api/security/roles` and `/api/security/users`
    * `/api/machine/ads/upload`
  * Added an automatic `window.fetch` interceptor in [`src/App.jsx`](file:///d:/GIT-HUB/RVM-dash/src/App.jsx) that automatically attaches `Authorization: Bearer <token>` to all dashboard requests, preventing any user disruption.

### 4. Path Traversal Guard on `/api/db/download/:filename`
* **File Modified:** [`server/index.js`](file:///d:/GIT-HUB/RVM-dash/server/index.js)
* **What was done:**
  * Sanitized `filename` using `path.basename()`.
  * Enforced directory boundary check: `resolvedPath.startsWith(path.resolve(BACKUPS_DIR))`.
  * Added `authenticateToken` and `requireAdmin` to prevent anonymous downloads of database dumps.

### 5. SQL Injection Remediation in Dynamic Engine
* **File Modified:** [`server/index.js`](file:///d:/GIT-HUB/RVM-dash/server/index.js)
* **What was done:**
  * Sanitized `matchKey` and `colName` in `updateDocInEngine` and `deleteDocFromEngine` using strict alphanumeric regex: `replace(/[^a-zA-Z0-9_]/g, '')`.
  * Reject queries with invalid keys before passing to PostgreSQL.

### 6. Hardened Mobile OTP Flow
* **File Modified:** [`server/index.js`](file:///d:/GIT-HUB/RVM-dash/server/index.js)
* **What was done:**
  * Replaced insecure `Math.random()` with Node.js `crypto.randomInt(100000, 999999)` for 6-digit cryptographically random OTPs.
  * Enforced expiration check: If `NOW() > otp_expiry`, rejection with HTTP 400 is returned.
  * Completely removed OTP code leakage from the HTTP JSON response body.
  * Mounted `otpLimiter` (max 5 requests per 15 minutes per IP) to block automated brute-force attacks.

### 7. Rate Limiting & Security Headers
* **Files Modified:** [`package.json`](file:///d:/GIT-HUB/RVM-dash/package.json), [`server/index.js`](file:///d:/GIT-HUB/RVM-dash/server/index.js)
* **What was done:**
  * Installed `helmet` and mounted it with HSTS, X-Frame-Options (Clickjacking defense), and X-Content-Type-Options (MIME-sniffing defense).
  * Installed `express-rate-limit` and mounted `loginLimiter` on `/api/auth/login` (max 15 requests per 5 minutes per IP).

### 8. Kiosk Claim Point Integrity
* **File Modified:** [`server/index.js`](file:///d:/GIT-HUB/RVM-dash/server/index.js)
* **What was done:**
  * Used `crypto.randomBytes(6).toString('hex')` to generate unpredictable, cryptographically random claim tokens.
  * Enforced bounds on session parameters (maximum 5,000 points and 500 bottles per session).

---

## Actions Needed by Owner (Operational Guidance)

The code-level vulnerabilities have been patched. To achieve 100% operational security in production, the system owner should complete the following operational steps:

### 1. Rotate Exposed Passwords
Because `.env` and database dumps were previously tracked in Git history, consider those old credentials compromised:
- [ ] **MongoDB Atlas:** Log in to MongoDB Atlas and change the passwords for users:
  - `aaqueelphotos_db_user`
  - `mcsrwp_db_user`
- [ ] **PostgreSQL:** Change the local PostgreSQL password on the Ubuntu hosting server (`ALTER USER postgres WITH PASSWORD 'NewStrongPassword';`) and update `PG_PASSWORD` in your server `.env`.
- [ ] **Master Developer Password:** Change the default master password in your server `.env`:
  ```bash
  MASTER_DEV_USERNAME=onenet
  MASTER_DEV_PASSWORD=YourNewUniquePasswordHere
  ```

### 2. Generate a Strong Production JWT Secret
In your server `.env` file, set a strong 64-character random string for `JWT_SECRET`:
```bash
JWT_SECRET=c8f8b39a7e6b014d5f29d9e21b8c0e1f7a4b8d9c2e0f1a3b5c7d9e1f3a5b7c9d
```
*(You can generate one using: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)*

### 3. Deploy Updates to Host Server
Run the following on your production server:
```bash
cd /path/to/RVM-dash
git pull origin B20
npm install
pm2 reload all
```
*(After reloading, log in once via the Dashboard to issue your new cryptographically signed JWT).*
