import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../utils/constants';

export const SongCard = ({ title, artist, app }) => {
  if (!title) {
    return (
      <View style={[styles.card, styles.emptyCard]}>
        <Text style={styles.emptyText}>Waiting for a song... 🎵</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{artist}</Text>
        {app && <Text style={styles.appBadge}>{getAppName(app)}</Text>}
      </View>
    </View>
  );
};

const getAppName = (pkg) => {
  if (pkg.includes('spotify')) return 'Spotify';
  if (pkg.includes('youtube')) return 'YouTube Music';
  if (pkg.includes('apple')) return 'Apple Music';
  if (pkg.includes('amazon')) return 'Amazon Music';
  return 'Music Player';
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.cardRadius,
    padding: SIZES.padding,
    marginHorizontal: 20,
    marginVertical: 10,
    ...SHADOWS.card,
    minHeight: 120,
    justifyContent: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  artist: {
    fontSize: 18,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '400',
    marginBottom: 12,
  },
  appBadge: {
    backgroundColor: COLORS.accent,
    color: COLORS.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: SIZES.pillRadius,
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden',
  },
});
