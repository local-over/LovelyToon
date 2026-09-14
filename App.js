import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, StatusBar, AppState, Platform, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from './src/screens/HomeScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { TabBar } from './src/components/TabBar';
import { appwriteService } from './src/services/AppwriteService';
import { StorageService } from './src/services/StorageService';
import { UpdateService } from './src/services/UpdateService';
import { startListening } from './src/services/NotificationService';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

function AppContent() {
  const { theme, themeId } = useTheme();
  const [activeTab, setActiveTab] = useState('home');
  const [currentSong, setCurrentSong] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [partnerId, setPartnerId] = useState(null);
  const [partnerName, setPartnerName] = useState(null);
  const [inviteData, setInviteData] = useState(null); // { code, partnerName }
  const [isLoading, setIsLoading] = useState(true);
  
  const partnerIdRef = useRef(null);
  
  // Keep ref in sync
  useEffect(() => {
    partnerIdRef.current = partnerId;
  }, [partnerId]);

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    initApp();
  }, []);

  const initApp = async () => {
    setIsLoading(true);
    try {
      // 1. Load from cache instantly
      const storedUserId = await StorageService.getUserId();
      const storedPartnerId = await StorageService.getPartnerId();
      const name = await StorageService.getNickname();
      const pname = await StorageService.getPartnerName();

      setUserId(storedUserId || '');
      setUserName(name || '');
      
      if (storedPartnerId) {
        setPartnerId(storedPartnerId);
        setPartnerName(pname);
        connectToPartner(storedPartnerId);
      }

      // Handle deep links
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        handleDeepLink({ url: initialUrl });
      }
      Linking.addEventListener('url', handleDeepLink);

      startListening();

      if (Platform.OS === 'android') {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          await Notifications.requestPermissionsAsync();
        }
      }

      UpdateService.checkForUpdates().then(updateInfo => {
        if (updateInfo?.hasUpdate) {
          UpdateService.showUpdateAlert(updateInfo);
        }
      }).catch(() => {});

      setIsLoading(false); // Render UI immediately from cache

      // 2. Sync with cloud in background
      appwriteService.getSession().then(async (session) => {
        if (session) {
          if (!storedUserId || storedUserId !== session.$id) {
            setUserId(session.$id);
            await StorageService.setUserId(session.$id);
          }
          
          const relPartnerId = await appwriteService.getRelationship();
          if (relPartnerId && relPartnerId !== storedPartnerId) {
            setPartnerId(relPartnerId);
            await StorageService.setPartnerId(relPartnerId);
            connectToPartner(relPartnerId);
          }
        }
      }).catch(() => {});
      
    } catch (e) {
      console.error(e);
      setIsLoading(false);
    }
  };

  const handleDeepLink = (event) => {
    try {
      const url = new URL(event.url.replace('lovelytoon://', 'https://lovelytoon.app/'));
      const pathMatch = url.pathname.match(/pair\/([a-zA-Z0-9]+)/i);
      
      let code = null;
      if (pathMatch && pathMatch[1]) code = pathMatch[1].toUpperCase();
      else if (url.searchParams.get('pair')) code = url.searchParams.get('pair').toUpperCase();

      if (code) {
        const name = url.searchParams.get('name');
        
        // If we already have a partner, ignore
        if (partnerIdRef.current) return;

        setInviteData({ code, partnerName: name ? decodeURIComponent(name) : 'Your partner' });
      }
    } catch (e) {
      console.error('Deep link parse error:', e);
    }
  };

  const handlePaired = async (pId, pName) => {
    const oldPartnerId = await StorageService.getPartnerId();
    
    const finalizePairing = async () => {
      setPartnerId(pId);
      setPartnerName(pName || 'Partner');
      await StorageService.setPartnerId(pId);
      await StorageService.setPartnerName(pName || 'Partner');
      setInviteData(null);
      connectToPartner(pId);
    };

    if (oldPartnerId && oldPartnerId !== pId) {
      Alert.alert(
        'New Partner Detected',
        'Are you pairing with a new partner or relinking with the same person?',
        [
          {
            text: 'Relinking (Keep History)',
            onPress: () => finalizePairing(),
            style: 'cancel',
          },
          {
            text: 'New Partner (Clear History)',
            onPress: async () => {
              await StorageService.clearHistory();
              finalizePairing();
            },
            style: 'destructive',
          },
        ],
        { cancelable: false }
      );
    } else {
      finalizePairing();
    }
  };

  const connectToPartner = (pId) => {
    appwriteService.setCallbacks({
      onConnect: async () => {
        setIsConnected(true);
        // Handshake: Tell partner we connected and send our name
        const myName = await StorageService.getNickname() || 'Someone';
        try {
          await appwriteService.publishBackgroundMessage({ status: `connected|${myName}` });
        } catch(e) {}
      },
      onMessage: async (data) => {
        let partnerNameFromStatus = null;
        let actualStatus = data.status;
        
        if (data.status && data.status.includes('|')) {
          const parts = data.status.split('|');
          actualStatus = parts[0];
          partnerNameFromStatus = parts[1];
        }

        if (actualStatus === 'stopped') {
          setCurrentSong(null);
          return;
        }

        let localPName = await StorageService.getPartnerName();
        if (partnerNameFromStatus && partnerNameFromStatus !== 'Partner' && partnerNameFromStatus !== localPName) {
           localPName = partnerNameFromStatus;
           await StorageService.setPartnerName(partnerNameFromStatus);
           setPartnerName(partnerNameFromStatus);
        }

        if (actualStatus === 'connected') {
          // Just a handshake, no song data
          return;
        }

        data.senderName = localPName || 'Partner';
        
        setCurrentSong(data);
        await StorageService.addHistoryItem({ ...data, direction: 'received' });

        const settings = await StorageService.getSettings();
        if (settings.pushNotifications !== false && AppState.currentState !== 'active') {
          await Notifications.scheduleNotificationAsync({
            identifier: 'now-playing',
            content: {
              title: `${data.senderName} is listening to...`,
              body: `${data.title} — ${data.artist}`,
              categoryIdentifier: 'music-actions',
              data: { ...data },
            },
            trigger: null,
          });
        }

        if (Platform.OS === 'android') {
          try {
            const { updateWidget } = require('./src/widget/WidgetTaskHandler');
            await updateWidget();
          } catch (e) {}
        }
      },
      onError: () => setIsConnected(false),
    });

    appwriteService.connectToPartner(pId);

    // Polling fallback for Huawei/Android background killers
    if (window.nowPlayingInterval) clearInterval(window.nowPlayingInterval);
    let lastPolledTimestamp = null;
    
    window.nowPlayingInterval = setInterval(async () => {
      try {
        const data = await appwriteService.getNowPlaying(pId);
        if (data && data.timestamp && data.timestamp !== lastPolledTimestamp) {
          lastPolledTimestamp = data.timestamp;
          const callbacks = appwriteService.callbacks;
          if (callbacks && callbacks.onMessage) {
            callbacks.onMessage(data);
          }
        }
      } catch(e) {}
    }, 5000);
  };

  // ── Notification action handling ──
  useEffect(() => {
    if (Platform.OS !== 'web') {
      Notifications.setNotificationCategoryAsync('music-actions', [
        {
          identifier: 'like',
          buttonTitle: '❤️ Like',
          options: { opensAppToForeground: false }
        },
        {
          identifier: 'listen',
          buttonTitle: '🎧 Listen',
          options: { opensAppToForeground: true }
        }
      ]).catch(() => {});
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const action = response.actionIdentifier;
      const data = response.notification.request.content.data;

      if (action === 'listen') {
        const query = encodeURIComponent(`${data.title} ${data.artist}`);
        Linking.openURL(`https://open.spotify.com/search/${query}`).catch(() => {});
      }
    });

    return () => subscription.remove();
  }, []);

  // ── Disconnect / Logout ──
  const handleDisconnect = async () => {
    if (window.nowPlayingInterval) clearInterval(window.nowPlayingInterval);
    appwriteService.disconnect();
    await appwriteService.signOut();
    await StorageService.clearAllPairing();
    await StorageService.setUserId(null);
    setIsConnected(false);
    setCurrentSong(null);
    setUserId('');
    setPartnerId(null);
    setPartnerName(null);
    setInviteData(null);
  };

  // ── Render ──
  const isDarkTheme = themeId === 'midnight' || themeId === 'ocean';
  const statusBarStyle = isDarkTheme ? 'light-content' : 'dark-content';

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle={statusBarStyle} backgroundColor={theme.colors.background} />
        <Ionicons name="headset" size={64} color={theme.colors.primary} />
      </View>
    );
  }

  if (!partnerId) {
    return (
      <SafeAreaProvider>
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <StatusBar barStyle={statusBarStyle} backgroundColor={theme.colors.background} />
          <OnboardingScreen
            onPaired={handlePaired}
            inviteData={inviteData}
            initialUserId={userId}
          />
        </View>
      </SafeAreaProvider>
    );
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeScreen
            currentSong={currentSong}
            isConnected={isConnected}
            partnerName={partnerName}
          />
        );
      case 'history':
        return <HistoryScreen />;
      case 'settings':
        return (
          <SettingsScreen
            onDisconnect={handleDisconnect}
            partnerName={partnerName}
          />
        );
      default:
        return <HomeScreen />;
    }
  };

  return (
    <SafeAreaProvider>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle={statusBarStyle} backgroundColor={theme.colors.background} />
        <View style={styles.content}>
          {renderScreen()}
        </View>
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      </View>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
