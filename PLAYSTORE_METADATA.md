# Play Store Metadata for SkyteKlokke

Denne filen inneholder all tekst og metadata som trengs for Google Play Store-oppføringen.

---

## 📱 App Informasjon

**App Name**: SkyteKlokke

**Package Name**: com.sigurdne.skyteklokke

**App Category**: Sports (alternativt: Tools)

**Content Rating**: PEGI 3 / Everyone

**Price**: Free

---

## 📝 Beskrivelser

### Short Description (maks 80 tegn)

```
Presisjonstimer for konkurranseskyttere og standplassleder
```

**Tegnantall**: 60/80 ✅

---

### Full Description (maks 4000 tegn)

```
⏱️ SKYTEKLOKKE - TIMER FOR KONKURRANSESKYTTERE

SkyteKlokke er en norsk timer-app utviklet spesielt for konkurranseskyttere og standplassledere. Appen gir deg presis timing for feltmatch og duellskyting i henhold til DFS-regler.

🎯 HOVEDFUNKSJONER

• FELTMATCH - Komplette tidssekvenser for feltskyting med automatisk faseskifte
• DUELLMATCH - Simulator for duellskyting med konfigurerbare tidsintervaller  
• NORSK GRENSESNITT - Utviklet av og for norske skyttere
• TALEFEEDBACK - Klare norske kommandoer og varsler
• VISUELL INDIKASJON - Tydelig fargekoding for hver fase
• SKJERM ALLTID PÅ - Skjermen forblir aktiv under hele økten

📱 ENKEL Å BRUKE

• Intuitivt design tilpasset standplassleder
• Store, tydelige tall som er lette å lese på avstand
• Godt synlig i alle lysforhold
• Enkle kontroller - start, pause, tilbakestill
• Konfigurerbare innstillinger per program

🇳🇴 LAGET FOR NORSKE SKYTTERE

SkyteKlokke er utviklet av Sigurd Nes, en norsk programvareutvikler og skytteentusiast. Appen er skapt for å dekke et reelt behov i det norske skyttemiljøet for en pålitelig, regelrett timer for både trening og konkurranser.

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
✓ Standplassledere som trenger pålitelig timing
✓ Skyttere som vil trene med korrekte tidssekvenser
✓ Skytterlag som trenger timer for trening og konkurranser
✓ Alle som ønsker en enkel, effektiv timer for pistolskyting

Last ned SkyteKlokke i dag og opplev forskjellen!
```

**Tegnantall**: ~1840/4000 ✅

---

## 📸 Screenshots

Du har allerede 8 screenshots i `docs/screenshots/`. Disse må konverteres fra WebP til PNG for Play Store.

### Screenshot-filer

1. **Screenshot_20251014_084455_SkyteKlokke.webp**
   - Tittel: "Hovedmeny"
   - Beskrivelse: "Velg mellom feltmatch og duellmatch"

2. **Screenshot_20251015_124700_SkyteKlokke_duell_settings.webp**
   - Tittel: "Innstillinger for duellmatch"
   - Beskrivelse: "Tilpass tidsintervaller for din treningsøkt"

3. **Screenshot_20251015_124750_SkyteKlokke_duell_klar.webp**
   - Tittel: "Klar til start"
   - Beskrivelse: "Tydelig visning av status"

4. **Screenshot_20251015_124759_SkyteKlokke_duell_ild.webp**
   - Tittel: "ILD-kommando"
   - Beskrivelse: "Stor, tydelig timing med talefeedback"

5. **Screenshot_20251015_124808_SkyteKlokke_duell_stans.webp**
   - Tittel: "STAANS-varsel"
   - Beskrivelse: "Klare visuelle og lydmessige signaler"

6. **Screenshot_20251015_124814_SkyteKlokke_duell_slutt.webp**
   - Tittel: "Økt fullført"
   - Beskrivelse: "Oppsummering av økten"

7. **Screenshot_20251015_125622_SkyteKlokke_felt_settings.webp**
   - Tittel: "Feltmatch-innstillinger"
   - Beskrivelse: "Konfigurer komplette feltsekvenser"

8. **Screenshot_20251015_125710_SkyteKlokke_felt_slutt.webp**
   - Tittel: "Feltmatch fullført"
   - Beskrivelse: "Oversikt over alle faser"

### Anbefalte screenshots for Play Store (velg 4-8)

For optimal presentasjon, velg disse:

1. Hovedmeny (084455) - Viser app-struktur
2. Duell ILD (124759) - Viser hoved-funksjonalitet
3. Duell STAANS (124808) - Viser varsel-funksjon
4. Duell fullført (124814) - Viser sluttskjerm
5. Feltmatch innstillinger (125622) - Viser konfigurasjon
6. Feltmatch fullført (125710) - Viser avansert funksjon

**Konverter med:**
```bash
cd docs/screenshots
for file in *.webp; do
    convert "$file" "${file%.webp}.png"
done
```

---

## 🎨 Grafiske Elementer

### App Icon

- **Eksisterende**: `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png`
- **Play Store trenger**: 512x512 px versjon

```bash
convert android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png \
  -resize 512x512 \
  play-store/icon-512.png
```

### Feature Graphic (valgfritt, men anbefalt)

- **Størrelse**: 1024x500 px
- **Forslag**: Lilla gradient bakgrunn med app-logo og tekst "SkyteKlokke - Timer for Konkurranseskyttere"
- Lag i GIMP, Canva, eller lignende

---

## 🔗 Lenker

**Website**: https://sigurdne.github.io/skyteklokke/

**Privacy Policy**: https://sigurdne.github.io/skyteklokke/privacy-policy.html

**GitHub Repository**: https://github.com/sigurdne/skyteklokke

**Support Email**: [din-epost@example.com]

---

## 🏷️ Tags og Søkeord

**Primære nøkkelord**:
- timer
- shooting timer
- pistol shooting
- competition timer
- feltskyting
- duellskyting
- standplassleder

**Sekundære nøkkelord**:
- DFS
- skytesport
- sports timer
- precision timer
- norsk skyting

---

## 📋 Release Notes Template

### Version 1.0.0 - Første release

**Norsk**:
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

**Engelsk** (for multi-language support):
```
🎉 First official release of SkyteKlokke!

Features:
• Field match timer with automatic phase transitions
• Duel match simulator
• Norwegian voice feedback and commands
• Customizable time settings
• Screen stays active during use
• Intuitive operation for range officers

Developed by and for Norwegian shooters.
```

### Version 1.0.1 - Template for fremtidige oppdateringer

```
🔧 Oppdatering 1.0.1

Forbedringer:
• [Beskrivelse av ny funksjon]
• [Beskrivelse av forbedring]

Feilrettinger:
• [Beskrivelse av bug-fix]

Takk for tilbakemeldinger!
```

---

## 📊 App Content Svar

### Data Safety Questionnaire

**Does your app collect or share user data?**
- ❌ No

**Rationale**: Appen lagrer kun innstillinger lokalt på enheten. Ingen data sendes til eksterne servere eller deles med tredjeparter.

### Ads Declaration

**Does your app contain ads?**
- ❌ No

**Rationale**: Appen er 100% gratis og reklamefri.

### Target Audience

**Target age group**: 13+ eller "All ages"

**Does your app appeal specifically to children?**
- ❌ No

**Rationale**: Appen er designet for skytteentusiaster og konkurranseskyttere.

### Content Rating (IARC)

**App category**: Sports / Tools

**Expected rating**: PEGI 3 / Everyone

**Questionnaire answers** (alle sannsynligvis "No"):
- Violence: No
- Sexual content: No
- Profanity: No
- Drugs/alcohol/tobacco: No
- Gambling: No
- Scary content: No

---

## 🌍 Distribution

### Countries/regions

**Anbefalt for første release**:
- 🇳🇴 Norge
- 🇸🇪 Sverige
- 🇩🇰 Danmark

**Kan utvides til**:
- 🇬🇧 United Kingdom
- 🇺🇸 United States
- 🇩🇪 Germany
- 🇫🇷 France
- Eller: **All countries**

### Pricing

**Type**: Free

**In-app purchases**: None

---

## ✅ Pre-Launch Checklist

Sjekk av følgende før lansering:

- [ ] App navn bekreftet: SkyteKlokke
- [ ] Kort beskrivelse skrevet (60/80 tegn)
- [ ] Full beskrivelse skrevet (~1840/4000 tegn)
- [ ] Minimum 4 screenshots konvertert til PNG
- [ ] 512x512 app-ikon opprettet
- [ ] Feature graphic opprettet (valgfritt)
- [ ] Privacy policy URL: https://sigurdne.github.io/skyteklokke/privacy-policy.html
- [ ] Website URL: https://sigurdne.github.io/skyteklokke/
- [ ] Support e-post bekreftet
- [ ] Content rating fullført (IARC)
- [ ] Data safety fullført (No data collection)
- [ ] Target audience valgt (13+)
- [ ] Countries/regions valgt (Norge, Sverige, Danmark)
- [ ] App Bundle bygget og testet
- [ ] Release notes skrevet
- [ ] Google Play Developer-konto opprettet ($25)
- [ ] Upload keystore generert
- [ ] keystore.properties konfigurert

---

## 🎯 Suksessmål

**Første uke**:
- 10+ nedlastninger
- Ingen kritiske bugs
- 4+ stjerner rating

**Første måned**:
- 50+ nedlastninger
- 5+ anmeldelser
- Positive tilbakemeldinger fra skyttemiljøet

**Langsiktig**:
- Bli standard timer for norske skytterlag
- Ekspandere til flere språk
- Community-drevne forbedringer

---

## 📞 Support

For spørsmål om Play Store-oppføringen, kontakt:
- E-post: [din-epost@example.com]
- GitHub Issues: https://github.com/sigurdne/skyteklokke/issues

---

**Lykke til med lanseringen!** 🚀
