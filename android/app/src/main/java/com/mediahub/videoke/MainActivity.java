package com.mediahub.videoke;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(LocalServerPlugin.class);
        super.onCreate(savedInstanceState);

        WebView webView = getBridge().getWebView();
        WebSettings settings = webView.getSettings();
        settings.setMediaPlaybackRequiresUserGesture(false);

        Intent serviceIntent = new Intent(this, BackgroundPlaybackService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent);
        } else {
            startService(serviceIntent);
        }
    }

    @Override
    public void onStop() {
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.onResume();
        }
        super.onStop();
    }

    @Override
    public void onDestroy() {
        stopService(new Intent(this, BackgroundPlaybackService.class));
        super.onDestroy();
    }
}