import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, Text } from 'react-native';
import { VinylRecord } from '../components/VinylRecord';
import { SongCard } from '../components/SongCard';
import { HeartBeat } from '../components/HeartBeat';
import { COLORS } from '../utils/constants';

export const HomeScreen = ({ currentSong, isConnected, pairingCode }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Room: {pairingCode}</Text>
        <HeartBeat connected={isConnected} />
      </View>
      
      <View style={styles.content}>
        <VinylRecord isPlaying={!!currentSong} />
        
        <View style={styles.spacer} />
        
        <Text style={styles.statusText}>
          {currentSong ? "They're listening to..." : "Waiting for them to play something..."}
        </Text>
        
        <SongCard 
          title={currentSong?.title} 
          artist={currentSong?.artist} 
          app={currentSong?.app} 
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
    backgroundColor: COLORS.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
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
