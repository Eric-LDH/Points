# 📱 Points 积分管理系统 - 移动端打包完整指南

## 🎯 快速开始（3 分钟上手）

### 方式一：一键构建（推荐）

**如果你已安装 Android Studio**：
```bash
# 双击运行批处理文件
build-android.bat
```

**如果未安装 Android Studio**：
1. 下载安装：https://developer.android.com/studio
2. 安装完成后运行 `build-android.bat`

### 方式二：分步构建

```bash
# 1. 构建 Web 项目
npm run build

# 2. 同步到 Android
npx cap sync android

# 3. 打开 Android Studio
npx cap open android
```

然后在 Android Studio 中点击 Run 按钮或选择 Build > Build APK(s)

---

## 📋 详细配置说明

### 1. 环境要求

#### 必需环境
- ✅ **Node.js**: v16+ (已安装)
- ✅ **npm**: v8+ (已安装)
- ⚠️ **Android Studio**: 用于编译和打包 APK（可选但推荐）

#### 可选工具
- **Android SDK**: 如果只需要命令行构建
- **JDK 17**: Android 构建所需

### 2. 应用配置信息

当前应用配置（capacitor.config.ts）：
- **应用名称**: Points 积分管理
- **包名 (App ID)**: com.points.family
- **Web 输出目录**: dist

### 3. 完整构建流程

#### Step 1: 准备项目
```bash
# 确保依赖已安装
npm install

# 验证 Capacitor 已正确配置
npx cap doctor
```

#### Step 2: 构建 Web 应用
```bash
npm run build
```
成功后会在 `dist` 目录生成生产环境的静态文件。

#### Step 3: 同步到原生平台
```bash
npx cap sync android
```
这会将 `dist` 目录的文件复制到 Android 项目中。

#### Step 4: 构建 APK

**方法 A：使用 Android Studio（最简单）**
```bash
npx cap open android
```
然后：
1. 等待 Gradle 同步完成（首次需要几分钟）
2. 点击绿色三角形 "Run" 按钮运行应用
3. 或选择菜单：Build > Build Bundle(s) / APK(s) > Build APK(s)

**方法 B：使用命令行（需 Android SDK）**
```bash
cd android
gradlew assembleDebug
```

#### Step 5: 获取 APK 文件

构建完成后，APK 文件位置：
```
android\app\build\outputs\apk\debug\app-debug.apk
```

你可以：
- 通过 USB 传输到手机安装
- 使用邮件或聊天工具发送给自己
- 使用 ADB 命令安装：`adb install app-debug.apk`

---

## 🔧 高级配置

### 修改应用信息

编辑 `capacitor.config.ts`：
```typescript
const config = {
  appId: 'com.yourcompany.app',  // 修改包名
  appName: '你的应用名称',        // 修改应用名称
  webDir: 'dist'
};
```

然后重新同步：
```bash
npx cap sync android
```

### 生成 Release 版本（用于发布）

#### 1. 创建签名密钥库
```bash
keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-alias
```

#### 2. 配置签名
编辑 `android/app/build.gradle`：
```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('my-release-key.jks')
            storePassword '你的密码'
            keyAlias 'my-alias'
            keyPassword '你的密码'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

#### 3. 构建 Release APK
```bash
cd android
gradlew assembleRelease
```

---

## 🍎 iOS 打包说明（仅限 macOS）

由于你使用的是 Windows，iOS 打包需要在 Mac 上完成：

### 在 Mac 上执行以下步骤：

```bash
# 1. 克隆项目并安装依赖
git clone <你的仓库>
cd Points
npm install

# 2. 添加 iOS 平台
npx cap add ios

# 3. 构建并同步
npm run build && npx cap sync

# 4. 打开 Xcode
npx cap open ios

# 5. 在 Xcode 中：
#    - 配置开发团队（Apple Developer 账号）
#    - 选择目标设备
#    - 点击 Product > Archive
```

---

## 🐛 常见问题解决

### 1. ❌ "Unable to launch Android Studio"

**原因**: Android Studio 未安装或路径未配置

**解决方案**:
- 下载安装 Android Studio: https://developer.android.com/studio
- 或使用命令行构建（需 Android SDK）

### 2. ❌ Gradle 同步失败

**可能原因**:
- 网络连接问题
- JDK 版本不匹配
- Gradle 缓存损坏

**解决方案**:
```bash
# 删除 Gradle 缓存
rm -rf android/.gradle

# 重新同步
npx cap sync android

# 重启 Android Studio
```

### 3. ❌ "SDK not found"

**解决方案**:
- 确保已设置 `ANDROID_HOME` 环境变量
- Windows: `setx ANDROID_HOME "C:\Users\<用户名>\AppData\Local\Android\Sdk"`
- 重启终端后重试

### 4. ❌ 应用白屏或无法加载

**检查清单**:
- [ ] 确认已执行 `npm run build`
- [ ] 运行 `npx cap sync` 同步代码
- [ ] 检查 `capacitor.config.ts` 中 `webDir: 'dist'`
- [ ] 清除 Android 应用缓存后重新运行

### 5. ❌ 构建的 APK 无法安装

**可能原因**:
- Android 版本不兼容
- 签名问题

**解决方案**:
- 检查 `android/app/build.gradle` 中的 `minSdkVersion`
- 建议使用默认配置（API 21+）

---

## 📊 构建命令速查表

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动 Vite 开发服务器 |
| `npm run build` | 构建生产版本到 dist 目录 |
| `npx cap sync` | 同步到所有平台 |
| `npx cap sync android` | 仅同步到 Android |
| `npx cap open android` | 在 Android Studio 中打开 |
| `npx cap run android` | 在连接的设备上运行 |
| `build-android.bat` | 一键构建 Android APK |

---

## 📁 重要文件位置

```
Points/
├── capacitor.config.ts          # Capacitor 配置
├── build-android.bat            # Android 快速构建脚本
├── dist/                        # Web 构建输出目录
├── android/                     # Android 原生项目
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── assets/public/   # Web 文件（自动同步）
│   │   │   └── AndroidManifest.xml
│   │   └── build.gradle
│   └── build/outputs/apk/       # APK 输出位置
└── README_MOBILE.md             # 本文档
```

---

## 🚀 下一步建议

### 开发阶段
1. 使用 `npm run dev` 进行 Web 开发
2. 定期运行 `npx cap sync` 同步到原生
3. 在 Android Studio 中保持项目打开

### 测试阶段
1. 构建 Debug APK 并在真机测试
2. 测试所有功能是否正常
3. 检查深色模式等 UI 表现

### 发布阶段
1. 配置应用签名
2. 构建 Release APK
3. 准备应用图标和启动图
4. 上传到应用商店

---

## 📞 需要帮助？

- **Capacitor 官方文档**: https://capacitorjs.com/docs
- **Android 开发者文档**: https://developer.android.com/docs
- **项目问题记录**: 查看项目根目录的 BUGFIX_*.md 文件

---

**最后更新**: 2026-03-16  
**Capacitor 版本**: Latest  
**状态**: ✅ 配置完成，可随时构建