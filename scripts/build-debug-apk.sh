#!/bin/bash

# Skript for å bygge og signere APK for testing

set -e  # Stopp ved feil

# Farger for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Få prosjektets rot-katalog
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}🔨 Bygger release APK med debug-signering...${NC}"
echo -e "${BLUE}   (APK-en bygges automatisk signert med APK Signature Scheme v2)${NC}"
cd android
./gradlew assembleRelease
cd ..

# Release APK er nå signert med debug keystore (konfigurert i build.gradle)
APK_PATH="android/app/build/outputs/apk/release/app-release.apk"

if [ ! -f "$APK_PATH" ]; then
    echo -e "${RED}❌ Feil: APK ikke funnet: $APK_PATH${NC}"
    exit 1
fi

echo -e "${GREEN}✅ APK bygget og signert${NC}"

# Les versjon fra build.gradle
VERSION=$(grep "versionName" android/app/build.gradle | awk '{print $2}' | tr -d '"')

OUTPUT_NAME="skyteklokke-${VERSION}-debug.apk"

echo -e "${BLUE}📦 Kopierer APK til prosjektrot...${NC}"
cp "$APK_PATH" "$OUTPUT_NAME"

echo ""
echo -e "${GREEN}✅ Ferdig!${NC}"
echo -e "${GREEN}APK: $OUTPUT_NAME${NC}"
ls -lh "$OUTPUT_NAME"

echo ""
echo -e "${BLUE}Neste steg:${NC}"
echo "  • Installer: adb install $OUTPUT_NAME"
echo "  • Last opp til GitHub Release"
echo "  • Del med testere"
