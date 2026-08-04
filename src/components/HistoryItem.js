import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../utils/constants';
import { formatTimestamp } from '../utils/helpers';

export const HistoryItem = ({ item }) => {
  const isSent = item.direction === 'sent';

  return (
    <View style={[styles.container, isSent ? styles.sentContainer : styles.receivedContainer]}>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{item.artist}</Text>
      </View>
      <Text style={styles.time}>{formatTimestamp(item.timestamp)}</Text>
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
  sentContainer: {
    backgroundColor: COLORS.card,
    marginLeft: 40,
  },
  receivedContainer: {
    backgroundColor: COLORS.accent,
    marginRight: 40,
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  artist: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  time: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
