#!/bin/bash

# Build Android App Bundle (AAB) for Google Play Store
# This script builds a signed release AAB ready for upload

set -e

echo "📦 Bygger App Bundle for Google Play Store..."
echo ""

# Check if keystore.properties exists
if [ ! -f "android/keystore.properties" ]; then
    echo "❌ Feil: android/keystore.properties finnes ikke!"
    echo ""
    echo "Opprett filen først med følgende innhold:"
    echo ""
    echo "storePassword=DITT_KEYSTORE_PASSORD"
    echo "keyPassword=DITT_KEY_PASSORD"
    echo "keyAlias=skyteklokke-upload"
    echo "storeFile=skyteklokke-upload.keystore"
    echo ""
    echo "Hvis du ikke har keystore ennå, kjør:"
    echo "  ./scripts/generate-upload-keystore.sh"
    echo ""
    exit 1
fi

# Check if keystore file exists
KEYSTORE_FILE=$(grep "storeFile=" android/keystore.properties | cut -d'=' -f2)
if [ ! -f "android/app/$KEYSTORE_FILE" ]; then
    echo "❌ Feil: Keystore-fil finnes ikke: android/app/$KEYSTORE_FILE"
    echo ""
    echo "Generer keystore først:"
    echo "  ./scripts/generate-upload-keystore.sh"
    echo ""
    exit 1
fi

# Extract current version from build.gradle
VERSION_CODE=$(grep "versionCode" android/app/build.gradle | head -1 | awk '{print $2}')
VERSION_NAME=$(grep "versionName" android/app/build.gradle | head -1 | awk '{print $2}' | tr -d '"')

echo "📋 Versjon: $VERSION_NAME (kode: $VERSION_CODE)"
echo ""

# Navigate to android directory
cd android

echo "🏗️  Bygger release bundle..."
echo ""

# Build the release bundle
./gradlew bundleRelease

# Check if build was successful
AAB_FILE="app/build/outputs/bundle/release/app-release.aab"
if [ ! -f "$AAB_FILE" ]; then
    echo ""
    echo "❌ Feil: AAB-fil ble ikke bygget!"
    echo ""
    exit 1
fi

# Get file size
AAB_SIZE=$(du -h "$AAB_FILE" | cut -f1)

echo ""
echo "✅ App Bundle bygget!"
echo ""
echo "📄 Fil: android/$AAB_FILE"
echo "📊 Størrelse: $AAB_SIZE"
echo "🏷️  Versjon: $VERSION_NAME (kode: $VERSION_CODE)"
echo ""
echo "📋 NESTE STEG:"
echo ""
echo "1. Logg inn på Play Console:"
echo "   https://play.google.com/console"
echo ""
echo "2. Gå til din app → Production → Create new release"
echo ""
echo "3. Last opp filen:"
echo "   android/$AAB_FILE"
echo ""
echo "4. Skriv release notes og send til review"
echo ""
echo "Se GOOGLE_PLAY_PUBLISHING.md for detaljert guide."
echo ""
