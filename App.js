import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView, Animated, Easing, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import RNAndroidNotificationListener from 'react-native-android-notification-listener';

export default function App() {
  const [partnerSong, setPartnerSong] = useState({
    title: 'Not Listening',
    artist: 'Waiting...',
    albumArt: 'https://cdn-icons-png.flaticon.com/512/1054/1054170.png'
  });
  const [history, setHistory] = useState([
    { id: '1', title: 'Sweater Weather', artist: 'The Neighbourhood', time: '10 mins ago' },
    { id: '2', title: 'Yellow', artist: 'Coldplay', time: '1 hour ago' },
  ]);
  const [spinValue] = useState(new Animated.Value(0));

  useEffect(() => {
    // Rotate animation for the record
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Check notification listener permissions
    checkPermissions();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const checkPermissions = async () => {
    const status = await RNAndroidNotificationListener.getPermissionStatus();
    if (status !== 'authorized') {
      RNAndroidNotificationListener.requestPermission();
    }
  };

  const openDonation = () => {
    // Opening the github repo per user's donation info location
    Linking.openURL('https://github.com/local-over/fsr-engine');
  };

  return (
    <LinearGradient colors={['#FFC371', '#FF5F6D']} style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="heart" size={32} color="#fff" />
        <Text style={styles.headerTitle}>Lovely Toon</Text>
      </View>

      <View style={styles.partnerCard}>
        <Text style={styles.partnerText}>Your Partner is listening to:</Text>
        <View style={styles.recordContainer}>
          <Animated.Image 
            source={{ uri: partnerSong.albumArt }} 
            style={[styles.recordImage, { transform: [{ rotate: spin }] }]} 
          />
          <View style={styles.recordHole} />
        </View>
        <Text style={styles.songTitle}>{partnerSong.title}</Text>
        <Text style={styles.songArtist}>{partnerSong.artist}</Text>
      </View>

      <View style={styles.historySection}>
        <Text style={styles.historyTitle}>Listening History</Text>
        <ScrollView style={styles.historyList}>
          {history.map((item) => (
            <View key={item.id} style={styles.historyItem}>
              <Ionicons name="musical-notes" size={24} color="#FF5F6D" />
              <View style={styles.historyTextContainer}>
                <Text style={styles.historySong}>{item.title}</Text>
                <Text style={styles.historyArtist}>{item.artist}</Text>
              </View>
              <Text style={styles.historyTime}>{item.time}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <TouchableOpacity style={styles.donateButton} onPress={openDonation}>
        <Ionicons name="cafe" size={24} color="#FF5F6D" />
        <Text style={styles.donateText}>Support Us (Donate)</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
    fontFamily: 'sans-serif-medium',
  },
  partnerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 25,
    padding: 30,
    alignItems: 'center',
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  partnerText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
    fontWeight: '600',
  },
  recordContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 10,
  },
  recordImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    opacity: 0.8,
  },
  recordHole: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#333',
    borderWidth: 2,
    borderColor: '#555',
  },
  songTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  songArtist: {
    color: '#ffe5e5',
    fontSize: 16,
    marginTop: 5,
  },
  historySection: {
    width: '85%',
    marginTop: 30,
    flex: 1,
  },
  historyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  historyList: {
    flex: 1,
  },
  historyItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  historyTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  historySong: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  historyArtist: {
    fontSize: 14,
    color: '#666',
  },
  historyTime: {
    fontSize: 12,
    color: '#aaa',
  },
  donateButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,
    marginBottom: 30,
    elevation: 5,
  },
  donateText: {
    color: '#FF5F6D',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  }
});
