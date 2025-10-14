# Local build helper

This repo includes a helper script to attempt a local build of an unsigned, minified release APK for testing.

Usage:

```bash
# from repo root
chmod +x scripts/build-local-apk.sh
./scripts/build-local-apk.sh
```

What the script does:
- Runs `npm ci` if `package-lock.json` exists; otherwise `npm install`.
- Attempts to generate React Native codegen artifacts (if script present).
- Cleans common Android build caches that break autolinking.
- Runs `./gradlew clean assembleRelease --stacktrace --info` and lists the output APKs.

If the script fails, copy/paste the Gradle output here and I'll help debug further.
