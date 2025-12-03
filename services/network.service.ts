import NetInfo from '@react-native-community/netinfo';

export type ConnectionType = 'wifi' | 'cellular' | 'none' | 'unknown';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: ConnectionType;
}

let currentNetworkStatus: NetworkStatus = {
  isConnected: false,
  isInternetReachable: null,
  type: 'unknown',
};

const listeners: ((status: NetworkStatus) => void)[] = [];

export function initializeNetworkListener(): () => void {
  const unsubscribe = NetInfo.addEventListener(state => {
    const newStatus: NetworkStatus = {
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable,
      type: (state.type as ConnectionType) || 'unknown',
    };

    currentNetworkStatus = newStatus;

    listeners.forEach(listener => listener(newStatus));

    console.log('🌐 Status de rede:', newStatus.isConnected ? 'Online' : 'Offline');
  });

  return unsubscribe;
}

export async function getNetworkStatus(): Promise<NetworkStatus> {
  const state = await NetInfo.fetch();
  
  const status: NetworkStatus = {
    isConnected: state.isConnected ?? false,
    isInternetReachable: state.isInternetReachable,
    type: (state.type as ConnectionType) || 'unknown',
  };

  currentNetworkStatus = status;
  return status;
}

export async function isOnline(): Promise<boolean> {
  const status = await getNetworkStatus();
  return status.isConnected && status.isInternetReachable !== false;
}

export function addNetworkListener(callback: (status: NetworkStatus) => void): () => void {
  listeners.push(callback);
  
  return () => {
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
}

export function getCurrentNetworkStatus(): NetworkStatus {
  return currentNetworkStatus;
}

export function isWiFiConnection(): boolean {
  return currentNetworkStatus.type === 'wifi';
}

export function isCellularConnection(): boolean {
  return currentNetworkStatus.type === 'cellular';
}
