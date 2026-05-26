import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
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

export default function RankingScreen({ onBack }) {
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
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>Global Top</Text>
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
  backButton: {
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
    color: '#FF8C42',
    letterSpacing: 2,
  },
  placeholder: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FFF8E7',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 5,
  },
  tabActive: {
    backgroundColor: '#FF8C42',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B7355',
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
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    color: '#333',
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
    color: '#FF8C42',
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
