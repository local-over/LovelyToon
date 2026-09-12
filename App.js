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
      let session = await appwriteService.getSession();
      if (session) {
        setUserId(session.$id);
        
        const relPartnerId = await appwriteService.getRelationship();
        if (relPartnerId) {
          setPartnerId(relPartnerId);
          await StorageService.setPartnerId(relPartnerId);
          connectToPartner(relPartnerId);
        }
      }
      
      const name = await StorageService.getNickname();
      setUserName(name || '');
      
      const pname = await StorageService.getPartnerName();
      setPartnerName(pname);

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

      const updateInfo = await UpdateService.checkForUpdates();
      if (updateInfo?.hasUpdate) {
        UpdateService.showUpdateAlert(updateInfo);
      }
    } catch (e) {
      console.error(e);
    } finally {
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
      onConnect: () => setIsConnected(true),
      onMessage: async (data) => {
        if (data.status === 'stopped') {
          setCurrentSong(null);
          return;
        }

        // We receive senderName as 'Partner' by default from service, overwrite with cached name
        const localPName = await StorageService.getPartnerName();
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
    appwriteService.disconnect();
    await appwriteService.signOut();
    await StorageService.clearAllPairing();
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
