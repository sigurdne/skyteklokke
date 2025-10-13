# SkyteKlokke - Setup Guide

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Expo Go app on your iOS/Android device
- For development: React Native development environment

### Installation

1. Clone the repository:
```bash
git clone https://github.com/sigurdne/skyteklokke.git
cd skyteklokke
```

2. Install dependencies:
```bash
npm install --legacy-peer-deps
```

3. Start the Expo development server:
```bash
npm start
```

4. Open the Expo Go app on your device and scan the QR code

## Development Commands

- `npm start` - Start Expo development server
- `npm run android` - Open on Android emulator
- `npm run ios` - Open on iOS simulator
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
skyteklokke/
├── App.tsx                      # Main app entry with navigation
├── src/
│   ├── screens/                 # Screen components
│   │   ├── HomeScreen.tsx       # Main menu
│   │   ├── TimerScreen.tsx      # Timer display
│   │   └── SettingsScreen.tsx   # Settings (placeholder)
│   ├── programs/                # Shooting program implementations
│   │   ├── base/BaseProgram.ts  # Abstract base class
│   │   ├── field/               # Field shooting
│   │   └── duel/                # Duel shooting
│   ├── services/                # Core services
│   │   ├── ProgramManager.ts    # Program management
│   │   ├── TimerEngine.ts       # Timer logic
│   │   └── AudioService.ts      # Text-to-speech
│   ├── components/              # Reusable components
│   ├── i18n/                    # Internationalization
│   │   └── locales/             # Translation files (no, en, sv, da)
│   ├── theme/                   # Design system
│   └── types/                   # TypeScript interfaces
└── assets/                      # Images and icons
```

## Features Implemented (Phase 1 MVP)

✅ React Native + Expo app  
✅ Navigation system with React Navigation  
✅ Home screen with program selection  
✅ BaseProgram abstract class architecture  
✅ StandardFieldProgram - Field shooting timer  
✅ StandardDuelProgram - Duel shooting simulator  
✅ Multi-language support (Norwegian, English, Swedish, Danish)  
✅ Text-to-speech audio commands  
✅ Professional design system  
✅ Pause/resume/reset functionality  

## Usage

### Field Shooting Program
1. Select "Feltskyting" from home screen
2. Tap "Start" to begin sequence
3. Listen for audio commands:
   - "Er skytterne klare" (10s preparation)
   - "Last" (5s loading)
   - "Ild" (start shooting)
   - "Stans" (cease fire)

### Duel Shooting Program
1. Select "Duellskyting" from home screen
2. Tap "Start" to begin sequence
3. Watch for:
   - 60s countdown preparation
   - 5 cycles of red light (7s) and green light (3s)
   - Fullscreen color display for clear visibility

## Troubleshooting

### Dependencies Installation Issues
If you encounter peer dependency issues, use:
```bash
npm install --legacy-peer-deps
```

### Audio Not Working
- Ensure device volume is not muted
- Check that Expo Go has microphone permissions
- Try restarting the app

## Next Steps (Future Phases)

- Phase 2: Silhouette shooting program
- Phase 3: Advanced audio rhythm engine
- Phase 4: Settings and customization
- Phase 5: Competition mode features

## License

MIT - See LICENSE file for details
