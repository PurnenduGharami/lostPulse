import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lostpulse.app',
  appName: 'Lost Pulse',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
