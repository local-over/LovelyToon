import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SIZES, SHADOWS } from '../utils/constants';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

export const SongCard = ({ title, artist, app, timestamp, artwork, duration }) => {
  const [progress, setProgress] = useState(0);
  const { theme } = useTheme();
  const colors = theme.colors;

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
      <View style={[styles.card, styles.emptyCard, { backgroundColor: colors.card + '80' }]}>
        <Ionicons name="musical-notes-outline" size={48} color={colors.textSecondary} style={{marginBottom: 16}} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Waiting for a song...</Text>
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
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={[styles.artworkContainer, { backgroundColor: colors.background }]}>
          {artwork ? (
            <Image source={{ uri: artwork }} style={styles.artwork} />
          ) : (
            <View style={[styles.artworkPlaceholder, { backgroundColor: colors.background }]}>
              <Ionicons name="musical-note" size={64} color={colors.textSecondary} />
            </View>
          )}
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>{title}</Text>
          <Text style={[styles.artist, { color: colors.textSecondary }]} numberOfLines={1}>{artist}</Text>
          {app && (
            <View style={styles.badgeContainer}>
              <Text style={[styles.appBadge, { backgroundColor: colors.accent, color: colors.primary }]}>{getAppName(app)}</Text>
            </View>
          )}
        </View>

        {/* Listening Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBarBackground, { backgroundColor: colors.background }]}>
            <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: colors.primary }]} />
          </View>
          <View style={styles.timeRow}>
            <Text style={[styles.timeText, { color: colors.textSecondary }]}>{formatTime(currentElapsedMillis)}</Text>
            <Text style={[styles.timeText, { color: colors.textSecondary }]}>{formatTime(duration)}</Text>
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
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  },
  artworkContainer: {
    width: width - 88, // 24 padding * 2 + 20 margin * 2
    height: width - 88,
    borderRadius: 16,
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
  },
  content: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  artist: {
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  appBadge: {
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
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
