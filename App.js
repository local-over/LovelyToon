import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, StatusBar, AppState, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { HomeScreen } from './src/screens/HomeScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { TabBar } from './src/components/TabBar';
import { mqttService } from './src/services/MqttService';
import { StorageService } from './src/services/StorageService';
import { UpdateService } from './src/services/UpdateService';
import { startListening } from './src/services/NotificationService';
import { COLORS } from './src/utils/constants';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [pairingCode, setPairingCode] = useState(null);
  const [currentSong, setCurrentSong] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [partnerId, setPartnerId] = useState(null);
  const [partnerName, setPartnerName] = useState(null);
  const [inviteData, setInviteData] = useState(null); // { code, partnerUid, partnerName }

  const partnerIdRef = useRef(null);

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
    const id = await StorageService.getUserId();
    const name = await StorageService.getNickname();
    setUserId(id);
    setUserName(name || '');

    const pid = await StorageService.getPartnerId();
    const pname = await StorageService.getPartnerName();
    setPartnerId(pid);
    setPartnerName(pname);
    partnerIdRef.current = pid;

    const savedCode = await StorageService.getPairingCode();
    if (savedCode && name) {
      // Already paired — reconnect
      connectToRoom(savedCode, { userId: id, name: name || 'Me' }, pid);
    }

    // Handle deep links
    const initialUrl = await Linking.getInitialURL();
    if (initialUrl) {
      handleDeepLink({ url: initialUrl }, savedCode);
    }
    Linking.addEventListener('url', (event) => handleDeepLink(event, savedCode));

    startListening();

    const updateInfo = await UpdateService.checkForUpdates();
    if (updateInfo?.hasUpdate) {
      UpdateService.showUpdateAlert(updateInfo);
    }
  };

  const handleDeepLink = (event, existingCode) => {
    try {
      const url = new URL(event.url.replace('lovelytoon://', 'https://lovelytoon.app/'));
      const pathMatch = url.pathname.match(/pair\/([a-zA-Z0-9]+)/i);
      
      if (pathMatch && pathMatch[1]) {
        const code = pathMatch[1].toUpperCase();
        const uid = url.searchParams.get('uid');
        const name = url.searchParams.get('name');

        // If we already have a room, ignore the deep link
        if (existingCode) return;

        if (uid && name) {
          // We know who invited us — show the invite flow
          setInviteData({ code, partnerUid: uid, partnerName: decodeURIComponent(name) });
        } else {
          // Old-style link with just a code — show invite flow with generic name
          setInviteData({ code, partnerUid: null, partnerName: 'Your partner' });
        }
      }
    } catch (e) {
      console.error('Deep link parse error:', e);
    }
  };

  // ── The main connect function ──
  // Called from OnboardingScreen with (code, partnerUid, partnerName)
  const handleConnect = async (code, pUid, pName) => {
    if (!code) return;

    const id = userId || await StorageService.getUserId();
    const name = userName || await StorageService.getNickname() || 'Me';

    // Save partner if we know them from the link/QR
    if (pUid) {
      setPartnerId(pUid);
      setPartnerName(pName || 'Partner');
      partnerIdRef.current = pUid;
      await StorageService.setPartnerId(pUid);
      await StorageService.setPartnerName(pName || 'Partner');
    }

    setPairingCode(code);
    await StorageService.setPairingCode(code);
    setInviteData(null);

    connectToRoom(code, { userId: id, name }, pUid);
  };

  const connectToRoom = (code, userInfo, lockedPartnerId) => {
    mqttService.setCallbacks({
      onConnect: () => setIsConnected(true),
      onMessage: async (data) => {
        // Ignore our own messages
        if (data.sender === userInfo.userId) return;

        const currentPartner = lockedPartnerId || partnerIdRef.current;

        // If we have a locked partner, only accept their messages
        if (currentPartner && data.sender !== currentPartner) {
          return; // Ghost everyone else
        }

        // If we don't have a partner yet, auto-lock to this sender
        if (!currentPartner && data.status !== 'stopped') {
          lockedPartnerId = data.sender;
          partnerIdRef.current = data.sender;
          setPartnerId(data.sender);
          setPartnerName(data.senderName || 'Partner');
          await StorageService.setPartnerId(data.sender);
          await StorageService.setPartnerName(data.senderName || 'Partner');
        }

        if (data.status === 'stopped') {
          setCurrentSong(null);
          return;
        }

        setCurrentSong(data);
        await StorageService.addHistoryItem({ ...data, direction: 'received' });

        const settings = await StorageService.getSettings();
        if (settings.pushNotifications !== false && AppState.currentState !== 'active') {
          await Notifications.scheduleNotificationAsync({
            identifier: 'now-playing',
            content: {
              title: `${data.senderName || 'Partner'} is listening to...`,
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
      onPresence: async (presenceData) => {
        // Someone announced themselves in the room
        if (presenceData.userId === userInfo.userId) return; // That's us

        const currentPartner = partnerIdRef.current;

        // If we don't have a partner yet, auto-lock to this person
        if (!currentPartner) {
          partnerIdRef.current = presenceData.userId;
          setPartnerId(presenceData.userId);
          setPartnerName(presenceData.name || 'Partner');
          await StorageService.setPartnerId(presenceData.userId);
          await StorageService.setPartnerName(presenceData.name || 'Partner');
        }
        // If this IS our partner, update their name (they may have changed it)
        else if (currentPartner === presenceData.userId && presenceData.name) {
          setPartnerName(presenceData.name);
          await StorageService.setPartnerName(presenceData.name);
        }
      },
      onError: () => setIsConnected(false),
    });

    mqttService.connect(code, userInfo);
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

  // ── Disconnect ──
  const handleDisconnect = async () => {
    mqttService.disconnect();
    await StorageService.clearAllPairing();
    setPairingCode(null);
    setIsConnected(false);
    setCurrentSong(null);
    setPartnerId(null);
    setPartnerName(null);
    partnerIdRef.current = null;
    setInviteData(null);
  };

  const handleResetPartner = async () => {
    partnerIdRef.current = null;
    setPartnerId(null);
    setPartnerName(null);
    setCurrentSong(null);
    await StorageService.setPartnerId(null);
    await StorageService.setPartnerName(null);
  };

  // ── Render: Onboarding or Main App ──
  if (!pairingCode) {
    return (
      <SafeAreaProvider>
        <View style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
          <OnboardingScreen
            onConnect={handleConnect}
            inviteData={inviteData}
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
            pairingCode={pairingCode}
            partnerName={partnerName}
          />
        );
      case 'history':
        return <HistoryScreen />;
      case 'settings':
        return (
          <SettingsScreen
            onDisconnect={handleDisconnect}
            onResetPartner={handleResetPartner}
            partnerName={partnerName}
            pairingCode={pairingCode}
          />
        );
      default:
        return <HomeScreen />;
    }
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={styles.content}>
          {renderScreen()}
        </View>
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
});
