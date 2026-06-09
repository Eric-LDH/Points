@echo off
chcp 65001 >nul
echo ========================================
echo   Android APP 打包脚本
echo ========================================
echo.

echo [1/3] 构建前端资源并同步到 Android...
call npm run build:android
if errorlevel 1 (
    echo.
    echo ❌ 构建失败！
    pause
    exit /b 1
)
echo ✅ 前端构建完成
echo.

echo [2/3] 编译 Android APK...
cd android
call .\gradlew clean assembleDebug
if errorlevel 1 (
    echo.
    echo ❌ APK 编译失败！
    cd ..
    pause
    exit /b 1
)
cd ..
echo ✅ APK 编译完成
echo.

echo [3/3] 打开 APK 文件所在文件夹...
start "" "android\app\build\outputs\apk\debug"
echo.
echo ========================================
echo   ✅ 打包成功！
echo   APK 位置: android\app\build\outputs\apk\debug\app-debug.apk
echo ========================================
pause
