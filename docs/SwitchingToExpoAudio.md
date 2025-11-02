# Switching from `expo-av` to `expo-audio`

This note captures everything we learned while experimenting with `expo-audio`. Keep it handy in case `expo-av` is ever removed or stops working.

## 1. Overview

`expo-audio` is still beta (as of Expo SDK 54). In production builds, playback currently breaks unless you apply workarounds. We are staying on `expo-av` for now because it is stable and reliable, but if we must migrate later, follow the steps below.

## 2. Code changes

1. **Replace imports**
   - Swap the `expo-av` playback logic with `expo-audio`. For example:
     - `import { createAudioPlayer } from 'expo-audio'` (player)
     - `import { useAudioRecorder } from 'expo-audio'` (if moving recording to hooks)

2. **Update playback implementation**
   - Instantiate player objects via `createAudioPlayer({ uri })`.
   - Keep a reference to the player to stop/remove it between plays (similar to the current `playbackPlayers` map).

3. **Recording**
   - Recording via `expo-audio` requires hooks (`useAudioRecorder`). Since our service runs outside of React components, consider:
     - Moving recording into a component, or
     - Keeping `expo-av` for recording until `expo-audio` exposes non-hook APIs.

## 3. Android build adjustments

1. **ProGuard keep rules**

   Add these to `android/app/proguard-rules.pro` to prevent class stripping:

   ```proguard
   # expo-audio playback
   -keep class expo.modules.audio.** { *; }
   -keep class com.google.android.exoplayer2.** { *; }
   -keep class com.google.android.exoplayer2.ext.** { *; }

   # Expo file system helpers (recording storage)
   -keep class expo.modules.filesystem.** { *; }
   ```

   Keep the existing React Native rules already present in the file.

2. **R8 workaround (Expo issue #34555)**

   If playback still fails in release, apply the temporary fix referenced in [Expo issue 34555](https://github.com/expo/expo/issues/34555#issuecomment-3141001410). The patch adds missing exports for the `expo-audio` module so the player isn’t stripped.

   Monitor that issue for official fixes and remove the patch once Expo ships a permanent solution.

3. **Rebuild**

   Run `cd android && ./gradlew clean assembleRelease` to produce a fresh release APK/AAB and reinstall it on a device to verify audio plays.

## 4. Permissions

- Playback from internal storage does *not* require extra Android permissions.
- Recording still needs `Audio.requestPermissionsAsync()` just like today; keep that logic.

## 5. Testing checklist

1. Record each phase and confirm files are saved.
2. Play back in the release APK (signed) on a physical device—audio should be heard.
3. Delete and re-record clips to confirm cleanup logic still works.
4. Check `adb logcat` for missing class errors; if you see strippages, revisit the keep rules/patch.

## 6. Rolling back

- If the migration fails, revert to the `expo-av` implementation, remove `expo-audio` imports, and rebuild.
- Ensure ProGuard rules are restored to the `expo-av` version by removing the `expo-audio`-specific keep rules and any applied patches.

---

Keep this document updated as Expo evolves; once `expo-audio` graduates from beta, some steps may become unnecessary.
