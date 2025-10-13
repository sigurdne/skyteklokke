# SkyteKlokke - Architecture Documentation

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    SkyteKlokke App                      │
│                   (React Native + Expo)                 │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
   ┌────────┐         ┌─────────┐        ┌──────────┐
   │  i18n  │         │  Theme  │        │Navigation│
   │ System │         │ System  │        │  Stack   │
   └────────┘         └─────────┘        └──────────┘
```

## Component Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      App.tsx                             │
│  ┌────────────────────────────────────────────────────┐ │
│  │       NavigationContainer (React Navigation)       │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │         Stack Navigator                      │ │ │
│  │  │                                              │ │ │
│  │  │  ┌────────────┐  ┌────────────┐  ┌───────┐ │ │ │
│  │  │  │ HomeScreen │  │TimerScreen │  │Settings│ │ │ │
│  │  │  └────────────┘  └────────────┘  └───────┘ │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

## Screen Hierarchy

```
HomeScreen
├── Header
│   ├── Title: "SkyteKlokke"
│   └── Subtitle: "Presis timer for skyttere"
├── ScrollView
│   ├── ProgramCard (Field Shooting)
│   │   ├── Icon: 🏹
│   │   ├── Title: "Feltskyting"
│   │   ├── Description: "Standard konkurranse..."
│   │   └── Category Indicator: Green
│   └── ProgramCard (Duel Shooting)
│       ├── Icon: ⚔️
│       ├── Title: "Duellskyting"
│       ├── Description: "Tørrtrening simulator..."
│       └── Category Indicator: Orange

TimerScreen
├── Header
│   ├── Back Button: ←
│   └── Program Name
├── TimerDisplay (or LightDisplay)
│   ├── Timer: "12.34"
│   ├── Command: "Ild"
│   ├── State Indicator: ●
│   └── State Text: "Aktiv skyting"
└── Controls
    ├── Start Button
    ├── Pause/Resume Button
    └── Reset Button
```

## Service Layer Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Services Layer                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────┐    ┌──────────────────┐         │
│  │ ProgramManager   │    │   TimerEngine    │         │
│  │   (Singleton)    │    │   (Instance)     │         │
│  ├──────────────────┤    ├──────────────────┤         │
│  │ - programs: Map  │    │ - sequence       │         │
│  │ - activeProgram  │    │ - currentStep    │         │
│  ├──────────────────┤    │ - listeners[]    │         │
│  │ + registerProgram│    ├──────────────────┤         │
│  │ + getProgram     │    │ + start()        │         │
│  │ + setActive      │    │ + pause()        │         │
│  └──────────────────┘    │ + resume()       │         │
│                          │ + reset()        │         │
│                          └──────────────────┘         │
│                                                         │
│  ┌──────────────────┐                                  │
│  │  AudioService    │                                  │
│  │   (Singleton)    │                                  │
│  ├──────────────────┤                                  │
│  │ - language       │                                  │
│  │ - isEnabled      │                                  │
│  │ - volume         │                                  │
│  ├──────────────────┤                                  │
│  │ + speak()        │                                  │
│  │ + stop()         │                                  │
│  │ + setLanguage()  │                                  │
│  └──────────────────┘                                  │
└─────────────────────────────────────────────────────────┘
```

## Program Class Hierarchy

```
┌────────────────────────────────────────┐
│         BaseProgram                    │
│         (Abstract)                     │
├────────────────────────────────────────┤
│ # config: ProgramConfig                │
│ # settings: ProgramSettings            │
├────────────────────────────────────────┤
│ + getStates(): States (abstract)       │
│ + getCommands(): string[] (abstract)   │
│ + getTimingSequence() (abstract)       │
│ + validateSettings() (abstract)        │
│ + getUIConfig(): UIConfig              │
│ + getAudioConfig(): AudioConfig        │
└────────────────────────────────────────┘
                  △
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
┌──────────────────┐  ┌──────────────────┐
│StandardField     │  │StandardDuel      │
│Program           │  │Program           │
├──────────────────┤  ├──────────────────┤
│States:           │  │States:           │
│- IDLE            │  │- IDLE            │
│- READY_CHECK     │  │- COUNTDOWN       │
│- PREPARE         │  │- RED_LIGHT       │
│- FIRE            │  │- GREEN_LIGHT     │
│- CEASE_FIRE      │  │- FINISHED        │
│- FINISHED        │  │                  │
├──────────────────┤  ├──────────────────┤
│Commands:         │  │Commands:         │
│- ready_check     │  │- start           │
│- prepare         │  │                  │
│- fire            │  │                  │
│- cease_fire      │  │                  │
└──────────────────┘  └──────────────────┘
```

## Data Flow: Starting a Field Shooting Program

```
User Action: Tap Field Shooting Card
        │
        ▼
HomeScreen.handleProgramSelect('standard-field')
        │
        ▼
navigation.navigate('Timer', { programId: 'standard-field' })
        │
        ▼
TimerScreen.useEffect()
        │
        ├─► ProgramManager.getProgram('standard-field')
        │   └─► Returns StandardFieldProgram instance
        │
        ├─► ProgramManager.setActiveProgram('standard-field')
        │   └─► Activates program
        │
        ├─► program.getTimingSequence()
        │   └─► Returns array of TimingSteps
        │
        └─► new TimerEngine(sequence)
            └─► Creates timer with sequence

User Action: Tap Start Button
        │
        ▼
handleStart()
        │
        ▼
timerEngine.start()
        │
        ├─► executeStep(0)
        │   ├─► emit('state_change', { state: 'ready_check' })
        │   │   └─► setCurrentState('ready_check')
        │   │
        │   ├─► emit('command', { command: 'ready_check' })
        │   │   ├─► setCurrentCommand('Er skytterne klare')
        │   │   └─► AudioService.speak('Er skytterne klare')
        │   │
        │   └─► setTimeout(() => executeStep(1), 10000)
        │
        ├─► After 10s: executeStep(1)
        │   └─► State: PREPARE, Command: "Last"
        │
        ├─► After 5s: executeStep(2)
        │   └─► State: FIRE, Command: "Ild"
        │
        ├─► After 8s: executeStep(3)
        │   └─► State: CEASE_FIRE, Command: "Stans"
        │
        └─► After 2s: executeStep(4)
            └─► State: FINISHED, emit('complete')
```

## Timer Engine Event Flow

```
┌──────────────┐
│ TimerEngine  │
│   Events     │
└──────────────┘
      │
      ├─► 'state_change'
      │   ├─► Updates UI state
      │   └─► Changes colors
      │
      ├─► 'command'
      │   ├─► Updates command text
      │   └─► Triggers TTS audio
      │
      ├─► 'complete'
      │   ├─► Stops timer
      │   └─► Shows reset button
      │
      ├─► 'pause'
      │   └─► Shows resume button
      │
      ├─► 'resume'
      │   └─► Shows pause button
      │
      └─► 'reset'
          ├─► Clears state
          └─► Shows start button
```

## Internationalization (i18n) Flow

```
App Launch
    │
    ▼
expo-localization.getLocales()
    │
    ├─► Device locale: "nb-NO"
    │   └─► Extract: "nb" → Map to "no"
    │
    ├─► Device locale: "en-US"
    │   └─► Extract: "en" → Use "en"
    │
    └─► Device locale: "zh-CN"
        └─► Extract: "zh" → Fallback to "no"
        
i18next.init({ lng: detectedLanguage })
    │
    ├─► Load resources from locales/
    │   ├─► no.json
    │   ├─► en.json
    │   ├─► sv.json
    │   └─► da.json
    │
    └─► Ready for translation

Component: t('commands.fire')
    │
    ├─► Language: "no" → "Ild"
    ├─► Language: "en" → "Fire"
    ├─► Language: "sv" → "Eld"
    └─► Language: "da" → "Ild"
```

## State Management Pattern

```
┌─────────────────────────────────────────────┐
│              TimerScreen                    │
├─────────────────────────────────────────────┤
│ State (React Hooks):                        │
│  ├─► currentState: string                   │
│  ├─► currentCommand: string                 │
│  ├─► elapsedTime: number                    │
│  ├─► isRunning: boolean                     │
│  └─► isPaused: boolean                      │
│                                             │
│ Refs (No re-render):                        │
│  ├─► timerEngineRef: TimerEngine           │
│  └─► intervalRef: NodeJS.Timeout           │
│                                             │
│ Effects:                                    │
│  ├─► Initialize program on mount           │
│  ├─► Setup timer engine events             │
│  ├─► Update elapsed time (50ms interval)   │
│  └─► Cleanup on unmount                    │
└─────────────────────────────────────────────┘
```

## Theme System Structure

```
theme/
├── colors.ts
│   ├── primary: '#2C3E50'
│   ├── success: '#27AE60'
│   ├── warning: '#F39C12'
│   ├── danger: '#E74C3C'
│   └── ... (15 colors total)
│
├── typography.ts
│   ├── h1: { fontSize: 32, fontWeight: '700' }
│   ├── h2: { fontSize: 24, fontWeight: '600' }
│   ├── timer: { fontSize: 72, fontFamily: 'monospace' }
│   └── ... (8 variants)
│
├── spacing.ts
│   ├── xs: 4
│   ├── sm: 8
│   ├── md: 16
│   ├── lg: 24
│   └── xl: 32
│
└── index.ts (exports all)
```

## Dependency Graph

```
App.tsx
 ├── @react-navigation/native
 ├── @react-navigation/native-stack
 ├── i18next
 └── src/
     ├── screens/
     │   ├── HomeScreen
     │   │   ├── Header
     │   │   ├── ProgramCard
     │   │   └── ProgramManager
     │   ├── TimerScreen
     │   │   ├── Header
     │   │   ├── TimerDisplay
     │   │   ├── ProgramManager
     │   │   ├── TimerEngine
     │   │   └── AudioService
     │   └── SettingsScreen
     │       └── Header
     ├── programs/
     │   ├── BaseProgram
     │   ├── StandardFieldProgram → BaseProgram
     │   └── StandardDuelProgram → BaseProgram
     ├── services/
     │   ├── ProgramManager → BaseProgram
     │   ├── TimerEngine → types
     │   └── AudioService → expo-speech
     ├── components/
     │   ├── Header → theme
     │   ├── ProgramCard → theme, i18n
     │   └── TimerDisplay → theme
     ├── i18n/
     │   ├── index.ts → expo-localization, i18next
     │   └── locales/*.json
     ├── theme/
     │   ├── colors
     │   ├── typography
     │   └── spacing
     └── types/
         └── index.ts (shared interfaces)
```

## Performance Optimization Strategy

1. **Timer Updates**: 50ms interval (20fps) for smooth display
2. **State Management**: Minimal state in components, refs for non-visual data
3. **Event System**: Decoupled timer logic from UI updates
4. **Memoization**: Not needed yet (simple component tree)
5. **Audio**: Single AudioService instance, stop before new speech

## Testing Strategy

```
Testing Pyramid:

            ┌─────────────┐
            │  Manual E2E │  ← Expo Go testing
            │   Testing   │     on real devices
            └─────────────┘
                  │
        ┌─────────────────┐
        │  Integration    │   ← Future: React Native
        │    Testing      │     Testing Library
        └─────────────────┘
                │
      ┌───────────────────┐
      │   Unit Testing    │    ← Future: Jest tests
      │  (Type Checking)  │      for services/utils
      └───────────────────┘      TypeScript now!
```

Current: TypeScript type checking + Manual testing
Future: Jest unit tests + React Native Testing Library

## Deployment Architecture

```
Development:
  Local Machine → npm start → Metro Bundler → Expo Go App

Production (Future):
  Source Code
      │
      ├─► iOS Build
      │   └─► Expo EAS Build → TestFlight → App Store
      │
      └─► Android Build
          └─► Expo EAS Build → Google Play (Internal Testing) → Production
```

## Extension Points for Phase 2

```
Future Programs:
  BaseProgram
      │
      ├─► StandardFieldProgram ✅
      ├─► StandardDuelProgram ✅
      ├─► SilhouetteProgram (Phase 2)
      ├─► CustomProgram (Phase 3)
      └─► ... (easily extensible)

Future Services:
  ├─► RhythmEngine (Phase 3) - Audio rhythm patterns
  ├─► StatisticsService (Phase 4) - Track usage
  └─► SettingsService (Phase 2) - Persistent settings

Future Screens:
  ├─► SettingsScreen (Phase 2) - Full implementation
  ├─► StatisticsScreen (Phase 4)
  └─► CustomProgramScreen (Phase 3)
```

## Technology Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React Native | 0.76.5 |
| Platform | Expo | 52.0 |
| Language | TypeScript | 5.3 |
| Navigation | React Navigation | 7.0 |
| i18n | i18next + react-i18next | 23.7 / 13.5 |
| Audio | expo-speech | 12.0 |
| Localization | expo-localization | 16.0 |
| State | React Hooks | Built-in |
| Styling | StyleSheet | Built-in |

## Security & Privacy

- ✅ No external API calls
- ✅ No data collection
- ✅ No user tracking
- ✅ All processing local
- ✅ No network permissions needed
- ✅ Minimal device permissions (audio only)

## Accessibility Features

- ✅ Large touch targets (44x44pt minimum)
- ✅ High contrast colors
- ✅ Text-to-speech audio feedback
- ✅ Clear visual hierarchy
- ✅ SafeAreaView for iOS notch
- 🔄 Screen reader support (future)
- 🔄 Dynamic text sizing (future)

---

**Architecture Status**: ✅ MVP Complete - Stable and Extensible
