import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export const VinylRecord = ({ isPlaying }) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const currentSpin = useRef(0);
  const { theme } = useTheme();
  const colors = theme.colors;

  useEffect(() => {
    let animation;
    if (isPlaying) {
      animation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      // If we stopped previously, we'll just let it jump for now 
      // since keeping track of exact angle requires listener. 
      // But we can improve it slightly by keeping state if needed.
      animation.start();
    } else {
      spinValue.stopAnimation();
    }
    return () => {
      if (animation) animation.stop();
    };
  }, [isPlaying]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.record, { transform: [{ rotate: spin }] }]}>
        <View style={styles.groove} />
        <View style={styles.grooveInner} />
        <View style={[styles.label, { backgroundColor: colors.primary }]}>
          <View style={[styles.hole, { backgroundColor: colors.background }]} />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  record: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  groove: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1,
    borderColor: '#333',
  },
  grooveInner: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: '#222',
  },
  label: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hole: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
