import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SIZES, SHADOWS } from '../utils/constants';
import { formatTimestamp } from '../utils/helpers';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export const HistoryItem = ({ item }) => {
  const isSent = item.direction === 'sent';
  const { theme } = useTheme();
  const colors = theme.colors;

  const getAppIcon = (pkg) => {
    if (!pkg) return 'musical-notes';
    if (pkg.includes('spotify')) return 'logo-react'; // placeholder since spotify not in ionicons
    if (pkg.includes('youtube')) return 'logo-youtube';
    if (pkg.includes('apple')) return 'logo-apple';
    return 'musical-notes';
  };

  return (
    <View style={[
      styles.container, 
      { backgroundColor: isSent ? colors.card : (colors.accent + '60') },
      isSent ? { alignSelf: 'flex-end', marginLeft: 40 } : { alignSelf: 'flex-start', marginRight: 40 }
    ]}>
      <View style={styles.iconContainer}>
        <Ionicons name={getAppIcon(item.app)} size={20} color={colors.primary} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>{item.title}</Text>
        <Text style={[styles.artist, { color: colors.textSecondary }]} numberOfLines={1}>{item.artist}</Text>
      </View>
      <Text style={[styles.time, { color: colors.textSecondary }]}>{formatTimestamp(item.timestamp)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: SIZES.cardRadius,
    marginVertical: 6,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.card,
  },
  iconContainer: {
    marginRight: 12,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  artist: {
    fontSize: 14,
  },
  time: {
    fontSize: 12,
    fontWeight: '500',
  },
});
