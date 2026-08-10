import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'lavadorasx.yapido.click',
  appName: 'Lavadoras',
  webDir: 'out',
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
  server: {
    url: 'https://lavadoras.yapido.click',
    cleartext: false,
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com'],
      webClientId: '294212274372-0o91m9db3733jv5dkhnugfsmi75ho6ui.apps.googleusercontent.com',
    },
    SplashScreen: {
      launchShowDuration: 4000,
      launchAutoHide: true,
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
