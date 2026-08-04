import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SectionList, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HistoryItem } from '../components/HistoryItem';
import { StorageService } from '../services/StorageService';
import { COLORS } from '../utils/constants';

export const HistoryScreen = () => {
  const [sections, setSections] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const data = await StorageService.getHistory();
    const myName = await StorageService.getNickname() || 'Me';
    
    // Group by sender
    const grouped = data.reduce((acc, item) => {
      const groupName = item.direction === 'sent' ? `${myName}'s History` : `${item.senderName || 'Partner'}'s History`;
      if (!acc[groupName]) acc[groupName] = [];
      acc[groupName].push(item);
      return acc;
    }, {});
    
    const formattedSections = Object.keys(grouped).map(key => ({
      title: key,
      data: grouped[key]
    }));
    
    setSections(formattedSections);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Listening History</Text>
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => `${item.timestamp}-${index}`}
        renderItem={({ item }) => <HistoryItem item={item} />}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{title}</Text>
          </View>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No songs yet. Share some music!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 24,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  list: {
    paddingVertical: 12,
  },
  sectionHeader: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    paddingVertical: 8,
    marginTop: 16,
    marginBottom: 8,
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
