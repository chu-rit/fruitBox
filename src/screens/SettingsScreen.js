import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
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

export default function SettingsScreen({ onBack, mapSize, onChangeMapSize, bgmOn, sfxOn, onBgmToggle, onSfxToggle }) {
  const mapSizes = [5, 6, 7, 8];
  const [showCredits, setShowCredits] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => { playStartSFX(); onBack(); }}>
          <Image source={BACK_ARROW} style={{ width: 24, height: 24 }} resizeMode="contain" />
        </TouchableOpacity>
        <Text style={styles.title}>SETTINGS</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Scrollable Content */}
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer}>

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

      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
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
    backgroundColor: 'rgba(139,115,85,0.12)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FF4444',
    letterSpacing: 2,
  },
  placeholder: {
    width: 40,
  },
  settingCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B7355',
    letterSpacing: 1,
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
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sizeButtonActive: {
    backgroundColor: '#FF4444',
    borderColor: '#FF4444',
  },
  sizeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
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
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF4444',
  },
  creditsButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF4444',
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
