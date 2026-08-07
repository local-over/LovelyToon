import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Dimensions, Share, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import RNAndroidNotificationListener from 'react-native-android-notification-listener';
import { StorageService } from '../services/StorageService';
import { COLORS, SIZES } from '../utils/constants';

const { width } = Dimensions.get('window');

// Conditionally import QR components (they may not work on web)
let QRCode = null;
let CameraView = null;
let useCameraPermissions = null;
try {
  QRCode = require('react-native-qrcode-svg').default;
} catch (e) {}
try {
  const cam = require('expo-camera');
  CameraView = cam.CameraView;
  useCameraPermissions = cam.useCameraPermissions;
} catch (e) {}

export const OnboardingScreen = ({ onConnect, inviteData }) => {
  const [step, setStep] = useState(inviteData ? 'invite' : 'welcome');
  const [nickname, setNickname] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState(null);
  const [userId, setUserId] = useState('');
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions ? useCameraPermissions() : [null, () => {}];
  const scannedRef = useRef(false);

  useEffect(() => {
    StorageService.getUserId().then(id => setUserId(id));
  }, []);

  useEffect(() => {
    if (inviteData) {
      setStep('invite');
    }
  }, [inviteData]);

  // ── Navigation ──
  const goToPermissions = async () => {
    if (Platform.OS !== 'android') {
      setStep('room');
      return;
    }
    try {
      const status = await RNAndroidNotificationListener.getPermissionStatus();
      if (status === 'authorized') {
        setStep('room');
      } else {
        setStep('permissions');
      }
    } catch (e) {
      setStep('room');
    }
  };

  const handleNameSubmit = async () => {
    if (!nickname.trim()) return;
    await StorageService.setNickname(nickname.trim());
    goToPermissions();
  };

  const handleGrantPermission = () => {
    RNAndroidNotificationListener.requestPermission();
    setStep('room');
  };

  // ── Room Creation ──
  const handleCreateRoom = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setGeneratedCode(code);
  };

  const getInviteUrl = (code) => {
    const params = `?pair=${code}&uid=${encodeURIComponent(userId)}&name=${encodeURIComponent(nickname)}`;
    return `https://local-over.github.io/LovelyToon/${params}`;
  };

  const getQrData = (code) => {
    return JSON.stringify({ code, uid: userId, name: nickname });
  };

  const shareLink = async () => {
    const url = getInviteUrl(generatedCode);
    const msg = `${nickname || 'Someone'} wants to listen to music with you! Join on Lovely Toon:\n${url}`;
    try {
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({ title: 'Join my Lovely Toon Room', text: msg, url });
        } else {
          navigator.clipboard.writeText(msg);
          alert('Link copied!');
        }
      } else {
        await Share.share({ message: msg, title: 'Join my Lovely Toon Room' });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ── QR Scanning ──
  const handleBarCodeScanned = ({ data }) => {
    if (scannedRef.current) return;
    scannedRef.current = true;
    setScanning(false);
    try {
      const parsed = JSON.parse(data);
      if (parsed.code && parsed.uid) {
        onConnect(parsed.code, parsed.uid, parsed.name || 'Partner');
      } else {
        alert('Invalid QR code');
        scannedRef.current = false;
      }
    } catch (e) {
      alert('Could not read QR code');
      scannedRef.current = false;
    }
  };

  const startScanning = async () => {
    if (Platform.OS === 'web') {
      alert('QR scanning is not available on web. Please enter the code manually.');
      return;
    }
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result?.granted) {
        alert('Camera permission is required to scan QR codes.');
        return;
      }
    }
    scannedRef.current = false;
    setScanning(true);
  };

  // ── Invited flow (came from a deep link) ──
  const handleInviteAccept = async () => {
    if (!nickname.trim()) return;
    await StorageService.setNickname(nickname.trim());
    onConnect(inviteData.code, inviteData.partnerUid, inviteData.partnerName);
  };

  // ── RENDER ──
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

          {/* ── SCANNING OVERLAY ── */}
          {scanning && CameraView && (
            <View style={styles.scanOverlay}>
              <CameraView
                style={styles.camera}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={handleBarCodeScanned}
              />
              <View style={styles.scanHeader}>
                <TouchableOpacity onPress={() => setScanning(false)} style={styles.scanClose}>
                  <Ionicons name="close" size={28} color="white" />
                </TouchableOpacity>
                <Text style={styles.scanTitle}>Scan your partner's QR code</Text>
              </View>
            </View>
          )}

          {/* ── STEP: WELCOME ── */}
          {step === 'welcome' && (
            <View style={styles.slide}>
              <View style={styles.iconContainer}>
                <Ionicons name="headset-outline" size={100} color={COLORS.primary} />
                <Ionicons name="heart" size={40} color={COLORS.accent} style={styles.floatingIcon} />
              </View>
              <Text style={styles.title}>Lovely Toon</Text>
              <Text style={styles.subtitle}>See what your partner is listening to, in real-time.</Text>
              <TouchableOpacity style={styles.button} onPress={() => setStep('name')}>
                <Text style={styles.buttonText}>Get Started</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── STEP: INVITE (came from deep link) ── */}
          {step === 'invite' && inviteData && (
            <View style={styles.slide}>
              <Ionicons name="heart-circle" size={100} color={COLORS.primary} />
              <Text style={styles.title}>{inviteData.partnerName} invited you!</Text>
              <Text style={styles.subtitle}>They want to share music with you. Enter your name to join their room.</Text>
              
              {Platform.OS === 'web' ? (
                <>
                  <TouchableOpacity style={styles.button} onPress={() => window.location.href = `lovelytoon://pair/${inviteData.code}?uid=${inviteData.partnerUid}&name=${encodeURIComponent(inviteData.partnerName)}`}>
                    <Text style={styles.buttonText}>Open in Lovely Toon App</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.secondaryButton, { marginTop: 16 }]} onPress={() => window.location.href = 'https://github.com/local-over/LovelyToon/releases/latest/download/LovelyToon.apk'}>
                    <Text style={styles.secondaryButtonText}>Download Android App</Text>
                  </TouchableOpacity>
                  
                  <Text style={styles.divider}>OR CONTINUE IN BROWSER</Text>
                </>
              ) : null}

              <TextInput
                style={styles.input}
                value={nickname}
                onChangeText={setNickname}
                placeholder="What's your name?"
                placeholderTextColor={COLORS.textSecondary}
                autoFocus={Platform.OS !== 'web'}
              />
              <TouchableOpacity
                style={[styles.button, !nickname.trim() && styles.buttonDisabled]}
                onPress={handleInviteAccept}
                disabled={!nickname.trim()}
              >
                <Text style={styles.buttonText}>Join {inviteData.partnerName}'s Room</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── STEP: NAME ── */}
          {step === 'name' && (
            <View style={styles.slide}>
              <Ionicons name="person-circle-outline" size={80} color={COLORS.primary} />
              <Text style={styles.title}>What's your name?</Text>
              <Text style={styles.subtitle}>This is what your partner will see.</Text>
              <TextInput
                style={styles.input}
                value={nickname}
                onChangeText={setNickname}
                placeholder="e.g. Babe, Alex, Bestie"
                placeholderTextColor={COLORS.textSecondary}
                autoFocus
              />
              <TouchableOpacity
                style={[styles.button, !nickname.trim() && styles.buttonDisabled]}
                onPress={handleNameSubmit}
                disabled={!nickname.trim()}
              >
                <Text style={styles.buttonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── STEP: PERMISSIONS ── */}
          {step === 'permissions' && (
            <View style={styles.slide}>
              <Ionicons name="notifications-circle-outline" size={80} color={COLORS.primary} />
              <Text style={styles.title}>One Quick Thing</Text>
              <Text style={styles.subtitle}>To detect what you're listening to, we need Notification Access. This lets us read your music player's notification.</Text>
              <TouchableOpacity style={styles.button} onPress={handleGrantPermission}>
                <Text style={styles.buttonText}>Enable Notification Access</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep('room')}>
                <Text style={styles.secondaryButtonText}>Skip for now</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── STEP: ROOM SETUP ── */}
          {step === 'room' && !generatedCode && (
            <View style={styles.slide}>
              <Ionicons name="people-circle-outline" size={80} color={COLORS.primary} />
              <Text style={styles.title}>Connect with your partner</Text>
              <Text style={styles.subtitle}>Create a room and invite them, or join theirs.</Text>

              <TouchableOpacity style={styles.button} onPress={handleCreateRoom}>
                <Ionicons name="add-circle-outline" size={22} color="white" style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>Create a Room</Text>
              </TouchableOpacity>

              <Text style={styles.divider}>OR</Text>

              <TouchableOpacity style={styles.outlineButton} onPress={startScanning}>
                <Ionicons name="qr-code-outline" size={22} color={COLORS.primary} style={{ marginRight: 8 }} />
                <Text style={styles.outlineButtonText}>Scan QR Code</Text>
              </TouchableOpacity>

              <Text style={styles.divider}>OR</Text>

              <TextInput
                style={styles.input}
                value={joinCode}
                onChangeText={setJoinCode}
                placeholder="Enter room code"
                placeholderTextColor={COLORS.textSecondary}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={[styles.secondaryButton, !joinCode.trim() && styles.buttonDisabled]}
                onPress={() => onConnect(joinCode.trim().toUpperCase(), null, null)}
                disabled={!joinCode.trim()}
              >
                <Text style={styles.secondaryButtonText}>Join with Code</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── STEP: ROOM CREATED (show QR + share) ── */}
          {step === 'room' && generatedCode && (
            <View style={styles.slide}>
              <Text style={styles.title}>Your Room</Text>
              <Text style={styles.codeText}>{generatedCode}</Text>

              {QRCode && (
                <View style={styles.qrContainer}>
                  <QRCode
                    value={getQrData(generatedCode)}
                    size={width * 0.5}
                    color={COLORS.textPrimary}
                    backgroundColor="white"
                  />
                </View>
              )}

              <Text style={styles.subtitle}>Let your partner scan this code, or send them the link below.</Text>

              <TouchableOpacity style={styles.button} onPress={shareLink}>
                <Ionicons name="share-outline" size={20} color="white" style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>Send Invite Link</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryButton, { marginTop: 12 }]}
                onPress={() => onConnect(generatedCode, null, null)}
              >
                <Text style={styles.secondaryButtonText}>Enter Room</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setGeneratedCode(null)} style={{ marginTop: 16 }}>
                <Text style={styles.linkText}>Back</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  slide: {
    alignItems: 'center',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  floatingIcon: {
    position: 'absolute',
    bottom: -10,
    right: -10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  input: {
    backgroundColor: '#fff',
    width: '100%',
    padding: 16,
    borderRadius: 14,
    fontSize: 18,
    textAlign: 'center',
    borderWidth: 2,
    borderColor: COLORS.accent,
    marginBottom: 20,
    color: COLORS.textPrimary,
  },
  button: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  outlineButton: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: 'transparent',
  },
  outlineButtonText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  divider: {
    marginVertical: 20,
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  codeText: {
    fontSize: 42,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 6,
    marginBottom: 24,
  },
  qrContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  linkText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  // Scanner overlay
  scanOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  scanHeader: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  scanClose: {
    position: 'absolute',
    left: 20,
    top: 0,
    padding: 8,
  },
  scanTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
});
