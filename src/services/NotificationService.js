import RNAndroidNotificationListener from 'react-native-android-notification-listener';
import { mqttService } from './MqttService';
import { StorageService } from './StorageService';

const MEDIA_APPS = [
  'com.spotify.music',
  'com.google.android.apps.youtube.music',
  'com.apple.android.music',
  'com.amazon.mp3',
];

let lastSong = { title: null, artist: null };

export const handleNotification = async (notification) => {
  if (!notification || !notification.app) return;
  
  if (MEDIA_APPS.includes(notification.app)) {
    const title = notification.title || 'Unknown Title';
    const text = notification.text || 'Unknown Artist';
    
    // Deduplicate
    if (lastSong.title === title && lastSong.artist === text) {
      return;
    }
    
    lastSong = { title, artist: text };
    
    const songData = {
      title,
      artist: text,
      app: notification.app,
      timestamp: Date.now(),
      sender: 'me'
    };
    
    mqttService.publishNowPlaying(songData);
    
    // Save to history locally as sent
    await StorageService.addHistoryItem({ ...songData, direction: 'sent' });
  }
};

export const startListening = () => {
  // In a real implementation this might be registered globally in index.js
  // But here we expose a function just in case.
};
