package com.points.family;

import android.os.Bundle;
import android.graphics.Color;
import android.view.View;
import android.webkit.WebView;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // 设置状态栏背景为透明，并启用深色模式自适应
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        
        // 根据系统主题自动调整状态栏图标颜色
        WindowInsetsControllerCompat windowInsetsController = 
            WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        
        // 默认使用浅色图标（深色背景下需要浅色图标）
        // 实际颜色会根据 WebView 内容动态调整
        windowInsetsController.setAppearanceLightStatusBars(false);
        
        // 禁用 WebView 的滚动回弹效果
        if (bridge != null) {
            WebView webView = bridge.getWebView();
            if (webView != null) {
                webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
            }
        }
    }
}
