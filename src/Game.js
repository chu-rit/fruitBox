import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Platform, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setBGMEnabled } from './services/musicService';
import { setSFXEnabled } from './services/sfxService';
import StartScreen from './screens/StartScreen';
import GameScreen from './screens/GameScreen';
import SettingsScreen from './screens/SettingsScreen';
import RankingScreen from './screens/RankingScreen';
import FruitBoxScreen from './screens/FruitBoxScreen';

export default function Game() {
  const [screen, setScreen] = useState('start'); // 'start', 'game', 'ranking', 'settings'
  const [running, setRunning] = useState(false);
  const [mapSize, setMapSize] = useState(6); // 5~8 configurable
  const [gameMode, setGameMode] = useState('fruit'); // 'apple' or 'fruit'
  const [bgmOn, setBgmOn] = useState(true);
  const [sfxOn, setSfxOn] = useState(true);
  const settingsLoaded = useRef(false);

  // Load saved settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedMapSize = await AsyncStorage.getItem('mapSize');
        if (savedMapSize !== null) setMapSize(parseInt(savedMapSize, 10));
        const savedBgm = await AsyncStorage.getItem('bgmOn');
        if (savedBgm !== null) { const v = savedBgm === 'true'; setBgmOn(v); setBGMEnabled(v); }
        const savedSfx = await AsyncStorage.getItem('sfxOn');
        if (savedSfx !== null) { const v = savedSfx === 'true'; setSfxOn(v); setSFXEnabled(v); }
      } catch (e) {}
      settingsLoaded.current = true;
    };
    loadSettings();
  }, []);

  // Save settings when changed (skip initial mount before load completes)
  useEffect(() => { if (settingsLoaded.current) AsyncStorage.setItem('mapSize', mapSize.toString()).catch(() => {}); }, [mapSize]);
  useEffect(() => { if (settingsLoaded.current) AsyncStorage.setItem('bgmOn', bgmOn.toString()).catch(() => {}); }, [bgmOn]);
  useEffect(() => { if (settingsLoaded.current) AsyncStorage.setItem('sfxOn', sfxOn.toString()).catch(() => {}); }, [sfxOn]);

  const handleBgmToggle = (v) => { setBgmOn(v); setBGMEnabled(v); };
  const handleSfxToggle = (v) => { setSfxOn(v); setSFXEnabled(v); };

  // TODO: Add your game state refs here

  const startGame = () => {
    setScreen(gameMode === 'fruit' ? 'fruitbox' : 'game');
    reset();
    setRunning(true);
  };

  const goToRanking = () => {
    setScreen('ranking');
  };

  const goToSettings = () => {
    setScreen('settings');
  };

  const toggleGameMode = () => {
    setGameMode(prev => prev === 'apple' ? 'fruit' : 'apple');
  };

  const backToStart = () => {
    setRunning(false);
    setScreen('start');
  };

  const reset = () => {
    // TODO: Reset game state
  };

  // Render screens
  const renderScreen = () => {
    switch (screen) {
      case 'start':
        return (
          <StartScreen
            onStart={startGame}
            onRanking={goToRanking}
            onSettings={goToSettings}
            onLogoPress={toggleGameMode}
            gameMode={gameMode}
          />
        );
      case 'fruitbox':
        return (
          <FruitBoxScreen onBackToStart={backToStart} mapSize={mapSize} />
        );
      case 'game':
        return (
          <GameScreen onBackToStart={backToStart} mapSize={mapSize} />
        );
      case 'ranking':
        return (
          <RankingScreen onBack={backToStart} />
        );
      case 'settings':
        return (
          <SettingsScreen
            onBack={backToStart}
            mapSize={mapSize}
            onChangeMapSize={setMapSize}
            bgmOn={bgmOn}
            sfxOn={sfxOn}
            onBgmToggle={handleBgmToggle}
            onSfxToggle={handleSfxToggle}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.background}>
      <View style={Platform.OS === 'web' ? styles.mobileBox : styles.container}>
        {renderScreen()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#FFF8E7',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    width: '100%',
  },
  mobileBox: {
    width: '100%',
    maxWidth: 430,
    height: '100%',
    backgroundColor: '#FFF8E7',
    overflow: 'hidden',
    paddingBottom: 20,
    borderRadius: 12,
  },
  gameContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
});
