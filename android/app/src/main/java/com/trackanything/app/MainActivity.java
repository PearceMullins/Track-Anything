package com.trackanything.app;

import android.content.res.Configuration;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        if (getBridge() == null) {
            return;
        }
        WebView webView = getBridge().getWebView();
        if (webView == null) {
            return;
        }
        webView.post(() -> {
            webView.requestLayout();
            webView.invalidate();
            webView.evaluateJavascript(
                "window.dispatchEvent(new Event('orientationchange'));",
                null
            );
        });
    }
}
