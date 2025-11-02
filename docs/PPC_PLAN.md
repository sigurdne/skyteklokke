# Plan for å innføre PPC-programmer i SkyteKlokke

Dette dokumentet beskriver hvordan vi kan legge til nye PPC-programmer (Precision Pistol Competition) i appen. Fokus er både på funksjonell opplevelse for skytteren og hvordan vi implementerer støtte i kodebasen.

## 1. Mål og omfang

- Legg til et nytt programområde kalt **PPC** med tre hoveddisipliner: `WA1500 - 150 skudds match`, `WA1500 - 60 skudds match` og `WA1500 - 48 skudds match`.
- Hver hoveddisiplin består av faste matcher og eventuelle underliggende *stages*.
- Skytteren skal få tydelig briefing før hvert delmoment (avstand, skytetid, skytestilling og antall skudd per stilling).
- Appen skal kunne brukes til både konkurranse og trening; i treningssammenheng må rekkefølge og repetisjon av matcher/stages være fleksibel.
- Tydelige kommandoer og nedtelling skal styre skyteforløpet, med lydsignal både ved start og slutt.

## 2. Programoversikt og struktur

| Hovedprogram | Match / Stage | Avstand | Iterasjoner | Skytested (rekkefølge) | Skytetid |
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
   - Vises før nedtelling starter.
   - Inneholder tekst: `Avstand`, `Totalt antall skudd`, nedbrutt per skytestilling, og `Skytetid`.
   - Lagres i i18n for flerspråklig støtte.

2. **Kommandoer**
   1. "Lade, hylstre" (forberedelse)
   2. "Er linja klar?"
   3. "Linja er klar" (trigger for strekk på -3 sekunder)

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
   - Lag struktur i koden (f.eks. JSON eller TypeScript-objekt) som beskriver hver stage:

     ```ts
     interface PPCStage {
       id: string;
       match: string;
       stage?: string;
       distanceYards: number;
       series: Array<{ shots: number; position: 'kne' | 'stå' | 'sitt' | 'ligg' | 'barrikade_l' | 'barrikade_h' }>;
       timeSeconds: 8 | 12 | 20 | 35 | 90 | 165;
       briefingKey: string; // i18n nøkkel
     }
     ```

   - Lag en array for hver hoveddisiplin.

3. **ProgramSettings**
   - Utvid `ProgramSettings` der nødvendig med felt som `discipline`, `currentStageIndex`, `autoAdvance`, etc.

4. **TimerSequence**
   - For hver stage, generer en sekvens i `getTimingSequence()` som:
     - Bruker negative trinn for `-3` til `-1` (kan løses ved å inkludere en pre-sekvens med countdown type `countdown` i `TimerEngine`).
     - Setter `command`-felt for lydsignaler (f.eks. `beep` for start og slutt).
   - Alternativ: la `TimerScreen` styre -3 countdown (UI/TimerEngine). Undersøk eksisterende logikk for custom audio.

5. **TimerEngine**
   - Verifiser at motoren kan håndtere negative startverdier. Hvis ikke, utvid med et nytt state for "pre-start".
   - Lydsignaler: gjenbruk systemlyd eller custom audio (dersom `soundMode` aktivert).

6. **Program Manager**
   - Registrer nytt program i `ProgramManager` (`registerProgram(new PPCProgram())`).

## 6. UI og brukeropplevelse

1. **Hjem-skjerm**
   - Legg til nytt kort for PPC (ikon + beskrivelse).
   - Evt. underkategorier ("WA1500 - 150 skudds match", "WA1500 - 60 skudds match", "WA1500 - 48 skudds match") i en modal eller nedtrekksmeny.

2. **TimerScreen**
   - Vis aktiv match/stage øverst (f.eks. `Match 3 – Stage 2`).
   - Legg inn briefing-panel (kan være kollapsbar) som lister distanse og shotplan.
   - Etter hver stage, vis resultatoppsummering / mulighet til å gå videre.

3. **Innstillinger**
   - Lar Skytteren velge hovedprogram ("WA1500 - 150 skudds match", "WA1500 - 60 skudds match", "WA1500 - 48 skudds match") og om appen skal auto-avanse til neste stage.
   - Tilbyr treningsmodus der skytter kan omarrangere eller repetere matcher/stages etter behov.
   - Tillat toggling av lydmodus som i eksisterende feltprogram.

## 7. Lyd og tilpasning

- Lydsignaler: gjenbruk eksisterende `beep`/`continuous_beep` eller introduser nye kommandoer (kort beep ved start + slutt).
- Custom audio: vurder om PPC trenger egne voice prompts (kan være gjenbruk av generiske kommandoer).

## 8. Internasjonalisering

- Opprett i18n-strenger for
   - Programnavn: "WA1500 - 150 skudds match", "WA1500 - 60 skudds match", "WA1500 - 48 skudds match".
  - Match-/stage-beskrivelser.
  - Briefing-tekst (avstand, stilling, skytetid).
  - Kommandoer ("Lade, hylstre", "Er linja klar?", "Linja er klar").
- Oppdater `en`, `no`, `sv`, `da` JSON-filer.

## 9. Testplan

1. **Funksjonelle tester**
   - Gjennomfør alle matcher og stages i "WA1500 - 150 skudds match" for å sikre riktig rekkefølge og tidsbruk.
   - Bekreft at -3 → skytetid → 0 fungerer med lydsignaler.
   - Test auto-avanse (hvis implementert).

2. **Regression**
   - Sørg for at eksisterende programmer (standard felt, duel) fortsatt fungerer.

3. **Plattformer**
   - Test både i utvikler (Expo Go) og produksjonsbygg (APK/AAB) for å sikre at lyd ikke brytes.

## 10. Videre arbeid og avklaringer

- Detaljer fleksibel treningsmodus (hvordan bruker omarrangerer, lagrer og repeterer matcher/stages).
- Bestem om scoring integreres (ikke del av første iterasjon, men bør vurderes).
- Dokumenter kommando- og lydlogikk i kode (kommentarer) for vedlikehold.

Når disse punktene er avklart kan vi lage konkrete utviklingsoppgaver (Issues) og estimere innsats per komponent.
