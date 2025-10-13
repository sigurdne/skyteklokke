# Prompt for GitHub Copilot Coding Agent

## Copy-Paste This Entire Prompt:

---

I need you to implement the complete MVP (Phase 1) of **SkyteKlokke** - a precision timer app for competitive shooting sports in Norway.

### 📋 **CRITICAL: Read These Files First**
Before writing any code, thoroughly read these documentation files in this exact order:
1. **AGENT_BRIEF.md** - Your complete implementation guide
2. **PROSJEKTPLAN.md** - Project requirements and phases
3. **TEKNISK_DESIGN.md** - Technical architecture with BaseProgram pattern
4. **UI_COMPONENTS.md** - Component library and design system
5. **I18N_PLAN.md** - Multi-language support specifications
6. **DOCS.md** - Quick reference summary

### 🎯 **What to Build**
Create a working React Native + Expo app with:

1. **Expo Project Setup** (TypeScript + Expo SDK ~51.0)
2. **Navigation System** (React Navigation 6 - Stack Navigator)
3. **HomeScreen** with ProgramCard components for program selection
4. **BaseProgram Abstract Class** (modular architecture for shooting programs)
5. **StandardFieldProgram** - Field shooting timer with precise TTS commands
6. **StandardDuelProgram** - Duel shooting simulator with light sequences
7. **i18n System** (Norwegian, English, Swedish, Danish with auto-detection)
8. **Design System** (colors, typography, spacing from UI_COMPONENTS.md)
9. **Audio Service** (expo-speech for TTS commands)

### 🏗️ **Project Structure** (See AGENT_BRIEF.md for complete structure)
```
src/
├── screens/         # HomeScreen, TimerScreen
├── programs/        # base/, field/, duel/
├── services/        # ProgramManager, TimerEngine, AudioService
├── components/      # ProgramCard, Header, TimerDisplay
├── i18n/           # index.ts, locales/
├── theme/          # colors, typography, spacing
└── types/          # TypeScript interfaces
```

### ⚡ **Critical Requirements**
- **Audio Precision**: TTS timing must be exact for competitive shooting
- **Modular Architecture**: ALL programs extend BaseProgram abstract class
- **i18n First**: All user-facing text must use translation keys
- **TypeScript**: Strict typing throughout
- **Design System**: Use colors/typography from UI_COMPONENTS.md
- **Mobile First**: Responsive design for all screen sizes

### 🚀 **Implementation Order** (from AGENT_BRIEF.md)
1. Project foundation & dependencies
2. Theme & i18n setup
3. BaseProgram architecture
4. Navigation & HomeScreen
5. Field shooting program
6. Duel shooting program
7. Polish & testing

### ✅ **Success Criteria**
The app is complete when:
- ✅ Launches on iOS/Android via Expo Go
- ✅ HomeScreen shows 2 program cards (Field, Duel)
- ✅ Field timer runs complete sequence with Norwegian audio commands
- ✅ Duel simulator runs 60s countdown + 5x light cycles
- ✅ Language auto-detects (Norwegian default)
- ✅ All UI follows design system
- ✅ Pause/reset functionality works
- ✅ Back navigation works

### 🚫 **DO NOT Build** (Future Phases)
- ❌ Silhouette shooting program (Phase 2)
- ❌ Advanced settings screen (minimal placeholder OK)
- ❌ Test suites (focus on working code first)
- ❌ Audio rhythm engine (Phase 3)

### 📦 **Key Dependencies to Install**
```
expo, react, react-native
@react-navigation/native, @react-navigation/stack
expo-speech, expo-localization
i18next, react-i18next
TypeScript and type definitions
```

### 🎨 **Design Implementation**
- Use BaseProgram abstract class pattern from TEKNISK_DESIGN.md
- StandardFieldProgram: States (IDLE→READY_CHECK→PREPARE→FIRE→CEASE_FIRE→FINISHED)
- StandardDuelProgram: 60s countdown → 5x (7s red light, 3s green light)
- Colors: Professional dark blue (#2C3E50), green (#27AE60), red (#E74C3C)
- Typography: See UI_COMPONENTS.md for complete scale

### 🌍 **i18n Commands** (Norwegian)
```
"Er skytterne klare" (10s before fire)
"Last" (5s before fire)
"Ild" (start shooting)
"Stans" (cease fire - 2 seconds)
"Start" (duel countdown)
```

### 📝 **Important Notes**
- This is for serious competitive shooters - precision is critical
- Audio timing must be exact (use expo-speech with high priority)
- Follow modular BaseProgram architecture for future expansion
- All text must be translatable via i18n
- Professional appearance is essential

### 🎯 **Your Task**
Implement the complete MVP as specified in AGENT_BRIEF.md. Create all necessary files, implement all components, and ensure the app runs successfully. Follow the technical architecture exactly as documented. Work autonomously and create a production-ready MVP.

**Start by reading AGENT_BRIEF.md thoroughly, then proceed with implementation.**

---

## Alternative Shorter Version (if token limit is an issue):

---

Implement complete MVP of SkyteKlokke shooting timer app for Norway.

**Read these files first**: AGENT_BRIEF.md (main guide), PROSJEKTPLAN.md, TEKNISK_DESIGN.md, UI_COMPONENTS.md, I18N_PLAN.md

**Build**: React Native + Expo app with:
- Navigation (HomeScreen → Field/Duel programs)
- BaseProgram abstract class architecture
- StandardFieldProgram (timer with TTS commands)
- StandardDuelProgram (light simulator)
- i18n (NO/EN/SV/DA auto-detect)
- Design system from UI_COMPONENTS.md

**Critical**: Audio precision for competitive shooting. Modular architecture. All text i18n. TypeScript strict.

**Success**: App launches, 2 programs work, audio commands play, language auto-detects, design system followed.

**Don't build**: Silhouette program, advanced settings, tests (Phase 2+).

Follow AGENT_BRIEF.md implementation order. Work autonomously. Create production-ready MVP.

---