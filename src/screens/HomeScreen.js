import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SongCard } from '../components/SongCard';
import { HeartBeat } from '../components/HeartBeat';
import { MusicInfoService } from '../services/MusicInfoService';
import { COLORS } from '../utils/constants';

export const HomeScreen = ({ currentSong, isConnected, pairingCode }) => {
  const [songInfo, setSongInfo] = useState(null);

  useEffect(() => {
    if (currentSong?.title) {
      MusicInfoService.fetchSongInfo(currentSong.title, currentSong.artist)
        .then(info => setSongInfo(info));
    } else {
      setSongInfo(null);
    }
  }, [currentSong]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.roomBadge}>
          <View style={[styles.statusDot, { backgroundColor: isConnected ? '#48BB78' : '#A0AEC0' }]} />
          <Text style={styles.headerText}>Room: {pairingCode}</Text>
        </View>
        <HeartBeat connected={isConnected} />
      </View>
      
      <View style={styles.content}>
        
        <Text style={styles.statusText}>
          {isConnected 
            ? (currentSong ? "They're listening to..." : "Connected! Waiting for music...")
            : "Waiting for partner to connect..."}
        </Text>
        
        <SongCard 
          title={currentSong?.title} 
          artist={currentSong?.artist} 
          app={currentSong?.app} 
          timestamp={currentSong?.timestamp}
          artwork={songInfo?.artwork}
          duration={songInfo?.duration}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  roomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  spacer: {
    height: 40,
  },
  statusText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
  },
});
