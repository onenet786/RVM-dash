# PecoDrop / PleaseIsp — iOS IPA Build & Installation Guide

This guide explains how to generate and install the **iOS `.ipa` package** for the PecoDrop RVM mobile application (`PleaseIsp` v2.0.2).

---

## ⚠️ Important Note on iOS Compilation

Unlike Android APKs (which compile on Windows/Linux via Java and Gradle), **Apple strictly requires macOS with Xcode** to compile native iOS code (`.ipa` Mach-O binaries).

To make this effortless without requiring a physical Mac, we have set up **automated cloud builds via GitHub Actions** (running on Apple Silicon macOS runners) in this repository.

---

## 🚀 Method 1: Free Automated Cloud Build via GitHub Actions (Recommended — No Mac Needed!)

Since this repository is connected to GitHub (`https://github.com/onenet786/RVM-dash.git`), GitHub provides **free cloud macOS runners (`macos-14`)**.

### How to Trigger the Cloud Build in 30 Seconds:
1. Open your repository on GitHub: `https://github.com/onenet786/RVM-dash`
2. Click on the **Actions** tab at the top.
3. In the left sidebar, click **"Build iOS IPA"**.
4. Click the **"Run workflow"** dropdown button on the right, and click the green **"Run workflow"** button.
5. GitHub's cloud macOS runner will automatically:
   - Install CocoaPods & Node.js dependencies.
   - Compile the React Native project with Xcode.
   - Package `PecoDrop-v2.0.2.ipa`.
   - Upload the finished `.ipa` file directly to the workflow page under **Artifacts** for 1-click download!

---

## 💻 Method 2: Local Build on any Mac (1-Command Build)

If you or a team member have a Mac:

1. Clone or pull the repository on your Mac.
2. Open Terminal and navigate to `mobile_app`:
   ```bash
   cd mobile_app
   chmod +x build_ios_ipa.sh
   ./build_ios_ipa.sh
   ```
3. The script will automatically install Pods, build the Xcode release archive, and generate:
   ```
   mobile_app/ios/build/PecoDrop-v2.0.2.ipa
   ```

---

## 📱 How to Install the IPA on iPhone / iPad

Once you download `PecoDrop-v2.0.2.ipa`, you can install it using any of the following methods:

| Tool | Operating System | Requirements | Best For |
| :--- | :--- | :--- | :--- |
| **Sideloadly** | Windows & Mac | Free Apple ID + USB cable | Easiest 1-click install from Windows PC |
| **AltStore** | Windows & Mac | Free Apple ID | Wireless installation & automatic renewal |
| **TrollStore** | iOS Device | iOS 14.0–17.0 | Permanent installation without 7-day resigning |
| **Apple Configurator** | Mac | Free | Mass installation / supervised devices |
| **TestFlight** | Cloud | Apple Developer Account ($99/yr) | Public & internal beta testing via App Store link |

### Installing via Sideloadly on Windows (Takes 2 minutes):
1. Download and install **[Sideloadly](https://sideloadly.io/)** on your Windows PC.
2. Connect your iPhone to your PC via USB cable and tap **"Trust this computer"** on your iPhone.
3. Open Sideloadly, drag and drop `PecoDrop-v2.0.2.ipa` into Sideloadly.
4. Enter your Apple ID email and click **Start**.
5. Once complete, on your iPhone go to:  
   **Settings &rarr; General &rarr; VPN & Device Management** &rarr; Tap your Apple ID &rarr; Tap **"Trust"**.
6. Open the PecoDrop app!
