import React, { useState, useEffect } from 'react';
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
  const [deviceId, setDeviceId] = useState('');

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
    const id = await StorageService.getDeviceId();
    setDeviceId(id);
    
    const savedCode = await StorageService.getPairingCode();
    if (savedCode) {
      handleConnect(savedCode, id);
    }
    
    // Handle deep links
    const initialUrl = await Linking.getInitialURL();
    if (initialUrl) {
      handleDeepLink({ url: initialUrl });
    }
    Linking.addEventListener('url', handleDeepLink);
    
    startListening();

    const updateInfo = await UpdateService.checkForUpdates();
    if (updateInfo?.hasUpdate) {
      UpdateService.showUpdateAlert(updateInfo);
    }
  };

  const handleDeepLink = (event) => {
    const data = Linking.parse(event.url);
    if (data.path && data.path.startsWith('pair/')) {
      const code = data.path.replace('pair/', '');
      if (code) {
        handleConnect(code, deviceId);
      }
    }
  };

  const handleConnect = async (code, id = deviceId) => {
    if (!code) return;
    
    setPairingCode(code);
    await StorageService.setPairingCode(code);
    
    mqttService.setCallbacks({
      onConnect: () => setIsConnected(true),
      onMessage: async (data) => {
        if (data.sender !== id) {
          setCurrentSong(data);
          await StorageService.addHistoryItem({ ...data, direction: 'received' });
          
          const settings = await StorageService.getSettings();
          if (settings.pushNotifications !== false && AppState.currentState !== 'active') {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: `${data.senderName || 'Your partner'} is listening to...`,
                body: `${data.title} • ${data.artist}`,
              },
              trigger: null,
            });
          }
          
          if (Platform.OS === 'android') {
            const { updateWidget } = require('./src/widget/WidgetTaskHandler');
            await updateWidget();
          }
        }
      },
      onError: () => setIsConnected(false),
    });
    
    mqttService.connect(code);
  };

  const handleDisconnect = async () => {
    await StorageService.setPairingCode('');
    setPairingCode(null);
    setIsConnected(false);
    setCurrentSong(null);
    if (mqttService.client) {
      mqttService.client.end();
    }
  };

  if (!pairingCode) {
    return (
      <SafeAreaProvider>
        <View style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
          <OnboardingScreen onConnect={(code) => handleConnect(code, deviceId)} />
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
          />
        );
      case 'history':
        return <HistoryScreen />;
      case 'settings':
        return <SettingsScreen onDisconnect={handleDisconnect} />;
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
