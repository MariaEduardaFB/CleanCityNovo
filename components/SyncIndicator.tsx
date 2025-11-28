import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getQueueStats, QueueStats } from '@/services/offline-queue.service';

interface SyncIndicatorProps {
  onPress?: () => void;
}

export function SyncIndicator({ onPress }: SyncIndicatorProps) {
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadStats = async () => {
    const queueStats = await getQueueStats();
    setStats(queueStats);
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 5000); // Atualiza a cada 5s

    return () => clearInterval(interval);
  }, []);

  if (!stats || stats.total === 0) return null;

  const handlePress = () => {
    if (onPress) {
      setIsLoading(true);
      onPress();
      setTimeout(() => {
        loadStats();
        setIsLoading(false);
      }, 1000);
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      disabled={isLoading}
      activeOpacity={0.7}
    >
      <View style={[styles.badge, stats.failed > 0 ? styles.error : styles.pending]}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <MaterialIcons
              name={stats.failed > 0 ? 'sync-problem' : 'sync'}
              size={18}
              color="#fff"
            />
            <Text style={styles.text}>
              {stats.pending > 0 ? `${stats.pending} pendente${stats.pending > 1 ? 's' : ''}` : 'Sincronizar'}
            </Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90,
    right: 16,
    zIndex: 1000,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  pending: {
    backgroundColor: '#2196F3',
  },
  error: {
    backgroundColor: '#f44336',
  },
  text: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
