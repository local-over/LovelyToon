import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Dimensions, Animated, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import RNAndroidNotificationListener from 'react-native-android-notification-listener';
import { StorageService } from '../services/StorageService';
import { mqttService } from '../services/MqttService';
import { COLORS } from '../utils/constants';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

export const OnboardingScreen = ({ onConnect }) => {
  const [step, setStep] = useState(1);
  const [nickname, setNickname] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState(null);

  // We skip step 3 (permissions) on non-Android platforms
  const TOTAL_STEPS = 6;

  const handleNext = async () => {
    if (step === 2) {
      if (nickname.trim()) {
        await StorageService.setNickname(nickname.trim());
      }
      
      if (Platform.OS !== 'android') {
        setStep(4); // Skip permission step
      } else {
        const status = await RNAndroidNotificationListener.getPermissionStatus();
        if (status === 'authorized') {
          setStep(4);
        } else {
          setStep(3);
        }
      }
    } else if (step === 3) {
      RNAndroidNotificationListener.requestPermission();
      setStep(4);
    } else {
      setStep(step + 1);
    }
  };

  const [isCreating, setIsCreating] = useState(false);

  const handleCreateRoom = async () => {
    setIsCreating(true);
    let code;
    let claimed = false;
    
    // Try up to 3 times to find an empty room
    for (let i = 0; i < 3; i++) {
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const success = await mqttService.checkAndClaimRoom(code);
      if (success) {
        claimed = true;
        break;
      }
    }
    
    setIsCreating(false);
    if (claimed) {
      setGeneratedCode(code);
    } else {
      alert("Failed to create a room. Please try again.");
    }
  };

  const shareCode = async () => {
    const senderName = nickname ? nickname : 'Your partner';
    const message = `${senderName} wants to listen to music with you! Download Lovely Toon and join the room: https://local-over.github.io/LovelyToon/pair/${generatedCode}`;
    try {
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({
            title: 'Join my Lovely Toon Room',
            text: message,
            url: `https://local-over.github.io/LovelyToon/pair/${generatedCode}`
          });
        } else {
          navigator.clipboard.writeText(message);
          alert('Link copied to clipboard!');
        }
      } else {
        await Share.share({
          message: message,
          title: 'Share your Magic Link'
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.content}>
          {step === 1 && (
            <View style={styles.slide}>
              <View style={styles.iconContainer}>
                <Ionicons name="headset-outline" size={100} color={COLORS.primary} />
                <Ionicons name="heart" size={40} color={COLORS.accent} style={styles.floatingIcon} />
              </View>
              <Text style={styles.title}>Welcome to Lovely Toon</Text>
              <Text style={styles.subtitle}>See what your partner is listening to in real-time, right on your screen.</Text>
              <TouchableOpacity style={styles.button} onPress={handleNext}>
                <Text style={styles.buttonText}>Get Started</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 2 && (
            <View style={styles.slide}>
              <Ionicons name="person-circle-outline" size={80} color={COLORS.primary} />
              <Text style={styles.title}>Who are you?</Text>
              <Text style={styles.subtitle}>What should your partner call you?</Text>
              <TextInput
                style={styles.input}
                value={nickname}
                onChangeText={setNickname}
                placeholder="e.g. Bestie, Babe, Alex"
                placeholderTextColor={COLORS.textSecondary}
                autoFocus
              />
              <TouchableOpacity 
                style={[styles.button, !nickname.trim() && styles.buttonDisabled]} 
                onPress={handleNext}
                disabled={!nickname.trim()}
              >
                <Text style={styles.buttonText}>Next</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 3 && (
            <View style={styles.slide}>
              <Ionicons name="notifications-circle-outline" size={80} color={COLORS.primary} />
              <Text style={styles.title}>Enable Magic</Text>
              <Text style={styles.subtitle}>To see what you are listening to, we need Notification Access so we can read your music player.</Text>
              <TouchableOpacity style={styles.button} onPress={handleNext}>
                <Text style={styles.buttonText}>Grant Permission</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep(4)}>
                <Text style={styles.secondaryButtonText}>Skip for now</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 4 && (
            <View style={styles.slide}>
              <Ionicons name="apps-outline" size={80} color={COLORS.primary} />
              <Text style={styles.title}>Widgets & Background</Text>
              <Text style={styles.subtitle}>You can add Lovely Toon to your Android Home Screen!{'\n\n'}Note: If you have a Huawei or Xiaomi device, make sure to disable "Battery Optimization" for this app, otherwise it may stop working in the background.</Text>
              <TouchableOpacity style={styles.button} onPress={handleNext}>
                <Text style={styles.buttonText}>Got it!</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 5 && (
            <View style={styles.slide}>
              <Ionicons name="options-outline" size={80} color={COLORS.primary} />
              <Text style={styles.title}>Preferences</Text>
              <Text style={styles.subtitle}>By default, we keep a small history of songs and send a Push Notification when a new song plays. You can change these later in Settings.</Text>
              <TouchableOpacity style={styles.button} onPress={handleNext}>
                <Text style={styles.buttonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 6 && (
            <View style={styles.slide}>
              <Ionicons name="people-circle-outline" size={80} color={COLORS.primary} />
              <Text style={styles.title}>Room Setup</Text>
              <Text style={styles.subtitle}>Join an existing room or create a new one to share.</Text>
              
              {!generatedCode ? (
                <>
                  <TextInput
                    style={styles.input}
                    value={joinCode}
                    onChangeText={setJoinCode}
                    placeholder="Enter 6-digit code to join"
                    placeholderTextColor={COLORS.textSecondary}
                    autoCapitalize="characters"
                  />
                  <TouchableOpacity 
                    style={[styles.button, !joinCode.trim() && styles.buttonDisabled]} 
                    onPress={() => onConnect(joinCode)}
                    disabled={!joinCode.trim()}
                  >
                    <Text style={styles.buttonText}>Join Room</Text>
                  </TouchableOpacity>

                  <Text style={styles.divider}>OR</Text>

                  <TouchableOpacity 
                    style={[styles.secondaryButton, isCreating && styles.buttonDisabled]} 
                    onPress={handleCreateRoom}
                    disabled={isCreating}
                  >
                    <Text style={styles.secondaryButtonText}>
                      {isCreating ? 'Creating Room...' : 'Create New Room'}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.generatedContainer}>
                  <Text style={styles.codeText}>{generatedCode}</Text>
                  <TouchableOpacity style={styles.button} onPress={shareCode}>
                    <Ionicons name="share-outline" size={20} color="white" style={{ marginRight: 8 }} />
                    <Text style={styles.buttonText}>Send Magic Link</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.secondaryButton, { marginTop: 16 }]} 
                    onPress={() => onConnect(generatedCode)}
                  >
                    <Text style={styles.secondaryButtonText}>Enter Room</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
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
  },
  input: {
    backgroundColor: '#fff',
    width: '100%',
    padding: 16,
    borderRadius: 12,
    fontSize: 18,
    textAlign: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
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
    opacity: 0.5,
  },
  buttonText: {
    color: 'white',
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
    backgroundColor: COLORS.surface,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  divider: {
    marginVertical: 24,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  generatedContainer: {
    width: '100%',
    alignItems: 'center',
  },
  codeText: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 8,
    marginBottom: 32,
  },
});
