import React, { useState } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Dimensions,
  Image,
  Modal,
  Linking,
  ScrollView,
} from 'react-native';
import { playStartSFX } from '../services/sfxService';

const BACK_ARROW = require('../assets/img/back_arrow.png');

const { width, height } = Dimensions.get('window');
const BG_BOT = require('../assets/img/BG_BOT.png');

export default function SettingsScreen({ onBack, mapSize, onChangeMapSize, bgmOn, sfxOn, onBgmToggle, onSfxToggle }) {
  const mapSizes = [5, 6, 7, 8];
  const [showCredits, setShowCredits] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Image source={BG_BOT} style={{ position: 'absolute', top: 0, left: 0, width, height: height + insets.top + insets.bottom }} resizeMode="stretch" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => { playStartSFX(); onBack(); }}>
          <Image source={BACK_ARROW} style={{ width: 24, height: 24 }} resizeMode="contain" />
        </TouchableOpacity>
        <Text style={styles.title}>SETTINGS</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Scrollable Content */}
      <ScrollView style={styles.scrollContent} contentContainerStyle={[styles.scrollContentContainer, { paddingBottom: 100 + insets.bottom }]}>

      {/* Map Size Setting */}
      <View style={styles.settingCard}>
        <Text style={styles.settingLabel}>MAP SIZE</Text>
        <Text style={styles.settingDescription}>
          Select grid size for the game board
        </Text>
        
        <View style={styles.sizeOptions}>
          {mapSizes.map((size) => (
            <TouchableOpacity
              key={size}
              style={[
                styles.sizeButton,
                mapSize === size && styles.sizeButtonActive,
              ]}
              onPress={() => onChangeMapSize(size)}
            >
              <Text
                style={[
                  styles.sizeButtonText,
                  mapSize === size && styles.sizeButtonTextActive,
                ]}
              >
                {size} × {size}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Preview */}
        <View style={styles.previewContainer}>
          <Text style={styles.previewLabel}>Preview:</Text>
          <View style={styles.previewGrid}>
            {Array(mapSize).fill(null).map((_, row) => (
              <View key={row} style={styles.previewRow}>
                {Array(mapSize).fill(null).map((_, col) => (
                  <View key={col} style={styles.previewCell} />
                ))}
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Sound Settings */}
      <View style={styles.settingCard}>
        <Text style={styles.settingLabel}>SOUND</Text>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Background Music</Text>
          <Switch
            value={bgmOn}
            onValueChange={onBgmToggle}
            trackColor={{ false: '#DDD', true: '#FF4444' }}
            thumbColor={'#FFF'}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Sound Effects</Text>
          <Switch
            value={sfxOn}
            onValueChange={onSfxToggle}
            trackColor={{ false: '#DDD', true: '#FF4444' }}
            thumbColor={'#FFF'}
          />
        </View>
      </View>

      {/* Credits Button */}
      <TouchableOpacity style={styles.creditsButton} onPress={() => setShowCredits(true)}>
        <Text style={styles.creditsButtonText}>Credits</Text>
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

      {/* Version */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>v1.0.8</Text>
      </View>

      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139,94,60,0.2)',
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#6B3E1E',
    letterSpacing: 3,
    textShadowColor: 'rgba(255,255,255,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  placeholder: {
    width: 40,
  },
  settingCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(139,94,60,0.15)',
    shadowColor: '#8B5A3C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: '#6B3E1E',
    letterSpacing: 2,
    marginBottom: 8,
  },
  settingDescription: {
    fontSize: 14,
    color: '#999',
    marginBottom: 20,
  },
  sizeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  sizeButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(139,94,60,0.2)',
  },
  sizeButtonActive: {
    backgroundColor: '#FF8C42',
    borderColor: '#FF8C42',
  },
  sizeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B3E1E',
  },
  sizeButtonTextActive: {
    color: '#FFF',
  },
  previewContainer: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  previewLabel: {
    fontSize: 14,
    color: '#8B7355',
    marginBottom: 12,
  },
  previewGrid: {
    backgroundColor: '#FFF8E7',
    padding: 8,
    borderRadius: 8,
  },
  previewRow: {
    flexDirection: 'row',
  },
  previewCell: {
    width: 16,
    height: 16,
    backgroundColor: '#FF6B6B',
    margin: 2,
    borderRadius: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  toggleLabel: {
    fontSize: 15,
    color: '#5C4A2A',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 8,
  },
  creditsButton: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(139,94,60,0.25)',
  },
  creditsButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B3E1E',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 100,
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
    color: '#6B3E1E',
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
    backgroundColor: '#FF8C42',
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  modalCloseText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 12,
    color: '#6B3E1E',
    fontWeight: '700',
    opacity: 0.6,
  },
});
