import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, Switch, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../utils/constants';
import { StorageService } from '../services/StorageService';

export const SettingsScreen = ({ onDisconnect, onResetPartner, partnerName, pairingCode }) => {
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

  const confirmDisconnect = () => {
    Alert.alert(
      'Leave Room',
      'This will disconnect you from your partner. You can always create a new room or join another one.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: onDisconnect },
      ]
    );
  };

  const confirmResetPartner = () => {
    Alert.alert(
      'Reset Partner',
      'This will clear your current partner selection. The next person to send a song in this room will become your new partner.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', onPress: onResetPartner },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        <View style={styles.content}>
          {/* Connection Info */}
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Ionicons name="link-outline" size={20} color={COLORS.primary} />
              <Text style={styles.infoLabel}>Room</Text>
              <Text style={styles.infoValue}>{pairingCode || '—'}</Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={20} color={COLORS.partnerAccent} />
              <Text style={styles.infoLabel}>Partner</Text>
              <Text style={styles.infoValue}>{partnerName || 'Waiting...'}</Text>
            </View>
          </View>

          {/* Notifications */}
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Push Notifications</Text>
                <Text style={styles.cardDescription}>Get notified when your partner plays a new song.</Text>
              </View>
              <Switch 
                value={pushEnabled} 
                onValueChange={togglePush} 
                trackColor={{ false: '#ccc', true: COLORS.primary }}
                thumbColor={'white'}
              />
            </View>
          </View>

          {/* Partner Reset */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Partner</Text>
            <Text style={styles.cardDescription}>
              Clear your current partner and auto-lock to the next person who plays a song in this room.
            </Text>
            <TouchableOpacity style={styles.actionButton} onPress={confirmResetPartner}>
              <Ionicons name="refresh-outline" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
              <Text style={styles.actionButtonText}>Reset Partner</Text>
            </TouchableOpacity>
          </View>

          {/* Leave Room */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Room</Text>
            <Text style={styles.cardDescription}>
              Leave this room entirely and return to the setup screen.
            </Text>
            <TouchableOpacity style={styles.dangerButton} onPress={confirmDisconnect}>
              <Ionicons name="log-out-outline" size={18} color={COLORS.heartRed} style={{ marginRight: 8 }} />
              <Text style={styles.dangerButtonText}>Leave Room</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    paddingTop: 8,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.cardRadius,
    padding: SIZES.padding,
    marginBottom: 16,
    ...SHADOWS.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginLeft: 10,
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.accent,
    marginVertical: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 14,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    borderRadius: SIZES.pillRadius,
    paddingVertical: 12,
  },
  actionButtonText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    borderRadius: SIZES.pillRadius,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: COLORS.heartRed,
  },
  dangerButtonText: {
    color: COLORS.heartRed,
    fontWeight: '700',
    fontSize: 15,
  },
});
