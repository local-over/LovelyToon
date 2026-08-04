import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../utils/constants';

export const PairingCode = ({ code, onConnect }) => {
  const [inputCode, setInputCode] = useState(code || '');
  const scale = new Animated.Value(1);

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
    onConnect(inputCode);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Enter your partner's code to connect 💕</Text>
      <TextInput
        style={styles.input}
        value={inputCode}
        onChangeText={setInputCode}
        placeholder="e.g. lovely123"
        placeholderTextColor={COLORS.textSecondary}
        autoCapitalize="none"
      />
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.button}
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
  },
  label: {
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: COLORS.background,
    borderRadius: SIZES.pillRadius,
    padding: 16,
    fontSize: 18,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.pillRadius,
    paddingVertical: 14,
    paddingHorizontal: 32,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.card,
    fontSize: 16,
    fontWeight: '700',
  },
});
