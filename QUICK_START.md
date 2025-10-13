# Quick Start Guide for GitHub Copilot Coding Agent

## 🚀 How to Use This Repository

### Step 1: Prepare the Agent
Open GitHub Copilot Chat and paste this prompt:

```
I need you to implement the complete MVP of SkyteKlokke shooting timer app.

FIRST: Read these files to understand the complete context:
- AGENT_BRIEF.md (your main implementation guide)
- PROSJEKTPLAN.md (project requirements)
- TEKNISK_DESIGN.md (technical architecture)
- UI_COMPONENTS.md (design system)
- I18N_PLAN.md (multi-language support)

THEN: Build a React Native + Expo app with:
1. Navigation system with HomeScreen
2. BaseProgram abstract class architecture
3. StandardFieldProgram (field shooting timer)
4. StandardDuelProgram (duel shooting simulator)
5. i18n system (Norwegian/English/Swedish/Danish)
6. Design system implementation
7. Audio service with expo-speech

Follow the implementation order in AGENT_BRIEF.md.
Work autonomously and create all necessary files.
Ensure audio timing precision for competitive shooting.
Use TypeScript with strict typing.

Start by reading AGENT_BRIEF.md, then implement the complete MVP.
```

### Step 2: Let the Agent Work
The agent will:
1. Read all documentation files
2. Set up Expo project with TypeScript
3. Create complete folder structure
4. Implement all components and services
5. Add i18n support
6. Test the implementation

### Step 3: Review and Test
After implementation:
```bash
# Install dependencies
npm install

# Start Expo
npx expo start

# Test on device
# Scan QR code with Expo Go app
```

## 📋 What the Agent Should Deliver

### Files Created (~30-40 files):
```
✅ App.tsx
✅ app.json (updated)
✅ tsconfig.json
✅ src/screens/* (3 files)
✅ src/programs/* (3 files)
✅ src/services/* (3 files)
✅ src/components/* (3+ files)
✅ src/i18n/* (5+ files)
✅ src/theme/* (3 files)
✅ src/types/* (1 file)
```

### Features Working:
- ✅ App launches successfully
- ✅ HomeScreen with 2 program cards
- ✅ Field shooting timer with audio
- ✅ Duel shooting light simulator
- ✅ Language auto-detection
- ✅ Professional design system
- ✅ Pause/reset functionality

## 🎯 Success Checklist

After agent completes, verify:
- [ ] `npx expo start` runs without errors
- [ ] App opens in Expo Go
- [ ] HomeScreen shows "Feltskyting" and "Duellskyting" cards
- [ ] Tapping Feltskyting starts timer
- [ ] Audio plays Norwegian commands ("Er skytterne klare", "Last", "Ild", "Stans")
- [ ] Duellskyting shows 60s countdown
- [ ] Red/green lights alternate correctly (5 cycles)
- [ ] Can pause and reset timers
- [ ] Back button returns to home

## 🔧 If Agent Needs Guidance

### Common Questions to Answer:
**Q: Which Expo SDK version?**
A: Use latest stable (~51.0.0), adjust in AGENT_BRIEF.md if needed

**Q: Audio not working?**
A: Check expo-speech permissions, ensure TTS is installed on device

**Q: Navigation errors?**
A: Ensure react-native-screens and safe-area-context are installed

**Q: TypeScript errors?**
A: Refer to types defined in TEKNISK_DESIGN.md

**Q: i18n not loading?**
A: Check locales are in src/i18n/locales/ and properly imported

## 📞 Fallback: Step-by-Step Mode

If agent needs more guidance, use this prompt:

```
Let's build SkyteKlokke in steps:

STEP 1: Read AGENT_BRIEF.md and confirm understanding
STEP 2: Initialize Expo project with TypeScript
STEP 3: Setup folder structure from AGENT_BRIEF.md
STEP 4: Implement theme system (colors, typography)
STEP 5: Setup i18n with 4 languages
STEP 6: Implement BaseProgram abstract class
STEP 7: Create Navigation and HomeScreen
STEP 8: Implement StandardFieldProgram
STEP 9: Implement StandardDuelProgram
STEP 10: Test and fix any issues

Start with Step 1. Wait for my confirmation before proceeding to next step.
```

## 💡 Pro Tips

1. **Let agent read docs first** - Don't skip the documentation reading phase
2. **Be patient** - Initial setup takes time but saves debugging later
3. **Trust the architecture** - BaseProgram pattern enables future expansion
4. **Audio is critical** - Verify TTS works on real device, not just simulator
5. **i18n from start** - Easier than retrofitting translation support

## 🎯 Expected Timeline

- **Agent reading docs**: 2-3 minutes
- **Project setup**: 5-10 minutes
- **Core implementation**: 20-30 minutes
- **Testing & fixes**: 10-15 minutes
- **Total**: 35-60 minutes

---

**Good luck! 🎯 The agent has everything it needs in the documentation files.**