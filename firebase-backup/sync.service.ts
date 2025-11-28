import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {
  saveWasteToFirebase,
  getUserWasteLocations,
  getAllPublicWasteLocations,
  deleteWasteFromFirebase,
} from './firebase.service';
import { getCurrentUser } from './auth.service';
import type { WasteLocation } from '@/utils/storage';

const SYNC_QUEUE_KEY = 'sync_queue';
const LAST_SYNC_KEY = 'last_sync_timestamp';
const OFFLINE_MODE_KEY = 'offline_mode';

export interface SyncQueueItem {
  id: string;
  action: 'create' | 'delete';
  data?: Omit<WasteLocation, 'id' | 'timestamp'>;
  timestamp: number;
}

/**
 * Verifica se há conexão com a internet
 */
export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected === true && state.isInternetReachable === true;
}

/**
 * Adiciona item à fila de sincronização
 */
async function addToSyncQueue(item: SyncQueueItem): Promise<void> {
  try {
    const queueJson = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    const queue: SyncQueueItem[] = queueJson ? JSON.parse(queueJson) : [];
    
    queue.push(item);
    
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    console.log('📝 Item adicionado à fila de sincronização:', item.action);
  } catch (error) {
    console.error('❌ Erro ao adicionar à fila de sincronização:', error);
  }
}

/**
 * Obtém fila de sincronização
 */
async function getSyncQueue(): Promise<SyncQueueItem[]> {
  try {
    const queueJson = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    return queueJson ? JSON.parse(queueJson) : [];
  } catch (error) {
    console.error('❌ Erro ao obter fila de sincronização:', error);
    return [];
  }
}

/**
 * Limpa fila de sincronização
 */
async function clearSyncQueue(): Promise<void> {
  try {
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify([]));
    console.log('✅ Fila de sincronização limpa');
  } catch (error) {
    console.error('❌ Erro ao limpar fila:', error);
  }
}

/**
 * Processa fila de sincronização
 */
export async function processSyncQueue(): Promise<void> {
  try {
    const user = getCurrentUser();
    if (!user) {
      console.log('⚠️ Usuário não autenticado, sincronização cancelada');
      return;
    }

    const online = await isOnline();
    if (!online) {
      console.log('⚠️ Sem conexão, sincronização adiada');
      return;
    }

    const queue = await getSyncQueue();
    if (queue.length === 0) {
      console.log('✅ Fila de sincronização vazia');
      return;
    }

    console.log(`🔄 Processando ${queue.length} itens da fila...`);

    const errors: string[] = [];

    for (const item of queue) {
      try {
        if (item.action === 'create' && item.data) {
          await saveWasteToFirebase(item.data);
          console.log(`✅ Registro ${item.id} sincronizado`);
        } else if (item.action === 'delete') {
          await deleteWasteFromFirebase(item.id);
          console.log(`✅ Deleção de ${item.id} sincronizada`);
        }
      } catch (error) {
        console.error(`❌ Erro ao sincronizar ${item.id}:`, error);
        errors.push(item.id);
      }
    }

    if (errors.length === 0) {
      await clearSyncQueue();
      await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
      console.log('✅ Sincronização completa!');
    } else {
      console.warn(`⚠️ ${errors.length} itens falharam na sincronização`);
      // Mantém apenas os itens que falharam na fila
      const failedItems = queue.filter(item => errors.includes(item.id));
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(failedItems));
    }
  } catch (error) {
    console.error('❌ Erro ao processar fila de sincronização:', error);
  }
}

/**
 * Salva registro localmente e adiciona à fila de sincronização
 */
export async function saveWasteLocationWithSync(
  wasteData: Omit<WasteLocation, 'id' | 'timestamp'>
): Promise<string> {
  try {
    // Cria ID temporário
    const tempId = `temp_${Date.now()}`;

    // Salva localmente
    const newLocation: WasteLocation = {
      id: tempId,
      timestamp: new Date().toISOString(),
      ...wasteData,
    };

    // Obtém dados locais
    const WASTE_LOCATIONS_KEY = 'waste_locations';
    const existingJson = await AsyncStorage.getItem(WASTE_LOCATIONS_KEY);
    const existingData: WasteLocation[] = existingJson ? JSON.parse(existingJson) : [];

    // Adiciona novo registro
    existingData.push(newLocation);
    await AsyncStorage.setItem(WASTE_LOCATIONS_KEY, JSON.stringify(existingData));

    console.log('💾 Registro salvo localmente:', tempId);

    // Verifica conexão
    const online = await isOnline();
    const user = getCurrentUser();

    if (online && user) {
      // Tenta sincronizar imediatamente
      try {
        const firebaseId = await saveWasteToFirebase(wasteData);
        
        // Atualiza ID local com ID do Firebase
        const updatedData = existingData.map(item => 
          item.id === tempId ? { ...item, id: firebaseId } : item
        );
        await AsyncStorage.setItem(WASTE_LOCATIONS_KEY, JSON.stringify(updatedData));
        
        console.log('🚀 Registro sincronizado imediatamente:', firebaseId);
        return firebaseId;
      } catch (error) {
        console.warn('⚠️ Erro na sincronização imediata, adicionando à fila:', error);
        await addToSyncQueue({
          id: tempId,
          action: 'create',
          data: wasteData,
          timestamp: Date.now(),
        });
      }
    } else {
      // Adiciona à fila para sincronizar depois
      await addToSyncQueue({
        id: tempId,
        action: 'create',
        data: wasteData,
        timestamp: Date.now(),
      });
      console.log('📤 Registro adicionado à fila de sincronização');
    }

    return tempId;
  } catch (error) {
    console.error('❌ Erro ao salvar com sincronização:', error);
    throw error;
  }
}

/**
 * Deleta registro localmente e adiciona à fila de sincronização
 */
export async function deleteWasteLocationWithSync(id: string): Promise<void> {
  try {
    // Deleta localmente
    const WASTE_LOCATIONS_KEY = 'waste_locations';
    const existingJson = await AsyncStorage.getItem(WASTE_LOCATIONS_KEY);
    const existingData: WasteLocation[] = existingJson ? JSON.parse(existingJson) : [];

    const updatedData = existingData.filter(item => item.id !== id);
    await AsyncStorage.setItem(WASTE_LOCATIONS_KEY, JSON.stringify(updatedData));

    console.log('💾 Registro deletado localmente:', id);

    // Verifica conexão
    const online = await isOnline();
    const user = getCurrentUser();

    if (online && user && !id.startsWith('temp_')) {
      // Tenta deletar do Firebase imediatamente
      try {
        await deleteWasteFromFirebase(id);
        console.log('🚀 Deleção sincronizada imediatamente:', id);
      } catch (error) {
        console.warn('⚠️ Erro na sincronização de deleção, adicionando à fila:', error);
        await addToSyncQueue({
          id,
          action: 'delete',
          timestamp: Date.now(),
        });
      }
    } else if (!id.startsWith('temp_')) {
      // Adiciona à fila para sincronizar depois
      await addToSyncQueue({
        id,
        action: 'delete',
        timestamp: Date.now(),
      });
      console.log('📤 Deleção adicionada à fila de sincronização');
    }
  } catch (error) {
    console.error('❌ Erro ao deletar com sincronização:', error);
    throw error;
  }
}

/**
 * Sincroniza dados do Firebase para o AsyncStorage local
 */
export async function syncFromFirebase(): Promise<void> {
  try {
    const user = getCurrentUser();
    if (!user) {
      console.log('⚠️ Usuário não autenticado');
      return;
    }

    const online = await isOnline();
    if (!online) {
      console.log('⚠️ Sem conexão para sincronizar');
      return;
    }

    console.log('📥 Sincronizando do Firebase...');

    // Busca registros do Firebase
    const firebaseData = await getUserWasteLocations();

    // Salva localmente
    const WASTE_LOCATIONS_KEY = 'waste_locations';
    await AsyncStorage.setItem(WASTE_LOCATIONS_KEY, JSON.stringify(firebaseData));

    await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString());

    console.log(`✅ ${firebaseData.length} registros sincronizados do Firebase`);
  } catch (error) {
    console.error('❌ Erro ao sincronizar do Firebase:', error);
  }
}

/**
 * Sincronização completa (bidirecional)
 */
export async function fullSync(): Promise<void> {
  try {
    console.log('🔄 Iniciando sincronização completa...');

    // 1. Processa fila local (envia para Firebase)
    await processSyncQueue();

    // 2. Baixa dados do Firebase
    await syncFromFirebase();

    console.log('✅ Sincronização completa finalizada!');
  } catch (error) {
    console.error('❌ Erro na sincronização completa:', error);
  }
}

/**
 * Obtém status de sincronização
 */
export async function getSyncStatus(): Promise<{
  lastSync: Date | null;
  queueSize: number;
  isOnline: boolean;
}> {
  try {
    const lastSyncTimestamp = await AsyncStorage.getItem(LAST_SYNC_KEY);
    const queue = await getSyncQueue();
    const online = await isOnline();

    return {
      lastSync: lastSyncTimestamp ? new Date(parseInt(lastSyncTimestamp)) : null,
      queueSize: queue.length,
      isOnline: online,
    };
  } catch (error) {
    console.error('❌ Erro ao obter status de sincronização:', error);
    return {
      lastSync: null,
      queueSize: 0,
      isOnline: false,
    };
  }
}

/**
 * Configura listener para mudanças na conectividade
 */
export function setupConnectivityListener(): () => void {
  const unsubscribe = NetInfo.addEventListener(state => {
    console.log('🌐 Status de conexão:', state.isConnected ? 'Online' : 'Offline');
    
    if (state.isConnected && state.isInternetReachable) {
      // Quando voltar online, processa a fila
      processSyncQueue();
    }
  });

  return unsubscribe;
}
