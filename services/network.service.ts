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

/**
 * Inicializa o listener de rede
 */
export function initializeNetworkListener(): () => void {
  const unsubscribe = NetInfo.addEventListener(state => {
    const newStatus: NetworkStatus = {
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable,
      type: (state.type as ConnectionType) || 'unknown',
    };

    currentNetworkStatus = newStatus;

    // Notifica todos os listeners
    listeners.forEach(listener => listener(newStatus));

    console.log('🌐 Status de rede:', newStatus.isConnected ? 'Online' : 'Offline');
  });

  return unsubscribe;
}

/**
 * Obtém o status atual da rede
 */
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

/**
 * Verifica se está online
 */
export async function isOnline(): Promise<boolean> {
  const status = await getNetworkStatus();
  return status.isConnected && status.isInternetReachable !== false;
}

/**
 * Adiciona listener de mudanças de rede
 */
export function addNetworkListener(callback: (status: NetworkStatus) => void): () => void {
  listeners.push(callback);
  
  // Retorna função para remover listener
  return () => {
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
}

/**
 * Obtém status de rede sem fazer fetch (usa o cache)
 */
export function getCurrentNetworkStatus(): NetworkStatus {
  return currentNetworkStatus;
}

/**
 * Verifica se a conexão é WiFi
 */
export function isWiFiConnection(): boolean {
  return currentNetworkStatus.type === 'wifi';
}

/**
 * Verifica se a conexão é celular
 */
export function isCellularConnection(): boolean {
  return currentNetworkStatus.type === 'cellular';
}
