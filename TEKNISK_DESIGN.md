# SkyteKlokke - Teknisk Design

## Arkitektur Oversikt

### Modulær Program-arkitektur
```
App Core
├── Program Registry (Tilgjengelige programmer)
├── Program Manager (Aktiv program-håndtering)
├── Timer Engine (Felles timer-logikk)
├── Audio Manager (TTS og lydkommandoer)
├── UI Manager (Skjerm og farger)
└── i18n Manager (Flerspråklig støtte)

Program Plugins
├── Field Programs (Feltskyting varianter)
├── Duel Programs (Duell varianter)
├── Training Programs (Treningsprogrammer)
└── Competition Programs (Konkurranser)
```

### BaseProgram Abstrakt Klasse
```javascript
// Abstrakt basisklasse for alle skyteprogrammer
abstract class BaseProgram {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.category = config.category; // 'field', 'duel', 'training', 'competition'
    this.type = config.type; // 'visual', 'audio', 'light', 'mixed'
    this.supportedLanguages = config.supportedLanguages || ['no', 'en'];
    this.defaultSettings = config.defaultSettings || {};
  }
  
  // Abstrakte metoder som må implementeres
  abstract getStates();           // Timer states for programmet
  abstract getCommands();         // Kommandoer som brukes
  abstract getTimingSequence();   // Timing-sekvens
  abstract getUIConfig();         // UI konfiguration
  abstract validateSettings(settings); // Validering av innstillinger
  
  // Felles metoder
  getDuration() { return this.calculateTotalDuration(); }
  isAudioSupported() { return this.type.includes('audio'); }
  isVisualSupported() { return this.type.includes('visual'); }
  getDefaultLanguage() { return this.supportedLanguages[0]; }
}
```

## Timer Implementation

### Core Timer Logic
```javascript
// Timer hook for å håndtere alle timer states
const useShootingTimer = () => {
  const [mode, setMode] = useState('field') // 'field' eller 'duel'
  const [state, setState] = useState('idle')
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [shootingDuration, setShootingDuration] = useState(10)
  const [currentPhase, setCurrentPhase] = useState(null)
  
  // Duell-skyting spesifikke states
  const [sequenceCount, setSequenceCount] = useState(0)
  const [lightPhase, setLightPhase] = useState(null) // 'red', 'green', 'pause'
  
  // Timer phases med eksakte tidspunkter for feltskyting
  const fieldPhases = {
    readyCheck: 15,   // "Er skytterne klare" - 15s før ild
    prepare: 5,       // "Klar" - 5s før ild  
    fire: 0,          // "Ild" - start skyting
    cease: -2,        // "Stans" - 2s før slutt
    finished: -(shootingDuration) // Ferdig
  }
  
  // Duell-skyting sekvens
  const duelSequence = {
    countdown: 60,    // 60s nedtelling
    redLight: 7,      // 7s rødt lys
    greenLight: 3,    // 3s grønt lys
    totalSequences: 5 // 5 komplette sekvenser
  }
}
```

### State Machine
```javascript
const TIMER_STATES = {
  // Feltskyting states
  IDLE: 'idle',
  COUNTDOWN: 'countdown',     // Nedtelling før "Er skytterne klare"
  READY_CHECK: 'ready_check', // "Er skytterne klare"
  PREPARE: 'prepare',         // "Klar"
  FIRE: 'fire',              // "Ild" - aktiv skyting
  CEASE_FIRE: 'cease_fire',  // "Stans"
  FINISHED: 'finished',
  
  // Duell-skyting states
  DUEL_IDLE: 'duel_idle',
  DUEL_START_COMMAND: 'duel_start',    // "Start" kommando
  DUEL_COUNTDOWN: 'duel_countdown',     // 60s nedtelling
  DUEL_RED_LIGHT: 'duel_red_light',    // 7s rødt lys
  DUEL_GREEN_LIGHT: 'duel_green_light', // 3s grønt lys
  DUEL_PAUSE: 'duel_pause',            // Pause mellom sekvenser
  DUEL_FINAL_RED: 'duel_final_red',    // Permanent rødt lys
  DUEL_COMPLETE: 'duel_complete'        // Ferdig
}
```

## UI/UX Design

### Skjerm Layout

#### Feltskyting Modus
```
┌─────────────────────────────────┐
│           SKYTEKLOKKE           │
│          [FELTSKYTING]          │
├─────────────────────────────────┤
│                                 │
│         [STOR TIMER]            │
│            :45                  │
│                                 │
├─────────────────────────────────┤
│        "ER SKYTTERNE KLARE"     │
├─────────────────────────────────┤
│  [START]  [PAUSE]  [RESET]     │
│                                 │
│  ⚙️ Innstillinger  🎯 Duell     │
└─────────────────────────────────┘
```

#### Duell-skyting Modus
```
┌─────────────────────────────────┐
│         DUELL-SKYTING           │
│       Sekvens: 3/5              │
├─────────────────────────────────┤
│                                 │
│                                 │
│        [FULLSKJERM LYS]         │
│            RØD/GRØNN            │
│                                 │
│                                 │
├─────────────────────────────────┤
│           Timer: 05             │
│       (7s rød / 3s grønn)       │
├─────────────────────────────────┤
│  [START]  [PAUSE]  [RESET]     │
│  📊 Status  ⚙️ Innstillinger    │
└─────────────────────────────────┘
```

### Fargeskjema per Fase

#### Feltskyting
- **Idle:** Grå bakgrunn, hvit tekst
- **Ready Check:** Rød bakgrunn (#FF6B6B), hvit tekst  
- **Prepare:** Orange bakgrunn (#FF8E53), hvit tekst
- **Fire:** Grønn bakgrunn (#4ECDC4), hvit tekst
- **Cease Fire:** Gul bakgrunn (#FFE66D), svart tekst

#### Duell-skyting
- **Countdown:** Mørk bakgrunn (#2C3E50), store hvite tall
- **Rødt lys:** Fullskjerm rød (#DC143C), ingen tekst
- **Grønt lys:** Fullskjerm grønn (#228B22), ingen tekst
- **Pause:** Svart skjerm (#000000)
- **Ferdig:** Permanent rød bakgrunn med tekst "FERDIG"

### Typography
- **Timer:** 72px, monospace font
- **Kommando:** 24px, bold, sans-serif
- **Knapper:** 18px, medium, sans-serif

## Konfigurasjon System

### Innstillinger som kan justeres
```javascript
const defaultSettings = {
  shootingDuration: 10,      // Sekunder aktiv skyting
  ceaseFireWarning: 2,       // Sekunder før "stans"
  vibrationEnabled: true,    // Vibrasjon på kommandoer
  soundEnabled: false,       // Lydkommandoer (treningsmodus)
  keepScreenOn: true,        // Hold skjerm på under bruk
  timerProfile: 'feltskyting', // Profil for kommandosekvens
  language: 'auto',          // Språkvalg (auto, no, en, sv, da)
  autoDetectLanguage: true,  // Automatisk språkdeteksjon
  
  // Audio-innstillinger
  audioVolume: 80,           // Lydvolum (0-100%)
  ttsRate: 1.0,             // TTS hastighet (0.5-2.0)
  ttsPitch: 1.0,            // TTS toneleie (0.5-2.0)
  usePrerecorded: false,    // Bruk forhåndsinnspilte vs TTS
  audioMode: 'tts',         // 'tts', 'prerecorded', 'mixed'
  muteSpecificCommands: []  // Array av kommandoer som skal dempes
}
```

### i18n Konfigurasjon
```javascript
// src/i18n/index.js
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import språkfiler
import no from './locales/no.json';
import en from './locales/en.json';
import sv from './locales/sv.json';
import da from './locales/da.json';

const resources = { no, en, sv, da };

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: Localization.locale.split('-')[0], // nb-NO -> nb
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
```

### Språkfiler Struktur
```javascript
// src/i18n/locales/no.json
{
  "commands": {
    "ready_check": "Er skytterne klare",
    "prepare": "Klar", 
    "fire": "Ild",
    "cease_fire": "Stans"
  },
  "ui": {
    "start": "Start",
    "pause": "Pause",
    "reset": "Reset",
    "settings": "Innstillinger",
    "timer": "Timer",
    "duration": "Varighet",
    "language": "Språk"
  },
  "phases": {
    "idle": "Klar til start",
    "countdown": "Countdown",
    "ready_check": "Skytterne klargjøres",
    "prepare": "Forberedt", 
    "fire": "Aktiv skyting",
    "cease_fire": "Skyting avsluttet",
    "finished": "Ferdig"
  },
  "settings": {
    "shooting_duration": "Skytetid (sekunder)",
    "cease_warning": "Stans-varsel (sekunder)",
    "vibration": "Vibrasjon",
    "language_selection": "Velg språk",
    "auto_detect": "Automatisk deteksjon"
  }
}
```

### Profiler for ulike skytedisipliner
```javascript
const profiles = {
  feltskyting: {
    name: "Feltskyting",
    type: "field",
    readyTime: 10,    // "Er skytterne klare"
    prepareTime: 5,   // "Klar" 
    defaultDuration: 10,
    ceaseWarning: 2,
    commands: ['ready_check', 'prepare', 'fire', 'cease_fire'],
    supportsTTS: true,
    audioEnabled: true
  },
  pistol: {
    name: "Pistol",
    type: "field",
    readyTime: 7,
    prepareTime: 3,
    defaultDuration: 8,
    ceaseWarning: 2,
    commands: ['ready_check', 'prepare', 'fire', 'cease_fire'],
    supportsTTS: true,
    audioEnabled: true
  },
  duell: {
    name: "Duell-skyting",
    type: "duel",
    countdownTime: 60,     // 60s nedtelling
    redLightDuration: 7,   // 7s rødt lys
    greenLightDuration: 3, // 3s grønt lys
    totalSequences: 5,     // 5 lyssekvenser
    commands: ['start'],
    supportsTTS: false,    // Kun visuell for duell
    audioEnabled: false
  }
  // Flere profiler kan legges til senere
}
```

## Audio Implementation

### TTS (Text-to-Speech) System
```javascript
// Expo Speech implementasjon
import * as Speech from 'expo-speech';

const AudioManager = {
  // Speak kommando med konfigurasjon
  async speakCommand(text, language = 'no', options = {}) {
    const speechOptions = {
      language: language,
      pitch: options.pitch || 1.0,
      rate: options.rate || 1.0,
      volume: options.volume || 0.8,
      ...options
    };
    
    await Speech.speak(text, speechOptions);
  },
  
  // Stopp TTS
  stopSpeaking() {
    Speech.stop();
  },
  
  // Sjekk om TTS er tilgjengelig
  async isAvailable() {
    return await Speech.isSpeakingAsync();
  }
};
```

### Audio Command Timing
```javascript
// Presis timing av audio-kommandoer
const useAudioCommands = (profile, settings) => {
  const commands = useCommands(); // i18n hook
  
  const playCommand = useCallback(async (commandKey, delay = 0) => {
    if (!settings.soundEnabled) return;
    
    // Delay før kommando spilles
    setTimeout(async () => {
      const text = commands[commandKey];
      await AudioManager.speakCommand(text, settings.language, {
        pitch: settings.ttsPitch,
        rate: settings.ttsRate,
        volume: settings.audioVolume / 100
      });
    }, delay * 1000);
  }, [commands, settings]);
  
  return { playCommand };
};
```

### Kommando-lengde og Timing
```javascript
// Estimert lengde av kommandoer for optimal timing
const COMMAND_DURATIONS = {
  no: {
    'ready_check': 2.5, // "Er skytterne klare" - 2.5s
    'prepare': 0.8,     // "Klar" - 0.8s
    'fire': 0.5,        // "Ild" - 0.5s
    'cease_fire': 2.0   // "Stans" - hele 2 sekunder (kontinuerlig)
  },
  en: {
    'ready_check': 2.0, // "Are the shooters ready" - 2.0s
    'prepare': 0.6,     // "Ready" - 0.6s
    'fire': 0.4,        // "Fire" - 0.4s
    'cease_fire': 2.0   // "Cease fire" - hele 2 sekunder (kontinuerlig)
  }
    // Fremtidige språk...
};
```

## Program Registry System

### Program Manager
```javascript
class ProgramManager {
  constructor() {
    this.programs = new Map();
    this.activeProgram = null;
  }
  
  // Registrer nytt program
  registerProgram(program) {
    if (!(program instanceof BaseProgram)) {
      throw new Error('Program must extend BaseProgram');
    }
    this.programs.set(program.id, program);
  }
  
  // Hent tilgjengelige programmer
  getAvailablePrograms(category = null) {
    const programs = Array.from(this.programs.values());
    return category 
      ? programs.filter(p => p.category === category)
      : programs;
  }
  
  // Aktiver program
  setActiveProgram(programId, settings = {}) {
    const program = this.programs.get(programId);
    if (!program) throw new Error(`Program ${programId} not found`);
    
    if (!program.validateSettings(settings)) {
      throw new Error('Invalid settings for program');
    }
    
    this.activeProgram = program;
    return program;
  }
}
```

### Eksempel: Standard Feltskyting Program
```javascript
class StandardFieldProgram extends BaseProgram {
  constructor() {
    super({
      id: 'standard-field',
      name: 'Standard Feltskyting',
      category: 'field',
      type: 'visual-audio',
      supportedLanguages: ['no', 'en', 'sv', 'da'],
      defaultSettings: {
        shootingDuration: 10,
        ceaseWarning: 2,
        readyTime: 10,
        prepareTime: 5,
        audioEnabled: false
      }
    });
  }
  
  getStates() {
    return {
      IDLE: 'idle',
      READY_CHECK: 'ready_check',
      PREPARE: 'prepare',
      FIRE: 'fire',
      CEASE_FIRE: 'cease_fire',
      FINISHED: 'finished'
    };
  }
  
  getCommands() {
    return ['ready_check', 'prepare', 'fire', 'cease_fire'];
  }
  
  getTimingSequence() {
    return [
      { state: 'READY_CHECK', duration: this.settings.readyTime, command: 'ready_check' },
      { state: 'PREPARE', duration: this.settings.prepareTime, command: 'prepare' },
      { state: 'FIRE', duration: this.settings.shootingDuration, command: 'fire' },
      { state: 'CEASE_FIRE', duration: this.settings.ceaseWarning, command: 'cease_fire' },
      { state: 'FINISHED', duration: 0 }
    ];
  }
  
  getUIConfig() {
    return {
      colors: {
        idle: '#95A5A6',
        ready_check: '#FF6B6B',
        prepare: '#FF8E53',
        fire: '#4ECDC4',
        cease_fire: '#FFE66D'
      },
      layout: 'timer-with-commands'
    };
  }
  
  validateSettings(settings) {
    return settings.shootingDuration >= 5 && 
           settings.shootingDuration <= 60 &&
           settings.ceaseWarning >= 1 &&
           settings.ceaseWarning <= 5;
  }
}
```

### Eksempel: Intervall-trening Program
```javascript
class IntervalTrainingProgram extends BaseProgram {
  constructor() {
    super({
      id: 'interval-training',
      name: 'Intervalltrening',
      category: 'training',
      type: 'audio',
      defaultSettings: {
        intervals: 5,
        workDuration: 30,
        restDuration: 10,
        audioEnabled: true
      }
    });
  }
  
  getStates() {
    return {
      IDLE: 'idle',
      WORK: 'work',
      REST: 'rest',
      FINISHED: 'finished'
    };
  }
  
  getCommands() {
    return ['start_work', 'start_rest', 'finished'];
  }
  
  getTimingSequence() {
    const sequence = [];
    for (let i = 0; i < this.settings.intervals; i++) {
      sequence.push(
        { state: 'WORK', duration: this.settings.workDuration, command: 'start_work' },
        { state: 'REST', duration: this.settings.restDuration, command: 'start_rest' }
      );
    }
    sequence.push({ state: 'FINISHED', duration: 0, command: 'finished' });
    return sequence;
  }
  
  getUIConfig() {
    return {
      colors: {
        idle: '#95A5A6',
        work: '#27AE60',
        rest: '#3498DB',
        finished: '#95A5A6'
      },
      layout: 'interval-display'
    };
  }
  
  validateSettings(settings) {
    return settings.intervals >= 1 && 
           settings.intervals <= 20 &&
           settings.workDuration >= 10 &&
           settings.restDuration >= 5;
  }
}
```

### Eksempel: Silhuett-skyting Program
```javascript
class SilhouetteProgram extends BaseProgram {
  constructor() {
    super({
      id: 'silhouette-training',
      name: 'Silhuettskyting Tørrtrening',
      category: 'training',
      type: 'visual-audio',
      supportedLanguages: ['no', 'en', 'sv', 'da'],
      defaultSettings: {
        preparationTime: 60,
        redLightDuration: 7,
        greenLightOptions: [8, 6, 4], // Forskjellige serietyper
        seriesCount: 5,
        shotsPerSeries: 5,
        audioAssistance: true,
        liftCue: true,
        shootingRhythm: true
      }
    });
  }
  
  getStates() {
    return {
      IDLE: 'idle',
      PREPARATION: 'preparation',
      RED_LIGHT: 'red_light',
      GREEN_LIGHT: 'green_light',
      SERIES_BREAK: 'series_break',
      FINISHED: 'finished'
    };
  }
  
  getCommands() {
    return [
      'ready_silhouette', 'weapon_down', 'lift_weapon', 
      'shoot_1', 'shoot_2', 'shoot_3', 'shoot_4', 'shoot_5',
      'weapon_down_end', 'series_complete'
    ];
  }
  
  getTimingSequence() {
    const sequence = [
      { state: 'PREPARATION', duration: this.settings.preparationTime, command: 'ready_silhouette' }
    ];
    
    for (let series = 0; series < this.settings.seriesCount; series++) {
      // Velg tilfeldig grønn lys-varighet
      const greenDuration = this.settings.greenLightOptions[
        Math.floor(Math.random() * this.settings.greenLightOptions.length)
      ];
      
      sequence.push(
        { 
          state: 'RED_LIGHT', 
          duration: this.settings.redLightDuration, 
          command: 'weapon_down',
          seriesNumber: series + 1
        },
        { 
          state: 'GREEN_LIGHT', 
          duration: greenDuration, 
          command: 'lift_weapon',
          seriesNumber: series + 1,
          shotsRequired: this.settings.shotsPerSeries,
          shootingRhythm: this.calculateShootingRhythm(greenDuration)
        }
      );
    }
    
    sequence.push({ state: 'FINISHED', duration: 0, command: 'series_complete' });
    return sequence;
  }
  
  calculateShootingRhythm(greenDuration) {
    // Beregn optimal rytme for 5 skudd
    const shotsNeeded = this.settings.shotsPerSeries;
    const timePerShot = (greenDuration - 1) / shotsNeeded; // -1s for løftetid
    
    return {
      liftTime: 1.0, // 1 sekund for løft
      timePerShot: timePerShot,
      shotIntervals: Array.from({length: shotsNeeded}, (_, i) => 1.0 + (i + 1) * timePerShot)
    };
  }
  
  getUIConfig() {
    return {
      colors: {
        idle: '#95A5A6',
        preparation: '#3498DB',
        red_light: '#E74C3C',
        green_light: '#27AE60',
        series_break: '#F39C12',
        finished: '#95A5A6'
      },
      layout: 'silhouette-display',
      fullscreenLights: true, // Fullskjerm rød/grønn lys
      showSeriesCounter: true,
      showShotCounter: true
    };
  }
  
  getAudioConfig() {
    return {
      enabled: this.settings.audioAssistance,
      liftCue: {
        enabled: this.settings.liftCue,
        timing: 'onGreenLight',
        message: 'lift_weapon'
      },
      shootingRhythm: {
        enabled: this.settings.shootingRhythm,
        useBeeps: true, // Pip-lyder i stedet for ord
        beatTiming: 'calculated' // Basert på calculateShootingRhythm
      },
      weaponDown: {
        enabled: true,
        timing: 'onRedLight',
        message: 'weapon_down'
      }
    };
  }
  
  validateSettings(settings) {
    return settings.preparationTime >= 30 && 
           settings.preparationTime <= 120 &&
           settings.redLightDuration >= 5 &&
           settings.redLightDuration <= 10 &&
           settings.seriesCount >= 1 &&
           settings.seriesCount <= 10 &&
           settings.shotsPerSeries >= 3 &&
           settings.shotsPerSeries <= 10;
  }
}
```
};

// Spesiell håndtering for "Stans" kommandoen
const handleCeaseFireCommand = async (duration = 2000) => {
  // "Stans" skal vare i hele perioden, ikke bare sies én gang
  const ceaseText = commands.cease_fire;
  
  // Alternativ 1: Lang versjon av "Stans"
  const extendedCeaseText = `${ceaseText}... ${ceaseText}... ${ceaseText}`;
  
  // Alternativ 2: Kontinuerlig repetisjon
  const startTime = Date.now();
  while (Date.now() - startTime < duration) {
    await AudioManager.speakCommand(ceaseText, settings.language, {
      rate: 0.8, // Litt langsommere for klarhet
      volume: settings.audioVolume / 100
    });
    await new Promise(resolve => setTimeout(resolve, 300)); // Kort pause
  }
};
```

## Performance Considerations

### Timer Accuracy
- Bruk `setInterval` med 100ms intervaller for smooth display
- Kompenser for JavaScript timer drift
- Test på eldre Android-enheter for performance

### Memory Management
- Cleanup timers ved unmount
- Unngå memory leaks i timer callbacks
- Optimaliser re-renders med React.memo

### Battery Optimization  
- Keep screen awake kun under aktiv bruk
- Reduser bakgrunnsaktivitet
- Efficient state updates

## Error Handling

### Critical Errors
- Timer stopper uventet
- App crashes under bruk
- Timing-unøyaktighet

### Fallback Strategies
- Manual override knapper
- Backup timer display
- Error logging og recovery

## Testing Strategy

### Unit Tests
- Timer logic og state transitions
- Configuration management
- Error scenarios

### Integration Tests  
- Full timer sekvenser
- Settings persistence
- Performance på target devices

### User Acceptance Tests
- Test med faktiske skyttere
- Timing validation med stopwatch
- Usability testing

## Development Roadmap

### Week 1: Core Timer + i18n Foundation
- [ ] Expo prosjekt setup
- [ ] Basic timer implementation
- [ ] State machine for phases
- [ ] Simple UI layout
- [ ] i18n setup med expo-localization
- [ ] Norsk språkpakke (base)

### Week 2: Enhanced UI + Multilingual
- [ ] Color coding system
- [ ] Typography og styling
- [ ] Command display med oversettelser
- [ ] Settings screen med språkvalg
- [ ] Engelsk, svensk, dansk oversettelser
- [ ] Språkdeteksjon og fallback

### Week 3: Polish & Test
- [ ] Vibration integration
- [ ] Performance optimization
- [ ] Multilingual user testing
- [ ] Cultural command validation
- [ ] Bug fixes

### Week 4: Preparation for Release
- [ ] Icon og splash screen
- [ ] Store listing materials (alle språk)
- [ ] Final testing på alle språk
- [ ] Documentation (engelsk + norsk)

## Technical Debt Considerations

### Future Refactoring
- Extract timer logic til custom hook
- Implement proper TypeScript typing
- Add comprehensive error boundaries
- Optimize bundle size

### Scalability 
- Plugin architecture for new profiles
- Cloud sync for settings (future)
- Multi-language support framework
- Analytics integration planning
- Additional languages: 🇫🇮 Finnish, 🇩🇪 German, 🇫🇷 French

## i18n Implementation Details

### Dependencies
```json
{
  "expo-localization": "~14.7.0",
  "i18next": "^23.7.6", 
  "react-i18next": "^13.5.0"
}
```

### Language Detection Flow
```javascript
// Auto-detect flow
const getDeviceLanguage = () => {
  const locale = Localization.locale; // e.g., "nb-NO"
  const language = locale.split('-')[0]; // "nb" -> "no"
  
  // Map variants to supported languages
  const languageMap = {
    'nb': 'no', 'nn': 'no', // Norwegian variants
    'sv': 'sv',              // Swedish
    'da': 'da',              // Danish
    'en': 'en'               // English
  };
  
  return languageMap[language] || 'en'; // Fallback to English
};
```

### Command Translation Hook
```javascript
// Custom hook for translated commands
const useCommands = () => {
  const { t } = useTranslation();
  
  return {
    readyCheck: t('commands.ready_check'),
    prepare: t('commands.prepare'),
    fire: t('commands.fire'),
    ceaseFire: t('commands.cease_fire')
  };
};
```

### Cultural Considerations

- **Timing Standards:** Some countries may prefer different warning times
- **Command Pronunciation:** Audio commands must be culturally appropriate  
- **Regional Variations:** Commands may vary between shooting federations
- **Accessibility:** Consider dyslexia-friendly fonts and high contrast modes

## Brukergrensesnitt Design

### Home Screen (Hovedmeny)
```typescript
interface HomeScreenProps {
  navigation: NavigationProp<any>;
  availablePrograms: ProgramInfo[];
}

interface ProgramCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'field' | 'duel' | 'silhouette' | 'training';
  difficulty: 'beginner' | 'intermediate' | 'expert';
}
```

### Navigation Structure
```
HomeScreen (/)
├── FieldShootingScreen (/field)
│   ├── StandardFieldTimer
│   └── CustomFieldTimer
├── DuelShootingScreen (/duel)
│   ├── StandardDuelSimulator
│   └── CustomDuelSimulator
├── SilhouetteScreen (/silhouette)
│   ├── SilhouetteTraining
│   └── RhythmTraining
└── SettingsScreen (/settings)
    ├── Language Settings
    ├── Audio Settings
    └── Timer Preferences
```

### Main Menu Layout (Mobile-First)
```jsx
// HomeScreen.tsx
const HomeScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Header title="SkyteKlokke" subtitle="Precision Timer for Shooters" />
      
      <ScrollView style={styles.menuContainer}>
        <ProgramCard
          icon="🏹"
          title="Feltskyting"
          description="Standard konkurranse med 10s skyting"
          onPress={() => navigate('FieldShooting')}
          category="field"
        />
        
        <ProgramCard
          icon="⚔️"
          title="Duellskyting"
          description="Tørrtrening med lyssekvenser"
          onPress={() => navigate('DuelShooting')}
          category="duel"
        />
        
        <ProgramCard
          icon="🎯"
          title="Silhuettskyting"
          description="Rytmetrening med audio-assistanse"
          onPress={() => navigate('Silhouette')}
          category="silhouette"
        />
        
        <SettingsCard
          icon="⚙️"
          title="Innstillinger"
          description="Språk, lyd og preferanser"
          onPress={() => navigate('Settings')}
        />
      </ScrollView>
    </SafeAreaView>
  );
};
```

### Design System
```typescript
// Theme.ts
export const theme = {
  colors: {
    primary: '#2C3E50',      // Mørk blå (profesjonell)
    secondary: '#E74C3C',    // Rød (stopp/varsel)
    success: '#27AE60',      // Grønn (start/ok)
    warning: '#F39C12',      // Orange (vent)
    background: '#FFFFFF',   // Hvit bakgrunn
    surface: '#F8F9FA',      // Lys grå kort
    text: '#2C3E50',         // Mørk tekst
    textSecondary: '#7F8C8D' // Grå beskrivelse
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32
  },
  typography: {
    h1: { fontSize: 28, fontWeight: '700' },
    h2: { fontSize: 24, fontWeight: '600' },
    h3: { fontSize: 20, fontWeight: '600' },
    body: { fontSize: 16, fontWeight: '400' },
    caption: { fontSize: 14, fontWeight: '400' }
  }
};
```

## Implementeringsstrategi

### Fase 1: Core Foundation & Navigation
1. **Expo Setup**: Initialisere React Native prosjekt med Expo SDK 54
2. **Navigation**: React Navigation 6 med stack navigator
3. **HomeScreen**: Hovedmeny med program-kort design
4. **BaseProgram**: Implementere abstract class og plugin arkitektur
5. **Timer Engine**: Bygge grunnleggende timer system
6. **Program Manager**: Registrering og håndtering av skyteprogrammer

### Fase 2: Basic Programs
1. **StandardFieldProgram**: Implementere standard feltskyting
2. **StandardDuelProgram**: Implementere duellskyting
3. **SilhouetteProgram**: Implementere silhuettskyting med audio-assistanse
4. **Basic UI**: Grunnleggende timer interface med fullskjerm lys-modus
5. **Audio System**: TTS integration med expo-speech og rytmisk pip-lyder

### Fase 3: Advanced Features
1. **I18n Implementation**: Flerspråklig støtte med automatisk deteksjon
2. **Training Programs**: Intervalltrening og andre treningsprogrammer  
3. **Audio Rhythm Engine**: Presise rytmiske signaler for skuddrytme
4. **Settings System**: Brukerinnstillinger og program-konfigurering
5. **Competition Mode**: Avanserte konkurranse-funksjoner

### Fase 4: Polish & Expansion
1. **UI/UX Refinement**: Polert brukergrensesnitt
2. **Additional Programs**: Flere skytedisipliner
3. **Performance Optimization**: Optimalisering av audio timing
4. **Testing & Distribution**: App store forberedelser

---

**Teknisk Lead:** GitHub Copilot  
**Opprettet:** ${new Date().toLocaleDateString('no-NO')}  
**Versjon:** 1.1