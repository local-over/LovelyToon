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
    const pairingCode = await StorageService.getPairingCode();
    if (!pairingCode) return;
    
    const userId = await StorageService.getUserId();
    
    if (notification.event === 'removed') {
      try {
        await mqttService.publishBackgroundMessage(pairingCode, { status: 'stopped', sender: userId });
      } catch (e) {}
      lastSong = { title: null, artist: null };
      return;
    }

    const title = notification.title || 'Unknown Title';
    const text = notification.text || 'Unknown Artist';
    
    if (lastSong.title === title && lastSong.artist === text) {
      return;
    }
    
    lastSong = { title, artist: text };
    
    const nickname = await StorageService.getNickname() || 'Someone';

    const songData = {
      title,
      artist: text,
      app: notification.app,
      timestamp: Date.now(),
      sender: userId,
      senderName: nickname
    };

    try {
      await mqttService.publishBackgroundMessage(pairingCode, songData);
      await StorageService.addHistoryItem({ ...songData, direction: 'sent' });
    } catch (e) {
      console.error('Failed to publish background message', e);
    }
  }
};

export const startListening = () => {
  // Registered globally in index.js via registerHeadlessTask
};
