import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'lavadoras.yapido.click',
  appName: 'Lavadoras',
  webDir: 'out',
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  server: {
    url: 'https://lavadoras.yapido.click',
    cleartext: false,
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com'],
    },
    SplashScreen: {
      launchShowDuration: 800,
      launchAutoHide: false,
      backgroundColor: '#0A0E1A',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      androidSpinnerStyle: 'large',
      spinnerColor: '#00B871',
      splashFullScreen: true,
      splashImmersive: true,
    },
    Biometric: {
      allowDeviceCredential: true,
    },
  },
};

export default config;
