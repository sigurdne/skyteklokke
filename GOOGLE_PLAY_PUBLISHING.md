# Google Play Publiseringsguide for SkyteKlokke

Denne guiden tar deg gjennom alle steg for å publisere SkyteKlokke til Google Play Store med Google Play App Signing.

## 📋 Sjekkliste før du starter

- [x] Google-konto opprettet
- [x] $25 USD klar for betaling (engangsavgift)
- [x] Kredittkort/betalingsinformasjon tilgjengelig
- [ ] ID-dokument for verifisering (kan bli bedt om)
- [x] Prosjektet bygger uten feil lokalt

## ✅ Fremdrift

- [x] **Steg 1.1**: Registrert som Google Play Developer ($25 betalt)
- [x] **Steg 1.2**: Godkjent av Google
- [x] **Forberedelser**: Screenshots konvertert til PNG (8 stk)
- [x] **Forberedelser**: App-ikon 512x512 opprettet
- [x] **Forberedelser**: .gitignore oppdatert (keystore, keystore.properties)
- [x] **Steg 2**: Upload keystore generert
- [x] **Steg 3.1**: keystore.properties opprettet
- [x] **Steg 3.2**: build.gradle oppdatert med signing-konfigurasjon
- [x] **Steg 4**: App Bundle (AAB) bygget (46 MB, versjon 0.1.0-beta.3)
- [x] **Steg 5.1**: Metadata forberedt (beskrivelser og screenshots)
- [ ] **Steg 6**: Opprett app i Play Console
- [ ] **Steg 7**: Fyll ut Store listing
- [ ] **Steg 8**: App content (Privacy, Data safety, Ads, Rating)
- [ ] **Steg 9**: Countries/regions
- [ ] **Steg 10**: Upload AAB med Play App Signing
- [ ] **Steg 11**: Send til review

## 🔐 Steg 1: Opprett Google Play Developer-konto

### 1.1 Registrer deg

1. Gå til: https://play.google.com/console/signup
2. Logg inn med din Google-konto
3. Velg kontotype:
   - **Individual** (Anbefalt for deg) - Personlig utvikler
   - **Organization** - For bedrifter
4. Fyll ut informasjon:
   - Navn: Sigurd Nes
   - E-post: [din-epost]
   - Land: Norge
5. Betal $25 USD engangsavgift
6. Aksepter Google Play Developer Distribution Agreement
7. Vent på godkjenning (vanligvis umiddelbart, kan ta opp til 48 timer)

### 1.2 Fullfør profilen

- Legg til utviklerinformasjon
- Verifiser identitet hvis påkrevd
- Legg til betalingsinformasjon (selv om appen er gratis)

**Kostnad**: $25 USD (engangs)
**Tid**: 15-30 minutter

---

## 🔑 Steg 2: Opprett upload keystore

Selv om Google Play App Signing håndterer den endelige signeringen, trenger du en **upload key** for å laste opp appen.

### 2.1 Generer upload keystore

```bash
cd android/app

keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore skyteklokke-upload.keystore \
  -alias skyteklokke-upload \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

### 2.2 Fyll ut informasjon

Du vil bli spurt om:

```
Enter keystore password: [Velg sterkt passord]
Re-enter new password: [Gjenta]
Enter key password: [Kan være samme som keystore]
Re-enter new password: [Gjenta]

What is your first and last name? Sigurd Nes
What is the name of your organizational unit? [Enter/skip]
What is the name of your organization? [Enter/skip]
What is the name of your City or Locality? [By]
What is the name of your State or Province? [Fylke]
What is the two-letter country code for this unit? NO

Is CN=Sigurd Nes, ... correct? yes
```

### 2.3 Lagre passord trygt

**⚠️ VIKTIG: Skriv ned og lagre:**
- Keystore passord
- Key passord
- Keystore filnavn: `skyteklokke-upload.keystore`
- Key alias: `skyteklokke-upload`

Lagre i passordbehandler eller på sikker plass!

### 2.4 Sikkerhetskopi

```bash
# Kopier til sikker lokasjon
cp android/app/skyteklokke-upload.keystore ~/Dokumenter/Keystore-backup/

# IKKE sjekk inn i Git!
echo "*.keystore" >> .gitignore
echo "keystore.properties" >> .gitignore
```

---

## ⚙️ Steg 3: Konfigurer signing i prosjektet

### 3.1 Opprett keystore.properties

Opprett filen `android/keystore.properties`:

```properties
storePassword=DITT_KEYSTORE_PASSORD
keyPassword=DITT_KEY_PASSORD
keyAlias=skyteklokke-upload
storeFile=skyteklokke-upload.keystore
```

**⚠️ ALDRI commit denne filen til Git!**

Sjekk at den er i `.gitignore`:

```bash
grep "keystore.properties" .gitignore
```

### 3.2 Oppdater build.gradle

Rediger `android/app/build.gradle` og sjekk at den har:

```gradle
android {
    // ... existing config ...
    
    // Last inn keystore-konfigurasjon
    def keystorePropertiesFile = rootProject.file("keystore.properties")
    def keystoreProperties = new Properties()
    if (keystorePropertiesFile.exists()) {
        keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
    }
    
    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            if (keystorePropertiesFile.exists()) {
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
    
    // ... rest of config ...
}
```

---

## 📦 Steg 4: Bygg App Bundle for produksjon

### 4.1 Oppdater versjonsinformasjon

Rediger `android/app/build.gradle`:

```gradle
defaultConfig {
    applicationId "com.sigurdne.skyteklokke"
    minSdkVersion 24
    targetSdkVersion 34
    versionCode 1          // ← Første versjon
    versionName "1.0.0"    // ← Synlig versjonsnummer
}
```

### 4.2 Bygg App Bundle (AAB)

```bash
# Naviger til android-mappen
cd android

# Bygg release App Bundle
./gradlew bundleRelease
```

**Output**: `android/app/build/outputs/bundle/release/app-release.aab`

### 4.3 Verifiser bygget

```bash
# Sjekk filstørrelse
ls -lh app/build/outputs/bundle/release/app-release.aab

# Forventet størrelse: ~30-60 MB
```

**Tid**: 2-5 minutter

---

## 🎨 Steg 5: Forbered metadata og grafisk materiale

### 5.1 App-beskrivelse

**Kort beskrivelse** (maks 80 tegn):
```
SkyteKlokke for konkurranseskyttere og standplassledere
```

**Full beskrivelse** (maks 4000 tegn):
```
⏱️ SKYTEKLOKKE - TIMER FOR KONKURRANSESKYTTERE

SkyteKlokke er en timer-app utviklet for konkurranseskyttere og standplassledere. Appen gir deg enkel og presis timing for feltmatch, i tillegg til en simlator for trening for duellskyting i henhold til DFS-regler.

🎯 HOVEDFUNKSJONER

• FELTMATCH - Komplette tidssekvenser for feltskyting med automatisk faseskifte
• DUELLMATCH - Simulator for duellskyting med konfigurerbare tidsintervaller  
• NORSK GRENSESNITT - Utviklet av og for norske skyttere
• VISUELL INDIKASJON - Tydelig fargekoding for hver fase
• SKJERM ALLTID PÅ - Skjermen forblir aktiv under hele økten

📱 ENKEL Å BRUKE

• Intuitivt design tilpasset standplassleder
• Store, tydelige tall som er lette å lese på avstand
• Godt synlig i alle lysforhold
• Enkle kontroller - start, pause, tilbakestill
• Konfigurerbare innstillinger per program

🇳🇴 LAGET FOR PISTOL SKYTTERE

SkyteKlokke er utviklet av Sigurd Nes, programvareutvikler og skytter. Appen er laget for å dekke et reelt behov for en enkel, pålitelig, timer for både trening og konkurranser.

⚡ 100% GRATIS & OPEN SOURCE

• Ingen reklame
• Ingen abonnementer
• Ingen skjulte kostnader
• Ingen datainnsamling
• Kildekoden er åpen på GitHub

🔒 PERSONVERN

• All data lagres lokalt på din enhet
• Ingen brukerregistrering
• Ingen sporing eller analytikk
• Ingen tilkobling til eksterne servere

🌐 FLERSPRÅKLIG

Støtte for norsk, svensk, dansk og engelsk.

📖 ÅPEN KILDEKODE

Prosjektet er åpent for bidrag! Besøk GitHub-repositoryet for å se kildekoden, rapportere feil eller foreslå forbedringer.

---

Perfekt for:
✓ Standplassledere som trenger enkel, intuitiv og pålitelig timing
✓ Skyttere som vil trene med korrekte tidssekvenser
✓ Alle som ønsker en enkel, effektiv timer for pistolskyting

Last ned SkyteKlokke i dag og opplev forskjellen!
```

### 5.2 Screenshots

Du har allerede 8 gode screenshots i `docs/screenshots/`. Disse må være:
- Format: PNG eller JPEG
- Størrelse: Minimum 320px, maksimum 3840px
- Størrelsesforhold: 16:9 eller 9:16 (foretrukket)

**Konverter WebP til PNG for Play Store:**

```bash
cd docs/screenshots

# Installer imagemagick hvis ikke installert
sudo apt-get install imagemagick

# Konverter alle WebP til PNG
for file in *.webp; do
    convert "$file" "${file%.webp}.png"
done

# Kopier PNG-filer til play-store mappe
mkdir -p ../../play-store/screenshots
cp *.png ../../play-store/screenshots/
```

**Anbefalte screenshots (velg 4-8):**
1. Hovedskjerm (menyvalg)
2. Feltmatch innstillinger
3. Aktiv timer (ILD-fase)
4. STAANS-varsel
5. Fullført skjerm

### 5.3 App-ikon

Ikonet ligger allerede i `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png`

**For Play Store trenger du også:**
- **512x512 px ikon** (høyoppløselig versjon)

```bash
# Hvis du har SVG eller større PNG
convert android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png \
  -resize 512x512 \
  play-store/icon-512.png
```

### 5.4 Feature Graphic (valgfritt men anbefalt)

- Størrelse: **1024x500 px**
- Format: PNG eller JPEG
- Vises øverst i Play Store-oppføringen

**Lag en enkel feature graphic:**
```bash
# Du kan lage dette i GIMP, Canva eller lignende
# Forslag: Lilla gradient bakgrunn med app-logo og tekst "SkyteKlokke"
```

---

## 📱 Steg 6: Opprett appen i Play Console

### 6.1 Logg inn

1. Gå til https://play.google.com/console
2. Logg inn med din Developer-konto

### 6.2 Opprett ny app

1. Klikk **"Create app"**
2. Fyll ut:
   - **App name**: SkyteKlokke
   - **Default language**: Norwegian (Norsk)
   - **App or game**: App
   - **Free or paid**: Free
3. Aksepter retningslinjer
4. Klikk **"Create app"**

---

## 📋 Steg 7: Fyll ut Store listing

### 7.1 App details

Naviger til: **Grow** → **Store presence** → **Main store listing**

**App name**: SkyteKlokke

**Short description**:
```
Presisjonstimer for konkurranseskyttere og standplassleder
```

**Full description**: (Lim inn teksten fra 5.1)

### 7.2 Graphics

Last opp:
- ✅ **App icon**: 512x512 px
- ✅ **Feature graphic**: 1024x500 px (hvis du har)
- ✅ **Phone screenshots**: Minimum 2, anbefalt 4-8

### 7.3 Categorization

- **App category**: Sports eller Tools
- **Tags**: timer, skyting, pistol, konkurranse

### 7.4 Contact details

- **Email**: [din-epost]
- **Website**: https://sigurdne.github.io/skyteklokke/
- **Privacy policy URL**: https://sigurdne.github.io/skyteklokke/privacy-policy.html

Klikk **Save**

---

## 🔐 Steg 8: App content - Personvern og sikkerhet

### 8.1 Privacy policy

Naviger til: **Policy** → **App content** → **Privacy policy**

- URL: `https://sigurdne.github.io/skyteklokke/privacy-policy.html`
- Klikk **Save**

### 8.2 Data safety

Naviger til: **Policy** → **App content** → **Data safety**

**Svar på spørsmål:**

1. **Does your app collect or share user data?**
   - ❌ No (appen samler ikke inn data)

2. Klikk **Next** og fullfør

### 8.3 Advertising

Naviger til: **Policy** → **App content** → **Ads**

- ❌ **No, my app does not contain ads**

### 8.4 Target audience and content

Naviger til: **Policy** → **App content** → **Target audience**

- **Target age group**: 13+ (eller "All ages")
- **No**, app does not appeal specifically to children

### 8.5 Content rating

Naviger til: **Policy** → **App content** → **Content rating**

1. Klikk **Start questionnaire**
2. Velg **IARC questionnaire**
3. Fyll ut:
   - Email: [din-epost]
   - Category: Sports/Tools
4. Svar på spørsmål (alle sannsynligvis "No" for en timer-app)
5. Submit
6. Du får umiddelbart rating (sannsynligvis PEGI 3 / Everyone)

---

## 🌍 Steg 9: Countries/regions og pricing

Naviger til: **Reach and devices** → **Countries/regions**

- **Available countries**: Velg land der du vil distribuere
  - Start med Norge, Sverige, Danmark
  - Eller velg "All countries"

---

## 🚀 Steg 10: Upload App Bundle med Play App Signing

### 10.1 Gå til Production release

Naviger til: **Release** → **Production**

### 10.2 Create new release

1. Klikk **"Create new release"**

### 10.3 Play App Signing (VIKTIG!)

Du vil se en melding om Play App Signing:

> **"Let Google manage and protect your app signing key (recommended)"**

✅ Klikk **"Continue"**

Dette aktiverer Play App Signing. Google vil:
- Generere en sikker app signing key
- Håndtere all signing automatisk
- La deg laste opp med upload key

### 10.4 Upload App Bundle

1. Klikk **"Upload"**
2. Velg filen: `android/app/build/outputs/bundle/release/app-release.aab`
3. Vent på opplasting og prosessering (1-2 minutter)

### 10.5 Release name

Google genererer automatisk, eller du kan skrive:
```
Version 1.0.0 - Første offisielle release
```

### 10.6 Release notes (Norsk)

```
🎉 Første offisielle release av SkyteKlokke!

Funksjoner:
• Feltmatch timer med automatiske faseskift
• Duellmatch simulator
• Norsk talefeedback og kommandoer
• Tilpassbare tidsinnstillinger
• Skjermen holder seg aktiv under bruk
• Intuitiv betjening for standplassleder

Utviklet av og for norske skyttere.
```

### 10.7 Rollout percentage

For første release:
- Start med **20%** gradvis utrulling
- Etter 1-2 dager uten problemer → øk til 50%
- Etter 3-4 dager → 100%

Eller velg **Full rollout** hvis du er sikker.

### 10.8 Save og review

1. Klikk **"Save"**
2. Sjekk at alt er grønt ✅
3. Klikk **"Review release"**

---

## ✅ Steg 11: Send til review

### 11.1 Sjekk status

Gå gjennom alle seksjoner og sjekk at alle har grønn hake ✅:

- ✅ Store listing (beskrivelse, screenshots, ikon)
- ✅ App content (personvern, ads, content rating)
- ✅ Countries and pricing
- ✅ Production release (App Bundle uploaded)

### 11.2 Submit for review

1. Klikk **"Start rollout to Production"**
2. Bekreft
3. Appen sendes til Google for review

### 11.3 Review-prosessen

- **Tid**: Vanligvis 1-7 dager, ofte 24-48 timer
- **Status**: Sjekk i Play Console → **Publishing overview**
- **Varsler**: Du får e-post når status endres

---

## 📊 Steg 12: Etter publisering

### 12.1 Overvåk lansering

- **Play Console Dashboard**: Se nedlastninger, crashes, ratings
- **Pre-launch report**: Google tester appen automatisk på ulike enheter
- **Crashes and ANRs**: Overvåk for feil

### 12.2 Første 48 timer

- Sjekk for crashes daglig
- Svar på brukeranmeldelser
- Overvåk rating

### 12.3 Gradvis øk rollout

Hvis du startet med 20%:
- **Dag 2-3**: Øk til 50% hvis alt går bra
- **Dag 4-5**: Øk til 100%

---

## 🔄 Fremtidige oppdateringer

### Oppdater appen

1. **Gjør endringer i koden**
2. **Oppdater versjon** i `android/app/build.gradle`:
   ```gradle
   versionCode 2          // ← Må alltid øke!
   versionName "1.0.1"    // ← Synlig versjon
   ```
3. **Bygg ny AAB**:
   ```bash
   cd android
   ./gradlew bundleRelease
   ```
4. **Last opp** til Play Console → Production → Create new release
5. **Skriv release notes**
6. **Send til review**

### Eksempel release notes for v1.0.1:

```
🔧 Oppdatering 1.0.1

Forbedringer:
• Forbedret lydkvalitet for kommandoer
• Fikset bug med pause-funksjon
• Optimalisert batteribruk

Takk for tilbakemeldinger!
```

---

## 📋 Oppsummering

**Hva du trenger:**
- ✅ Google Play Developer-konto ($25)
- ✅ Upload keystore (generert)
- ✅ App Bundle (bygget)
- ✅ Screenshots (8 stk ferdig)
- ✅ Personvernpolicy (ferdig på GitHub Pages)
- ✅ App-beskrivelser (skrivet over)

**Tidsestimat:**
- Opprett Developer-konto: 30 min
- Generer keystore og konfigurer: 15 min
- Bygg App Bundle: 5 min
- Forbered screenshots: 15 min
- Fyll ut Play Console: 45-60 min
- **Totalt**: 2-2.5 timer

**Review-tid:**
- 1-7 dager (vanligvis 24-48 timer)

**Kostnad:**
- $25 USD (engangs)

---

## 🆘 Feilsøking

### Problem: "App Bundle is not signed"

**Løsning:** Sjekk at `keystore.properties` eksisterer og har riktige verdier.

### Problem: "Version code 1 has already been used"

**Løsning:** Øk `versionCode` i `build.gradle`.

### Problem: "Privacy policy URL is not reachable"

**Løsning:** 
1. Commit og push privacy-policy.html
2. Aktiver GitHub Pages
3. Vent 2-3 minutter
4. Test URL: https://sigurdne.github.io/skyteklokke/privacy-policy.html

### Problem: Gradlew command not found

**Løsning:**
```bash
cd android
chmod +x gradlew
./gradlew bundleRelease
```

---

## 📚 Nyttige ressurser

- [Play Console Help](https://support.google.com/googleplay/android-developer)
- [Launch Checklist](https://developer.android.com/distribute/best-practices/launch/launch-checklist)
- [Play App Signing](https://support.google.com/googleplay/android-developer/answer/9842756)
- [Content Rating](https://support.google.com/googleplay/android-developer/answer/9859655)

---

## ✨ Du er klar!

Følg stegene over, og SkyteKlokke vil være tilgjengelig på Google Play Store om noen dager! 🎉

**Lykke til med lanseringen!** 🚀
