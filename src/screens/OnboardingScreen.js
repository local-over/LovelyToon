import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Dimensions, Share, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import RNAndroidNotificationListener from 'react-native-android-notification-listener';
import { StorageService } from '../services/StorageService';
import { appwriteService } from '../services/AppwriteService';
import { SIZES, THEMES } from '../utils/constants';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

let QRCode = null;
let CameraView = null;
let useCameraPermissions = null;
try { QRCode = require('react-native-qrcode-svg').default; } catch (e) {}
try {
  const cam = require('expo-camera');
  CameraView = cam.CameraView;
  useCameraPermissions = cam.useCameraPermissions;
} catch (e) {}

export const OnboardingScreen = ({ onPaired, inviteData, initialUserId }) => {
  const [step, setStep] = useState(initialUserId ? (inviteData ? 'invite' : 'welcome') : 'auth');
  const [nickname, setNickname] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState(null);
  
  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  
  const [loading, setLoading] = useState(false);
  
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions ? useCameraPermissions() : [null, () => {}];
  const scannedRef = useRef(false);

  const { theme, changeTheme, themeId } = useTheme();
  const colors = theme.colors;

  useEffect(() => {
    StorageService.getNickname().then(n => { if (n) setNickname(n); });
  }, []);

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

  const handleAuthSubmit = async () => {
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    try {
      if (isLogin) {
        await appwriteService.loginEmail(email.trim(), password);
      } else {
        await appwriteService.registerEmail(email.trim(), password, nickname || 'User');
      }
      setStep('welcome');
    } catch (e) {
      alert(e.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAnonSubmit = async () => {
    setLoading(true);
    try {
      await appwriteService.signInAnonymous();
      setStep('welcome');
    } catch (e) {
      alert('Failed to sign in anonymously');
    } finally {
      setLoading(false);
    }
  };

  const handleNameSubmit = async () => {
    if (!nickname.trim()) return;
    await StorageService.setNickname(nickname.trim());
    try { await appwriteService.account.updateName(nickname.trim()); } catch(e){}
    setStep('theme'); // Go to Theme step next
  };

  const handleThemeSubmit = async () => {
    goToPermissions();
  };

  const handleGrantPermission = () => {
    RNAndroidNotificationListener.requestPermission();
    setStep('room');
  };

  const handleCreateInvite = async () => {
    setLoading(true);
    try {
      const code = await appwriteService.createInvite(nickname);
      setGeneratedCode(code);
    } catch (e) {
      alert('Could not generate invite. Are you logged in?');
    } finally {
      setLoading(false);
    }
  };

  const handleConsumeInvite = async (code) => {
    if (!code) return;
    setLoading(true);
    try {
      const result = await appwriteService.consumeInvite(code, nickname);
      onPaired(result.partnerId, result.partnerName);
    } catch (e) {
      alert(e.message || 'Invalid or expired code');
      scannedRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  const getInviteUrl = (code) => {
    const params = `?pair=${code}&name=${encodeURIComponent(nickname)}`;
    return `https://local-over.github.io/LovelyToon/${params}`;
  };

  const shareLink = async () => {
    const url = getInviteUrl(generatedCode);
    const msg = `${nickname || 'Someone'} wants to listen to music with you! Join on Lovely Toon:\n${url}`;
    try {
      if (Platform.OS === 'web') {
        if (navigator.share) await navigator.share({ title: 'Join my Lovely Toon', text: msg, url });
        else { navigator.clipboard.writeText(msg); alert('Link copied!'); }
      } else {
        await Share.share({ message: msg, title: 'Join my Lovely Toon' });
      }
    } catch (e) {}
  };

  const handleBarCodeScanned = ({ data }) => {
    if (scannedRef.current) return;
    scannedRef.current = true;
    setScanning(false);
    try {
      const parsed = JSON.parse(data);
      if (parsed.code) handleConsumeInvite(parsed.code);
      else { alert('Invalid QR code'); scannedRef.current = false; }
    } catch (e) {
      alert('Could not read QR code');
      scannedRef.current = false;
    }
  };

  const startScanning = async () => {
    if (Platform.OS === 'web') { alert('QR scanning is not available on web.'); return; }
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result?.granted) { alert('Camera permission is required'); return; }
    }
    scannedRef.current = false;
    setScanning(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

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
                <Text style={styles.scanTitle}>Scan QR code</Text>
              </View>
            </View>
          )}

          {step === 'auth' && (
            <View style={styles.slide}>
              <Ionicons name="shield-checkmark-outline" size={80} color={colors.primary} />
              <Text style={[styles.title, { color: colors.textPrimary }]}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Log in to sync your relationship across devices, or stay anonymous.</Text>
              
              <TextInput
                style={[styles.input, { borderColor: colors.accent, color: colors.textPrimary }]}
                value={email}
                onChangeText={setEmail}
                placeholder="Email address"
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor={colors.textSecondary}
              />
              <TextInput
                style={[styles.input, { borderColor: colors.accent, color: colors.textPrimary }]}
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                secureTextEntry
                placeholderTextColor={colors.textSecondary}
              />

              <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleAuthSubmit} disabled={loading}>
                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>{isLogin ? 'Login' : 'Sign Up'}</Text>}
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={{ marginTop: 16 }}>
                <Text style={[styles.linkText, { color: colors.textSecondary }]}>{isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}</Text>
              </TouchableOpacity>

              <Text style={[styles.divider, { color: colors.textSecondary }]}>OR</Text>

              <TouchableOpacity style={[styles.outlineButton, { borderColor: colors.primary }]} onPress={handleAnonSubmit} disabled={loading}>
                <Text style={[styles.outlineButtonText, { color: colors.primary }]}>Continue Anonymously</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 'welcome' && (
            <View style={styles.slide}>
              <View style={styles.iconContainer}>
                <Ionicons name="headset-outline" size={100} color={colors.primary} />
                <Ionicons name="heart" size={40} color={colors.accent} style={styles.floatingIcon} />
              </View>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Lovely Toon</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>See what your partner is listening to, in real-time.</Text>
              <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={() => setStep('name')}>
                <Text style={styles.buttonText}>Get Started</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 'invite' && inviteData && (
            <View style={styles.slide}>
              <Ionicons name="heart-circle" size={100} color={colors.primary} />
              <Text style={[styles.title, { color: colors.textPrimary }]}>{inviteData.partnerName} invited you!</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Enter your name to pair devices.</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.accent, color: colors.textPrimary }]}
                value={nickname}
                onChangeText={setNickname}
                placeholder="What's your name?"
                placeholderTextColor={colors.textSecondary}
              />
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary }, (!nickname.trim() || loading) && styles.buttonDisabled]}
                onPress={() => {
                  StorageService.setNickname(nickname.trim());
                  handleConsumeInvite(inviteData.code);
                }}
                disabled={!nickname.trim() || loading}
              >
                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Pair with {inviteData.partnerName}</Text>}
              </TouchableOpacity>
            </View>
          )}

          {step === 'name' && (
            <View style={styles.slide}>
              <Ionicons name="person-circle-outline" size={80} color={colors.primary} />
              <Text style={[styles.title, { color: colors.textPrimary }]}>What's your name?</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>This is what your partner will see.</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.accent, color: colors.textPrimary }]}
                value={nickname}
                onChangeText={setNickname}
                placeholder="e.g. Babe, Alex"
                placeholderTextColor={colors.textSecondary}
              />
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary }, !nickname.trim() && styles.buttonDisabled]}
                onPress={handleNameSubmit}
                disabled={!nickname.trim()}
              >
                <Text style={styles.buttonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 'theme' && (
            <View style={styles.slide}>
              <Ionicons name="color-palette-outline" size={80} color={colors.primary} />
              <Text style={[styles.title, { color: colors.textPrimary }]}>Choose a Theme</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>This applies to the app and your home screen widget.</Text>
              
              <View style={styles.themeGrid}>
                {Object.values(THEMES).map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      styles.themeCard,
                      { backgroundColor: t.colors.card },
                      themeId === t.id && { borderWidth: 3, borderColor: colors.textPrimary }
                    ]}
                    onPress={() => changeTheme(t.id)}
                  >
                    <View style={[styles.themeCircle, { backgroundColor: t.colors.primary }]} />
                    <Text style={[styles.themeName, { color: t.colors.textPrimary }]}>{t.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary, marginTop: 30 }]}
                onPress={handleThemeSubmit}
              >
                <Text style={styles.buttonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 'permissions' && (
            <View style={styles.slide}>
              <Ionicons name="notifications-circle-outline" size={80} color={colors.primary} />
              <Text style={[styles.title, { color: colors.textPrimary }]}>One Quick Thing</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>To detect what you're listening to, we need Notification Access.</Text>
              <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleGrantPermission}>
                <Text style={styles.buttonText}>Enable Access</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: colors.accent }]} onPress={() => setStep('room')}>
                <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Skip for now</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 'room' && !generatedCode && (
            <View style={styles.slide}>
              <Ionicons name="people-circle-outline" size={80} color={colors.primary} />
              <Text style={[styles.title, { color: colors.textPrimary }]}>Pair Devices</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Create an invite or join using a code.</Text>

              <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleCreateInvite} disabled={loading}>
                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Create Invite</Text>}
              </TouchableOpacity>

              <Text style={[styles.divider, { color: colors.textSecondary }]}>OR</Text>
              <TouchableOpacity style={[styles.outlineButton, { borderColor: colors.primary }]} onPress={startScanning}>
                <Text style={[styles.outlineButtonText, { color: colors.primary }]}>Scan QR</Text>
              </TouchableOpacity>

              <Text style={[styles.divider, { color: colors.textSecondary }]}>OR</Text>

              <TextInput
                style={[styles.input, { borderColor: colors.accent, color: colors.textPrimary }]}
                value={joinCode}
                onChangeText={setJoinCode}
                placeholder="Enter partner's code"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={[styles.secondaryButton, { backgroundColor: colors.accent }, (!joinCode.trim() || loading) && styles.buttonDisabled]}
                onPress={() => handleConsumeInvite(joinCode.trim().toUpperCase())}
                disabled={!joinCode.trim() || loading}
              >
                {loading ? <ActivityIndicator color={colors.primary} /> : <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Join with Code</Text>}
              </TouchableOpacity>
            </View>
          )}

          {step === 'room' && generatedCode && (
            <View style={styles.slide}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Your Invite Code</Text>
              <Text style={[styles.codeText, { color: colors.textPrimary }]}>{generatedCode}</Text>

              {QRCode && (
                <View style={styles.qrContainer}>
                  <QRCode
                    value={JSON.stringify({ code: generatedCode })}
                    size={width * 0.5}
                    color={colors.textPrimary}
                    backgroundColor="white"
                  />
                </View>
              )}

              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Let your partner scan this code, or send them the link.</Text>

              <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={shareLink}>
                <Text style={styles.buttonText}>Share Link</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setGeneratedCode(null)} style={{ marginTop: 24 }}>
                <Text style={[styles.linkText, { color: colors.textSecondary }]}>Back</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  slide: { alignItems: 'center' },
  iconContainer: { position: 'relative', marginBottom: 20 },
  floatingIcon: { position: 'absolute', bottom: -10, right: -10 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 32, lineHeight: 24 },
  input: { backgroundColor: '#fff', width: '100%', padding: 16, borderRadius: 14, fontSize: 18, textAlign: 'center', borderWidth: 2, marginBottom: 20 },
  button: { paddingVertical: 16, borderRadius: 30, width: '100%', alignItems: 'center', elevation: 5 },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: 'white', fontSize: 18, fontWeight: '700' },
  outlineButton: { paddingVertical: 16, borderRadius: 30, width: '100%', alignItems: 'center', borderWidth: 2 },
  outlineButtonText: { fontSize: 18, fontWeight: '700' },
  secondaryButton: { paddingVertical: 16, borderRadius: 30, width: '100%', alignItems: 'center' },
  secondaryButtonText: { fontSize: 18, fontWeight: '700' },
  divider: { marginVertical: 20, fontWeight: '600' },
  codeText: { fontSize: 42, fontWeight: '900', letterSpacing: 6, marginBottom: 24 },
  qrContainer: { padding: 20, backgroundColor: 'white', borderRadius: 20, marginBottom: 24, elevation: 6 },
  linkText: { fontSize: 16, fontWeight: '600' },
  scanOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, backgroundColor: 'black' },
  camera: { flex: 1 },
  scanHeader: { position: 'absolute', top: 60, left: 0, right: 0, alignItems: 'center' },
  scanClose: { position: 'absolute', left: 20, top: 0, padding: 8 },
  scanTitle: { color: 'white', fontSize: 18, fontWeight: '700' },
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16 },
  themeCard: { width: '45%', padding: 16, borderRadius: 16, alignItems: 'center', elevation: 2 },
  themeCircle: { width: 40, height: 40, borderRadius: 20, marginBottom: 12 },
  themeName: { fontSize: 14, fontWeight: '700', textAlign: 'center' }
});
