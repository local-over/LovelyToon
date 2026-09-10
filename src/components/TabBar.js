import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { SIZES, SHADOWS, ANIMATION } from '../utils/constants';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TabItem = ({ tab, isActive, onPress, colors }) => {
  const scale = useRef(new Animated.Value(isActive ? 1.1 : 1)).current;
  const bgOpacity = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: isActive ? 1.1 : 1,
        ...ANIMATION.spring.smooth,
        useNativeDriver: true,
      }),
      Animated.timing(bgOpacity, {
        toValue: isActive ? 1 : 0,
        duration: ANIMATION.timing.fast,
        useNativeDriver: false,
      })
    ]).start();
  }, [isActive]);

  const activeIcon = tab.icon.replace('-outline', '');
  
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.tab}
      onPress={() => onPress(tab.id)}
    >
      <Animated.View style={[
        styles.tabInner, 
        { 
          backgroundColor: bgOpacity.interpolate({
            inputRange: [0, 1],
            outputRange: ['transparent', colors.accent]
          })
        }
      ]}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons 
            name={isActive ? activeIcon : tab.icon} 
            size={24} 
            color={isActive ? colors.primary : colors.textSecondary} 
          />
        </Animated.View>
        {isActive && (
          <Text style={[styles.label, { color: colors.primary }]}>{tab.label}</Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

export const TabBar = ({ activeTab, onTabChange }) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();

  const tabs = [
    { id: 'home', icon: 'home-outline', label: 'Home' },
    { id: 'history', icon: 'time-outline', label: 'History' },
    { id: 'settings', icon: 'settings-outline', label: 'Settings' },
  ];

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: colors.card, 
        paddingBottom: 8, 
        bottom: Math.max(insets.bottom, 20) 
      },
      SHADOWS.card
    ]}>
      {tabs.map((tab) => (
        <TabItem 
          key={tab.id}
          tab={tab}
          isActive={activeTab === tab.id}
          onPress={onTabChange}
          colors={colors}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: 20,
    paddingHorizontal: 8,
    paddingTop: 8,
    borderRadius: SIZES.pillRadius,
    justifyContent: 'space-between',
    position: 'absolute',
    left: 0,
    right: 0,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: SIZES.pillRadius,
  },
  label: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '700',
  },
});
