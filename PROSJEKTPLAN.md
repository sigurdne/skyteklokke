# SkyteKlokke - Prosjektplan

## Prosjektoversikt

**Appnavn:** SkyteKlokke  
**Målgruppe:** Konkurranseskyttere og standplass-ledere  
**Plattformer:** Android (primær), iOS (sekundær)  
**Teknologi:** React Native + Expo SDK 54  

## Funksjonalitetsbeskrivelse

### Kjernearkitektur: Modulært Skyteprogramsystem
Et utvidbart system som støtter ulike skytedisipliner og programmer gjennom en plugin-basert arkitektur.

### Basisfunksjon 1: Feltskyting Timer
En presis timer som støtter standplass-ledere med korrekte kommandoer og timing for feltskyting.

**To moduser:**
- **Visuell modus:** For standplass-ledere (kun visuell timing)
- **Treningsmodus:** Med lydsignaler for selvtrening og gruppetrening

### Basisfunksjon 2: Duell-skyting Simulator
En lyskommando-simulator for tørrtrening av duell-skyting, som simulerer den offisielle lyssekvensen.

### Utvidelsesmuligheter: Flere Skyteprogrammer
Systemet er designet for enkel utvidelse med:
- **Konkurranseprogrammer:** Offisielle regler og timing
- **Treningsprogrammer:** Simulering og øvingsmoduser
- **Spesialiserte disipliner:** Presisjon, tempo, kombinert

### Kommandosekvens for Feltskyting
1. **"Er skytterne klare"** - 10 sekunder før ildkommando
2. **"Klar"** - 5 sekunder før ildkommando  
3. **"Ild"** - Start av skyteperiode
4. **Skyteperiode** - Konfigurerbar varighet (standard 10 sekunder)
5. **"Stans"** - De to siste sekundene av skyteperioden

### Lyssekvens for Duell-skyting
1. **"Start"** kommando - Muntlig/visuell indikator
2. **Nedtelling** - 60 sekunder countdown
3. **Lyssekvens** (repeteres 5 ganger):
   - Rødt lys: 7 sekunder
   - Grønt lys: 3 sekunder  
4. **Avslutning** - Rødt lys (permanent)

### Brukergrensesnitt Krav

#### Feltskyting Modus
- **Store, tydelige tall** for sekundnedtelling og opptelling
- **Fargekoding** for ulike faser:
  - Rød: Forberedelse ("Er skytterne klare", "Klar")
  - Grønn: Aktiv skyting ("Ild")
  - Gul/Orange: Avslutning ("Stans")
- **Nedtelling før start** (15 sekunder total)
- **Opptelling under skyting** (konfigurerbar periode)
- **Treningsmodus med lydsignaler:**
  - Klare og distinkte kommandoer på riktig tidspunkt
  - Korrekt lengde på hver kommando
  - Justering av lydvolum
  - TTS (Text-to-Speech) eller forhåndsinnspilte kommandoer

#### Duell-skyting Modus
- **Store, tydelige tall** for 60-sekund nedtelling
- **Fullskjerm lyssimulering**:
  - Rødt lys: Fullskjerm rød bakgrunn
  - Grønt lys: Fullskjerm grønn bakgrunn
  - Svart skjerm: Pause mellom lyssekvenser
- **Sekvens-indikator** (1/5, 2/5, etc.)
- **"Start"-kommando** visuell/audio
- **Mobilplassering**: Optimalisert for horisontal plassering ved siden av treningsutstyr

## Teknisk Arkitektur

### Teknologi Stack
- **Frontend:** React Native 0.72+
- **Development:** Expo SDK 54
- **State Management:** React Hooks (useState, useEffect)
- **Timer:** JavaScript setInterval/setTimeout
- **Styling:** React Native StyleSheet
- **Audio:** Expo AV for lydkommandoer og TTS
- **Text-to-Speech:** Expo Speech for dynamiske kommandoer
- **Internasjonalisering:** expo-localization + i18next
- **Språkstøtte:** Norsk, Engelsk, Svensk, Dansk (initial)

### Prosjektstruktur
```
skyteklokke/
├── App.js                    # Hovedkomponent
├── app.json                  # Expo konfigurasjon
├── package.json              # Dependencies
├── src/
│   ├── components/
│   │   ├── Timer.js          # Hoved timer komponent
│   │   ├── CommandDisplay.js # Kommando visning
│   │   └── ConfigPanel.js    # Konfigurasjonspanel
│   ├── screens/
│   │   ├── TimerScreen.js    # Hovedskjerm
│   │   ├── SettingsScreen.js # Innstillinger
│   │   └── ProgramScreen.js  # Program-valg
│   ├── programs/             # Skyteprogrammer (modulær)
│   │   ├── index.js          # Program registry
│   │   ├── base/
│   │   │   └── BaseProgram.js # Abstrakt basisklasse
│   │   ├── field/
│   │   │   ├── StandardField.js    # Standard feltskyting
│   │   │   ├── PistolField.js      # Pistol feltskyting
│   │   │   └── RifleField.js       # Rifle feltskyting
│   │   ├── duel/
│   │   │   ├── StandardDuel.js     # Standard duell
│   │   │   └── RapidDuel.js        # Hurtig duell
│   │   └── training/
│   │       ├── BasicTraining.js   # Grunnleggende trening
│   │       ├── IntervalTraining.js # Intervalltrening
│   │       └── CustomTraining.js  # Tilpasset trening
│   ├── utils/
│   │   └── timerLogic.js     # Timer-logikk
│   ├── styles/
│   │   └── globalStyles.js   # Globale styles
│   ├── i18n/
│   │   ├── index.js          # i18n konfigurasjon
│   │   ├── locales/
│   │   │   ├── no.json       # Norsk oversettelse
│   │   │   ├── en.json       # Engelsk oversettelse
│   │   │   ├── sv.json       # Svensk oversettelse
│   │   │   └── da.json       # Dansk oversettelse
│   │   └── utils.js          # i18n hjelpefunksjoner
└── assets/                   # Bilder og lyder
```

## Utviklingsfaser

### Fase 1: Grunnleggende Timer (MVP)
**Mål:** Fungerende timer med alle kommandoer for feltskyting

**Funksjoner:**
- [x] Prosjektoppsett med Expo
- [ ] Grunnleggende timer-logikk (feltskyting)
- [ ] Kommandosekvens implementasjon
- [ ] Visuell nedtelling/opptelling
- [ ] Fargekoding av faser
- [ ] Konfigurerbar skyteperiode
- [ ] i18n setup og norsk språkpakke
- [ ] Duell-skyting simulator (basis)
- [ ] Silhuett-skyting simulator (tørrtrening)
- [ ] Lyssekvens implementasjon (rød/grønn fullskjerm)
- [ ] Audio-kommandoer for treningsmodus
- [ ] TTS (Text-to-Speech) implementasjon
- [ ] Modulær program-arkitektur
- [ ] BaseProgram abstrakt klasse

**Estimat:** 1-2 uker

### Fase 2: Forbedret Brukeropplevelse
**Mål:** Profesjonell app med bedre UX/UI

**Funksjoner:**
- [ ] Forbedret design og typografi
- [ ] Animasjoner mellom faser
- [ ] Vibrasjon ved kritiske kommandoer
- [ ] Pause/resume funksjonalitet
- [ ] Reset timer funksjon

**Estimat:** 1 uke

### Fase 3: Utvidede Funksjoner
**Mål:** Støtte for flere skytedisipliner

**Funksjoner:**
- [ ] Flere timer-profiler (pistol, rifle, etc.)
- [ ] Lydkommandoer (TTS eller opptak)
- [ ] Statistikk og loggføring
- [ ] Eksport av økter
- [ ] Mørk/lys tema
- [ ] Flerspråklig støtte (engelsk, svensk, dansk)
- [ ] Kulturell tilpasning av kommandoer
- [ ] Plugin-system for nye skyteprogrammer
- [ ] Program-kategorier (konkurranse vs trening)
- [ ] Tilpassbare treningsprogrammer

**Estimat:** 2-3 uker

### Fase 4: Publisering og Optimalisering
**Mål:** Klar for Google Play Store (og App Store)

**Oppgaver:**
- [ ] Performance optimalisering
- [ ] Testing på ulike enheter
- [ ] App ikoner og splash screens
- [ ] Store listing forberedelser
- [ ] Beta testing

**Estimat:** 1-2 uker

## Detaljerte Krav

### Timer States
```javascript
const TIMER_STATES = {
  // Feltskyting states
  IDLE: 'idle',           // Ikke startet
  READY_CHECK: 'ready',   // "Er skytterne klare" (10s før)
  PREPARE: 'prepare',     // "Klar" (5s før)
  FIRE: 'fire',          // "Ild" - aktiv skyting
  CEASE: 'cease',        // "Stans" (siste 2s)
  FINISHED: 'finished',   // Ferdig
  
  // Duell-skyting states
  DUEL_IDLE: 'duel_idle',         // Ikke startet
  DUEL_COUNTDOWN: 'duel_countdown', // 60s nedtelling
  DUEL_RED: 'duel_red',           // Rødt lys (7s)
  DUEL_GREEN: 'duel_green',       // Grønt lys (3s)
  DUEL_PAUSE: 'duel_pause',       // Pause mellom sekvenser
  DUEL_FINAL_RED: 'duel_final_red', // Slutt - rødt lys
  DUEL_COMPLETE: 'duel_complete'    // Ferdig
}
```

### Konfigurasjon
- **Skyteperiode:** 5-60 sekunder (standard: 10s)
- **Stans-varsel:** 1-5 sekunder (standard: 2s)
- **Forberedelsestid:** Fast 15 sekunder (10s + 5s)
- **Språk:** Auto-deteksjon basert på enhetsinnstillinger
- **Kommandoer:** Tilpasset til lokale skyteinstruksjoner
- **Duell-modus:** 60s nedtelling, 5x lyssekvenser (7s rød + 3s grønn)
- **Lysintensitet:** Konfigurerbar skjermlysstyrke for synlighet
- **Audio-innstillinger:**
  - Lydvolum for kommandoer (0-100%)
  - TTS hastighet og toneleie
  - Muting av spesifikke kommandoer
  - Forhåndsinnspilte vs TTS kommandoer

## Internasjonalisering (i18n)

### Støttede Språk (Initial)
- **🇳🇴 Norsk (Bokmål)** - Primærspråk, standard kommandoer
- **🇬🇧 Engelsk** - Internasjonal standard
- **🇸🇪 Svensk** - Nordisk skyteforbund kompatibilitet  
- **🇩🇰 Dansk** - Nordisk skyteforbund kompatibilitet

### Kommandosekvenser per Språk

#### Norsk (Standard)
1. "Er skytterne klare" (10s før)
2. "Klar" (5s før)
3. "Ild" (start)
4. "Stans" (slutt)

#### Engelsk  
1. "Are the shooters ready" (10s før)
2. "Ready" (5s før)
3. "Fire" (start)
4. "Cease fire" (slutt)

#### Svensk
1. "Är skyttarna klara" (10s før)
2. "Klar" (5s før)  
3. "Eld" (start)
4. "Eldupphör" (slutt)

#### Dansk
1. "Er skytterne klar" (10s før)
2. "Klar" (5s før)
3. "Ild" (start)
4. "Stop" (slutt)

### i18n Implementasjon
- **Automatisk språkdeteksjon** fra enhetsinnstillinger
- **Manuell språkvalg** i innstillinger
- **Fallback til engelsk** hvis språk ikke støttes
- **Kulturell tilpasning** av tidsformat og kommandoer
- **Fremtidige språk:** Finsk, Tysk, Fransk

### Fargepalett
- **Forberedelse:** `#FF6B6B` (Rød)
- **Aktiv:** `#4ECDC4` (Turkis/Grønn)
- **Avslutning:** `#FFE66D` (Gul)
- **Idle:** `#95A5A6` (Grå)
- **Tekst:** `#2C3E50` (Mørk blå)

## Risiko og Utfordringer

### Tekniske Risikos
- **Timer-presisjon:** Sikre nøyaktig timing på mobile enheter
- **Bakgrunnsaktivitet:** App må fungere selv om skjermen låses
- **Batterilevetid:** Optimalisere for lang bruk

### Bruker-risikos
- **Brukervennlighet:** Må være intuitiv under stress/konkurranse
- **Pålitelighet:** Kan ikke feile under viktige konkurranser
- **Tilgjengelighet:** Støtte for ulike skjermstørrelser

## Success Metrics

### MVP Success
- [ ] Timer kjører uten avbrudd i 30 minutter
- [ ] Kommandoer vises på riktig tidspunkt (±0.1s)
- [ ] App fungerer på minimum 3 Android-enheter
- [ ] Ingen kritiske bugs rapportert i testing

### Lang-sikt Success
- [ ] 100+ aktive brukere i skytemiljøet
- [ ] Gjennomsnittlig sesjon > 10 minutter
- [ ] App Store rating > 4.0
- [ ] Brukt i minimum 5 offisielle konkurranser

## Neste Steg

1. **Sett opp utviklingsmiljø**
   - Installer Node.js og Expo CLI
   - Opprett nytt Expo-prosjekt
   - Konfigurer development environment

2. **Implementer grunnleggende timer**
   - Lag timer state management
   - Implementer kommandosekvens logikk
   - Bygg grunnleggende UI

3. **Test og iterer**
   - Test med faktiske skyttere
   - Samle feedback på timing og kommandoer
   - Juster basert på brukerinput

---

**Opprettet:** ${new Date().toLocaleDateString('no-NO')}  
**Sist oppdatert:** ${new Date().toLocaleDateString('no-NO')}  
**Versjon:** 1.0