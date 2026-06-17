import React, { useState } from 'react';
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

  return (
    <View style={[styles.container, isFruitMode && styles.containerFruit]}>
      {/* Background image based on aspect ratio */}
      <Image 
        source={is9_20 ? BG_IMAGE_20 : BG_IMAGE_16} 
        style={[styles.bgImage, { height }]} 
        resizeMode="cover"
      />

      {/* Content Container */}
      <View style={styles.contentContainer}>
        {/* Title Section */}
        <View style={styles.titleContainer}>
          
        </View>

        {/* Menu Buttons - 상단 기준 배치 */}
        <View style={[styles.menuContainer, { marginTop: height * 0.5 }]}>
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
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  contentContainer: {
    flex: 1,
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
});
