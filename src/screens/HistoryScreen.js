import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, FlatList, LayoutAnimation, Platform, UIManager, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { HistoryItem } from '../components/HistoryItem';
import { StorageService } from '../services/StorageService';
import { useTheme } from '../context/ThemeContext';
import { SIZES, SHADOWS } from '../utils/constants';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SESSION_GAP_MS = 60 * 60 * 1000; // 1 hour

const formatTimeOnly = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const strTime = hours + ':' + (minutes < 10 ? '0' + minutes : minutes) + ' ' + ampm;
  return strTime;
};

const formatDateOnly = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const SessionCard = ({ session, colors }) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View style={[styles.sessionCard, { backgroundColor: colors.card }]}>
      <TouchableOpacity 
        style={styles.sessionHeader} 
        onPress={toggleExpand}
        activeOpacity={0.7}
      >
        <View style={styles.sessionInfo}>
          <Text style={[styles.sessionTitle, { color: colors.textPrimary }]}>
            {session.senderName}'s Session
          </Text>
          <Text style={[styles.sessionTime, { color: colors.textSecondary }]}>
            {formatDateOnly(session.startTime)} • {formatTimeOnly(session.startTime)} - {formatTimeOnly(session.endTime)}
          </Text>
          <Text style={[styles.songCount, { color: colors.primary }]}>
            {session.items.length} {session.items.length === 1 ? 'song' : 'songs'}
          </Text>
        </View>
        <Ionicons 
          name={expanded ? "chevron-up" : "chevron-down"} 
          size={24} 
          color={colors.textSecondary} 
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.sessionItems}>
          {session.items.map((item, index) => (
            <HistoryItem key={`${item.timestamp}-${index}`} item={item} />
          ))}
        </View>
      )}
    </View>
  );
};

export const HistoryScreen = () => {
  const [sessions, setSessions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const { theme } = useTheme();
  const colors = theme.colors;

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const data = await StorageService.getHistory();
    const myName = await StorageService.getNickname() || 'Me';
    
    if (!data || data.length === 0) {
      setSessions([]);
      return;
    }

    // Sort ascending by timestamp first to build sessions chronologically
    const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);

    const groupedSessions = [];
    let currentSession = null;

    sortedData.forEach((item) => {
      const senderName = item.direction === 'sent' ? myName : (item.senderName || 'Partner');
      
      if (!currentSession) {
        currentSession = {
          id: item.timestamp.toString(),
          senderName,
          startTime: item.timestamp,
          endTime: item.timestamp,
          items: [item]
        };
      } else {
        const timeDiff = item.timestamp - currentSession.endTime;
        
        if (senderName === currentSession.senderName && timeDiff <= SESSION_GAP_MS) {
          // Add to current session
          currentSession.endTime = item.timestamp;
          // Reverse order inside session so newest song is on top
          currentSession.items.unshift(item);
        } else {
          // Push current session and start a new one
          groupedSessions.push(currentSession);
          currentSession = {
            id: item.timestamp.toString(),
            senderName,
            startTime: item.timestamp,
            endTime: item.timestamp,
            items: [item]
          };
        }
      }
    });

    if (currentSession) {
      groupedSessions.push(currentSession);
    }

    // Reverse the sessions array so the most recent session is at the top
    groupedSessions.reverse();

    setSessions(groupedSessions);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Listening History</Text>
      </View>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SessionCard session={item} colors={colors} />}
        contentContainerStyle={[styles.list, sessions.length === 0 && {flex: 1}]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="musical-notes-outline" size={80} color={colors.accent} style={{marginBottom: 16}} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No history yet.</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary, opacity: 0.7 }]}>Songs you listen to while connected will appear here.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  list: {
    paddingVertical: 12,
  },
  sessionCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: SIZES.cardRadius,
    ...SHADOWS.card,
    overflow: 'hidden',
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  sessionTime: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  songCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  sessionItems: {
    paddingBottom: 16,
  },
  empty: {
    flex: 1,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  }
});
