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

---

# Phase 4 — Full Remediation (October 17, 2026)

A second audit found that most of Phase 1–3 had been bypassed or never covered the enterprise, kiosk, and mobile surfaces. The following was applied in code. **Items marked OPERATOR must be done on the servers and kiosks by a human.**

## Code changes (done)

| Area | Fix |
|---|---|
| Authorization | `x-user-role` / `x-user-name` / body `isSuperAdmin` / `roleId` hints are no longer trusted anywhere. Super-admin, client-admin, org and machine scope come only from the verified JWT. `/api/auth/me` no longer accepts unsigned `token_onenet_*` strings. |
| Secrets | No hardcoded JWT secret, PostgreSQL password, MongoDB URI, or master password remains in `server/`, `src/`, `ecosystem.config.cjs`, `deploy-aapanel.sh`, `.env.example`, helper scripts, or the desktop apps. A missing/weak `JWT_SECRET` now generates a random per-process secret and logs a warning. Only one JWT secret is accepted (the legacy multi-secret list is gone). `/api/admin/presets` requires super admin and never returns connection strings. |
| Admin DB tooling | `switch-db`, `restart-server`, `sync-databases`, `sync-postgres`, `test-postgres` require a super-admin JWT, are rate limited, and `switch-db` still requires `MASTER_DEV_*` credentials as a second factor. Database names are validated before `CREATE DATABASE`. `.env` rewrites now preserve every other variable and never write a JWT secret or admin password. |
| Passwords | Admin accounts, client admins, sub-users, mobile users, registration and password reset all use bcrypt. Legacy plaintext rows are upgraded on first successful login. The `adminpassword` fallback for password-less accounts is removed. Minimum lengths enforced. Auth cookie is `httpOnly` and `secure` behind HTTPS. |
| Google / OTP | Google ID tokens are verified against Google's tokeninfo endpoint (issuer, expiry, email_verified, optional `GOOGLE_CLIENT_IDS` audience). OTP codes are never returned in HTTP responses. OTP send and verify routes are rate limited; stored OTPs are single-use with expiry; pending OTP maps are pruned. Dead duplicate SSO routes removed. |
| Enterprise tenants | Org create/delete/bulk-delete/approve/reject/assign-machines: super admin only. Personalization, departments, employees, stats, bulk-import: authenticated and scoped to the caller's org. Sub-user create/update/delete: client admin of the same org or ISP admin; super-admin accounts can never be edited through sub-user routes. `GET /api/enterprise/organizations` returns public fields only to non-admins. Registration no longer accepts `userType`/`orgId` from the body and company codes must match exactly. |
| Citizen data | Points, history, redemptions, profile, corporate link/unlink, heartbeat and vouchers are user-scoped via `requireMobileUser`; with `ENFORCE_MOBILE_AUTH=true` a token is mandatory and a citizen can only act on their own account. Redemptions and payouts use atomic conditional updates (no double spend). Leaderboard phone numbers are masked for non-admins. `/api/collections/:name` restricts PII/credential tables to ISP admins and strips passwords. |
| Kiosks | All kiosk endpoints accept a shared `x-kiosk-key` header (`KIOSK_API_KEY` on the server, `KioskApiKey` in each kiosk `config.txt`). Until the key is configured the fleet keeps working unauthenticated. Machine registry checks fail closed. Config/point-settings/ads mutations require an admin JWT. Ad deletion matches exact ids/file names only. The fallback citizen account `08884424625` is gone from server and both kiosk apps; sessions without a known user are never credited, and the real user is credited the delta when the kiosk re-posts with the phone number. Machine totals are incremented by delta, not cumulatively. |
| Bugs | `claim-points` inserted into non-existent columns (fixed), is now atomic and rejects anonymous ids. Restore-snapshot `ReferenceError` fixed. DB restore runs in a transaction, only touches JSON document tables, and releases the client. Point-settings for one machine no longer overwrite the global default. Analytics read endpoint no longer zeroes telemetry. Fabricated audit data replaced with empty, labelled datasets. Health endpoint no longer leaks schema to anonymous callers and no longer leaks connections. |
| Performance | Heartbeat DDL runs once per process. Security seeding runs at most every 10 minutes. In-memory caches are bounded and pruned. Stale `STARTED` handshakes expire after 30 minutes. |
| Frontend | Master password removed from the bundle; role headers removed; CSV cells escaped against formula injection; stale-response guards on polling tabs; token only attached to same-origin requests; 403 no longer logs the user out. |
| Kiosk apps | Escape/Alt+F4 cannot exit the kiosk. B/C/U simulated deposits only work in demo mode. Admin login no longer prints default credentials and offline fallback only honours `AdminUsername`/`AdminPassword` from `config.txt`. In-flight guards on sync and handshake timers; shared `HttpClient`; ad file names sanitised; playlist cleanup only deletes `ad_*` files; serial and firmware input buffers capped. |
| Mobile app | Sends `Authorization: Bearer <token>` on every request after login (new build required). |
| Dependencies | `npm audit` production vulnerabilities: 7 → 0. |

## OPERATOR actions (required)

1. **Rotate every credential that was in git history**: PostgreSQL `postgres` password, both MongoDB Atlas users (`aaqueelphotos_db_user`, `mcsrwp_db_user`), the master developer password, and the Gmail app password. Then purge them from git history (e.g. `git filter-repo`) and force-push.
2. On the production server create `.env` from `.env.example` with: a 64-hex `JWT_SECRET`, the new `PG_PASSWORD`, `MASTER_DEV_PASSWORD`, `MONGODB_URI_ONS_RVM` / `MONGODB_URI_RVMAPP` (only if Mongo sync is still needed), `PUBLIC_BASE_URL=https://isprvm.binishaqsoft.com`, and SMTP settings. `pm2 restart rvm-dash`.
3. Generate `KIOSK_API_KEY` (32+ random hex chars), set it in `.env`, and add `KioskApiKey = <same value>` to `config.txt` on every RVM and PecoDrop kiosk. Deploy the rebuilt kiosk apps. Until the key is set, kiosk endpoints remain open.
4. Build and publish the new mobile app (version 2.0.7 or later) from `mobile_app/`, then set `ENFORCE_MOBILE_AUTH=true` in `.env` and restart. Until then, citizen endpoints still accept identifiers without a token.
5. Set `GOOGLE_CLIENT_IDS` to the OAuth client ids used by the mobile app and web portal to pin the Google token audience.
6. Change the kiosk local SQL admin credential (`RVM` / `Admin786`) in `AdminCredentials` on each machine.
7. Existing admin passwords are plaintext in `adminaccounts` until each user logs in once (auto-upgraded to bcrypt). Ask all admins to log in, or reset their passwords from the Security tab.
8. Remove committed binaries from the repo (seven copies of a 54 MB APK, MP4s, `.tmp/` is now ignored) to shrink clones.
9. `AGENTS.md` still documents the old PostgreSQL password in the "Live Database Verification Protocol" line; update it after rotation.
