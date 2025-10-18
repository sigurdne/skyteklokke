# Bygging og signering av APK for testing

Dette dokumentet beskriver hvordan du bygger og signerer en APK for testformål.

## Forutsetninger

- Node.js og npm installert
- Android SDK installert
- JDK (Java Development Kit) installert
- Gradle (inkludert via Android SDK)

## Metode 1: Automatisk bygging med debug-signering

### Bygg debug APK (signert automatisk)

```bash
cd android
./gradlew assembleDebug
```

Dette vil generere en ferdig signert APK her:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

### Bygg release APK med debug-signering

```bash
cd android
./gradlew assembleRelease
```

**NB:** Prosjektet er konfigurert til å bygge usignerte release-APKer. Se Metode 2 for signering.

## Metode 2: Bygg release med debug-signering (Anbefalt)

Release-bygget er konfigurert i `android/app/build.gradle` til å automatisk signeres med debug keystore.

### Steg 1: Bygg release APK

```bash
cd android
./gradlew assembleRelease
```

Dette genererer en signert APK:

```text
android/app/build/outputs/apk/release/app-release.apk
```

APK-en er automatisk signert med **APK Signature Scheme v2/v3**, som kreves av moderne Android-versjoner.

### Steg 2: Kopier og gi nytt navn

```bash
# Naviger til prosjektets rot
cd ..

# Finn versjonsnummer i android/app/build.gradle
# Kopier APK til prosjektets rot med beskrivende navn
cp android/app/build/outputs/apk/release/app-release.apk \
   skyteklokke-v0.1.0-beta.3-debug.apk
```

## Komplett skript for rask bygging

Lag en fil `scripts/build-debug-apk.sh`:

```bash
#!/bin/bash

# Skript for å bygge og signere APK for testing

set -e  # Stopp ved feil

# Farger for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔨 Bygger release APK...${NC}"
cd android
./gradlew assembleRelease
cd ..

echo -e "${BLUE}✍️  Signerer APK med debug keystore...${NC}"
jarsigner -verbose \
  -sigalg SHA256withRSA \
  -digestalg SHA-256 \
  -keystore android/app/debug.keystore \
  -storepass android \
  -keypass android \
  android/app/build/outputs/apk/release/app-release-unsigned.apk \
  androiddebugkey

echo -e "${BLUE}✅ Verifiserer signatur...${NC}"
jarsigner -verify android/app/build/outputs/apk/release/app-release-unsigned.apk

# Les versjon fra build.gradle
VERSION=$(grep "versionName" android/app/build.gradle | awk '{print $2}' | tr -d '"')

echo -e "${BLUE}📦 Kopierer APK til prosjektrot...${NC}"
cp android/app/build/outputs/apk/release/app-release-unsigned.apk \
   skyteklokke-${VERSION}-debug.apk

echo -e "${GREEN}✅ Ferdig!${NC}"
echo -e "${GREEN}APK: skyteklokke-${VERSION}-debug.apk${NC}"
ls -lh skyteklokke-${VERSION}-debug.apk
```

Gjør skriptet kjørbart (allerede gjort hvis du klonet repoet):

```bash
chmod +x scripts/build-debug-apk.sh
```

Kjør skriptet:

```bash
./scripts/build-debug-apk.sh
```

## Om debug keystore

Debug keystore-filen ligger i `android/app/debug.keystore` og har følgende detaljer:

- **Alias**: `androiddebugkey`
- **Keystore passord**: `android`
- **Key passord**: `android`
- **Gyldig til**: ~2052

**⚠️ VIKTIG**: Debug keystore skal **ALDRI** brukes for produksjonsutgivelser!

## Installere APK på enhet

### Via ADB (Android Debug Bridge)

```bash
adb install skyteklokke-v0.1.0-beta.3-debug.apk
```

### Manuell overføring

1. Kopier APK-filen til enheten (via USB, e-post, eller filoverføring)
2. På Android-enheten:
   - Gå til **Innstillinger** → **Sikkerhet** → **Installer ukjente apper**
   - Aktiver for filbehandleren du bruker
3. Åpne APK-filen og trykk **Installer**

## Feilsøking

### "App not installed as package appears to be invalid"

Dette betyr at APK-en er usignert. Følg Metode 2 for å signere den.

### Gradle build feiler

Sjekk at du har:

- Korrekt Android SDK installert
- Riktig JDK-versjon (sjekk `android/build.gradle` for påkrevd versjon)
- Kjør `./gradlew clean` før ny bygging

### Signering feiler

Sjekk at:

- `android/app/debug.keystore` eksisterer
- Du har JDK installert (jarsigner er en del av JDK)
- Stien til keystore er korrekt

## Versjonering

Versjonsnummer og versjonskode defineres i `android/app/build.gradle`:

```gradle
defaultConfig {
    applicationId 'com.skyteklokke.app'
    versionCode 2
    versionName "0.1.0-beta.3"
}
```

Oppdater disse verdiene før du bygger en ny versjon.

## For produksjonsbygg

For produksjonsutgivelser må du:

1. Opprette en egen release keystore (ikke debug.keystore)
2. Konfigurere `signingConfigs.release` i `android/app/build.gradle`
3. Aktivere `signingConfig signingConfigs.release` i release buildType
4. Aldri dele eller sjekke inn release keystore i Git

Se [React Native dokumentasjon](https://reactnative.dev/docs/signed-apk-android) for mer informasjon.

## GitHub Release

For å laste opp til GitHub:

```bash
# Opprett en tag
git tag v0.1.0-beta.3
git push origin v0.1.0-beta.3

# Gå til GitHub → Releases → Draft a new release
# Velg tag, last opp APK-filen
```

Eller via GitHub CLI:

```bash
gh release create v0.1.0-beta.3 \
  skyteklokke-v0.1.0-beta.3-debug.apk \
  --title "v0.1.0-beta.3" \
  --notes "Test release for beta testing"
```

---

## 🚀 Publisering til Google Play Store

For produksjonspublisering til Google Play Store, se:

### 📖 [GOOGLE_PLAY_PUBLISHING.md](GOOGLE_PLAY_PUBLISHING.md)

Denne guiden dekker:
- Oppretting av Google Play Developer-konto
- Generering av upload keystore for Play App Signing
- Bygging av Android App Bundle (AAB)
- Konfigurasjon av Play Console
- Innlevering for review
- Fremtidige oppdateringer

### Hurtigstart for Play Store

1. **Generer upload keystore**:
   ```bash
   ./scripts/generate-upload-keystore.sh
   ```

2. **Konfigurer keystore.properties**:
   ```properties
   storePassword=DITT_KEYSTORE_PASSORD
   keyPassword=DITT_KEY_PASSORD
   keyAlias=skyteklokke-upload
   storeFile=skyteklokke-upload.keystore
   ```

3. **Bygg App Bundle**:
   ```bash
   ./scripts/build-playstore-aab.sh
   ```

4. **Last opp** til Play Console:
   - Fil: `android/app/build/outputs/bundle/release/app-release.aab`
   - Logg inn på: https://play.google.com/console

Se også: [PLAYSTORE_METADATA.md](PLAYSTORE_METADATA.md) for beskrivelser og grafisk materiale.

---

## Ressurser

- [Android App Signing](https://developer.android.com/studio/publish/app-signing)
- [React Native Publishing](https://reactnative.dev/docs/signed-apk-android)
- [Gradle Build Variants](https://developer.android.com/studio/build/build-variants)
- [Google Play App Signing](https://support.google.com/googleplay/android-developer/answer/9842756)
