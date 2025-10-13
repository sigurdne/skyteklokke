# GitHub Copilot Coding Agent - Implementation Brief

## 🎯 Mission Statement
Implement a complete MVP (Phase 1) of SkyteKlokke - a precision timer app for competitive shooting sports in Norway. Build a working React Native + Expo application with modular architecture, multi-language support, and professional UI navigation.

## 📋 Required Reading (Context Files)
Before starting, review these files for complete context:
1. **PROSJEKTPLAN.md** - Project requirements and development phases
2. **TEKNISK_DESIGN.md** - Technical architecture with BaseProgram pattern
3. **I18N_PLAN.md** - Multi-language support (Norwegian, English, Swedish, Danish)
4. **UI_COMPONENTS.md** - Complete component library and design system
5. **DOCS.md** - Quick reference and architecture summary

## 🚀 Implementation Goals

### Phase 1 MVP - What to Build:
1. ✅ **Expo Project Setup** with React Native + TypeScript
2. ✅ **Navigation System** with React Navigation 6 (Stack Navigator)
3. ✅ **HomeScreen** with ProgramCard navigation to shooting programs
4. ✅ **BaseProgram Abstract Class** for modular program architecture
5. ✅ **StandardFieldProgram** - Field shooting timer implementation
6. ✅ **StandardDuelProgram** - Duel shooting simulator implementation
7. ✅ **i18n System** with expo-localization and i18next
8. ✅ **Design System** implementation (colors, typography, components)
9. ✅ **Basic Audio** with expo-speech for TTS commands

### What NOT to Build (Future Phases):
- ❌ Silhouette shooting (Phase 2)
- ❌ Advanced audio rhythm engine (Phase 3)
- ❌ Settings screen (can be minimal/placeholder)
- ❌ Test suites (focus on working code first)

## 🏗️ Technical Architecture

### Project Structure to Create:
```
skyteklokke/
├── App.tsx                      # Main app entry with navigation
├── app.json                     # Expo configuration
├── package.json                 # Dependencies (already exists)
├── tsconfig.json               # TypeScript configuration
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx      # Main menu with program cards
│   │   ├── TimerScreen.tsx     # Generic timer display
│   │   └── SettingsScreen.tsx  # Minimal placeholder
│   ├── programs/
│   │   ├── base/
│   │   │   └── BaseProgram.ts  # Abstract class
│   │   ├── field/
│   │   │   └── StandardFieldProgram.ts
│   │   └── duel/
│   │       └── StandardDuelProgram.ts
│   ├── services/
│   │   ├── ProgramManager.ts   # Program registration/management
│   │   ├── TimerEngine.ts      # Core timer logic
│   │   └── AudioService.ts     # TTS command playback
│   ├── components/
│   │   ├── ProgramCard.tsx     # Navigation card component
│   │   ├── Header.tsx          # App header
│   │   └── TimerDisplay.tsx    # Timer visualization
│   ├── i18n/
│   │   ├── index.ts            # i18n configuration
│   │   └── locales/
│   │       ├── no.json         # Norwegian translations
│   │       ├── en.json         # English translations
│   │       ├── sv.json         # Swedish translations
│   │       └── da.json         # Danish translations
│   ├── theme/
│   │   ├── colors.ts           # Color palette
│   │   ├── typography.ts       # Typography scale
│   │   └── spacing.ts          # Spacing system
│   └── types/
│       └── index.ts            # TypeScript interfaces
└── assets/                      # Icons and images
```

## 📦 Dependencies to Install

### Core Dependencies:
```json
{
  "expo": "~51.0.0",
  "react": "18.2.0",
  "react-native": "0.74.0",
  "@react-navigation/native": "^6.1.9",
  "@react-navigation/stack": "^6.3.20",
  "react-native-screens": "~3.31.0",
  "react-native-safe-area-context": "4.10.0",
  "expo-speech": "~11.7.0",
  "expo-localization": "~15.0.0",
  "i18next": "^23.7.0",
  "react-i18next": "^13.5.0"
}
```

### Dev Dependencies:
```json
{
  "@types/react": "~18.2.45",
  "@types/react-native": "~0.73.0",
  "typescript": "^5.3.0"
}
```

## 🎨 Design Implementation Guidelines

### BaseProgram Interface (CRITICAL):
```typescript
abstract class BaseProgram {
  id: string;
  name: string;
  category: 'field' | 'duel' | 'silhouette' | 'training';
  settings: object;
  
  abstract getStates(): { [key: string]: string };
  abstract getCommands(): string[];
  abstract getTimingSequence(): TimingStep[];
  abstract validateSettings(settings: object): boolean;
  
  getUIConfig(): UIConfig { /* default implementation */ }
  getAudioConfig(): AudioConfig { /* default implementation */ }
}
```

### StandardFieldProgram Requirements:
- **States**: IDLE, READY_CHECK, PREPARE, FIRE, CEASE_FIRE, FINISHED
- **Commands**: "Er skytterne klare" (10s), "Last" (5s), "Ild", "Stans" (2s)
- **Timing**: Configurable shooting duration (default 10s)
- **Audio**: TTS commands in selected language
- **Visual**: Color-coded states (see TEKNISK_DESIGN.md)

### StandardDuelProgram Requirements:
- **States**: IDLE, COUNTDOWN, RED_LIGHT, GREEN_LIGHT, FINISHED
- **Sequence**: 60s countdown → 5x (7s red, 3s green) → finish
- **Visual**: Fullscreen red/green light display
- **Audio**: "Start" command, optional beep on light change

### Color Palette (from UI_COMPONENTS.md):
```typescript
{
  primary: '#2C3E50',    // Professional dark blue
  success: '#27AE60',    // Green for start
  warning: '#F39C12',    // Orange for prepare
  danger: '#E74C3C',     // Red for stop
  background: '#FFFFFF',
  surface: '#F8F9FA',
  text: '#2C3E50'
}
```

## 🌍 i18n Implementation

### Translation Keys to Implement:
```json
{
  "navigation": {
    "home_title": "SkyteKlokke",
    "field_shooting": "Feltskyting",
    "duel_shooting": "Duellskyting"
  },
  "commands": {
    "ready_check": "Er skytterne klare",
    "prepare": "Last",
    "fire": "Ild",
    "cease_fire": "Stans",
    "start": "Start"
  }
}
```

### Language Detection:
```typescript
import * as Localization from 'expo-localization';
import i18n from 'i18next';

// Auto-detect language, fallback to Norwegian
const deviceLanguage = Localization.locale.split('-')[0];
const supportedLanguages = ['no', 'en', 'sv', 'da'];
const initialLanguage = supportedLanguages.includes(deviceLanguage) 
  ? deviceLanguage 
  : 'no';
```

## ⚡ Critical Implementation Notes

### Audio Timing Precision:
- Audio commands MUST be precise for competitive shooting
- Use `expo-speech` with maximum priority
- "Stans" command should last exactly 2 seconds
- Test audio delay on both iOS and Android

### State Management:
- Use React hooks (useState, useEffect, useContext)
- Timer state should update at 60fps for smooth display
- Audio commands should trigger on state transitions

### Navigation Flow:
```
HomeScreen → Select Program → TimerScreen
             ↓
   ProgramManager.setActiveProgram(programId)
             ↓
   TimerEngine.start(program.getTimingSequence())
             ↓
   AudioService.playCommand(command, language)
```

### Error Handling:
- Graceful fallback if TTS fails (visual-only mode)
- Validate program settings before starting
- Handle background/foreground app transitions

## ✅ Success Criteria

### MVP is Complete When:
1. ✅ App launches without errors
2. ✅ HomeScreen shows 2 program cards (Field, Duel)
3. ✅ Can navigate to Field Shooting timer
4. ✅ Field timer runs complete sequence with audio
5. ✅ Can navigate to Duel Shooting simulator
6. ✅ Duel simulator runs 60s + 5 light cycles
7. ✅ Language auto-detects (Norwegian default)
8. ✅ All UI follows design system colors/typography
9. ✅ Can pause/reset timers
10. ✅ Back navigation works correctly

### Quality Standards:
- **TypeScript**: All files must use TypeScript with proper types
- **No console.log**: Remove or replace with proper logging
- **Responsive**: Works on all mobile screen sizes
- **Performance**: Smooth 60fps animations
- **Accessibility**: Basic screen reader support

## 🚫 Common Pitfalls to Avoid

1. **Don't** implement Silhouette shooting yet (Phase 2)
2. **Don't** build complex settings (minimal placeholder is fine)
3. **Don't** over-engineer - MVP first, optimization later
4. **Don't** use external UI libraries - build custom components
5. **Don't** skip i18n - all text must be translatable
6. **Don't** hardcode colors - use theme system
7. **Don't** forget SafeAreaView for iOS notch support

## 📝 Implementation Order (Recommended)

### Step 1: Project Foundation (30 min)
- Initialize Expo project with TypeScript
- Install all dependencies
- Create folder structure
- Setup tsconfig.json

### Step 2: Theme & i18n (20 min)
- Implement color/typography theme
- Setup i18next with language files
- Create basic translation keys

### Step 3: BaseProgram Architecture (30 min)
- Implement BaseProgram abstract class
- Create ProgramManager service
- Define TypeScript interfaces

### Step 4: Navigation & HomeScreen (30 min)
- Setup React Navigation
- Implement HomeScreen with ProgramCards
- Create Header component

### Step 5: Field Shooting Program (45 min)
- Implement StandardFieldProgram
- Create TimerEngine service
- Build TimerScreen component
- Add AudioService for TTS

### Step 6: Duel Shooting Program (30 min)
- Implement StandardDuelProgram
- Add fullscreen light display
- Integrate with TimerScreen

### Step 7: Polish & Testing (30 min)
- Test all flows
- Fix any bugs
- Verify audio timing
- Test on iOS and Android

**Total Estimated Time: 3-4 hours**

## 🎯 Final Deliverables

After implementation, the app should:
- ✅ Launch on iOS and Android via Expo Go
- ✅ Show professional home screen with shooting program options
- ✅ Run complete field shooting timer with Norwegian TTS commands
- ✅ Run complete duel shooting light sequence
- ✅ Auto-detect user language (Norwegian/English/Swedish/Danish)
- ✅ Follow design system consistently
- ✅ Be ready for Phase 2 expansion (Silhouette program)

---

**Remember**: This is for serious competitive shooters in Norway. Precision, reliability, and professional appearance are critical. Audio timing must be exact. The modular BaseProgram architecture is essential for future expansion.

**Good luck! 🎯🏹⚔️**