import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.markium.app',
  appName: 'Markium',
  webDir: 'dist',
  ios: {
    allowsBackForwardNavigationGestures: true,
  },
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    allowNavigation: ['be-test.markium.online', 'be.markium.online', 's3.markium.online'],
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#00A76F',
    },
  },
};

export default config;
