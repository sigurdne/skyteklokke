# SkyteKlokke 🎯

En presis timer-app for konkurranseskyttere og standplass-ledere.

## Om Prosjektet

SkyteKlokke er designet for å støtte standplass-ledere med korrekte tidskommandoer under feltskyting og andre skytedisipliner. Appen tilbyr også en duell-skyting simulator for tørrtrening.

## Funksjoner

- ⏱️ Presis timer med kommandosekvens for feltskyting
- 🚦 Duell-skyting simulator med lyssekvenser (tørrtrening)
- 🎯 Silhuett-skyting simulator med tørrtrening og skuddrytme
- 🔊 Audio-kommandoer med TTS for treningsmodus
- 🎨 Fargekodede faser for enkel identifikasjon
- ⚙️ Konfigurerbar skyteperiode og lydinnstillinger
- 📱 Optimalisert for mobile enheter
- 🔄 Pause og reset funksjonalitet
- 🌍 Flerspråklig støtte (Norsk, Engelsk, Svensk, Dansk)
- 🔧 Automatisk språkdeteksjon

## Teknologi

- **React Native** - Kryssplattform mobile utvikling
- **Expo SDK 54** - Utviklingsverktøy og deployment
- **JavaScript/TypeScript** - Programmeringsspråk

## Kommandosekvens

### Feltskyting
**Visuell modus (for standplass-ledere):**
1. **"Er skytterne klare"** (10s før ild)
2. **"Klar"** (5s før ild)
3. **"Ild"** (start skyteperiode)
4. **Skyteperiode** (konfigurerbar, standard 10s)
5. **"Stans"** (siste 2s av skyteperiode)

**Treningsmodus (med audio):**
- 🔊 Samme sekvens med lydkommandoer
- ⚙️ Konfigurerbar lydvolum og hastighet
- 🗣️ Text-to-speech på valgt språk
- ⏱️ Presis timing av kommandoer
- 🛑 "Stans" varer i hele de 2 siste sekundene

### Duell-skyting (Tørrtrening)
1. **"Start"** kommando
2. **60 sekunder** nedtelling
3. **Lyssekvens** (5 ganger):
   - 🔴 Rødt lys (7 sekunder)
   - 🟢 Grønt lys (3 sekunder)
4. **Permanent rødt lys** (ferdig)

### Silhuett-skyting (Tørrtrening)
1. **"Klar for silhuett"** kommando
2. **60 sekunder** nedtelling til skytestilling
3. **Lyssekvens** (per serie):
   - 🔴 Rødt lys (7 sekunder) - våpenet skal være i hvilestilling
   - 🟢 Grønt lys (8, 6 eller 4 sekunder) - løft og skyt 5 skudd
   - 🔴 Rødt lys (våpen ned)
4. **Audio-assistanse**:
   - 🔊 "Løft" signal ved grønt lys
   - 🔊 Rytmisk "Skyt" signal for optimal skuddtempo
   - 🔊 "Våpen ned" ved rødt lys

## Dokumentasjon

- [📋 Prosjektplan](./PROSJEKTPLAN.md) - Detaljert prosjektplanlegging
- [⚡ Teknisk Design](./TEKNISK_DESIGN.md) - Arkitektur og implementasjonsdetaljer

## Kom i gang

```bash
# Klon og installer
npm install

# Start utviklingsserver
npx expo start

# Kjør på Android
npx expo run:android

# Kjør på iOS  
npx expo run:ios
```

## Status

🚧 **Under utvikling** - MVP i progess

### Ferdig
- [x] Prosjektplanlegging
- [x] Teknisk design
- [x] Dokumentasjon

### Pågående
- [ ] Expo prosjekt setup
- [ ] Grunnleggende timer implementasjon
- [ ] UI/UX design

### Planlagt
- [ ] Konfigurasjonssystem
- [ ] Testing og optimalisering
- [ ] Publisering til app stores

## Bidrag

Dette er et spesialisert prosjekt for den norske skyttersporten. Feedback og forbedringsforslag er velkommen!

---

**Utviklet med ❤️ for den norske skyttersporten**