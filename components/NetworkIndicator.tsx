import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { addNetworkListener, NetworkStatus } from '@/services/network.service';

export function NetworkIndicator() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    const unsubscribe = addNetworkListener((status) => {
      setNetworkStatus(status);

      // Anima entrada
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(3000),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });

    return unsubscribe;
  }, []);

  if (!networkStatus) return null;

  const isOffline = !networkStatus.isConnected;
  const isSlowConnection = networkStatus.type === 'cellular';

  if (!isOffline && !isSlowConnection) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={[styles.banner, isOffline ? styles.offline : styles.cellular]}>
        <MaterialIcons
          name={isOffline ? 'cloud-off' : 'signal-cellular-alt'}
          size={20}
          color="#fff"
        />
        <Text style={styles.text}>
          {isOffline ? 'Modo Offline' : 'Conexão Lenta'}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  offline: {
    backgroundColor: '#f44336',
  },
  cellular: {
    backgroundColor: '#ff9800',
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
