import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../utils/constants';
import { StorageService } from '../services/StorageService';

export const PairingCode = ({ code, onConnect }) => {
  const [inputCode, setInputCode] = useState(code || '');
  const [nickname, setNickname] = useState('');
  const scale = new Animated.Value(1);

  useEffect(() => {
    StorageService.getNickname().then(name => {
      if (name) setNickname(name);
    });
  }, []);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
    
    if (inputCode && nickname) {
      StorageService.setNickname(nickname);
      onConnect(inputCode, nickname);
    }
  };

  const generateCode = () => {
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setInputCode(randomCode);
  };

  const shareCode = async () => {
    if (!inputCode) return;
    try {
      const magicLink = `https://local-over.github.io/LovelyToon/pair/${inputCode}`;
      await Share.share({
        message: `Let's listen together! 💕 Download Lovely Toon and join my room:\n\n${magicLink}`,
        title: 'Join my Lovely Toon room',
      });
    } catch (error) {
      console.error(error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>1. What should they call you? 💬</Text>
      <TextInput
        style={styles.input}
        value={nickname}
        onChangeText={setNickname}
        placeholder="e.g. Bestie, Babe, Hassan"
        placeholderTextColor={COLORS.textSecondary}
      />

      <Text style={styles.label}>2. Room Code 🔑</Text>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, { flex: 1, marginBottom: 0 }]}
          value={inputCode}
          onChangeText={setInputCode}
          placeholder="e.g. L0V3LY"
          placeholderTextColor={COLORS.textSecondary}
          autoCapitalize="characters"
        />
        <TouchableOpacity style={styles.iconButton} onPress={generateCode}>
          <Ionicons name="dice-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      
      {inputCode.length > 0 && (
        <TouchableOpacity style={styles.shareRow} onPress={shareCode}>
          <Ionicons name="share-outline" size={20} color={COLORS.primary} />
          <Text style={styles.shareText}>Send Magic Link</Text>
        </TouchableOpacity>
      )}

      <Animated.View style={{ transform: [{ scale }], marginTop: 24, width: '100%' }}>
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[styles.button, (!inputCode || !nickname) && styles.buttonDisabled]}
          disabled={!inputCode || !nickname}
        >
          <Text style={styles.buttonText}>Connect</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    padding: SIZES.padding,
    borderRadius: SIZES.cardRadius,
    marginHorizontal: 20,
    ...SHADOWS.card,
    alignItems: 'center',
    width: '100%',
  },
  label: {
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 8,
    marginTop: 16,
    fontWeight: '600',
    alignSelf: 'flex-start',
  },
  input: {
    width: '100%',
    backgroundColor: COLORS.background,
    borderRadius: SIZES.pillRadius,
    padding: 16,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 8,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
  },
  iconButton: {
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: SIZES.pillRadius,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginTop: 8,
    backgroundColor: COLORS.primary + '15',
    borderRadius: SIZES.pillRadius,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  shareText: {
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.pillRadius,
    paddingVertical: 14,
    width: '100%',
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: COLORS.textSecondary,
    opacity: 0.5,
  },
  buttonText: {
    color: COLORS.card,
    fontSize: 16,
    fontWeight: '700',
  },
});
