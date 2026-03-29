import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.points.family',
  appName: 'Points 积分管理',
  webDir: 'dist',
  server: {
    // 开发时可启用此配置进行热重载调试
    // url: 'http://localhost:3000',
    // cleartext: true
  },
  android: {
    buildOptions: {
      keystorePath: '',
      keystorePassword: '',
      keystoreAlias: '',
      keystoreAliasPassword: '',
      releaseType: 'APK'
    },
    webContentsDebuggingEnabled: true
  }
};

export default config;