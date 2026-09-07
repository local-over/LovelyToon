import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SongCard } from '../components/SongCard';
import { HeartBeat } from '../components/HeartBeat';
import { MusicInfoService } from '../services/MusicInfoService';
import { useTheme } from '../context/ThemeContext';

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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={[styles.roomBadge, { backgroundColor: colors.accent + '80' }]}>
          <View style={[styles.statusDot, { backgroundColor: isConnected ? colors.success : '#A0AEC0' }]} />
          <Text style={[styles.headerText, { color: colors.textSecondary }]}>{isConnected ? 'Connected' : 'Disconnected'}</Text>
        </View>
        <HeartBeat connected={isConnected} />
      </View>
      
      <View style={styles.content}>
        <Text style={[styles.statusText, { color: colors.textSecondary }]}>{getStatusText()}</Text>
        
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
    marginBottom: 16,
  },
});
