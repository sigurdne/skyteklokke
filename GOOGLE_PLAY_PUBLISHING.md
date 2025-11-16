# Google Play Publiseringsguide for SkyteKlokke

Denne guiden tar deg gjennom alle steg for å publisere SkyteKlokke til Google Play Store med Google Play App Signing.

Det finnes to måter å bygge appen for Play Store på:

- **Metode A (anbefalt)**: Bygg med **Expo Application Services (EAS)** og la EAS håndtere signering og App Bundle (
    `.aab`).
- **Metode B**: Bygg App Bundle lokalt med **Gradle** (`./gradlew bundleRelease`) og last opp filen manuelt.

Begge metodene gir et gyldig, signert `.aab` som kan lastes opp til Google Play. I resten av dokumentet er
EAS-varianten beskrevet først (A), deretter den manuelle Gradle-varianten (B).

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
- [x] **Forberedelser**: Feature Graphic opprettet (1024x500)
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
- [ ] **Steg 10**: Sett opp Closed Testing (NYE KONTOER - PÅKREVD!)
- [ ] **Steg 11**: Rekrutter minimum 12 testere
- [ ] **Steg 12**: Kjør test i 14 dager sammenhengende
- [ ] **Steg 13**: Søk om produksjonstilgang
- [ ] **Steg 14**: Send til production review (etter godkjenning)

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

### 4A: Bygg med EAS (anbefalt)

Denne metoden bruker Expo Application Services til å bygge og signere `.aab`-filen i skyen.

**Forutsetninger:**

- `app.json` har korrekt versjon:

    ```jsonc
    {
        "expo": {
            "version": "1.0.0",
            "extra": {
                "eas": {
                    "projectId": "68784b4a-d5de-49c3-87ff-4708c64e3ebe"
                }
            }
        }
    }
    ```

- Keystoren (`skyteklokke-upload.keystore`) er lastet opp til EAS for `production`-profilen via
    `eas credentials --platform android`.

#### 4A.1 Bygg Android App Bundle med EAS

Kjør fra prosjektroten:

```bash
eas build --platform android --profile production
```

- Dette starter en build på EAS-serverne.
- Når builden er ferdig, får du en lenke til `.aab`-filen, eller du kan finne den i EAS Dashboard.

#### 4A.2 Send til Google Play

Du kan enten:

1. **Laste ned `.aab`-filen** fra EAS Dashboard og laste den opp manuelt i Play Console (Closed testing eller
     Production), eller
2. Bruke EAS Submit direkte:

     ```bash
     eas submit --platform android --latest
     ```

     Dette tar siste Android-build fra EAS og sender den til Google Play. Første gang må du sette opp en Google
     Service Account for Play Store submissions, men det er en engangsjobb.

### 4B: Bygg App Bundle lokalt med Gradle

Dersom du ønsker å bygge lokalt (uten EAS), kan du bruke Gradle direkte. Dette var den opprinnelige metoden og er
fortsatt gyldig.

#### 4B.1 Oppdater versjonsinformasjon i Gradle

Rediger `android/app/build.gradle` (merk at `applicationId` må matche pakken i Play Console):

```gradle
defaultConfig {
        applicationId "com.sigurdne.skyteklokke"
        minSdkVersion 24
        targetSdkVersion 34
        versionCode 1          // ← Første versjon (øk med hver opplasting)
        versionName "1.0.0"    // ← Synlig versjonsnummer
}
```

> 💡 Når du bruker EAS med "remote" versjonskilde for Android, vil `versionCode` i `android/app/build.gradle` i
> praksis ignoreres av EAS. For ren lokal Gradle-build er det fortsatt `versionCode` her som gjelder.

#### 4B.2 Bygg App Bundle (AAB) lokalt

```bash
# Naviger til android-mappen
cd android

# Bygg release App Bundle
./gradlew bundleRelease
```

**Output**: `android/app/build/outputs/bundle/release/app-release.aab`

#### 4B.3 Verifiser bygget

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

## 🚀 Steg 10: Sett opp Closed Testing (PÅKREVD FOR NYE KONTOER!)

> ⚠️ **VIKTIG**: Nye personlige Google Play Developer-kontoer må kjøre en lukket test i minimum 14 dager med minst 12 testere før de kan publisere til Production.

### 10.1 Hvorfor Closed Testing?

Google krever dette for nye kontoer for å:
- Sikre at appen er testet ordentlig
- Beskytte brukere mot upolerte apper
- Verifisere at utvikleren er legitim

### 10.2 Opprett Closed Testing track

1. Gå til Play Console → **Testing** → **Closed testing**
2. Klikk **"Create new release"** eller **"Create track"**
3. Gi tracken et navn: `Closed Beta` (standard)

### 10.3 Aktiver Google Play App Signing

- Du vil se en melding om Play App Signing
- Klikk **"Continue"** for å aktivere det
- Dette er det samme systemet som brukes for Production

### 10.4 Last opp App Bundle

1. Klikk **"Upload"**
2. Velg filen: `android/app/build/outputs/bundle/release/app-release.aab`
3. Vent på prosessering

### 10.5 Skriv release notes for testere

**Release notes** (norsk):

```
🧪 Closed Beta - Test av SkyteKlokke

Takk for at du hjelper til med å teste SkyteKlokke!

Dette er første testversjon av appen. Vennligst test følgende:
• Start feltmatch-timer og se at faseskiftene fungerer
• Start duellmatch-simulator og test innstillinger
• Sjekk at lyd/vibrasjoner fungerer som forventet
• Test pause og tilbakestill-funksjoner
• Rapporter eventuelle bugs eller problemer

Gi gjerne tilbakemelding på hva som fungerer bra og hva som kan forbedres!

Versjon: 0.1.0-beta.3
```

### 10.6 Velg rollout (100% anbefalt for testing)

- Velg **Full rollout** (100%)
- Alle testere får tilgang med en gang

### 10.7 Lagre release

1. Klikk **"Save"**
2. Klikk **"Review release"**
3. Sjekk at alt ser riktig ut
4. Klikk **"Start rollout to Closed testing"**

---

## 👥 Steg 11: Rekrutter minimum 12 testere

### 11.1 Opprett testerliste

1. I Closed testing → Klikk **"Testers"** tab
2. Velg **"Email list"** (enklest)
3. Opprett en liste med navn: `Beta Testers`

### 11.2 Legg til e-postadresser

Legg til minimum 12 e-postadresser (Gmail-kontoer anbefales):

```
tester1@gmail.com
tester2@gmail.com
...
tester12@gmail.com
```

**Tips for å finne testere:**
- Skytterklubben din (standplassledere, skyttere)
- Venner og familie
- Kollegaer
- Post i norske skytte-forum/Facebook-grupper
- Post på klubbens Discord/Slack

### 11.3 Få invitasjonslenke

1. Etter at du har lagt til testere, klikk **"Copy link"**
2. Du får en lenke som ser slik ut:
   ```
   https://play.google.com/apps/testing/com.skyteklokke.app
   ```

### 11.4 Send invitasjon til testere

**E-post mal:**

```
Emne: Test SkyteKlokke - Beta for Android

Hei!

Jeg har utviklet en timer-app for konkurranseskyttere og trenger din hjelp til å teste den!

SkyteKlokke har funksjoner for feltmatch og duellskyting med automatiske tidssekvenser.

For å bli med i beta-testen:

1. Klikk på denne lenken: https://play.google.com/apps/testing/com.skyteklokke.app
2. Klikk "Bli med i testen"
3. Vent litt (kan ta noen minutter)
4. Last ned appen fra Google Play Store
5. Test appen og gi tilbakemelding!

Beta-testen vil vare i minimum 14 dager, og jeg trenger minst 12 testere for å kunne publisere appen offisielt.

Takk for hjelpen! 🎯

Hilsen,
Sigurd Nes
```

### 11.5 Verifiser testere

- Testere må **aktivt opt-in** til testen via lenken
- De må **laste ned og installere** appen fra Play Store
- Sjekk i Play Console → Testing → Closed testing → **"Testers"** at de blir vist som aktive

---

## ⏳ Steg 12: Kjør test i 14 dager sammenhengende

### 12.1 Overvåk testperioden

- **Minimum varighet**: 14 dager sammenhengende
- **Minimum aktive testere**: 12 testere som har opt-in til testen
- Testere må **forbli opted-in** hele perioden

### 12.2 Følg med på statistikk

Gå til Play Console → Testing → Closed testing → **Statistics**:
- Antall nedlastninger
- Antall aktive testere
- Crashes og ANRs
- Brukerrapporter

### 12.3 Samle tilbakemeldinger

**Opprett et enkelt tilbakemeldingsskjema** (valgfritt men anbefalt):
- Google Forms
- E-post
- Discord/Slack-kanal

**Spørsmål til testere:**
1. Hvilken Android-versjon bruker du?
2. Fungerer timeren som forventet?
3. Er lyden/vibrasjoner tydelige?
4. Er appen enkel å bruke?
5. Oppdaget du noen bugs?
6. Forbedringsforslag?

### 12.4 Fiks kritiske bugs

- Hvis testere finner bugs, fiks dem og last opp ny versjon
- Hver gang du laster opp ny versjon, må du øke `versionCode` i `build.gradle`
- 14-dagers perioden **nulstilles IKKE** ved oppdateringer

### 12.5 Vent til dag 14

- **Ikke avbryt testingen før 14 dager har gått**
- Sørg for at minst 12 testere har vært opted-in hele perioden
- Sjekk at appen er stabil (få eller ingen crashes)

---

## 🎯 Steg 13: Søk om produksjonstilgang

### 13.1 Sjekk at kravene er oppfylt

Før du søker, verifiser at:
- ✅ Closed testing har kjørt i minst 14 dager
- ✅ Minst 12 testere har vært opted-in hele perioden
- ✅ Appen har få eller ingen crashes
- ✅ Store listing er fullført
- ✅ App content (privacy, content rating) er fullført

### 13.2 Gå til Dashboard

1. I Play Console → **Dashboard** (forsiden)
2. Du vil se en melding eller knapp: **"Apply for production access"**
3. Klikk på den

### 13.3 Svar på Googles spørsmål

Du vil bli bedt om å svare på spørsmål som:

**1. Beskriv appen din:**
```
SkyteKlokke er en timer-app utviklet spesielt for konkurranseskyttere 
og standplassledere i Norge. Appen gir presis timing for feltmatch 
og duellskyting i henhold til DFS-regler.
```

**2. Hvordan har du testet appen?**
```
Appen har gjennomgått 14 dagers lukket beta-testing med 12+ aktive testere, 
inkludert standplassledere og aktive skyttere. Vi har testet på ulike 
Android-enheter og versjoner, og fikset bugs basert på tilbakemeldinger.
```

**3. Hvorfor er appen klar for produksjon?**
```
Appen er stabil uten kritiske bugs, har gjennomført grundig testing, 
og dekker et reelt behov i skyttermiljøet. Testere har gitt positive 
tilbakemeldinger på funksjonalitet og brukervennlighet.
```

**4. Målgruppe og bruk:**
```
Appen er rettet mot konkurranseskyttere og standplassledere i Norge, 
Sverige og Danmark. Den brukes for timing under trening og konkurranser.
```

### 13.4 Send inn søknaden

1. Gjennomgå svarene dine
2. Klikk **"Submit"** (Send inn)
3. Vent på svar fra Google

### 13.5 Ventetid

- **Review-tid**: Vanligvis 1-7 dager
- Du får e-post når Google har tatt en beslutning
- Sjekk Play Console Dashboard for status

### 13.6 Hvis godkjent

✅ Du får tilgang til å publisere i **Production**!
- Fortsett til Steg 14

### 13.7 Hvis avvist

❌ Google vil forklare hvorfor:
- Fiks problemene som nevnes
- Kjør evt. mer testing
- Søk på nytt

---

## 🚀 Steg 14: Send til Production review

### 14.1 Opprett Production release

Nå som du har produksjonstilgang:

1. Gå til **Release** → **Production**
2. Klikk **"Create new release"**
3. **Google Play App Signing** er allerede aktivert fra Closed testing

### 14.2 Bruk samme AAB

Du kan:
- **Alternativ A**: Laste opp samme AAB som ble testet (anbefalt hvis ingen endringer)
- **Alternativ B**: Bygge og laste opp ny AAB med høyere `versionCode`

### 14.3 Skriv production release notes

**Release notes** (norsk):

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
Testet grundig i 14 dager med positive tilbakemeldinger.
```

### 14.4 Velg rollout-strategi

For første production release:
- **Staged rollout**: Start med 20% (anbefalt)
- **Full rollout**: 100% hvis du er veldig sikker

### 14.5 Lagre og send til review

1. Klikk **"Save"**
2. Klikk **"Review release"**
3. Sjekk at alle seksjoner er grønne ✅
4. Klikk **"Start rollout to Production"**

### 14.6 Google reviewer appen (igjen)

- **Review-tid**: 1-7 dager (vanligvis 24-48 timer)
- Google sjekker:
  - At appen følger retningslinjer
  - At metadata er korrekt
  - At appen fungerer som beskrevet
- Du får e-post når status endres

### 14.7 Publisert! 🎉

Når Google godkjenner:
- Appen blir tilgjengelig på Google Play Store
- Brukere kan søke etter "SkyteKlokke" og installere den
- Du kan dele lenken: `https://play.google.com/store/apps/details?id=com.skyteklokke.app`

---

## 📊 Steg 15: Etter publisering

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

## 📊 Steg 15: Etter publisering

### 15.1 Overvåk lansering

- **Play Console Dashboard**: Se nedlastninger, crashes, ratings
- **Pre-launch report**: Google tester appen automatisk på ulike enheter
- **Crashes and ANRs**: Overvåk for feil

### 15.2 Første 48 timer

- Sjekk for crashes daglig
- Svar på brukeranmeldelser
- Overvåk rating

### 15.3 Gradvis øk rollout

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
