import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { HomeScreen } from './src/screens/HomeScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { PairingScreen } from './src/screens/PairingScreen';
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

  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    const savedCode = await StorageService.getPairingCode();
    if (savedCode) {
      handleConnect(savedCode);
    }
    
    startListening();

    const updateInfo = await UpdateService.checkForUpdates();
    if (updateInfo?.hasUpdate) {
      UpdateService.showUpdateAlert(updateInfo);
    }
  };

  const handleConnect = async (code) => {
    if (!code) return;
    
    setPairingCode(code);
    await StorageService.setPairingCode(code);
    
    mqttService.setCallbacks({
      onConnect: () => setIsConnected(true),
      onMessage: async (data) => {
        if (data.sender !== 'me') {
          setCurrentSong(data);
          await StorageService.addHistoryItem({ ...data, direction: 'received' });
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
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <PairingScreen onConnect={handleConnect} />
      </View>
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
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.content}>
        {renderScreen()}
      </View>
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </View>
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
