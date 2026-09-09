import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SongCard } from '../components/SongCard';
import { HeartBeat } from '../components/HeartBeat';
import { MusicInfoService } from '../services/MusicInfoService';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { VinylRecord } from '../components/VinylRecord';

export const HomeScreen = ({ currentSong, isConnected, partnerName }) => {
  const [songInfo, setSongInfo] = useState(null);
  const { theme } = useTheme();
  const colors = theme.colors;

  useEffect(() => {
    if (currentSong?.title) {
      MusicInfoService.fetchSongInfo(currentSong.title, currentSong.artist)
        .then(info => setSongInfo(info));
    } else {
      setSongInfo(null);
    }
  }, [currentSong]);

  const getStatusText = () => {
    if (!isConnected) return 'Connecting...';
    if (currentSong) {
      return partnerName ? `${partnerName} is listening to` : 'Now playing';
    }
    return partnerName 
      ? `Waiting for ${partnerName} to play something...` 
      : 'Waiting for your partner...';
  };

  return (
    <LinearGradient 
      colors={[colors.gradientStart + '40', colors.background]} 
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <View style={[styles.roomBadge, { backgroundColor: colors.surfaceOverlay }]}>
            <View style={[styles.statusDot, { backgroundColor: isConnected ? colors.success : '#A0AEC0' }]} />
            <Text style={[styles.headerText, { color: colors.textSecondary }]}>{isConnected ? 'Connected' : 'Disconnected'}</Text>
          </View>
          <HeartBeat connected={isConnected} />
        </View>
        
        <View style={styles.content}>
          <Text style={[styles.statusText, { color: colors.textSecondary }]}>{getStatusText()}</Text>
          
          {currentSong ? (
            <SongCard 
              title={currentSong?.title} 
              artist={currentSong?.artist} 
              app={currentSong?.app} 
              timestamp={currentSong?.timestamp}
              artwork={songInfo?.artwork}
              duration={songInfo?.duration}
            />
          ) : (
            <View style={styles.emptyState}>
              <VinylRecord isPlaying={false} />
            </View>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
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
  },
  roomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
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
  statusText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 24,
    opacity: 0.8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  }
});
