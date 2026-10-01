@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ========================================
echo   Android APP 打包脚本
echo ========================================
echo.

set "APK_PATH=android\app\build\outputs\apk\debug\app-debug.apk"
set "APP_ID=com.points.family"

echo [1/4] 构建前端资源...
call npm run build
if errorlevel 1 (
    echo.
    echo ❌ 前端构建失败！
    pause
    exit /b 1
)
echo ✅ 前端构建完成
echo.

echo [2/4] 同步到 Android 工程...
call npx cap sync android
if errorlevel 1 (
    echo.
    echo ❌ 同步失败！
    pause
    exit /b 1
)
echo ✅ 同步完成
echo.

echo [3/4] 编译 Android APK...
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

echo [4/4] 安装到已连接的手机...
call :find_adb
if not defined ADB (
    echo ⚠️  未找到 adb，已跳过安装步骤
    echo    请安装 Android SDK Platform-Tools，或将其加入系统 PATH
) else (
    call :install_apk
    if errorlevel 1 echo ⚠️  安装未完成，请查看上面的提示
)
echo.

echo ========================================
echo   ✅ 打包成功！
echo   APK 位置: %APK_PATH%
echo ========================================
pause
exit /b 0

rem ==========================================================
rem  查找 adb：优先 PATH，其次 local.properties 中的 SDK 目录
rem ==========================================================
:find_adb
set "ADB="
for /f "delims=" %%i in ('where adb 2^>nul') do (
    if not defined ADB set "ADB=%%i"
)
if defined ADB exit /b 0

set "SDK_DIR="
if exist "android\local.properties" (
    for /f "usebackq tokens=1,* delims==" %%a in ("android\local.properties") do (
        if /i "%%a"=="sdk.dir" set "SDK_DIR=%%b"
    )
)
rem 去掉 local.properties 中反斜杠的转义写法（C\:\\xxx -> C:\xxx）
if defined SDK_DIR set "SDK_DIR=!SDK_DIR:\:=:!"
if defined SDK_DIR set "SDK_DIR=!SDK_DIR:\\=\!"
if not defined SDK_DIR set "SDK_DIR=%LOCALAPPDATA%\Android\Sdk"

if exist "!SDK_DIR!\platform-tools\adb.exe" set "ADB=!SDK_DIR!\platform-tools\adb.exe"
if not defined ADB if exist "%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" set "ADB=%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe"
exit /b 0

rem ==========================================================
rem  通过 adb 安装 APK 到手机
rem ==========================================================
:install_apk
if not exist "%APK_PATH%" (
    echo ❌ 未找到 APK 文件: %APK_PATH%
    exit /b 1
)

"%ADB%" start-server >nul 2>&1

set "SERIALS="
set "OTHER="
for /f "skip=1 tokens=1,2" %%d in ('"%ADB%" devices') do (
    if /i "%%e"=="device" (
        set "SERIALS=!SERIALS! %%d"
    ) else (
        if not "%%d"=="" set "OTHER=!OTHER! %%d(%%e)"
    )
)

set "DEVCOUNT=0"
for %%s in (!SERIALS!) do set /a DEVCOUNT+=1

if !DEVCOUNT!==0 (
    echo ❌ 未检测到可用设备
    if defined OTHER echo    异常状态设备:!OTHER!
    "%ADB%" devices -l
    echo.
    echo    请检查:
    echo      1. 手机已用数据线连接电脑（建议使用原装线，模式选“传输文件/MTP”）
    echo      2. 已开启「开发者选项 - USB 调试」
    echo      3. 手机屏幕上已点击「允许 USB 调试」授权本电脑
    exit /b 1
)

if !DEVCOUNT! GTR 1 (
    "%ADB%" devices
    set /p "SERIAL=检测到多台设备，请输入要安装的设备序列号: "
    if not defined SERIAL exit /b 1
) else (
    for %%s in (!SERIALS!) do set "SERIAL=%%s"
)

echo 正在安装到设备 !SERIAL! ...
"%ADB%" -s !SERIAL! install -r "%APK_PATH%"
if not errorlevel 1 (
    echo ✅ 安装成功，手机上已更新应用
    exit /b 0
)

echo.
echo ⚠️  安装失败。若提示 INSTALL_FAILED_UPDATE_INCOMPATIBLE / 签名不一致，
echo    需要先卸载手机上的旧版本再重新安装（旧版本的应用数据会丢失）。
set /p "RETRY=是否卸载旧版本后重新安装? (Y/N): "
if /i not "!RETRY!"=="Y" exit /b 1

"%ADB%" -s !SERIAL! uninstall %APP_ID%
"%ADB%" -s !SERIAL! install -r "%APK_PATH%"
if errorlevel 1 (
    echo ❌ 重新安装仍然失败，请手动排查
    exit /b 1
)
echo ✅ 安装成功，手机上已更新应用
exit /b 0
