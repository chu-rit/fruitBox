import React, { useState } from 'react';
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

const FRUIT_IMAGES = {
  apple: require('../assets/img/apple.png'),
  orange: require('../assets/img/orange.png'),
  grape: require('../assets/img/grape.png'),
  pear: require('../assets/img/pear.png'),
  watermelon: require('../assets/img/watermelon.png'),
  strawberry: require('../assets/img/strawberry.png'),
  peach: require('../assets/img/peach.png'),
  pineapple: require('../assets/img/pineapple.png'),
};

const LOGO_IMAGE = require('../assets/img/FruitBoxLogo.png');

const BG_FRUITS = [
  { fruit: 'apple',      size: 55, top: height*0.04,  left: width*0.05,  rotate: '-15deg', opacity: 0.18 },
  { fruit: 'orange',     size: 48, top: height*0.07,  right: width*0.06, rotate: '20deg',  opacity: 0.18 },
  { fruit: 'grape',      size: 52, top: height*0.17,  left: width*0.72,  rotate: '-8deg',  opacity: 0.15 },
  { fruit: 'strawberry', size: 44, top: height*0.25,  left: width*0.03,  rotate: '12deg',  opacity: 0.18 },
  { fruit: 'pear',       size: 50, top: height*0.38,  right: width*0.04, rotate: '-20deg', opacity: 0.15 },
  { fruit: 'watermelon', size: 60, top: height*0.55,  left: width*0.05,  rotate: '8deg',   opacity: 0.15 },
  { fruit: 'peach',      size: 46, top: height*0.62,  right: width*0.07, rotate: '15deg',  opacity: 0.18 },
  { fruit: 'pineapple',  size: 56, top: height*0.72,  left: width*0.68,  rotate: '-10deg', opacity: 0.13 },
  { fruit: 'apple',      size: 42, top: height*0.80,  left: width*0.07,  rotate: '25deg',  opacity: 0.13 },
  { fruit: 'orange',     size: 50, top: height*0.85,  right: width*0.10, rotate: '-5deg',  opacity: 0.15 },
];

export default function StartScreen({ onStart, onSettings, onRanking, onLogoPress, gameMode = 'apple' }) {
  const isFruitMode = gameMode === 'fruit';
  const [showCredits, setShowCredits] = useState(false);

  return (
    <View style={[styles.container, isFruitMode && styles.containerFruit]}>

      {/* Background fruit icons */}
      {BG_FRUITS.map(({ fruit, size, top, left, right, rotate, opacity }, i) => (
        <Image
          key={i}
          source={FRUIT_IMAGES[fruit]}
          pointerEvents="none"
          style={[styles.bgFruit, { width: size, height: size, top, left, right, opacity, transform: [{ rotate }] }]}
          resizeMode="contain"
        />
      ))}

      {/* Title Section */}
      <View style={styles.titleContainer}>
        <TouchableOpacity style={styles.iconBox} onPress={onLogoPress} activeOpacity={0.8}>
          <Image source={FRUIT_IMAGES.apple} style={{ width: 72, height: 72 }} resizeMode="contain" />
        </TouchableOpacity>
        <Image source={LOGO_IMAGE} style={{ width: 280, height: 132 }} resizeMode="contain" />
        <Text style={styles.subtitle}>{isFruitMode ? 'Mix & Match' : 'Collect & Stack'}</Text>
        <View style={styles.fruitRow}>
          <Image source={FRUIT_IMAGES.orange} style={{ width: 28, height: 28 }} resizeMode="contain" />
          <Image source={FRUIT_IMAGES.grape} style={{ width: 28, height: 28 }} resizeMode="contain" />
          <Image source={FRUIT_IMAGES.strawberry} style={{ width: 28, height: 28 }} resizeMode="contain" />
          <Image source={FRUIT_IMAGES.pear} style={{ width: 28, height: 28 }} resizeMode="contain" />
          <Image source={FRUIT_IMAGES.watermelon} style={{ width: 28, height: 28 }} resizeMode="contain" />
        </View>
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

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.version}>v1.0.5</Text>
        <TouchableOpacity onPress={() => setShowCredits(true)} style={styles.creditsBtn}>
          <Text style={styles.creditsText}>Credits</Text>
        </TouchableOpacity>
      </View>

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
  bgFruit: {
    position: 'absolute',
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: height * 0.08,
  },
  iconBox: {
    width: 110,
    height: 110,
    backgroundColor: '#FFF',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#8B7355',
    letterSpacing: 2,
    marginBottom: 14,
  },
  fruitRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    opacity: 0.75,
  },
  menuContainer: {
    paddingHorizontal: 40,
    paddingBottom: height * 0.13,
    gap: 14,
  },
  button: {
    backgroundColor: '#FF4444',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#FF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonFruit: {
    backgroundColor: '#FF8C42',
    shadowColor: '#FF8C42',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  buttonSecondary: {
    backgroundColor: '#FFF',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF4444',
  },
  buttonSecondaryFruit: {
    borderColor: '#FF8C42',
  },
  buttonSecondaryText: {
    color: '#FF4444',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  buttonSecondaryTextFruit: {
    color: '#FF8C42',
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  version: {
    fontSize: 12,
    color: '#8B7355',
    opacity: 0.5,
  },
  creditsBtn: {
    marginTop: 6,
  },
  creditsText: {
    fontSize: 12,
    color: '#8B7355',
    opacity: 0.6,
    textDecorationLine: 'underline',
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
