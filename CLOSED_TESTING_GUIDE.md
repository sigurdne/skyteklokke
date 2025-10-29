# Closed Testing Guide for SkyteKlokke

## 🎯 Mål

Kjøre en vellykket 14-dagers beta-test med minst 12 testere for å kvalifisere til produksjonspublisering på Google Play.

## ⏱️ Tidslinje

- **Start dato**: [Fyll inn når du starter Closed testing]
- **Slutt dato**: [Start dato + 14 dager]
- **Status**: 🔴 Ikke startet

## 👥 Testere

### 11.2 Legg til e-postadresser

Legg til minimum 12 e-postadresser knyttet til Google-kontoer:

```
tester1@gmail.com
tester2@example.com (hvis de har Google-konto med denne eposten)
...
tester12@gmail.com
```

**⚠️ VIKTIG: Google-konto er påkrevd!**
- Testere **må ha Google-konto** for å delta i Closed Testing
- De trenger **ikke Gmail** - hvilken som helst epost kan brukes til Google-konto
- Har de ikke Google-konto? De kan opprette gratis på: https://accounts.google.com/signup (tar ~2 min)
- E-postadressen du legger til må være den som er **knyttet til deres Google-konto**

**Tips for å finne testere:**
- Skytterklubben din (standplassledere, skyttere)
- Venner og familie (spør om de har Google-konto)
- Kollegaer
- Post i norske skytte-forum/Facebook-grupper
- Post på klubbens Discord/Slack

## 📋 Testplan

### Hva skal testes?

#### 1. Feltmatch Timer
- [ ] Start timer
- [ ] Pause/fortsett
- [ ] Tilbakestill
- [ ] Automatiske faseskift fungerer
- [ ] Lydvarsler fungerer
- [ ] Visuell indikasjon er tydelig

#### 2. Duellmatch Simulator
- [ ] Start simulator
- [ ] Pause/fortsett
- [ ] Tilbakestill
- [ ] Innstillinger endres korrekt
- [ ] Tidssekvenser følger reglene

#### 3. Generelt
- [ ] Appen starter korrekt
- [ ] Skjermen forblir aktiv under bruk
- [ ] Ingen krasj under normal bruk
- [ ] Navigasjon fungerer intuitivt
- [ ] Batteridrain er akseptabelt

### Testinstruksjoner for testere

Send dette til testere sammen med invitasjonen:

```
📱 Test av SkyteKlokke - Instruksjoner

Takk for at du hjelper til! Her er hva jeg ønsker at du tester:

1. FELTMATCH:
   - Trykk på "Feltmatch" på hovedskjermen
   - Start timeren og se at den teller ned
   - Test pause og fortsett
   - Sjekk at du får lyd-/vibrasjonsvarsel ved faseskift

2. DUELLMATCH:
   - Trykk på "Duellmatch" på hovedskjermen
   - Prøv å endre innstillinger
   - Start simulator og se at alt fungerer

3. GENERELT:
   - Bruk appen som du ville gjort i en ekte treningssituasjon
   - Rapporter alt som virker rart eller ikke fungerer
   - Gi gjerne forslag til forbedringer!

Send tilbakemelding til: [din-epost]

Takk! 🎯
```

## 📊 Fremdrift

### Uke 1 (Dag 1-7)

| Dag | Aktive testere | Crashes | Bugs rapportert | Notater |
|-----|----------------|---------|-----------------|---------|
| 1   | 0              | 0       | 0               |         |
| 2   |                |         |                 |         |
| 3   |                |         |                 |         |
| 4   |                |         |                 |         |
| 5   |                |         |                 |         |
| 6   |                |         |                 |         |
| 7   |                |         |                 |         |

### Uke 2 (Dag 8-14)

| Dag | Aktive testere | Crashes | Bugs rapportert | Notater |
|-----|----------------|---------|-----------------|---------|
| 8   |                |         |                 |         |
| 9   |                |         |                 |         |
| 10  |                |         |                 |         |
| 11  |                |         |                 |         |
| 12  |                |         |                 |         |
| 13  |                |         |                 |         |
| 14  | ✅             | ✅      | ✅              | Klar!   |

## 🐛 Bug-tracking

### Kritiske bugs (må fikses før production)
| # | Beskrivelse | Rapportert av | Dato | Status |
|---|-------------|---------------|------|--------|
|   |             |               |      |        |

### Mindre bugs (nice to have)
| # | Beskrivelse | Rapportert av | Dato | Status |
|---|-------------|---------------|------|--------|
|   |             |               |      |        |

### Forbedringsforslag
| # | Forslag | Rapportert av | Dato | Prioritet |
|---|---------|---------------|------|-----------|
|   |         |               |      |           |

## 📧 Kommunikasjon med testere

### Utsendelser

#### Invitasjon (Dag 0)
- [ ] E-post sendt til alle testere
- [ ] Invitasjonslenke inkludert
- [ ] Testinstruksjoner vedlagt

#### Påminnelse 1 (Dag 3)
- [ ] Påminn testere som ikke har opted-in
- [ ] Spør om det er problemer med å bli med

#### Midtveisoppdatering (Dag 7)
- [ ] Takk testere for innsatsen
- [ ] Del evt. oppdateringer/bugfikser
- [ ] Påminn om at testen fortsetter i 7 dager til

#### Siste uke (Dag 10)
- [ ] Påminn at testen snart er ferdig
- [ ] Be om siste tilbakemeldinger

#### Avslutning (Dag 14)
- [ ] Takk alle testere!
- [ ] Del når appen blir tilgjengelig i Production
- [ ] Gi credits i release notes

## ✅ Sjekkliste for produksjonstilgang

Før du søker om produksjonstilgang (dag 14+):

- [ ] 14 dager har gått siden første tester opted-in
- [ ] Minst 12 testere har vært opted-in hele perioden
- [ ] Appen har få eller ingen crashes (<0.5% crash rate)
- [ ] Kritiske bugs er fikset
- [ ] Store listing er komplett
- [ ] App content er komplett (privacy, content rating)
- [ ] Countries/regions er valgt
- [ ] AAB er klar for production

## 📞 Hvor finne testere?

### 1. Skyttermiljøet (best match!)
- Post i skytterklubben din
- Norges Pistolforbund forum/Facebook
- DFS (Det frivillige Skyttervesen) grupper
- Standplassleder-nettverk
- Trenere og instruktører

### 2. Familie og venner
- Be familie med Android-telefoner
- Kollegaer på jobb
- Venner (trenger ikke være skyttere for å teste)

### 3. Online communities
- Reddit: r/norway, r/androidapps
- Facebook-grupper for app-testing
- LinkedIn-nettverket ditt

### 4. Universitetet/høyskole
- Studentorganisasjoner
- IT/datagrupper
- Hvis du har tilknytning til universitet

## 📝 E-post mal: Invitasjon

```
Emne: Test SkyteKlokke - Beta for Android (14 dager)

Hei [navn]!

Jeg har utviklet en timer-app for konkurranseskyttere og trenger din hjelp til å teste den! 🎯

**Om appen:**
SkyteKlokke er en presisjons-timer for feltmatch og duellskyting, laget spesielt for norske standplassledere og skyttere.

**Hva jeg trenger fra deg:**
- 14 dagers beta-test (du trenger ikke bruke den daglig)
- Teste hovedfunksjonene (tar ~15 minutter)
- Gi tilbakemelding på hva som fungerer/ikke fungerer

**VIKTIG: Du må ha Google-konto!**
- Har du Gmail? Da har du allerede Google-konto! ✅
- Har du ikke? Opprett gratis her: https://accounts.google.com/signup (tar ~2 min)
- E-posten du bruker må være knyttet til din Google-konto

**Slik blir du med:**

1. Klikk på denne lenken: https://play.google.com/apps/testing/com.skyteklokke.app
2. Logg inn med din Google-konto
3. Klikk "Bli med i testen" (opt-in)
4. Vent noen minutter
5. Last ned "SkyteKlokke" fra Google Play Store
6. Test appen og send tilbakemelding til [din-epost]

**Viktig:**
- Du må forbli "opted-in" i hele testperioden (14 dager)
- Jeg trenger minimum 12 testere for å kunne publisere appen

Testinstruksjoner og mer info følger i neste e-post!

Takk for hjelpen! 🙏

Hilsen,
Sigurd Nes

---
P.S. Appen er 100% gratis, ingen reklame, ingen datainnsamling.
```

## 📝 E-post mal: Påminnelse (Dag 3)

```
Emne: Påminnelse: Test av SkyteKlokke

Hei!

Jeg sendte invitasjon til beta-test av SkyteKlokke for 3 dager siden.

Hvis du ikke har joined testen ennå, vil jeg sette stor pris på om du kan gjøre det! 🙏

Lenke: https://play.google.com/apps/testing/com.skyteklokke.app

Hvis du har problemer med å bli med, eller ikke har tid, er det helt greit - gi meg beskjed så finner jeg en annen tester.

Takk!

Sigurd
```

## 📝 E-post mal: Takk (Dag 14)

```
Emne: Takk for testing av SkyteKlokke! 🎉

Hei alle testere!

14-dagers beta-testen av SkyteKlokke er nå fullført! 🎉

Takk for deres fantastiske innsats! Tilbakemeldingene deres har vært uvurderlige, og appen er nå mye bedre takket være dere.

**Hva skjer nå:**
- Jeg søker nå om produksjonstilgang hos Google
- Når appen er godkjent, blir den tilgjengelig for alle på Google Play
- Dere vil automatisk få oppdateringer fremover
- Jeg gir dere credits i release notes! 🏆

Jeg sender beskjed når appen er live!

Takk igjen for hjelpen! 🙏

Sigurd Nes

---
SkyteKlokke - Timer for konkurranseskyttere
Gratis, ingen reklame, open source
```

## 🎯 Suksesskriterier

For å søke om produksjonstilgang:

✅ **Minimum 12 testere** opted-in hele perioden
✅ **14 dager sammenhengende** testing
✅ **Crash rate < 0.5%** (ideelt 0%)
✅ **Ingen kritiske bugs** uløst
✅ **Positive tilbakemeldinger** fra testere
✅ **Store listing komplett** i Play Console
✅ **App content komplett** (privacy, rating)

## 📅 Datoer å huske

| Milestone | Dato | Status |
|-----------|------|--------|
| Closed testing opprettet | [Fyll inn] | ⏳ |
| Første tester opted-in | [Fyll inn] | ⏳ |
| Uke 1 checkpoint | [+7 dager] | ⏳ |
| Dag 14 nådd | [+14 dager] | ⏳ |
| Søkt om produksjonstilgang | [+14 dager] | ⏳ |
| Produksjonstilgang godkjent | [Venter] | ⏳ |
| Production release | [Venter] | ⏳ |

---

**Lykke til med testingen! 🚀**
