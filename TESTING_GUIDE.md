# SkyteKlokke - Testing Guide

## Manual Testing Checklist

### Pre-Testing Setup
1. Install Expo Go app on iOS or Android device
2. Run `npm install --legacy-peer-deps` 
3. Run `npm start`
4. Scan QR code with Expo Go
5. Ensure device volume is turned on

---

## Test Scenarios

### 1. App Launch & Home Screen

#### Test 1.1: Initial Launch
- [ ] App launches without crashes
- [ ] HomeScreen displays with header "SkyteKlokke"
- [ ] Subtitle shows "Presis timer for skyttere" (or language equivalent)
- [ ] Two program cards are visible:
  - [ ] 🏹 Feltskyting (Field Shooting)
  - [ ] ⚔️ Duellskyting (Duel Shooting)

#### Test 1.2: Language Detection
- [ ] App detects device language correctly
- [ ] Norwegian users see Norwegian text
- [ ] English users see English text
- [ ] Swedish users see Swedish text
- [ ] Danish users see Danish text
- [ ] Other languages fall back to Norwegian

#### Test 1.3: UI Appearance
- [ ] Professional dark blue header (#2C3E50)
- [ ] Cards have light gray background (#F8F9FA)
- [ ] Category indicators show correct colors:
  - [ ] Green for Field (success)
  - [ ] Orange for Duel (warning)
- [ ] Text is readable and properly sized
- [ ] Touch targets are large enough (44x44pt minimum)

---

### 2. Field Shooting Program (Feltskyting)

#### Test 2.1: Navigation
- [ ] Tap on Field Shooting card
- [ ] Navigate to TimerScreen
- [ ] Header shows "Standard Feltskyting"
- [ ] Back button (←) is visible
- [ ] Start button is visible at bottom

#### Test 2.2: Timer Sequence (Norwegian)
Expected sequence with default settings (10s shooting):

**Phase 1: Ready Check (10 seconds)**
- [ ] Tap "Start" button
- [ ] Audio plays: "Er skytterne klare"
- [ ] Timer counts up from 0
- [ ] State shows "Skytterne klargjøres"
- [ ] Orange/yellow color indicator

**Phase 2: Prepare (5 seconds)**
- [ ] Audio plays: "Last" (at 10s mark)
- [ ] State changes to "Forbered deg"
- [ ] Timer continues counting
- [ ] Orange color indicator

**Phase 3: Fire (8 seconds)**
- [ ] Audio plays: "Ild" (at 15s mark)
- [ ] State changes to "Aktiv skyting"
- [ ] Timer continues counting
- [ ] Green color indicator

**Phase 4: Cease Fire (2 seconds)**
- [ ] Audio plays: "Stans" (at 23s mark)
- [ ] State changes to "Skyting avsluttet"
- [ ] Timer continues for 2 more seconds
- [ ] Red color indicator

**Phase 5: Finished**
- [ ] State changes to "Ferdig" (at 25s mark)
- [ ] Timer stops
- [ ] Start button disappears
- [ ] Reset button appears

#### Test 2.3: Audio Precision
- [ ] "Er skytterne klare" plays immediately on start
- [ ] "Last" plays exactly 10 seconds later
- [ ] "Ild" plays exactly 5 seconds after "Last"
- [ ] "Stans" plays exactly 8 seconds after "Ild"
- [ ] All commands are clear and audible
- [ ] No audio delays or glitches

#### Test 2.4: Controls
- [ ] Pause button appears while running
- [ ] Tap Pause - timer stops
- [ ] Resume button appears
- [ ] Tap Resume - timer continues from pause point
- [ ] Tap Reset - timer returns to initial state
- [ ] Back button works at any time

#### Test 2.5: State Display
- [ ] Timer display updates smoothly (50ms intervals)
- [ ] Format: "0.00" for times under 1 minute
- [ ] Format: "1:23" for times over 1 minute
- [ ] Current command text displays clearly
- [ ] State indicator dot changes color correctly

---

### 3. Duel Shooting Program (Duellskyting)

#### Test 3.1: Navigation
- [ ] Tap Back to return to Home
- [ ] Tap on Duel Shooting card
- [ ] Navigate to TimerScreen
- [ ] Header shows "Standard Duellskyting"
- [ ] Start button visible

#### Test 3.2: Timer Sequence
Expected sequence with default settings:

**Phase 1: Countdown (60 seconds)**
- [ ] Tap "Start" button
- [ ] Audio plays: "Start"
- [ ] Timer counts up from 0
- [ ] State shows "Nedtelling"
- [ ] Normal display (not fullscreen yet)

**Phase 2: Light Cycles (5 cycles)**
After 60 seconds, expect 5 cycles of:

**Cycle 1-5 Pattern:**
- [ ] Screen switches to FULLSCREEN mode
- [ ] Red light fills entire screen (7 seconds)
  - [ ] Timer shows seconds in white text
  - [ ] State shows "Rød lys"
- [ ] Green light fills entire screen (3 seconds)
  - [ ] Timer continues in white text
  - [ ] State shows "Grønn lys"
- [ ] Pattern repeats 5 times total

**Phase 3: Finished**
- [ ] After 5 cycles complete (110 seconds total)
- [ ] Screen returns to normal view
- [ ] State shows "Ferdig"
- [ ] Reset button appears

#### Test 3.3: Fullscreen Light Display
- [ ] Red light is clearly visible (#E74C3C)
- [ ] Green light is clearly visible (#27AE60)
- [ ] Timer remains visible in white during light cycles
- [ ] State text visible in white
- [ ] No header visible during fullscreen mode

#### Test 3.4: Controls During Duel
- [ ] Pause works during countdown
- [ ] Pause works during light cycles
- [ ] Resume continues from correct point
- [ ] Reset returns to beginning
- [ ] Back button exits (with confirmation if running)

#### Test 3.5: Timing Verification
- [ ] Total countdown: 60 seconds
- [ ] Each red light: 7 seconds
- [ ] Each green light: 3 seconds
- [ ] Total cycle time: 10 seconds per cycle
- [ ] 5 cycles: 50 seconds
- [ ] Total program: 110 seconds (1:50)

---

### 4. Multi-Language Testing

#### Test 4.1: Norwegian (no/nb)
Set device to Norwegian:
- [ ] Home subtitle: "Presis timer for skyttere"
- [ ] Field card: "Feltskyting"
- [ ] Duel card: "Duellskyting"
- [ ] Commands: "Er skytterne klare", "Last", "Ild", "Stans"

#### Test 4.2: English (en)
Set device to English:
- [ ] Home subtitle: "Precision Timer for Shooters"
- [ ] Field card: "Field Shooting"
- [ ] Duel card: "Duel Shooting"
- [ ] Commands: "Are the shooters ready", "Load", "Fire", "Stop"

#### Test 4.3: Swedish (sv)
Set device to Swedish:
- [ ] Home subtitle: "Precisionstimer för skyttar"
- [ ] Field card: "Fältskytte"
- [ ] Commands: "Är skyttarna klara", "Ladda", "Eld", "Stopp"

#### Test 4.4: Danish (da)
Set device to Danish:
- [ ] Home subtitle: "Præcisionstimer for skytter"
- [ ] Field card: "Feltskytte"
- [ ] Commands: "Er skytterne klar", "Lad", "Ild", "Stop"

---

### 5. Edge Cases & Error Handling

#### Test 5.1: Interruptions
- [ ] Incoming phone call - app pauses gracefully
- [ ] Return to app - state preserved
- [ ] Switch to another app - timer stops
- [ ] Low battery warning - app continues

#### Test 5.2: Audio Failures
- [ ] Mute device - visual-only mode works
- [ ] No speaker available - app doesn't crash
- [ ] TTS not supported - fallback to visual only

#### Test 5.3: Navigation Edge Cases
- [ ] Rapid back button presses don't crash
- [ ] Navigate during timer - proper cleanup
- [ ] Start program, go back, start again - works correctly

#### Test 5.4: State Transitions
- [ ] Pause at each state - works correctly
- [ ] Resume from each state - continues properly
- [ ] Reset from any state - returns to idle

---

### 6. Performance Testing

#### Test 6.1: Smooth Operation
- [ ] Timer updates at 60fps (smooth animation)
- [ ] No lag when switching states
- [ ] Audio plays without delay
- [ ] Button presses respond immediately

#### Test 6.2: Memory & Battery
- [ ] App doesn't consume excessive battery
- [ ] Memory usage stays reasonable
- [ ] No memory leaks during long sessions
- [ ] Multiple program runs don't slow down app

---

### 7. Design System Verification

#### Test 7.1: Colors
- [ ] Primary blue (#2C3E50) - Header
- [ ] Success green (#27AE60) - Start button, green light
- [ ] Warning orange (#F39C12) - Prepare state, duel card
- [ ] Danger red (#E74C3C) - Cease fire, red light
- [ ] Background white (#FFFFFF)
- [ ] Surface gray (#F8F9FA) - Cards

#### Test 7.2: Typography
- [ ] Timer: 72px, monospace, bold
- [ ] H2: 24px (header title)
- [ ] H3: 20px (card titles)
- [ ] Body: 16px (descriptions)
- [ ] Button: 18px, semi-bold

#### Test 7.3: Spacing
- [ ] Cards have consistent padding (24px)
- [ ] Margins between cards (8px)
- [ ] Button spacing (32px padding)
- [ ] Header padding (16px vertical, 24px horizontal)

---

## Acceptance Criteria

### Must Pass (Blocking Issues)
- [ ] App launches without crashes
- [ ] Both programs are accessible
- [ ] Field shooting timer completes full sequence
- [ ] Duel shooting timer completes full sequence
- [ ] Audio commands play in Norwegian
- [ ] Back navigation works
- [ ] Basic pause/reset functionality works

### Should Pass (Important Issues)
- [ ] Audio timing is precise (within 100ms)
- [ ] Fullscreen lights display correctly
- [ ] All 4 languages work properly
- [ ] Resume functionality works correctly
- [ ] State indicators show correct colors

### Nice to Have (Enhancement Ideas)
- [ ] Smooth animations between states
- [ ] Haptic feedback on button press
- [ ] Visual countdown during prepare phase
- [ ] Sound on light color changes

---

## Bug Reporting Template

When reporting bugs, include:
1. **Device**: iOS/Android version and model
2. **Steps to Reproduce**: Exact steps to trigger bug
3. **Expected Result**: What should happen
4. **Actual Result**: What actually happens
5. **Screenshots**: If applicable
6. **Console Logs**: Any error messages

---

## Test Results Summary

Date: ___________  
Tester: ___________  
Device: ___________  

| Category | Tests Passed | Tests Failed | Notes |
|----------|--------------|--------------|-------|
| Home Screen | __/6 | | |
| Field Shooting | __/17 | | |
| Duel Shooting | __/12 | | |
| Multi-Language | __/12 | | |
| Edge Cases | __/11 | | |
| Performance | __/6 | | |
| Design System | __/15 | | |
| **TOTAL** | **__/79** | | |

**Overall Status**: PASS / FAIL / PARTIAL

**Blocker Issues**: _______________

**Recommendations**: _______________

---

## Next Steps After Testing

1. Document all bugs found
2. Create GitHub issues for blockers
3. Test on multiple devices (iOS + Android)
4. Get feedback from actual competitive shooters
5. Plan Phase 2 features based on user feedback
