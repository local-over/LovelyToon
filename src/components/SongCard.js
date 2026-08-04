import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../utils/constants';

const { width } = Dimensions.get('window');

export const SongCard = ({ title, artist, app, timestamp, artwork, duration }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval;
    if (timestamp && duration) {
      interval = setInterval(() => {
        const now = Date.now();
        const elapsed = now - timestamp;
        let p = elapsed / duration;
        if (p > 1) p = 1; // Cap at 100%
        setProgress(p);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timestamp, duration]);

  if (!title) {
    return (
      <View style={[styles.card, styles.emptyCard]}>
        <Ionicons name="musical-notes-outline" size={48} color={COLORS.textSecondary} style={{marginBottom: 16}} />
        <Text style={styles.emptyText}>Waiting for a song...</Text>
      </View>
    );
  }

  const handlePress = () => {
    const query = encodeURIComponent(`${title} ${artist}`);
    let url = `https://open.spotify.com/search/${query}`; // Default fallback
    
    if (app) {
      if (app.includes('youtube')) {
        url = `https://music.youtube.com/search?q=${query}`;
      } else if (app.includes('apple')) {
        url = `https://music.apple.com/search?term=${query}`;
      } else if (app.includes('amazon')) {
        url = `https://music.amazon.com/search/${query}`;
      }
    }
    Linking.openURL(url).catch(() => {});
  };

  const formatTime = (millis) => {
    if (!millis) return "0:00";
    const totalSeconds = Math.floor(millis / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentElapsedMillis = progress * (duration || 0);

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={handlePress}>
      <View style={styles.card}>
        <View style={styles.artworkContainer}>
          {artwork ? (
            <Image source={{ uri: artwork }} style={styles.artwork} />
          ) : (
            <View style={styles.artworkPlaceholder}>
              <Ionicons name="musical-note" size={64} color={COLORS.textSecondary} />
            </View>
          )}
        </View>

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.artist} numberOfLines={1}>{artist}</Text>
          {app && (
            <View style={styles.badgeContainer}>
              <Text style={styles.appBadge}>{getAppName(app)}</Text>
            </View>
          )}
        </View>

        {/* Listening Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(currentElapsedMillis)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
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
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 24,
    marginVertical: 10,
    ...SHADOWS.card,
    alignItems: 'center',
  },
  emptyCard: {
    minHeight: 300,
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  artworkContainer: {
    width: width - 88, // 24 padding * 2 + 20 margin * 2
    height: width - 88,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    marginBottom: 20,
    ...SHADOWS.card,
    overflow: 'hidden',
  },
  artwork: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  artworkPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  content: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  artist: {
    fontSize: 18,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  appBadge: {
    backgroundColor: COLORS.accent,
    color: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: SIZES.pillRadius,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
  },
  progressContainer: {
    width: '100%',
    paddingHorizontal: 8,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});
