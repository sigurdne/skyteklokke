#!/bin/bash

# Local build helper script for SkyteKlokke
# This script builds an unsigned, minified release APK for testing

set -e  # Exit on error

echo "🚀 Starting local APK build..."
echo ""

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "📁 Project root: $PROJECT_ROOT"
echo ""

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
if [ -f "package-lock.json" ]; then
    npm ci --legacy-peer-deps
else
    npm install --legacy-peer-deps
fi
echo ""

# Step 2: Generate React Native codegen artifacts (if script exists)
echo "🔧 Generating React Native codegen artifacts..."
if [ -f "node_modules/react-native/scripts/generate-codegen-artifacts.js" ]; then
    node node_modules/react-native/scripts/generate-codegen-artifacts.js \
        --path "$PROJECT_ROOT" \
        --outputPath "$PROJECT_ROOT/android/app/build/generated/source/codegen" || true
    echo "✅ Codegen artifacts generated"
else
    echo "⚠️  Codegen script not found, skipping..."
fi
echo ""

# Step 3: Clean Android build caches
echo "🧹 Cleaning Android build caches..."
cd android
rm -rf app/build
rm -rf app/.cxx
rm -rf build
rm -rf .gradle
echo "✅ Build caches cleaned"
echo ""

# Step 4: Build release APK
echo "🔨 Building release APK..."
echo "   This may take a few minutes..."
echo ""
./gradlew clean assembleRelease --stacktrace
echo ""

# Step 5: Find and display APK location
echo "🔍 Locating built APK..."
APK_PATH="$PROJECT_ROOT/android/app/build/outputs/apk/release/app-release.apk"

if [ -f "$APK_PATH" ]; then
    # Read version from app.json
    VERSION=$(grep -oP '(?<="version": ")[^"]+' "$PROJECT_ROOT/app.json")
    
    # Create versioned filename
    DEST_NAME="skyteklokke-v${VERSION}.apk"
    DEST_PATH="$PROJECT_ROOT/$DEST_NAME"
    
    # Copy and rename APK to project root
    echo "📋 Copying APK to project root..."
    cp "$APK_PATH" "$DEST_PATH"
    
    # Get file size
    SIZE=$(du -h "$DEST_PATH" | cut -f1)
    
    echo ""
    echo -e "${GREEN}✅ BUILD SUCCESSFUL!${NC}"
    echo ""
    echo "📦 APK Details:"
    echo "   Version:  $VERSION"
    echo "   Size:     $SIZE"
    echo "   Location: $DEST_PATH"
    echo ""
    echo "📱 To install on device:"
    echo "   adb install $DEST_PATH"
    echo ""
else
    echo -e "${RED}❌ Build failed - APK not found at expected location${NC}"
    echo "Expected: $APK_PATH"
    exit 1
fi
