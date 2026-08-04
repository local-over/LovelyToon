import React from 'react';
import { View, StyleSheet, SafeAreaView, Text, TouchableOpacity, Linking, Alert } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../utils/constants';

export const SettingsScreen = ({ onDisconnect }) => {
  const openBatterySettings = () => {
    // Attempting to open battery settings for android
    Linking.openSettings().catch(() => {
      Alert.alert('Notice', 'Please open Settings and allow background activity for this app.');
    });
  };

  const openDonation = () => {
    Linking.openURL('https://github.com/local-over');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.content}>
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
            If you love using this app with your partner, consider buying me a coffee! ☕
          </Text>
          <TouchableOpacity style={[styles.button, styles.donateButton]} onPress={openDonation}>
            <Text style={styles.donateButtonText}>Support via GitHub</Text>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
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
