# SkyteKlokke 🎯

A precision timer app for competitive shooters and range officers.

## About

SkyteKlokke is designed to support range officers with accurate timing commands during field shooting and other shooting disciplines. The app also offers a duel shooting simulator for dry training.

## Features

- ⏱️ Precise timer with command sequence for field shooting
- 🚦 Duel shooting simulator with light sequences (dry training) 
- 🎯 Silhouette shooting simulator with dry training and shot rhythm
- 🔊 Audio commands with TTS for training mode
- 🎨 Color-coded phases for easy identification
- ⚙️ Configurable shooting period and audio settings
- 📱 Optimized for mobile devices
- 🔄 Pause and reset functionality
- 🌍 Multi-language support (Norwegian, English, Swedish, Danish)
- 🔧 Automatic language detection

## Technology Stack

- **React Native** - Cross-platform mobile development
- **Expo SDK 54** - Development tools and deployment
- **JavaScript/TypeScript** - Programming language
- **expo-speech** - Text-to-speech functionality
- **i18next** - Internationalization

## Project Status

🚧 **In Planning Phase** - Comprehensive documentation complete, ready for development

### Completed
- [x] Project planning and architecture design
- [x] Multi-language command specifications
- [x] Technical design with modular program system
- [x] Internationalization strategy

### Next Steps
- [ ] Expo project setup
- [ ] Core timer implementation
- [ ] BaseProgram architecture implementation
- [ ] Field shooting program
- [ ] Duel shooting simulator

## Documentation

- [📋 Project Plan](./PROSJEKTPLAN.md) - Detailed project planning (Norwegian)
- [⚡ Technical Design](./TEKNISK_DESIGN.md) - Architecture and implementation details (Norwegian)
- [🌍 I18n Plan](./I18N_PLAN.md) - Internationalization strategy (Norwegian)

## Getting Started

```bash
# Clone and install
git clone https://github.com/sigurdne/skyteklokke.git
cd skyteklokke
npm install

# Start development server
npx expo start

# Run on Android
npx expo run:android

# Run on iOS
npx expo run:ios
```

## Contributing

We welcome contributions! Please read our contributing guidelines before submitting pull requests.

### Development Setup

1. Install Node.js (v18 or higher)
2. Install Expo CLI: `npm install -g @expo/cli`
3. Clone the repository
4. Run `npm install`
5. Start development with `npx expo start`

## Command Sequences

### Field Shooting
1. "Are the shooters ready" (10s before fire)
2. "Load" (5s before fire) 
3. "Fire" (shooting period starts)
4. "Stop" (2s warning before cease fire)

### Duel Shooting (Dry Training)
1. "Start" command
2. 60 second countdown
3. Light sequence (5 times):
   - 🔴 Red light (7 seconds)
   - 🟢 Green light (3 seconds)
4. Permanent red light (finished)

### Silhouette Shooting (Dry Training)
1. "Ready for silhouette" command
2. 60 second countdown to shooting position
3. Light sequence (per series):
   - 🔴 Red light (7 seconds) - weapon at rest
   - 🟢 Green light (8, 6 or 4 seconds) - lift and shoot 5 shots
   - 🔴 Red light (weapon down)
4. Audio assistance with optimal lift and shooting rhythm

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@skyteklokke.no or create an issue on GitHub.

---

**Developed with ❤️ for the Norwegian shooting community**