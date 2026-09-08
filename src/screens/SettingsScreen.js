import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, Switch, ScrollView, Dimensions, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SIZES, SHADOWS, THEMES } from '../utils/constants';
import { StorageService } from '../services/StorageService';
import { appwriteService } from '../services/AppwriteService';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

let QRCode = null;
try { QRCode = require('react-native-qrcode-svg').default; } catch (e) {}

export const SettingsScreen = ({ onDisconnect, partnerName }) => {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [migrateModalVisible, setMigrateModalVisible] = useState(false);
  
  const { theme, changeTheme, themeId } = useTheme();
  const colors = theme.colors;

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
      'Logout',
      'This will log you out of your account and clear your current session.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: onDisconnect },
      ]
    );
  };

  const getMigratePayload = () => {
    return JSON.stringify({
      migrateId: appwriteService.partnerId,
      relationshipId: appwriteService.relationshipId
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Settings</Text>
        </View>

        <View style={styles.content}>
          {/* Connection Info */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={20} color={colors.partnerAccent} />
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Partner</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{partnerName || 'Waiting...'}</Text>
            </View>
          </View>

          {/* Theme Selector */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Theme</Text>
            <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
              Customize the look and feel of the app and Android widget.
            </Text>
            <View style={styles.themeContainer}>
              {Object.values(THEMES).map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    styles.themeCircle,
                    { backgroundColor: t.colors.primary },
                    themeId === t.id && { borderWidth: 3, borderColor: colors.textPrimary }
                  ]}
                  onPress={() => changeTheme(t.id)}
                />
              ))}
            </View>
          </View>

          {/* Notifications */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Push Notifications</Text>
                <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>Get notified when your partner plays a new song.</Text>
              </View>
              <Switch 
                value={pushEnabled} 
                onValueChange={togglePush} 
                trackColor={{ false: '#ccc', true: colors.primary }}
                thumbColor={'white'}
              />
            </View>
          </View>

          {/* Account Migration */}
          {appwriteService.partnerId && (
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Migrate Device</Text>
              <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                Switching phones? Scan a QR code on your new device to seamlessly transfer your pairing.
              </Text>
              <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={() => setMigrateModalVisible(true)}>
                <Ionicons name="qr-code-outline" size={18} color={'white'} style={{ marginRight: 8 }} />
                <Text style={[styles.primaryButtonText, { color: 'white' }]}>Generate QR Code</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Logout */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Account</Text>
            <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
              Log out of your Appwrite session. You will need to log back in to see your partner's status.
            </Text>
            <TouchableOpacity style={[styles.dangerButton, { backgroundColor: colors.background, borderColor: colors.heartRed }]} onPress={confirmDisconnect}>
              <Ionicons name="log-out-outline" size={18} color={colors.heartRed} style={{ marginRight: 8 }} />
              <Text style={[styles.dangerButtonText, { color: colors.heartRed }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Migration Modal */}
      <Modal visible={migrateModalVisible} animationType="slide" transparent={true} onRequestClose={() => setMigrateModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <TouchableOpacity onPress={() => setMigrateModalVisible(false)} style={styles.modalClose}>
              <Ionicons name="close" size={28} color={colors.textPrimary} />
            </TouchableOpacity>
            
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Migrate Account</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              1. Install Lovely Toon on your new device.{"\n"}
              2. On your new device, select "Scan QR" during setup.{"\n"}
              3. Scan the code below to migrate your pairing.
            </Text>

            {QRCode && appwriteService.partnerId ? (
              <View style={styles.qrWrapper}>
                <QRCode
                  value={getMigratePayload()}
                  size={width * 0.6}
                  color={colors.textPrimary}
                  backgroundColor="white"
                />
              </View>
            ) : (
              <Text style={{ color: colors.heartRed, marginTop: 20 }}>Unable to generate QR Code. Partner ID missing.</Text>
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  content: {
    padding: 20,
    paddingTop: 8,
  },
  card: {
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
    fontWeight: '500',
    marginLeft: 10,
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  themeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  themeCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: SIZES.pillRadius,
    paddingVertical: 12,
    borderWidth: 1.5,
  },
  dangerButtonText: {
    fontWeight: '700',
    fontSize: 15,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: SIZES.pillRadius,
    paddingVertical: 12,
  },
  primaryButtonText: {
    fontWeight: '700',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    alignItems: 'center',
    minHeight: '60%',
  },
  modalClose: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
  },
  modalSubtitle: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 30,
  },
  qrWrapper: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    elevation: 4,
    ...SHADOWS.card,
  }
});
