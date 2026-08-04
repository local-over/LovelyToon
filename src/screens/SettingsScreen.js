import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Linking, Alert, Switch, Clipboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../utils/constants';
import { StorageService } from '../services/StorageService';

export const SettingsScreen = ({ onDisconnect }) => {
  const [pushEnabled, setPushEnabled] = useState(true);
  
  useEffect(() => {
    StorageService.getSettings().then(settings => {
      if (settings && settings.pushNotifications !== undefined) {
        setPushEnabled(settings.pushNotifications);
      }
    });
  }, []);

  const togglePush = async (value) => {
    setPushEnabled(value);
    const settings = await StorageService.getSettings();
    await StorageService.setSettings({ ...settings, pushNotifications: value });
  };

  const openBatterySettings = () => {
    Linking.openSettings().catch(() => {
      Alert.alert('Notice', 'Please open Settings and allow background activity for this app.');
    });
  };

  const copyUSDT = () => {
    Clipboard.setString('0x1234567890abcdef1234567890abcdef12345678'); // REPLACE WITH REAL USDT
    Alert.alert('Copied!', 'USDT Address copied to clipboard.');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.sectionTitle}>Push Notifications</Text>
            <Switch 
              value={pushEnabled} 
              onValueChange={togglePush} 
              trackColor={{ false: COLORS.textSecondary, true: COLORS.primary }}
              thumbColor={COLORS.card}
            />
          </View>
          <Text style={styles.description}>
            Get pinged when your partner starts a new song.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Battery Optimization</Text>
          <Text style={styles.description}>
            To keep sharing music while the app is closed, please disable battery optimization.
          </Text>
          <TouchableOpacity style={styles.button} onPress={openBatterySettings}>
            <Text style={styles.buttonText}>Open Settings</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Support the App</Text>
          <Text style={styles.description}>
            If you love using this app, consider sending a coffee via USDT (TRC20 or ERC20) ☕
          </Text>
          <TouchableOpacity style={[styles.button, styles.donateButton]} onPress={copyUSDT}>
            <Ionicons name="copy-outline" size={20} color={COLORS.card} style={{ marginRight: 8 }} />
            <Text style={styles.donateButtonText}>Copy USDT Address</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Connection</Text>
          <TouchableOpacity style={[styles.button, styles.disconnectButton]} onPress={onDisconnect}>
            <Text style={styles.disconnectButtonText}>Disconnect Partner</Text>
          </TouchableOpacity>
        </View>
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
    padding: 24,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.cardRadius,
    padding: SIZES.padding,
    marginBottom: 20,
    ...SHADOWS.card,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  button: {
    backgroundColor: COLORS.accent,
    borderRadius: SIZES.pillRadius,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonText: {
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontSize: 16,
  },
  donateButton: {
    backgroundColor: COLORS.partnerAccent,
  },
  donateButtonText: {
    color: COLORS.card,
    fontWeight: '600',
    fontSize: 16,
  },
  disconnectButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.heartRed,
  },
  disconnectButtonText: {
    color: COLORS.heartRed,
    fontWeight: '600',
    fontSize: 16,
  },
});
