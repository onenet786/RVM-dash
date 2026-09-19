#!/bin/bash
set -e

echo "========================================================="
echo "   PecoDrop RVM / PleaseIsp — iOS IPA Build Script       "
echo "========================================================="

# 1. Ensure in mobile_app directory
cd "$(dirname "$0")"

echo "[1/5] Installing Node.js dependencies..."
npm install --legacy-peer-deps

echo "[2/5] Installing CocoaPods..."
cd ios
pod install --repo-update

echo "[3/5] Generating React Native iOS JavaScript Bundle..."
cd ..
npx react-native bundle \
  --platform ios \
  --dev false \
  --entry-file index.js \
  --bundle-output ios/main.jsbundle \
  --assets-dest ios/

echo "[4/5] Building Xcode Release Archive..."
cd ios
mkdir -p build
xcodebuild archive \
  -workspace PleaseIsp.xcworkspace \
  -scheme PleaseIsp \
  -configuration Release \
  -sdk iphoneos \
  -archivePath build/PleaseIsp.xcarchive \
  CODE_SIGNING_ALLOWED=NO \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGN_IDENTITY="" \
  clean archive

echo "[5/5] Packaging into IPA..."
mkdir -p build/Payload
cp -r "build/PleaseIsp.xcarchive/Products/Applications/PleaseIsp.app" build/Payload/
cd build
rm -f PecoDrop-v2.0.2.ipa
zip -r -9 PecoDrop-v2.0.2.ipa Payload/

echo "========================================================="
echo " SUCCESS: IPA created at mobile_app/ios/build/PecoDrop-v2.0.2.ipa"
echo "========================================================="
