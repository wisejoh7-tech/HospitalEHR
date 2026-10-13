import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hospital.app',
  appName: 'Hospital Management System',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
