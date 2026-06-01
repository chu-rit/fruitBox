import React, { useState } from 'react';
// SafeAreaView removed for web
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  Linking,
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
  const [showCredits, setShowCredits] = useState(false);

  return (
    <View style={[styles.container, isFruitMode && styles.containerFruit]}>

      {/* Background image based on aspect ratio */}
      <Image 
        source={is9_20 ? BG_IMAGE_20 : BG_IMAGE_16} 
        style={styles.bgImage} 
        resizeMode="cover"
      />

      {/* Title Section */}
      <View style={styles.titleContainer}>
        
        
      </View>

      {/* Menu Buttons */}
      <View style={styles.menuContainer}>
        <TouchableOpacity style={[styles.button, isFruitMode && styles.buttonFruit]} onPress={() => { playStartSFX(); startBGM(); onStart(); }}>
          <Text style={styles.buttonText}>▶  START GAME</Text>
        </TouchableOpacity>

        {isFruitMode && (
        <TouchableOpacity style={[styles.buttonSecondary, isFruitMode && styles.buttonSecondaryFruit]} onPress={() => { playStartSFX(); onRanking(); }}>
          <Text style={[styles.buttonSecondaryText, isFruitMode && styles.buttonSecondaryTextFruit]}>🏆  RANKING</Text>
        </TouchableOpacity>
      )}

      {isFruitMode && (
        <TouchableOpacity style={[styles.buttonSecondary, isFruitMode && styles.buttonSecondaryFruit]} onPress={() => { playStartSFX(); onSettings(); }}>
          <Text style={[styles.buttonSecondaryText, isFruitMode && styles.buttonSecondaryTextFruit]}>⚙  SETTINGS</Text>
        </TouchableOpacity>
      )}
      </View>

      {/* Version */}
      <View style={styles.footer}>
        <Text style={styles.version}>v1.0.5</Text>
      </View>

      {/* Credits at bottom */}
      <TouchableOpacity onPress={() => setShowCredits(true)} style={styles.creditsContainer}>
        <Text style={styles.creditsText}>Credits</Text>
      </TouchableOpacity>

      {/* Credits Modal */}
      <Modal transparent visible={showCredits} animationType="fade" onRequestClose={() => setShowCredits(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCredits(false)}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Credits</Text>
            <Text style={styles.modalBody}>Created by ChuRit</Text>
            <Text
              style={styles.modalLink}
              onPress={() => Linking.openURL('https://chu-rit.github.io/')}
            >
              chu-rit.github.io
            </Text>
            <Text style={styles.modalBody}>Music by Clement Panchout</Text>
            <Text
              style={styles.modalLink}
              onPress={() => Linking.openURL('http://www.clementpanchout.com')}
            >
              www.clementpanchout.com
            </Text>
            <Text style={styles.modalBody}>SFX by KronBits</Text>
            <Text
              style={styles.modalLink}
              onPress={() => Linking.openURL('https://kronbits.itch.io/freesfx')}
            >
              kronbits.itch.io/freesfx
            </Text>
            <TouchableOpacity onPress={() => setShowCredits(false)} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    paddingHorizontal: 40,
    paddingBottom: is9_20 ? height * 0.12 : height * 0.06,
    gap: is9_20 ? 30 : 10,
  },
  button: {
    backgroundColor: 'transparent',
    paddingVertical: 18,
    alignItems: 'center',
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
    backgroundColor: 'transparent',
    paddingVertical: 15,
    alignItems: 'center',
  },
  buttonSecondaryFruit: {
    backgroundColor: 'transparent',
  },
  buttonSecondaryText: {
    color: 'transparent',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  buttonSecondaryTextFruit: {
    color: 'transparent',
  },
  footer: {
    position: 'absolute',
    top: is9_20 ? height * 0.88 : height * 0.6,
    left: 0,
    right: 0,
    fontWeight: '600',
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
  creditsText: {
    fontSize: is9_20 ? 15 : 12,
    opacity: 0.9,
    color: '#ad7339',
    fontWeight: '900',
    textDecorationLine: 'underline',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  creditsContainer: {
    position: 'absolute',
    bottom: is9_20 ? height * 0.065 : height * 0.03,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 32,
    alignItems: 'center',
    width: '80%',
    gap: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FF4444',
    marginBottom: 8,
  },
  modalBody: {
    fontSize: 14,
    color: '#5C4A2A',
    textAlign: 'center',
  },
  modalLink: {
    fontSize: 13,
    color: '#FF8C42',
    textDecorationLine: 'underline',
    textAlign: 'center',
    marginBottom: 6,
  },
  modalClose: {
    marginTop: 14,
    backgroundColor: '#FF4444',
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  modalCloseText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
