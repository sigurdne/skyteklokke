# SkyteKlokke - Internasjonalisering (i18n) Plan

## Oversikt

SkyteKlokke skal støtte flerspråklig bruk for å tjene det nordiske og internasjonale skyttemiljøet. Denne planen beskriver implementeringen av internasjonalisering (i18n) funksjoner.

## Språkstøtte

### Prioriterte Språk (Fase 1)
1. **🇳🇴 Norsk (Bokmål)** - Primærspråk, standard kommandoer
2. **🇬🇧 Engelsk** - Internasjonal standard, fallback språk
3. **🇸🇪 Svensk** - Nordisk skyteforbund kompatibilitet
4. **🇩🇰 Dansk** - Nordisk skyteforbund kompatibilitet

### Fremtidige Språk (Fase 2+)
- **🇫🇮 Finsk** - Komplettere nordisk dekning
- **🇩🇪 Tysk** - Stor skyttertradisjon
- **🇫🇷 Fransk** - Internasjonal konkurranse språk

## Kommandooversettelser

### Kommandooversettelser

| Fase | Norsk | Engelsk | Svensk | Dansk |
|------|--------|---------|--------|--------|
| **Feltskyting** | | | | |
| Forberedelse (10s) | "Er skytterne klare" | "Are the shooters ready" | "Är skyttarna klara" | "Er skytterne klar" |
| Klar (5s) | "Klar" | "Ready" | "Klar" | "Klar" |
| Start | "Ild" | "Fire" | "Eld" | "Ild" |
| Stopp | "Stans" | "Cease fire" | "Eldupphör" | "Stop" |
| **Duell-skyting** | | | | |
| Start kommando | "Start" | "Start" | "Start" | "Start" |
| Countdown | "Nedtelling" | "Countdown" | "Nedräkning" | "Nedtælling" |
| Rødt lys | "Rødt lys" | "Red light" | "Rött ljus" | "Rødt lys" |
| Grønt lys | "Grønt lys" | "Green light" | "Grönt ljus" | "Grønt lys" |
| Ferdig | "Ferdig" | "Finished" | "Klar" | "Færdig" |

### Kulturelle Tilpasninger

#### Norsk (Standard)
- Basert på Norges Skytterforbunds retningslinjer
- Tradisjonelle kommandoer brukt i norsk skyting

#### Engelsk (Internasjonal)
- ISSF (International Shooting Sport Federation) standard
- Brukes i internasjonale konkurranser

#### Svensk
- Svenska Skyttesportförbundets terminologi
- Tilpasset svensk skyttertradisjon

#### Dansk
- Dansk Skytte Unions standarder
- Lokale kommandovarianter

## Teknisk Implementasjon

### Arkitektur
```
i18n System
├── Language Detection (expo-localization)
├── Translation Engine (i18next)
├── Locale Files (JSON)
├── Fallback System (English)
└── Cultural Adaptations
```

### Nøkkelfiler
- `src/i18n/index.js` - Hovedkonfigurasjon
- `src/i18n/locales/[lang].json` - Språkfiler
- `src/i18n/utils.js` - Hjelpefunksjoner

### Automatisk Språkdeteksjon
```javascript
// Detekterer enhetens språk
const deviceLocale = Localization.locale; // "nb-NO"
const language = deviceLocale.split('-')[0]; // "nb"

// Mapper til støttet språk
const supportedLanguage = mapToSupported(language);
```

## Brukergrensesnitt

### Språkvalg
- **Automatisk deteksjon** som standard
- **Manuell overstyre** i innstillinger
- **Visuell indikator** for aktivt språk
- **Umiddelbar endring** uten app-restart

### Innstillinger-skjerm
```
┌─────────────────────────┐
│       INNSTILLINGER     │
├─────────────────────────┤
│                         │
│ Språk / Language        │
│ ○ Automatisk           │
│ ○ Norsk                │
│ ○ English              │
│ ○ Svenska              │
│ ○ Dansk                │
│                         │
└─────────────────────────┘
```

## Utvikling og Testing

### Utviklingsfaser

#### Fase 1: Grunnlag (Uke 1)
- [ ] i18n bibliotek setup
- [ ] Norsk språkfil (komplett)
- [ ] Engelsk språkfil (komplett)
- [ ] Automatisk språkdeteksjon

#### Fase 2: Nordisk Ekspansjon (Uke 2)
- [ ] Svensk oversettelse
- [ ] Dansk oversettelse
- [ ] Kommando-validering med lokale eksperter
- [ ] Kulturell tilpasning

#### Fase 3: UI/UX (Uke 2-3)
- [ ] Språkvalg i innstillinger
- [ ] Dynamisk språkendring
- [ ] Visuell språkindikator
- [ ] Fallback-håndtering

### Testing Strategi

#### Automatisert Testing
- Unit tests for oversettelse funksjoner
- Fallback-mekanisme testing
- Språkdeteksjon validering

#### Manuell Testing
- Native speaker validering for hver språk
- Kontekst-passende oversettelser
- Kulturell sensitivitet sjekk

#### Bruker Testing
- Test med skyttere fra ulike land
- Feedback på kommando-timing
- Validering av kulturelle tilpasninger

## Kvalitetssikring

### Oversettelseskvalitet
- **Native speakers** for alle språk
- **Skyte-eksperter** for terminologi
- **Konsistens** på tvers av språk
- **Kontekst-passende** oversettelser

### Teknisk Kvalitet
- **Performance** - Ingen forsinkelse ved språkbytte
- **Memory** - Effektiv lagring av språkfiler
- **Fallback** - Grasiøs håndtering av manglende oversettelser
- **Sync** - Konsistent opplevelse på tvers av skjermer

### Kommandoer for Silhuettskyting

#### Norsk (Standard)
```json
{
  "silhouette": {
    "ready_silhouette": "Klar for silhuett",
    "weapon_down": "Våpen ned",
    "lift_weapon": "Løft",
    "shoot_1": "Skyt",
    "shoot_2": "Skyt", 
    "shoot_3": "Skyt",
    "shoot_4": "Skyt",
    "shoot_5": "Skyt",
    "weapon_down_end": "Våpen ned",
    "series_complete": "Serie fullført",
    "preparation": "Forberedelse",
    "red_light": "Rødt lys",
    "green_light": "Grønt lys"
  }
}
```

#### Engelsk
```json
{
  "silhouette": {
    "ready_silhouette": "Ready for silhouette",
    "weapon_down": "Weapon down",
    "lift_weapon": "Lift",
    "shoot_1": "Fire",
    "shoot_2": "Fire",
    "shoot_3": "Fire", 
    "shoot_4": "Fire",
    "shoot_5": "Fire",
    "weapon_down_end": "Weapon down",
    "series_complete": "Series complete",
    "preparation": "Preparation",
    "red_light": "Red light",
    "green_light": "Green light"
  }
}
```

#### Svensk
```json
{
  "silhouette": {
    "ready_silhouette": "Klar för siluett",
    "weapon_down": "Vapen ner",
    "lift_weapon": "Lyft",
    "shoot_1": "Skjut",
    "shoot_2": "Skjut",
    "shoot_3": "Skjut",
    "shoot_4": "Skjut", 
    "shoot_5": "Skjut",
    "weapon_down_end": "Vapen ner",
    "series_complete": "Serie klar",
    "preparation": "Förberedelse",
    "red_light": "Rött ljus",
    "green_light": "Grönt ljus"
  }
}
```

#### Dansk
```json
{
  "silhouette": {
    "ready_silhouette": "Klar til silhuet",
    "weapon_down": "Våben ned",
    "lift_weapon": "Løft",
    "shoot_1": "Skyd",
    "shoot_2": "Skyd",
    "shoot_3": "Skyd",
    "shoot_4": "Skyd",
    "shoot_5": "Skyd", 
    "weapon_down_end": "Våben ned",
    "series_complete": "Serie færdig",
    "preparation": "Forberedelse",
    "red_light": "Rødt lys",
    "green_light": "Grønt lys"
  }
}
```

## Kulturelle Hensyn

### Timing og Kommandoer
- Ulike land kan ha varierende kommando-timing
- Respektere lokale skyteinstruksjoner
- Fleksibilitet for nasjonale tilpasninger

### Tilgjengelighet
- Støtte for høy kontrast modus
- Dysleksi-vennlige fonter
- Kulturelt passende fargebruk

### Regional Variasjon
- Underregionale kommandovarianter
- Lokal skytterforbund-spesifikke termer
- Mulighet for custom kommandosett

## Vedlikehold og Utvidelse

### Langterm Planer
- **Plugin-arkitektur** for nye språk
- **Community-bidrag** til oversettelser
- **Cloud-sync** av språkpreferanser
- **Analytics** på språkbruk

### Versjonskontroll
- Språkfil-versjonering
- Bakoverkompatibilitet
- Gradual utrulling av nye oversettelser

---

**Språkansvarlig:** Community + Native Speakers  
**Teknisk Lead:** GitHub Copilot  
**Opprettet:** ${new Date().toLocaleDateString('no-NO')}  
**Versjon:** 1.0