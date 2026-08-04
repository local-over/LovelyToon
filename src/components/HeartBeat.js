import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';

export const HeartBeat = ({ connected }) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (connected) {
      Animated.loop(
        Animated.sequence([
          Animated.spring(scale, {
            toValue: 1.2,
            friction: 2,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.spring(scale, {
            toValue: 1,
            friction: 2,
            tension: 40,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scale.setValue(1);
    }
  }, [connected]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons 
          name={connected ? "heart" : "heart-outline"} 
          size={32} 
          color={connected ? COLORS.primary : COLORS.textSecondary} 
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heart: {
    fontSize: 24,
  },
});
