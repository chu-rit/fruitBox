import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { startBGM } from '../services/musicService';
import { playStartSFX } from '../services/sfxService';

const { width, height } = Dimensions.get('window');

// Background images for different aspect ratios
const BG_IMAGE_16 = require('../assets/img/ST_BG(16).png');
const BG_IMAGE_20 = require('../assets/img/ST_BG(20).png');

// Aspect ratio detection (9:20 vs 9:16)
const aspectRatio = height / width;
const is9_20 = aspectRatio > 1.9;


export default function StartScreen({ onStart, onSettings, onRanking, onLogoPress, gameMode = 'apple' }) {
  const isFruitMode = gameMode === 'fruit';
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, isFruitMode && styles.containerFruit]}>

      {/* Background image based on aspect ratio */}
      <Image 
        source={is9_20 ? BG_IMAGE_20 : BG_IMAGE_16} 
        style={[styles.bgImage, { height: height + insets.top + insets.bottom }]} 
        resizeMode="cover"
      />

      {/* Title Section */}
      <View style={styles.titleContainer}>
        
      </View>

      {/* Menu Buttons */}
      <View style={styles.menuContainer}>
        <TouchableOpacity style={[styles.button, isFruitMode && styles.buttonFruit]} onPress={() => { playStartSFX(); startBGM(); onStart(); }}>
          <Text style={styles.buttonText}></Text>
        </TouchableOpacity>

        {isFruitMode && (
        <TouchableOpacity style={[styles.button, isFruitMode && styles.buttonFruit]} onPress={() => { playStartSFX(); onRanking(); }}>
          <Text style={styles.buttonText}></Text>
        </TouchableOpacity>
      )}

      {isFruitMode && (
        <TouchableOpacity style={[styles.button, isFruitMode && styles.buttonFruit]} onPress={() => { playStartSFX(); onSettings(); }}>
          <Text style={styles.buttonText}></Text>
        </TouchableOpacity>
      )}
      </View>

      {/* Footer: Version */}
      <View style={styles.footer}>
        <Text style={styles.version}>v1.0.5</Text>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  containerFruit: {
    backgroundColor: '#FFF5E6',
  },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
    zIndex: 0,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: height * 0.08,
  },
  menuContainer: {
    paddingHorizontal: 80,
    paddingBottom: is9_20 ? height * 0.16 : height * 0.1,
    gap: is9_20 ? 23 : 3,
  },
  button: {
    backgroundColor: 'transparent',
    paddingVertical: 15,
    alignItems: 'center',
    height: 58,
    width: '100%',
  },
  buttonFruit: {
    backgroundColor: 'transparent',
  },
  buttonText: {
    color: 'transparent',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  buttonSecondary: {
    backgroundColor: 'rgba(0,0,255,0.3)',
    paddingVertical: 15,
    alignItems: 'center',
    height: 45,
    width: '100%',
  },
  buttonSecondaryFruit: {
    backgroundColor: 'rgba(0,0,255,0.3)',
  },
  buttonSecondaryText: {
    color: 'blue',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  buttonSecondaryTextFruit: {
    color: 'blue',
  },
  footer: {
    position: 'absolute',
    bottom: is9_20 ? height * 0.1 : height * 0.05,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  version: {
    fontSize: 12,
    opacity: 0.9,
    color: '#ad7339',
    fontWeight: '900',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
