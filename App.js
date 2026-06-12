import { StyleSheet, View, Platform, Image, TouchableWithoutFeedback, Text } from 'react-native';
import { useEffect, useState } from 'react';
import { Asset } from 'expo-asset';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Game from './src/Game';
import { preloadSFX } from './src/services/sfxService';
import { setBGMEnabled, preloadBGM } from './src/services/musicService';
import { loadRewardedAd } from './src/services/adService';

const PRELOAD_IMAGES = [
  require('./src/assets/img/S1.png'),
  require('./src/assets/img/S2.png'),
  require('./src/assets/img/C1.png'),
  require('./src/assets/img/C2.png'),
  require('./src/assets/img/C3.png'),
  require('./src/assets/img/C4.png'),
  require('./src/assets/img/C5.png'),
  require('./src/assets/img/BG_BOT.png'),
  require('./src/assets/img/BG_TOP.png'),
  require('./src/assets/img/FruitBoxLogo.png'),
  require('./src/assets/img/ST_BG(16).png'),
  require('./src/assets/img/ST_BG(20).png'),
  require('./src/assets/img/T1.jpg'),
  require('./src/assets/img/T2.jpg'),
  require('./src/assets/img/T3.jpg'),
  require('./src/assets/img/apple.png'),
  require('./src/assets/img/back_arrow.png'),
  require('./src/assets/img/bar1.png'),
  require('./src/assets/img/bar2.png'),
  require('./src/assets/img/bubble.png'),
  require('./src/assets/img/grape.png'),
  require('./src/assets/img/hand.png'),
  require('./src/assets/img/icon.png'),
  require('./src/assets/img/orange.png'),
  require('./src/assets/img/peach.png'),
  require('./src/assets/img/pear.png'),
  require('./src/assets/img/pineapple.png'),
  require('./src/assets/img/strawberry.png'),
  require('./src/assets/img/watermelon.png'),
];

const LOADING_IMG = require('./src/assets/img/loading.png');

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [ready, setReady] = useState(false);
  const [dotCount, setDotCount] = useState(1);

  // Loading dots animation
  useEffect(() => {
    if (loaded) return;
    
    const interval = setInterval(() => {
      setDotCount(prev => (prev % 3) + 1);
    }, 500);
    
    return () => clearInterval(interval);
  }, [loaded]);

  // Inject web CSS to prevent text selection and context menu
  useEffect(() => {
    setBGMEnabled(true);
    const tasks = [
      preloadSFX(),
      preloadBGM(),
      Asset.loadAsync(PRELOAD_IMAGES),
    ];
    if (Platform.OS !== 'web') tasks.push(loadRewardedAd());
    Promise.all(tasks)
      .catch(() => {})
      .finally(() => {
        setLoaded(true);
        setReady(true);
      });
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

  if (!ready) {
    return (
      <View style={styles.loadingContainer}>
        <Image source={LOADING_IMG} style={styles.loadingBg} resizeMode="cover" />
        <View style={styles.loadingMessageContainer}>
          {loaded ? (
            <Text style={styles.tapText}>Starting...</Text>
          ) : (
            <Text style={styles.loadingText}>
              Loading{'.'.repeat(dotCount)}
            </Text>
          )}
        </View>
      </View>
    );
  }

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
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingBg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  loadingMessageContainer: {
    position: 'absolute',
    bottom: '20%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 32,
    fontFamily: Platform.OS === 'web' ? 'Arial Black' : 'Fredoka_700Bold',
    fontWeight: '900',
    color: '#7A4010',
    textShadowColor: 'rgba(120,60,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    zIndex: 100,
  },
  tapText: {
    fontSize: '3vh',
    fontFamily: Platform.OS === 'web' ? 'Arial Black' : 'Fredoka_700Bold',
    fontWeight: '900',
    color: '#7A4010',
    textShadowColor: 'rgba(120,60,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    zIndex: 100,
  },
});
