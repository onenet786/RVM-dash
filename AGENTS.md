# RVM-dash Workspace Rules & Permanent Memory

## Kiosk Desktop Application Roles
- **`PecoDropDesktopApp`** -> **ENTERPRISE / CORPORATE CLIENTS**
  - Path: `d:\GIT-HUB\RVM-dash\PecoDropDesktopApp`
  - Purpose: Dedicated for corporate campuses, private offices, factories, and university workplaces (e.g., Engro, Unilever, PepsiCo, Banks).
  - Materials: Multi-material recycling — Plastic (PET), Aluminum Cans (Metal), and Document/Office Paper (by weight in Kg via HX711 load cell).
  - Features: Corporate employee greeting, department tracking, cafeteria discounts, internal corporate perks, and CSR/ESG environmental metrics.

- **`RVMDesktopApp`** -> **GENERAL PUBLIC**
  - Path: `d:\GIT-HUB\RVM-dash\RVMDesktopApp`
  - Purpose: Dedicated for the general public at public shopping malls, metro/transit stations, commercial hubs, and municipal parks.
  - Materials: Standard public container intake (primarily PET bottles & beverage cans).
  - Features: Citizen gamification, instant mobile wallet payouts (EasyPaisa, JazzCash, mobile load), public consumer merchant coupons, and national leaderboards.

## Core Development Guidelines
1. **Never Mix Logic**: Keep code, database configs, serial ports, UI views, and ad playlists strictly separated between `PecoDropDesktopApp` and `RVMDesktopApp`.
2. **Context Awareness**: Whenever the user asks to modify, run, build, or debug a desktop app, verify whether the task targets the Enterprise client (`PecoDropDesktopApp`) or the Public system (`RVMDesktopApp`).

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

