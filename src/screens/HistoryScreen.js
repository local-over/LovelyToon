import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HistoryItem } from '../components/HistoryItem';
import { StorageService } from '../services/StorageService';
import { COLORS } from '../utils/constants';

export const HistoryScreen = () => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const data = await StorageService.getHistory();
    setHistory(data);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Listening History</Text>
      </View>
      <FlatList
        data={history}
        keyExtractor={(item, index) => `${item.timestamp}-${index}`}
        renderItem={({ item }) => <HistoryItem item={item} />}
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
