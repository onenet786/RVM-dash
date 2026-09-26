# RVM-dash Workspace Rules & Permanent Memory

## Kiosk Desktop Application Roles
- **`PecoDropDesktopApp`** -> **ENTERPRISE / CORPORATE CLIENTS**
  - Path: `d:\GIT-HUB\RVM-dash\PecoDropDesktopApp`
  - Purpose: Dedicated for corporate campuses, private offices, factories, and university workplaces (e.g., Engro, Unilever, PepsiCo, Banks).
  - Physical Architecture & Appearance:
    - Dual Landscape Displays: Screen 1 (Left: Video & Instructions), Screen 2 (Right: Interactive Kiosk & Live Leaderboard).
    - Left Console: Integrated Optical QR Code scanner window & digital keypad for employee authentication.
    - 3 Illuminated Shape Intake Apertures:
      - ⭕ **Circle (Neon Magenta / Pink Glow)**: Plastic PET Bottles.
      - 🔺 **Triangle (Neon Emerald Green Glow)**: Aluminum & Metal Beverage Cans.
      - 🟦 **Square (Neon Cyan Blue Glow)**: Office Paper & Documents (weighed in grams/kg via HX711 load cell).
  - Features: Corporate employee greeting, department tracking, cafeteria discounts, internal corporate perks, and CSR/ESG environmental metrics.
  - Confidential Hotkeys (Buffer Sequence):
    - `1122`: Activates Demo Mode & opens Demo Testing simulator window.
    - `1218`: Confidential System Restart dialogue (Yes / No / Cancel).
    - `1219`: Confidential System Shutdown dialogue (Yes / No / Cancel).
  - **Conversational Rule**: Whenever the user asks about or mentions "pecodrop" / "PecoDrop", always refer to and maintain this exact physical kiosk identity (dual displays, QR scanner, ⭕ Circle Plastic, 🔺 Triangle Cans, 🟦 Square Paper) and enterprise corporate workflow.

- **`RVMDesktopApp`** -> **GENERAL PUBLIC**
  - Path: `d:\GIT-HUB\RVM-dash\RVMDesktopApp`
  - Purpose: Dedicated for the general public at public shopping malls, metro/transit stations, commercial hubs, and municipal parks.
  - Materials: Standard public container intake:
    - 🧴 **PLASTIC**: PET / HDPE bottles (S, M, L counts + Total pcs)
    - 🥫 **CAN**: Beverage cans (S, M, L counts + Total pcs)
    - 🧃 **UBC**: Tetra Pak cartons (S, M, L counts + Total pcs)
    - 🚫 **REJECT**: Rejected items counter + Total pcs
  - Features: Citizen gamification, instant mobile wallet payouts (EasyPaisa, JazzCash, mobile load), public consumer merchant coupons, live session container breakdown with integrated reward balance, and national/kiosk leaderboards.
  - Confidential Hotkeys (Buffer Sequence):
    - `1122`: Activates Demo Mode & opens Demo Testing simulator window.
    - `1218`: Confidential System Restart dialogue (Yes / No / Cancel).
    - `1219`: Confidential System Shutdown dialogue (Yes / No / Cancel).
  - Launch Command: `powershell -ExecutionPolicy Bypass -File .\RVMDesktopApp\launch-kiosk.ps1`
  - **Conversational & Architectural Rule ("RVM" Reference)**:
    - Whenever the user refers to **"RVM"**, strictly map to `RVMDesktopApp` (never confuse with enterprise `PecoDropDesktopApp`).
    - Use this conversation as the canonical baseline for UI dimensions and layout:
      - Live Session Container Breakdown cards must remain compact without hardcoded excessive `MinHeight` or empty flexible spacer rows that push items off-screen.
      - Maintain dynamic adaptive height management (`UpdateAdaptiveLayoutHeights()` in `MainWindow.xaml.cs`) so that Instruction Video and How-To guides scale proportionally on $\le 1200$px displays (1080p landscape/laptops) and $\ge 1600$px tall kiosk displays without clipping the breakdown or leaderboard cards.
      - Idle mode smooth zoom expands video to 50% screen height and seamlessly restores when user touches screen or presses `0`.

## Core Development Guidelines
1. **Never Mix Logic**: Keep code, database configs, serial ports, UI views, and ad playlists strictly separated between `PecoDropDesktopApp` and `RVMDesktopApp`.
2. **Context Awareness**: Whenever the user asks to modify, run, build, or debug a desktop app, verify whether the task targets the Enterprise client (`PecoDropDesktopApp`) or the Public system (`RVMDesktopApp`). Always maintain the physical PecoDrop context when PecoDrop is referenced.

---

## Mobile Application Guidelines (`mobileapp`)
- **App Name & Package**:
  - Name: `SmartRecycling` (display label in strings.xml and package builds).
  - Package ID: `com.pleaseisp`
  - Workspace Path: `d:\GIT-HUB\RVM-dash\mobile_app`
  - Release Deliverables: `mobile_app\release-playstore\SmartRecycling-v2.0.6.apk` and `SmartRecycling-v2.0.6.aab`.

- **Keystore & Signatures**:
  - Upload Keystore: `mobile_app\android\app\my-upload-key.keystore` (alias: `my-key-alias`).
  - Release SHA-1: `A9:49:98:AB:88:D7:9E:CA:E3:FE:1F:A7:5B:CD:01:C7:3C:CD:E0:38`
  - Debug SHA-1: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`

- **Authentication & Google Sign-In**:
  - Native Module: `GoogleAuthModule.kt` (`com.pleaseisp.GoogleAuthModule`) linked in `MainApplication.kt` with `GoogleAuthPackage.kt`.
  - Account Chooser: Uses direct native `AccountManager.newChooseAccountIntent` (prevents double prompt issue).
  - Account Remembering:
    - On sign-in, save `@last_google_user` in `AsyncStorage`.
    - Next time, button displays 1-tap: `"Continue as <Name>"` (direct login without dialogs).
    - Under the button, display `"Switch or use another account"` which opens the picker dialog.
  - No Facebook login: Removed from UI.

- **Corporate / Enterprise Verification via Google**:
  - Endpoint: `https://isprvm.binishaqsoft.com/api/auth/google` (implemented in `server/index.js`).
  - Automatic Corporate Domain Match: If email domain matches an organization in `organizations` (e.g. `@engro.com`, `@bankalfalah.com`, `@ucp.edu.pk`), the account is automatically assigned `user_type: 'ENTERPRISE'`, linked to `org_id`, assigned department, and given employee perks.
  - Personal Gmail (`@gmail.com`): Defaults to `user_type: 'CITIZEN'`. Users can link corporate membership using Company Code / Corporate ID in profile.

- **Build & Deployment Routine**:
  1. Bundle JS: `npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res/`
  2. Assemble & Bundle: Run `./gradlew assembleRelease bundleRelease` from `mobile_app/android`.
  3. Deploy Output: Copy artifacts to `mobile_app/release-playstore/` as `SmartRecycling-v2.0.6.apk` and `SmartRecycling-v2.0.6.aab`.
  4. Test on Connected Device: `adb install -r ./release-playstore/SmartRecycling-v2.0.6.apk`.

---

## Web Dashboard Guidelines (`RVM-dash` Master Portal)
- **Portal Path**: `d:\GIT-HUB\RVM-dash`
- **Purpose**: Unified SaaS & Master Control Portal for Smart Recycling Machines (Public RVMs) and Corporate Campus Kiosks (PecoDrop). Built with React + Vite + Tailwind CSS + Node.js/Express + PostgreSQL.
- **Production Server**: Node daemon on `http://localhost:5009` (proxied via NGINX in production at `isprvm.binishaqsoft.com`).

### 1. Hierarchy & Multi-Tenant Access Model
- **Roles & Permissions**:
  - **Super Admin (`super_admin` / `onenet` / `bilalaaqueel`)**:
    - Full system governance across all RVMs, PecoDrop units, and client tenants.
    - Can approve/reject client tenant onboarding requests.
    - Can assign unassigned/master RVMs & PecoDrop units to any corporate client (`kiosk_org_bindings`).
    - **Client Deletion Authority**: Super Admin can delete individual enterprise clients or perform bulk deletions. Upon deletion, any bound machines are automatically returned to the `ISP_MASTER` fleet (`ISP Environmental Master (All Sites)`), orphaned bindings are purged, and associated sub-users/client admins are removed.
    - Full access to DB Switcher, System Health, and Database Backups.
  - **Client Admin (`client_admin`)**:
    - Organization lead (e.g. CSR / ESG Lead of Engro, Bank Alfalah, UCP, etc.).
    - Created during corporate client onboarding or manually provisioned. Requires ISP Super Admin approval before activation.
    - Can ONLY view machines and PecoDrop units bound to their organization.
    - Can manage departments, ESG goals, corporate rewards, and team members under their organization.
    - Can create **Corporate Sub-Users** and delegate specific machines from their assigned fleet.
  - **Corporate Sub-User (`corporate_sub_user`)**:
    - Created by a Client Admin to oversee specific branches, floors, or cafeteria sites.
    - Restricted STRICTLY to the specific subset of machine IDs assigned to their user profile (`accessible_machines`).
    - Cannot access hardware or statistics belonging to other machines or other corporate tenants.
  - **Standard User (`user`)**:
    - Read-only operational viewer or technician scoped to assigned sites.

### 2. Enterprise Corporate Clients & Hardware Lifecycle
- **Tenant Data Structure**:
  - Table `organizations`: Stores `org_id`, `name`, `domain`, `status` (`ACTIVE`, `PENDING_APPROVAL`, `SUSPENDED`), ESG targets, logos, and custom theme overrides.
  - Table `kiosk_org_bindings`: Maps `kiosk_id` (machine_id) to `org_id` with `installed_location` and `assigned_by`.
  - Machine table `machines`: Stores `client_id` (or `'ISP_MASTER'` when unassigned), `client_name`, and hardware telemetry.
- **Safe Kiosk Re-Assignment & Deletion Flow**:
  - Deleting an enterprise client NEVER deletes physical machines or recycling transaction logs.
  - In `DELETE /api/enterprise/organizations/:orgId` and `POST /api/enterprise/organizations/bulk-delete`:
    1. Delete records from `kiosk_org_bindings WHERE org_id IN (...)`.
    2. Reset machines `WHERE client_id IN (...)` back to `client_id = 'ISP_MASTER'`, `client_name = 'ISP Environmental Master (All Sites)'`.
    3. Purge associated departments from `departments`.
    4. Purge client admin and corporate sub-users from `adminaccounts WHERE org_id IN (...)`.
    5. Delete the organization record from `organizations`.

### 3. UI/UX Design System & Theme Accessibility (WCAG AAA)
- **Curated Theme System**:
  - 6 Themes: `isp-eco` (default green), `isp-portal` (emerald deep), `cyber-dark` (high-tech dark), `ocean-dark` (deep teal), `neon-violet` (modern purple), `sleek-light` (high-contrast corporate light).
- **Contrast & Visibility Standards**:
  - Always use theme tokens (`t-text-primary`, `t-text-secondary`, `t-text-muted`, `t-bg`, `t-bg-sec`, `t-border`) rather than hardcoded muted slate or gray on dark backgrounds.
  - For status pills and material badges (Bottles, Cans, UBC, Paper, Rejects), always provide paired light/dark classes with high contrast:
    - Cyan: `text-cyan-700 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/30`
    - Emerald: `text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30`
    - Amber: `text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/30`
    - Rose: `text-rose-700 dark:text-rose-400 bg-rose-500/10 border-rose-500/30`
    - Purple: `text-purple-700 dark:text-purple-400 bg-purple-500/10 border-purple-500/30`
  - Table headers, dropdown selects, and input controls must enforce distinct background and foreground tokens to prevent white-on-white or gray-on-dark text illegibility.


