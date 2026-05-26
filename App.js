import { StyleSheet, View, Platform } from 'react-native';
import { useEffect } from 'react';
import { Asset } from 'expo-asset';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Game from './src/Game';
import { preloadSFX } from './src/services/sfxService';
import { setBGMEnabled } from './src/services/musicService';

const PRELOAD_IMAGES = [
  require('./src/assets/img/S1.png'),
  require('./src/assets/img/S2.png'),
  require('./src/assets/img/C1.png'),
  require('./src/assets/img/C2.png'),
  require('./src/assets/img/C3.png'),
  require('./src/assets/img/C4.png'),
  require('./src/assets/img/C5.png'),
];

export default function App() {
  // Inject web CSS to prevent text selection and context menu
  useEffect(() => {
    setBGMEnabled(true);
    preloadSFX();
    Asset.loadAsync(PRELOAD_IMAGES).catch(() => {});
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const style = document.createElement('style');
      style.textContent = `
        * {
          -webkit-touch-callout: none !important;
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
          -webkit-tap-highlight-color: transparent !important;
        }
      `;
      document.head.appendChild(style);
      
      // Prevent context menu
      const preventMenu = (e) => {
        e.preventDefault();
        return false;
      };
      document.addEventListener('contextmenu', preventMenu, true);
      document.addEventListener('selectstart', preventMenu, true);
      
      return () => {
        document.head.removeChild(style);
        document.removeEventListener('contextmenu', preventMenu, true);
        document.removeEventListener('selectstart', preventMenu, true);
      };
    }
  }, []);

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <Game />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
