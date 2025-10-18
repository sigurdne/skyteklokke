#!/bin/bash

# Generate Upload Keystore for Google Play App Signing
# This script creates the upload keystore needed to sign your app bundles

set -e

echo "🔑 Genererer upload keystore for SkyteKlokke..."
echo ""

KEYSTORE_DIR="android/app"
KEYSTORE_FILE="skyteklokke-upload.keystore"
KEY_ALIAS="skyteklokke-upload"

# Check if keystore already exists
if [ -f "$KEYSTORE_DIR/$KEYSTORE_FILE" ]; then
    echo "❌ Keystore finnes allerede: $KEYSTORE_DIR/$KEYSTORE_FILE"
    echo ""
    echo "Hvis du vil lage en ny keystore, slett den gamle først:"
    echo "  rm $KEYSTORE_DIR/$KEYSTORE_FILE"
    echo ""
    exit 1
fi

# Create directory if it doesn't exist
mkdir -p "$KEYSTORE_DIR"

echo "📝 Du vil bli spurt om følgende informasjon:"
echo "   - Keystore passord (velg sterkt passord!)"
echo "   - Key passord (kan være samme som keystore)"
echo "   - Navn: Sigurd Nes"
echo "   - Organizational Unit: [Enter/skip]"
echo "   - Organization: [Enter/skip]"
echo "   - City/Locality: [Din by]"
echo "   - State/Province: [Ditt fylke]"
echo "   - Country Code: NO"
echo ""
echo "⚠️  VIKTIG: Skriv ned passordene på et trygt sted!"
echo ""
read -p "Trykk Enter for å fortsette..."
echo ""

# Generate keystore
keytool -genkeypair -v \
    -storetype PKCS12 \
    -keystore "$KEYSTORE_DIR/$KEYSTORE_FILE" \
    -alias "$KEY_ALIAS" \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000

echo ""
echo "✅ Keystore opprettet!"
echo ""
echo "📄 Fil: $KEYSTORE_DIR/$KEYSTORE_FILE"
echo "🔑 Alias: $KEY_ALIAS"
echo ""
echo "📋 NESTE STEG:"
echo ""
echo "1. Opprett android/keystore.properties med følgende innhold:"
echo ""
echo "   storePassword=DITT_KEYSTORE_PASSORD"
echo "   keyPassword=DITT_KEY_PASSORD"
echo "   keyAlias=$KEY_ALIAS"
echo "   storeFile=$KEYSTORE_FILE"
echo ""
echo "2. Lag sikkerhetskopi av keystore:"
echo "   cp $KEYSTORE_DIR/$KEYSTORE_FILE ~/Dokumenter/Keystore-backup/"
echo ""
echo "3. Sjekk at keystore ikke committes til Git:"
echo "   grep '*.keystore' .gitignore"
echo "   grep 'keystore.properties' .gitignore"
echo ""
echo "4. Bygg App Bundle:"
echo "   ./scripts/build-playstore-aab.sh"
echo ""
echo "⚠️  Lagre passordene dine trygt - du trenger dem for alle fremtidige releases!"
echo ""
