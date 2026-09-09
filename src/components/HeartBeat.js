import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ANIMATION } from '../utils/constants';

export const HeartBeat = ({ connected }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const animRef = useRef(null);
  const { theme } = useTheme();
  const colors = theme.colors;

  useEffect(() => {
    if (connected) {
      animRef.current = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.spring(scale, {
              toValue: 1.15,
              ...ANIMATION.spring.smooth,
              useNativeDriver: true,
            }),
            Animated.spring(scale, {
              toValue: 1,
              ...ANIMATION.spring.bouncy,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(glowOpacity, {
              toValue: 0.3,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(glowOpacity, {
              toValue: 0.1,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        ])
      );
      animRef.current.start();
    } else {
      if (animRef.current) {
        animRef.current.stop();
      }
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, ...ANIMATION.spring.smooth, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0, duration: 300, useNativeDriver: true })
      ]).start();
    }
    
    return () => {
      if (animRef.current) animRef.current.stop();
    };
  }, [connected]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.glow, { 
        backgroundColor: colors.primary,
        opacity: glowOpacity,
        transform: [{ scale: Animated.multiply(scale, 1.5) }]
      }]} />
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons 
          name={connected ? "heart" : "heart-outline"} 
          size={32} 
          color={connected ? colors.primary : colors.textSecondary} 
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
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
  }
});
