import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../utils/constants';

import { Ionicons } from '@expo/vector-icons';

export const TabBar = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'home', icon: 'home-outline', label: 'Home' },
    { id: 'history', icon: 'time-outline', label: 'History' },
    { id: 'settings', icon: 'settings-outline', label: 'Settings' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, isActive && styles.activeTab]}
            onPress={() => onTabChange(tab.id)}
          >
            <Ionicons name={tab.icon} size={24} color={isActive ? COLORS.primary : COLORS.textSecondary} />
            <Text style={[styles.label, !isActive && styles.inactiveLabel]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 8,
    borderRadius: SIZES.pillRadius,
    ...SHADOWS.card,
    justifyContent: 'space-between',
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: SIZES.pillRadius,
  },
  activeTab: {
    backgroundColor: COLORS.accent,
  },
  label: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  inactiveLabel: {
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
