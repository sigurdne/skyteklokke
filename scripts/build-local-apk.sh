#!/usr/bin/env bash
set -euo pipefail

echo "== SkyteKlokke: Local APK build helper =="
echo "This script will attempt to install dependencies and build an unsigned, minified release APK."
echo

# Basic environment checks
command -v node >/dev/null 2>&1 || { echo "ERROR: node not found in PATH"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "ERROR: npm not found in PATH"; exit 1; }
command -v java >/dev/null 2>&1 || { echo "ERROR: java not found in PATH"; exit 1; }

if [[ -z "${ANDROID_SDK_ROOT:-}" && -z "${ANDROID_HOME:-}" ]]; then
  echo "WARNING: ANDROID_SDK_ROOT and ANDROID_HOME are not set. Gradle may still find SDK if installed via Android Studio."
else
  echo "ANDROID_SDK_ROOT=${ANDROID_SDK_ROOT:-(not set)}"
fi

# Ensure script executed from repo root
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# Install Node modules
if [[ -f package-lock.json ]]; then
  echo "Found package-lock.json -> running npm ci"
  if ! npm ci; then
    echo "npm ci failed; retrying with npm install --legacy-peer-deps"
    npm install --legacy-peer-deps
  fi
else
  echo "No package-lock.json -> running npm install"
  if ! npm install; then
    echo "npm install failed; try npm install --legacy-peer-deps"
    exit 1
  fi
fi

# (Optional) generate codegen artifacts if script exists
if [[ -f node_modules/react-native/scripts/generate-codegen-artifacts.js ]]; then
  echo "Generating React Native codegen artifacts (if needed)"
  # don't fail the whole run if this script exits nonzero
  node node_modules/react-native/scripts/generate-codegen-artifacts.js || true
fi

# Clean Android build artifacts that commonly cause CMake/autolinking issues
echo "Cleaning Android build artifacts (android/.cxx, android/app/build, android/build)"
rm -rf android/.cxx android/build android/app/build

# Build release APK (unsigned if signing config is removed)
cd android
echo "Running Gradle assembleRelease (this may take several minutes)"
./gradlew clean assembleRelease --stacktrace --info || {
  echo "Gradle build failed. See output above for details.";
  exit 1;
}

APK_DIR="$(pwd)/app/build/outputs/apk/release"
echo
if [[ -d "$APK_DIR" ]]; then
  echo "Build finished. APKs in: $APK_DIR"
  ls -lh "$APK_DIR" || true
else
  echo "Build finished but $APK_DIR not found. Check Gradle output for errors."
fi

echo "Done. If the build failed, copy/paste the tail of the output or the Gradle stacktrace here and I'll help debug."
