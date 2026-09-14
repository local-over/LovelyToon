import RNAndroidNotificationListener from 'react-native-android-notification-listener';
import { appwriteService } from './AppwriteService';
import { StorageService } from './StorageService';

const MEDIA_APPS = [
  'com.spotify.music',
  'com.google.android.apps.youtube.music',
  'com.apple.android.music',
  'com.amazon.mp3',
  'com.soundcloud.android',
  'deezer.android.app',
  'com.pandora.android',
  'com.aspiro.tidal',
  'com.huawei.music',
  'com.sec.android.app.music',
  'com.miui.player',
  'com.oplus.music',
  'com.heytap.music',
  'com.hhtc.music',
  'com.netease.cloudmusic',
  'com.tencent.qqmusic',
  'com.kugou.android',
  'com.kuwo.kwmusic.biz',
  'com.anghami',
  'com.jio.media.jiobeats',
  'com.bsbportal.music',
  'com.audiomack',
  'tunein.player',
  'app.podcast.cosmos',
  'fm.castbox.audiobook.radio.podcast',
  'com.stitcher.app'
];

let lastSong = { title: null, artist: null };

export const handleNotification = async (notification) => {
  if (!notification || !notification.app) return;
  
  if (MEDIA_APPS.includes(notification.app)) {
    const userId = await StorageService.getUserId();
    
    if (notification.event === 'removed') {
      try {
        await appwriteService.publishBackgroundMessage({ status: 'stopped', sender: userId });
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
      senderName: nickname,
      status: `playing|${nickname}`
    };

    try {
      await appwriteService.publishBackgroundMessage(songData);
      await StorageService.addHistoryItem({ ...songData, direction: 'sent' });
    } catch (e) {
      console.error('Failed to publish background message', e);
    }
  }
};

export const startListening = () => {
  // Registered globally in index.js via registerHeadlessTask
};
