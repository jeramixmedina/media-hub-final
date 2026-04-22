# Media Hub — Setup & Build Guide

## Prerequisites
- Node.js 18+ installed on your PC
- Android Studio installed (for building the APK)
- Android tablet connected via USB with Developer Mode enabled
- Java 17+ (comes with Android Studio)

---

## Step 1 — Install dependencies

```bash
cd media-hub
npm install
```

---

## Step 2 — Build the web app

```bash
npm run build
```
This creates the `dist/` folder.

---

## Step 3 — Add Android platform

```bash
npx cap add android
```

---

## Step 4 — Add storage permissions to AndroidManifest.xml

Open `android/app/src/main/AndroidManifest.xml` and add inside `<manifest>`:

```xml
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"
    android:maxSdkVersion="32" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"
    android:maxSdkVersion="29" />
<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
```

Also add `android:requestLegacyExternalStorage="true"` to the `<application>` tag.

---

## Step 5 — Sync Capacitor

```bash
npx cap sync android
```

---

## Step 6 — Build the APK

### Option A — Open in Android Studio (recommended)
```bash
npx cap open android
```
Then in Android Studio:
- Build → Generate Signed Bundle / APK → APK → Next
- Create a keystore (first time) or use existing
- Build release APK
- APK will be at: `android/app/release/app-release.apk`

### Option B — Build from command line
```bash
cd android
./gradlew assembleDebug
```
APK at: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## Step 7 — Install on tablet

### Via USB
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Via file transfer
1. Copy the APK to your tablet
2. On the tablet: Settings → Security → Allow installs from unknown sources
3. Open the APK file and tap Install

---

## First Run on Tablet

1. Open **Media Hub**
2. Tap **Settings** (bottom nav, right side)
3. Tap **Add folder** → browse to your videos folder → tap **Add**
4. Tap **Scan** to index all videos
5. Go to **Songbook** — all your songs appear
6. Tap the **edit icon** on any song in Settings → Song Numbers to assign numbers
7. Start playing!

---

## Adding New Videos Later

1. Copy new video files to the same folder on your tablet
2. Open Media Hub → Settings → tap **Scan**
3. New songs appear automatically. Existing song numbers are preserved.

---

## File Naming Convention

Your videos should be named:
```
Song Title - Artist Name.mp4
```
Examples:
```
My Way - Frank Sinatra.mp4
Bohemian Rhapsody - Queen.mp4
Shape of You - Ed Sheeran.mp4
```

Songs with no ` - ` separator will be imported as title only (artist = "Unknown Artist").

---

## Folder Structure (any of these work)

```
Videos/                          ← flat folder
  My Way - Frank Sinatra.mp4
  Bohemian Rhapsody - Queen.mp4

Videos/                          ← organized by artist
  Frank Sinatra/
    My Way - Frank Sinatra.mp4
  Queen/
    Bohemian Rhapsody - Queen.mp4

Videos/                          ← mixed
  My Way - Frank Sinatra.mp4
  OPM/
    Ikaw - Yeng Constantino.mp4
```

All structures are scanned recursively.

---

## Development (live reload on tablet)

```bash
npm run dev
```
Then in a separate terminal:
```bash
npx cap run android --livereload --external
```
Make sure your PC and tablet are on the same Wi-Fi network.

---

## Troubleshooting

**Videos not loading:**
- Check storage permission is granted: Settings (Android) → Apps → Media Hub → Permissions → Storage → Allow all

**Folder browser shows empty:**
- Grant storage permission first, then re-open the folder browser

**App crashes on startup:**
- Rebuild: `npm run build && npx cap sync android`

**Scan finds 0 songs:**
- Confirm your folder path is correct
- Make sure files end in .mp4, .webm, or .mkv
