# Crash Log Capture Procedure (Android via WSL + Windows)

Use this checklist whenever you need to extract a crash log from a physical Android device while the project runs inside WSL.

## 1. Prerequisites
- Windows host with the Android platform tools installed (e.g. `C:\Android\platform-tools`).
- Smartphone with Developer Options enabled.
- Both the Windows host and phone connected to the same Wi-Fi network.
- Wireless debugging available (Android 11+). If the menu is missing, fall back to the USB-only workflow at the end of this document.

## 2. Prepare the Device
1. Open *Settings → About phone → Software information*.
2. Tap *Build number* seven times to enable *Developer options* (skip if already enabled).
3. Go back to *Settings → Developer options*.
4. Enable *USB debugging*.
5. Scroll to *Wireless debugging* and enable it.
6. Tap *Pair device with pairing code* and keep the dialog open (shows IP, pairing port, and pairing code).

## 3. Pair the Device over Wi-Fi (from WSL)
1. In WSL, ensure the latest Android platform tools are on the PATH (`adb --version`).
2. Start a fresh `adb` server:
   ```bash
   adb kill-server
   adb start-server
   ```
3. Pair the device using the details from the wireless debugging dialog:
   ```bash
   adb pair <device-ip>:<pairing-port>
   ```
   Enter the six-digit pairing code when prompted.
4. Connect to the regular debugging port listed in the wireless debugging view (usually 5555):
   ```bash
   adb connect <device-ip>:<adb-port>
   ```
5. Confirm the device is online:
   ```bash
   adb devices
   ```
   The device should appear as `device` (not `offline`).

## 4. Reproduce the Crash
1. In WSL, start the app with enhanced logging:
   ```bash
   EXPO_DEBUG=true npx expo start --tunnel --dev-client
   ```
2. Launch the Expo Dev Client on the phone and run the app.
3. Perform the steps that trigger the crash. Keep the Expo/Metro terminal open.

## 5. Collect the Crash Log
1. Immediately after the crash, dump the logcat buffer to a file:
   ```bash
   adb logcat -d -v time > expo_crash.log
   ```
2. Inspect the tail of the file for the `E/AndroidRuntime` or `FATAL EXCEPTION` block:
   ```bash
   tail -n 120 expo_crash.log
   ```
3. Share the relevant excerpt (usually 40–60 lines around the fatal exception) for diagnosis.
4. Clear the logcat buffer so the next capture is clean:
   ```bash
   adb logcat -c
   ```

## 6. Optional: USB-Only Workflow (for Android 10 or older)
If wireless debugging is unavailable:
1. Connect the phone via USB.
2. In Windows PowerShell:
   ```powershell
   cd C:\Android\platform-tools
   .\adb.exe kill-server
   .\adb.exe start-server
   .\adb.exe devices # accept the USB debugging prompt on the phone
   .\adb.exe tcpip 5555
   .\adb.exe connect <device-ip>:5555
   ```
3. Disconnect the USB cable and continue with the WSL steps above (pairing is no longer needed once connected).

## 7. Troubleshooting
- If `adb devices` shows the phone as `unauthorized`, unlock the device and accept the debugging prompt. If it never appears, disable/re-enable USB debugging and tap *Revoke USB debugging authorizations*.
- If `adb connect` fails, double-check that the phone and PC share the same Wi-Fi and that the IP/port match the wireless debugging screen.
- Use `adb logcat -d` only after the crash occurs; the buffer is cleared automatically once dumped.
- Restart `adb` if connectivity drops: `adb kill-server && adb start-server`.

Keep this procedure handy in `docs/CRASH_LOG_PROCEDURE.md` so the team can gather reliable crash logs whenever the Expo app terminates unexpectedly.
