import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../utils/constants';

export const TabBar = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'home', icon: '🏠', label: 'Home' },
    { id: 'history', icon: '📜', label: 'History' },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
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
            <Text style={styles.icon}>{tab.icon}</Text>
            {isActive && <Text style={styles.label}>{tab.label}</Text>}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: SIZES.pillRadius,
  },
  activeTab: {
    backgroundColor: COLORS.accent,
  },
  icon: {
    fontSize: 20,
  },
  label: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
});
