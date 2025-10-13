# SkyteKlokke - Documentation Index

## 📋 Core Planning Documents (ALWAYS READ FIRST!)

### 1. [PROSJEKTPLAN.md](./PROSJEKTPLAN.md)
**Purpose**: Complete project requirements, phases, and feature specifications
**Key Sections**:
- Development phases (MVP → Advanced features)
- Timer states and command sequences
- Technology stack (React Native + Expo)
- Modular program architecture requirements

### 2. [TEKNISK_DESIGN.md](./TEKNISK_DESIGN.md) 
**Purpose**: Technical architecture and implementation details
**Key Sections**:
- BaseProgram abstract class definition
- Program Manager and plugin system
- Audio timing implementation with expo-speech
- Concrete examples: StandardFieldProgram, SilhouetteProgram
- Implementation strategy (4 phases)

### 3. [I18N_PLAN.md](./I18N_PLAN.md)
**Purpose**: Multi-language support strategy
**Key Sections**:
- Command translations (Norwegian, English, Swedish, Danish)
- Automatic language detection with expo-localization
- Cultural considerations for shooting terminology
- Audio pronunciation guidelines

## 🎯 Quick Context for AI Agents

### What is SkyteKlokke?
A mobile timer app for Norwegian competitive shooting sports with:
- **Field shooting timer** with precise command sequences
- **Duel shooting simulator** for dry training
- **Silhouette shooting** with rhythm assistance
- **Multi-language support** for Nordic countries
- **Audio training mode** with TTS commands

### Core Architecture (from TEKNISK_DESIGN.md):
```typescript
// All shooting programs extend this base class
abstract class BaseProgram {
  abstract getStates(): object;
  abstract getCommands(): string[];
  abstract getTimingSequence(): TimingStep[];
  abstract validateSettings(settings: object): boolean;
}

// Examples: StandardFieldProgram, DuelProgram, SilhouetteProgram
```

### Development Priority (from PROSJEKTPLAN.md):
1. **Phase 1**: Core timer + BaseProgram architecture
2. **Phase 2**: Field & duel shooting programs
3. **Phase 3**: Silhouette + i18n implementation  
4. **Phase 4**: Polish + additional programs

### Tech Stack:
- React Native 0.76+ with Expo SDK 54
- TypeScript for type safety
- expo-speech for TTS commands
- i18next for internationalization
- Modular plugin architecture

## 🔄 Development Workflow

### Before Any Code Changes:
1. ✅ Read relevant sections of the 3 core documents
2. ✅ Ensure changes align with modular architecture
3. ✅ Add i18n support for user-facing text
4. ✅ Consider audio timing precision requirements

### File Structure (from TEKNISK_DESIGN.md):
```
src/
├── programs/
│   ├── base/         # BaseProgram abstract class
│   ├── field/        # Field shooting programs
│   ├── duel/         # Duel shooting programs
│   └── silhouette/   # Silhouette shooting programs
├── services/         # Timer, Audio, I18n services
├── components/       # Reusable UI components
└── i18n/            # Translation files
```

## 🎮 User Journey (Context for Features):
1. **Range Officer**: Uses visual timer with precise commands
2. **Competitive Shooter**: Uses audio mode for training without screen
3. **Dry Training**: Uses simulators (duel/silhouette) at home
4. **Multi-lingual**: Automatic language detection for Nordic users

---
**Remember**: This is for serious competitive shooting - precision and reliability are critical!