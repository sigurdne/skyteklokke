# Plan for å innføre PPC-programmer i SkyteKlokke

Dette dokumentet beskriver hvordan vi kan legge til nye PPC-programmer (Precision Pistol Competition) i appen. Fokus er både på funksjonell opplevelse for skytteren og hvordan vi implementerer støtte i kodebasen.

## 1. Mål og omfang

- Legg til et nytt programområde kalt **PPC** med tre hoveddisipliner: `WA1500 - 150 skudds match`, `WA1500 - 60 skudds match` og `WA1500 - 48 skudds match`.
- Hjem-skjermen skal få et nytt kort/knapp merket **PPC** med undertittel **Precision Pistol Competition**.
- Hver hoveddisiplin består av faste matcher og eventuelle underliggende *stages*.
- Skytteren skal få tydelig briefing før hvert delmoment (avstand, skytetid, skytestilling og antall skudd per stilling).
- Appen skal kunne brukes til både konkurranse og trening; i treningssammenheng må rekkefølge og repetisjon av matcher/stages være fleksibel.
- Tydelige kommandoer og nedtelling skal styre skyteforløpet, med lydsignal både ved start og slutt.

## 2. Programoversikt og struktur

| Hovedprogram | Match / Stage | Avstand | Iterasjoner | Skytestilling (rekkefølge) | Skytetid |
|--------------|---------------|---------|-------------|------------------------|----------|
| **WA1500 - 150 skudds match** | Match 1 Stage 1 | 7 yard | 2×6 skudd | Stående | 20 s |
| | Match 1 Stage 2 | 15 yard | 2×6 skudd | Stående | 20 s |
| | Match 2 | 25 yard | 3×6 skudd | Kne, stå venstre barrikade, stå høyre barrikade | 90 s |
| | Match 3 | 50 yard | 4×6 skudd | Sittende, liggende, stå venstre barrikade, stå høyre barrikade | 165 s |
| | Match 4 | 25 yard (×2) | 2×6 skudd | Stående | 35 s |
| | Match 5 Stage 1 | 7 yard | 2×6 skudd | Stående | 20 s |
| | Match 5 Stage 2 | 25 yard | 3×6 skudd | Kne, stå venstre barrikade, stå høyre barrikade | 90 s |
| | Match 5 Stage 3 | 50 yard | 4×6 skudd | Sittende, liggende | 165 s |
| | Match 5 Stage 4 | 25 yard | 6 skudd | Stående | 12 s |
| **WA1500 - 60 skudds match** | Stage 1 | 7 yard | 2×6 skudd | Stående | 20 s |
|        | Stage 2 | 25 yard | 3×6 skudd | Kne, stå venstre barrikade, stå høyre barrikade | 90 s |
|        | Stage 3 | 50 yard | 4×6 skudd | Sittende, liggende, stå venstre barrikade, stå høyre barrikade | 165 s |
|        | Stage 4 | 25 yard | 6 skudd | Stående uten støtte | 12 s |
| **WA1500 - 48 skudds match** | Stage 1 | 3 yard | 6 (5) skudd | Én hånd, stående uten støtte | 8 s |
|        | Stage 2 | 7 yard | 12 (10) skudd | Stående uten støtte | 20 s |
|        | Stage 3 | 15 yard | 12 (10) skudd | Stående uten støtte | 20 s |
|        | Stage 4 | 25 yard | 18 (15) skudd | Kne, stå venstre barrikade, stå høyre barrikade | 90 s |

> **Merk:** Tall i parentes gjelder den alternative 40-skuddsvarianten av PPC 48.
> **Referanse:** Stage-beskrivelser følger reglementets §7.2, §7.3, §7.4, §7.6 (PPC 60) og §7.9 (PPC 48).

## 3. Logisk flyt per stage

1. **Briefing**
   - Består av to deler: **tittel** (match/stage-navn) og **øvelsesbeskrivelse** (avstand, iterasjoner, skytestilling i rekkefølge og skytetid).
   - Briefing skal kunne gjenbrukes på tvers av hovedprogrammer: både tittel og øvelsesbeskrivelse lagres med felles nøkler, og tilhørende lydopptak kan knyttes til samme referanser.
   - Lagres i i18n for flerspråklig støtte og skal kunne spille av et forhåndsinnspilt lydklipp i lydmodus.

2. **Kommandoer**
   1. "Lade, hylstre" (forberedelse)
   2. "Er linja klar?"
   3. "Linja er klar" (trigger for strekk på -3 sekunder)
   - Alle tre kommandoer skal støtte avspilling av et forhåndsinnspilt lydklipp (gjenbrukes på tvers av stages).

3. **Nedtelling og skyting**
   - Når kommando 3 er annonsert, viser klokka `-3`, `-2`, `-1` før den hopper til valgt skytetid (f.eks. `165`) og teller ned til `0`.
   - Kort skarpt lydsignal ved overgang fra `-1 → skytetid`. Nytt signal ved `0`.

4. **Avslutning**
   - Etter lydsignalet ved `0`, stopp timer og gå videre til neste stage (automatisk eller manuelt valg).

## 4. Tidskonfigurasjoner

- Tillatte skytetider: `8`, `12`, `20`, `35`, `90`, `165` sekunder.
- Match-/stage-definisjonene må referere til en av disse verdiene.
- Dersom PPC senere krever andre tider, utvid listen og oppdater UI-validering.

## 5. Datamodell og kodeendringer

1. **Nytt program**
   - Opprett `PPCProgram` (f.eks. `src/programs/ppc/PPCProgram.ts`).
   - Arv fra `BaseProgram` som de andre programmene.
   - Konfigurer `defaultSettings` med PPC-spesifikke felter (f.eks. valgt hoveddisiplin, valgt match/stage, lydmodus etc.).

2. **Stage-definisjoner**
   - Lag struktur i koden (f.eks. JSON eller TypeScript-objekt) som beskriver hver stage og muliggjør gjenbruk av briefing:

     ```ts
     interface PPCStage {
       id: string;
       match: string;
       stage?: string;
       distanceYards: number;
       series: Array<{ shots: number; position: 'kne' | 'stå' | 'sitt' | 'ligg' | 'barrikade_l' | 'barrikade_h' }>;
       timeSeconds: 8 | 12 | 20 | 35 | 90 | 165;
       titleKey: string; // i18n nøkkel for match/stage-navn
       briefingKey: string; // i18n nøkkel for øvelsesbeskrivelse (gjenbrukes på tvers av hovedprogrammer)
       audioTitleKey?: string; // valgfritt opptak for tittel-delen
       audioBriefingKey?: string; // referanse til lagret lydopptak for øvelsesbeskrivelsen
     }
     ```

   - Lag en array for hver hoveddisiplin. Når samme stage dukker opp i flere programmer, referer til samme `id`, `titleKey` og `briefingKey` for å gjenbruke tekst og audio.
   - Eksempel: `WA1500 - 150 skudds match – Match 1 Stage 1` og `WA1500 - 60 skudds match – Stage 1` deler samme stage-id slik at briefingtekst og lydopptak gjenbrukes.

3. **ProgramSettings**
   - Utvid `ProgramSettings` der nødvendig med felt som `discipline`, `currentStageId`, `autoAdvance`, og referanser til valgte `briefingKey`/`audioBriefingKey`.
   - Legg til struktur for å lagre hvilke lydopptak som er knyttet til kommando 1–3 (f.eks. `commandAudioKeys`), slik at de kan spilles av på tvers av matcher.

4. **TimerSequence**
   - For hver stage, generer en sekvens i `getTimingSequence()` som dekker:
     - Negative trinn for `-3` til `-1` (kan løses ved å inkludere en pre-sekvens med countdown type `countdown` i `TimerEngine`).
     - `command`-felt for lydsignaler (f.eks. `beep` for start og slutt) og eventuelle referanser til lydopptak for kommando 1–3.
   - Alternativ: la `TimerScreen` styre -3 countdown (UI/TimerEngine). Undersøk eksisterende logikk for custom audio.

5. **TimerEngine**
   - Verifiser at motoren kan håndtere negative startverdier. Hvis ikke, utvid med et nytt state for "pre-start".
   - Lydsignaler: gjenbruk systemlyd eller custom audio (dersom `soundMode` aktivert) og sørg for at kommando-/briefingopptak trigges på riktige tidspunkt.

6. **Program Manager**
   - Registrer nytt program i `ProgramManager` (`registerProgram(new PPCProgram())`).

## 6. UI og brukeropplevelse

1. **Hjem-skjerm**
   - Nytt PPC-kort med tittel **PPC** og undertittel "Precision Pistol Competition".
   - Trykk åpner PPC-visning med liste over hovedprogrammer (WA1500 - 150 / 60 / 48).

2. **PPC-visning**
   - Nivå 1: liste over hovedprogrammer med kort beskrivelse og ikon.
   - Nivå 2: etter valg av hovedprogram vises match-/stage-liste. Deløvelser som forekommer flere ganger gjenbruker samme briefingtekst/audio.
   - Når en match/stage velges:
     - Vises briefingpanel som tydelig skiller **tittel** (match/stage-navn) og **øvelsesbeskrivelse** (avstand, iterasjoner, skytetid). Begge kan spilles av via egne knapper ved tilgjengelige opptak.
     - Viser tre kommando-knapper (1–3). Kommandoene har tilhørende lydopptak; kommando 3 trigger nedtellingen (-3 til 0).
   - Etter ferdig stage returnerer UI til match-/stage-listen for valgt hovedprogram slik at skytteren kan repetere eller velge neste.

3. **Innstillinger**
   - Lar skytteren velge standard hovedprogram og om appen skal auto-avanse til neste stage.
   - Tilbyr treningsmodus der bruker kan omarrangere eller repetere matcher/stages.
   - Inneholder egen seksjon for lydopptak:
     - Viser samme hierarki av hovedprogrammer → matcher/stages som i PPC-visningen.
     - For hvert stage kan bruker spille inn eller erstatte opptak for **tittel** og **briefing**.
     - Når et opptak allerede finnes via gjenbruk, listes det med mulighet for avspilling (test) og sletting før ny innspilling.
   - Tillater toggling av lydmodus samt valg av hvilke kommando-/briefingopptak som skal brukes.

## 7. Lyd og tilpasning

- Lydsignaler: gjenbruk eksisterende `beep`/`continuous_beep` eller introduser nye kommandoer (kort beep ved start + slutt).
- Custom audio: vurder om PPC trenger egne voice prompts (kan være gjenbruk av generiske kommandoer).
- Kommando 1–3 og briefingopptak må kunne spilles inn én gang og gjenbrukes på tvers av matcher/hovedprogram.
- Innstillingssiden skal bruke felles opptaksmodul som lagrer lyd med referanse til `audioTitleKey` og `audioBriefingKey`, slik at alle programmer deler samme ressurs.

## 8. Internasjonalisering

- Opprett i18n-strenger for
   - Programnavn: "WA1500 - 150 skudds match", "WA1500 - 60 skudds match", "WA1500 - 48 skudds match".
  - Match-/stage-beskrivelser.
  - Briefing-tekst (avstand, stilling, skytetid).
  - Kommandoer ("Lade, hylstre", "Er linja klar?", "Linja er klar").
- Oppdater `en`, `no`, `sv`, `da` JSON-filer.
- Alle brukertekster som vises i opptaksflyten (inkludert knapper, tomtilstand, bekreftelser og feilmeldinger) må registreres med i18n-nøkler som deles på tvers av språk og gjenbrukes både i PPC-visningen og innstillingssiden.

## 9. Testplan

1. **Funksjonelle tester**
   - Bekreft at PPC-kortet på hjem-skjermen åpner hovedprogramlisten.
   - Naviger gjennom alle hovedprogrammer og verifiser at del-stages med gjenbruk deler briefingtekst og lyd.
   - Test at briefing vises og kan spilles av før hver stage, og at kommando 1–3 kan trigges med tilhørende lyd (kommando 3 starter nedtelling).
   - Etter fullført stage skal visningen returnere til match-/stage-listen; verifiser mulighet til å kjøre samme stage igjen.

2. **Regression**
   - Sørg for at eksisterende programmer (standard felt, duel) fortsatt fungerer.

3. **Plattformer**
   - Test både i utvikler (Expo Go) og produksjonsbygg (APK/AAB) for å sikre at lyd ikke brytes.

## 10. Videre arbeid og avklaringer

- Detaljer fleksibel treningsmodus (hvordan bruker omarrangerer, lagrer og repeterer matcher/stages).
- Bestem om scoring integreres (ikke del av første iterasjon, men bør vurderes).
- Dokumenter kommando- og lydlogikk i kode (kommentarer) for vedlikehold.
- Arbeidsflyt for innspilling, lagring og gjenbruk av briefing- og kommandoopptak:
   1. Bruker åpner en stage i PPC-visningen og får opp detaljpanel med briefing- og kommando-seksjon.
   2. For hvert element (tittel, briefing, kommandoer) kan man spille av enten eksisterende opptak eller standard TTS via `AudioService`.
   3. «Ta opp» starter Expo AV-opptak; fil flyttes til `AudioClipService` bibliotek ved stopp og metadata lagres i AsyncStorage.
   4. Opptak kan slettes direkte fra panelet; da faller avspilling tilbake til standard TTS.
   5. Timeren vil etter integrasjon lese lagrede nøkler for å trigge tilpassede opptak under kommando/briefing.

## 11. TODO-liste

- [x] Registrer `PPCProgram` i `ProgramManager` med nødvendige standardinnstillinger.
- [x] Modellér stage-data (type `PPCStage`) og gjenbruk briefing- og audio-nøkler der det er mulig.
- [x] Generer timersekvenser per stage, inkludert -3 til -1 nedtelling og start/slutt-signaler.
- [x] Utvid `TimerEngine`/adaptere for å støtte negative tellere og PPC-spesifikke kommandoer.
- [x] Lag PPC-hjemvisning med navigasjon til hoveddisipliner og tilhørende matcher/stages.
- [x] Implementer briefing- og kommando-panel med avspillings- og opptaksstøtte.
- [ ] Integrer lydopptaksflyten i innstillinger med gjenbrukbare ressurser for PPC.
- [ ] Oppdater i18n-filer (no/en/sv/da) med alle nye PPC-strenger.
- [ ] Skriv testplan og gjennomfør regresjonstester for eksisterende programmer.

Når disse punktene er avklart kan vi lage konkrete utviklingsoppgaver (Issues) og estimere innsats per komponent.
