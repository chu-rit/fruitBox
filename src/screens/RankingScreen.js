import React, { useState, useEffect } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { getRankings, getWeeklyRankings } from '../services/rankingService';

const BACK_ARROW = require('../assets/img/back_arrow.png');

const { width, height } = Dimensions.get('window');
const BG_BOT = require('../assets/img/BG_BOT.png');

export default function RankingScreen({ onBack }) {
  const insets = useSafeAreaInsets();
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('weekly'); // 'all' or 'weekly'

  useEffect(() => {
    loadRankings();
  }, [activeTab]);

  const loadRankings = async () => {
    setLoading(true);
    const result = activeTab === 'all' 
      ? await getRankings(50)
      : await getWeeklyRankings(50);
    if (result.success) {
      setRankings(result.rankings);
    }
    setLoading(false);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ko-KR');
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Image source={BG_BOT} style={{ position: 'absolute', top: 0, left: 0, width, height: height + insets.top + insets.bottom }} resizeMode="stretch" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Image source={BACK_ARROW} style={{ width: 24, height: 24 }} resizeMode="contain" />
        </TouchableOpacity>
        <Text style={styles.title}>RANKING</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'weekly' && styles.tabActive]}
          onPress={() => setActiveTab('weekly')}
        >
          <Text style={[styles.tabText, activeTab === 'weekly' && styles.tabTextActive]}>Weekly Top</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.tabActive]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>AllTime Top</Text>
        </TouchableOpacity>
      </View>

      {/* Rankings List */}
      {loading ? (
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#FF8C42" />
        </View>
      ) : rankings.length === 0 ? (
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🏆</Text>
          </View>
          <Text style={styles.message}>No rankings yet</Text>
          <Text style={styles.subMessage}>
            Be the first to set a record!
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer}>
          {rankings.map((item, index) => (
            <View key={item.id} style={styles.rankItem}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankBadgeText}>{getRankBadge(index + 1)}</Text>
              </View>
              <View style={styles.rankInfo}>
                <Text style={styles.rankName}>{item.name}</Text>
                <Text style={styles.rankDate}>{formatDate(item.createdAt)}</Text>
              </View>
              <View style={styles.rankScoreBox}>
                <Text style={styles.rankScore}>{item.score}</Text>
                <Text style={styles.rankLevel}>Lv.{item.level}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.version}>v1.0.0</Text>
      </View>
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
    zIndex: 1,
  },
  backButton: {
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'transparent',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(139,94,60,0.2)',
  },
  tabActive: {
    backgroundColor: '#FF8C42',
    borderColor: '#FF8C42',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6B3E1E',
  },
  tabTextActive: {
    color: '#FFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    backgroundColor: '#FFF',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  icon: {
    fontSize: 60,
  },
  message: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  subMessage: {
    fontSize: 16,
    color: '#8B7355',
    textAlign: 'center',
    lineHeight: 24,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  rankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(139,94,60,0.15)',
    shadowColor: '#8B5A3C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  rankBadge: {
    width: 50,
    alignItems: 'center',
  },
  rankBadgeText: {
    fontSize: 20,
    fontWeight: '900',
  },
  rankInfo: {
    flex: 1,
    marginLeft: 12,
  },
  rankName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4A2C0A',
    marginBottom: 4,
  },
  rankDate: {
    fontSize: 12,
    color: '#8B7355',
  },
  rankScoreBox: {
    alignItems: 'flex-end',
  },
  rankScore: {
    fontSize: 20,
    fontWeight: '900',
    color: '#D2691E',
  },
  rankLevel: {
    fontSize: 12,
    color: '#8B7355',
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  version: {
    fontSize: 12,
    color: '#8B7355',
    opacity: 0.6,
  },
});
