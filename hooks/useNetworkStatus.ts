import { useState, useEffect } from 'react';
import {
  addNetworkListener,
  getNetworkStatus,
  NetworkStatus,
} from '@/services/network.service';

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: false,
    isInternetReachable: null,
    type: 'unknown',
  });

  useEffect(() => {
    getNetworkStatus().then(setStatus);

    const unsubscribe = addNetworkListener(setStatus);

    return unsubscribe;
  }, []);

  return {
    isOnline: status.isConnected && status.isInternetReachable !== false,
    isOffline: !status.isConnected,
    connectionType: status.type,
    isWiFi: status.type === 'wifi',
    isCellular: status.type === 'cellular',
  };
}
