import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'click.yapido.app',
  appName: 'Yapido',
  webDir: 'out',
  server: {
    url: 'https://lavadoras.yapido.click',
    cleartext: true
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com'],
    },
  },
};

export default config;
