# Local build helper

This repo includes a helper script to build a local unsigned, minified release APK for testing.

## Quick Start

```bash
# from repo root
./scripts/build-local-apk.sh
```

The script will automatically:
- Install dependencies (`npm ci` or `npm install`)
- Generate React Native codegen artifacts (if available)
- Clean Android build caches
- Build release APK with `./gradlew clean assembleRelease`
- Copy and rename APK to project root as `skyteklokke-v{VERSION}.apk`

## Updating Version

To update the version before building, edit these 3 files:

### 1. `app.json`
```json
{
  "expo": {
    "version": "0.1.0-beta.6",  // <-- Update this
    ...
```

### 2. `app.json` (Android versionCode)
```json
{
  "expo": {
    ...
    "android": {
      ...
      "versionCode": 6,  // <-- Increment this (must be integer)
```

### 3. `android/app/build.gradle`
```gradle
defaultConfig {
    ...
    versionCode 6              // <-- Must match app.json versionCode
    versionName "0.1.0-beta.6" // <-- Must match app.json version
```

**Important:** All three version fields must be updated together. The `versionCode` must be incremented for each release (it's used by Android to determine which version is newer).

## Troubleshooting

If the script fails, check:
- Node.js and npm are installed
- Android SDK is properly configured
- Java 17+ is installed
- Run with more verbose output: `./scripts/build-local-apk.sh 2>&1 | tee build.log`
