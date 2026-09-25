# Mobile Application (`SmartRecycling` / `mobileapp`) Settings & Rules

Whenever the user mentions **mobileapp**, **SmartRecycling**, or works on files inside `mobile_app/`, apply these permanent instructions:

## 1. Project Identity & Paths
- **App Name**: `SmartRecycling`
- **Package Name**: `com.pleaseisp`
- **Root Directory**: `d:\GIT-HUB\RVM-dash\mobile_app`
- **Output Artifacts**:
  - APK: `mobile_app\release-playstore\SmartRecycling-v2.0.6.apk`
  - AAB: `mobile_app\release-playstore\SmartRecycling-v2.0.6.aab`
- **Signing Credentials**:
  - Keystore: `mobile_app\android\app\my-upload-key.keystore` (Alias: `my-key-alias`)
  - Release SHA-1: `A9:49:98:AB:88:D7:9E:CA:E3:FE:1F:A7:5B:CD:01:C7:3C:CD:E0:38`
  - Debug SHA-1: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`

## 2. Authentication & Google Sign-In Architecture
- **Native Android Module**:
  - `mobile_app\android\app\src\main\java\com\pleaseisp\GoogleAuthModule.kt`
  - Uses direct native `AccountManager.newChooseAccountIntent` for account selection.
  - **Rule**: Never fall back from GoogleSignIn into AccountManager in sequence; that causes double account chooser popups.
- **Login UI & Account Memory**:
  - File: `mobile_app\screens\LoginScreen.jsx`
  - Save `@last_google_user` (`email`, `name`, `photoUrl`) into `AsyncStorage` on sign-in.
  - If a user has previously signed in:
    - Button displays: `Continue as <Name>` (1-tap instant login with zero dialogs).
    - Beneath the button, display `Switch or use another account` link to open the single account chooser dialog.
  - No Facebook login button should appear.
- **Enterprise / Corporate Verification**:
  - Backend Endpoint: `https://isprvm.binishaqsoft.com/api/auth/google` in `server/index.js`.
  - Corporate domains (e.g. `@engro.com`, `@bankalfalah.com`, `@ucp.edu.pk`) automatically get assigned `user_type: 'ENTERPRISE'` and linked to their organization ID and department.
  - Personal `@gmail.com` accounts default to `user_type: 'CITIZEN'`. Users can enter a Company Code in profile to link with their employer.

## 3. Standard Build & Test Routine
Always follow this 4-step sequence when building or testing the mobile app:
1. **Bundle JS**:
   ```bash
   cd d:\GIT-HUB\RVM-dash\mobile_app
   npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res/
   ```
2. **Compile Release APK & AAB**:
   ```powershell
   cd d:\GIT-HUB\RVM-dash\mobile_app\android
   powershell -Command "./gradlew assembleRelease bundleRelease"
   ```
3. **Copy to Release Folder**:
   ```powershell
   Copy-Item -Force './android/app/build/outputs/apk/release/app-release.apk' './release-playstore/SmartRecycling-v2.0.6.apk'
   Copy-Item -Force './android/app/build/outputs/bundle/release/app-release.aab' './release-playstore/SmartRecycling-v2.0.6.aab'
   ```
4. **Install to Connected Device**:
   ```powershell
   adb install -r ./release-playstore/SmartRecycling-v2.0.6.apk
   ```
