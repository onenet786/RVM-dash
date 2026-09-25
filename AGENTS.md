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
  - Materials: Standard public container intake (primarily PET bottles & beverage cans).
  - Features: Citizen gamification, instant mobile wallet payouts (EasyPaisa, JazzCash, mobile load), public consumer merchant coupons, and national leaderboards.
  - Confidential Hotkeys (Buffer Sequence):
    - `1122`: Activates Demo Mode & opens Demo Testing simulator window.
    - `1218`: Confidential System Restart dialogue (Yes / No / Cancel).
    - `1219`: Confidential System Shutdown dialogue (Yes / No / Cancel).

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

