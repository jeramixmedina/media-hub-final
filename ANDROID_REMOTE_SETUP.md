# Android changes for QR Remote (Feature 5)
# Do these ONCE on your PC before building the APK

## Step 1 — Add NanoHTTPD to build.gradle

Open:  D:\media-hub\android\app\build.gradle

Find the dependencies { } block and add this line inside it:

    implementation 'org.nanohttpd:nanohttpd:2.3.1'

Example — your dependencies block should look like:

    dependencies {
        implementation 'org.nanohttpd:nanohttpd:2.3.1'
        // ... other existing lines stay as-is
    }

---

## Step 2 — Register the plugin in MainActivity.java

Open:  D:\media-hub\android\app\src\main\java\com\mediahub\videoke\MainActivity.java

Replace the entire file content with this:

    package com.mediahub.videoke;

    import android.os.Bundle;
    import com.getcapacitor.BridgeActivity;

    public class MainActivity extends BridgeActivity {
        @Override
        public void onCreate(Bundle savedInstanceState) {
            registerPlugin(LocalServerPlugin.class);
            super.onCreate(savedInstanceState);
        }
    }

---

## Step 3 — Copy the plugin file

The file:  D:\media-hub\android\app\src\main\java\com\mediahub\videoke\LocalServerPlugin.java

Already exists in the zip — just make sure it's in that folder.

---

## Step 4 — Rebuild

In PowerShell:

    cd D:\media-hub
    npm install
    npm run build
    npx cap sync android

Then in Android Studio:
    Build → Build Bundle(s) / APK(s) → Build APK(s)

---

## How to use the Remote

1. Open Media Hub on your tablet
2. Tap the QR icon in the bottom nav (last tab)
3. The server starts automatically and shows a QR code
4. Other phones on the same WiFi scan the QR code
5. They see a full songbook — tap + to add songs to queue
6. Songs appear in the queue on your tablet instantly
