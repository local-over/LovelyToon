import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { SIZES, SHADOWS } from '../utils/constants';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export const TabBar = ({ activeTab, onTabChange }) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  const tabs = [
    { id: 'home', icon: 'home-outline', label: 'Home' },
    { id: 'history', icon: 'time-outline', label: 'History' },
    { id: 'settings', icon: 'settings-outline', label: 'Settings' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, isActive && { backgroundColor: colors.accent }]}
            onPress={() => onTabChange(tab.id)}
          >
            <Ionicons name={tab.icon} size={24} color={isActive ? colors.primary : colors.textSecondary} />
            <Text style={[styles.label, { color: isActive ? colors.primary : colors.textSecondary }]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
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
  label: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
  },
});
