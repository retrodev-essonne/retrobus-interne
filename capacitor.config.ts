import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'fr.retrobus.essonne.interne',
  appName: 'RétroBus Interne',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#1a202c',
      showSpinner: true,
      spinnerColor: 'white'
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#1a202c'
    }
  }
};

export default config;
