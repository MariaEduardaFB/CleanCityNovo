import AsyncStorage from '@react-native-async-storage/async-storage';
import { isOnline } from './network.service';

const QUEUE_KEY = 'offline_queue';
const QUEUE_PROCESSING_KEY = 'queue_processing';

export interface QueueItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  data?: any;
  timestamp: number;
  retries: number;
  error?: string;
}

export interface QueueStats {
  total: number;
  pending: number;
  failed: number;
  lastProcessed: number | null;
}

export async function addToQueue(
  type: QueueItem['type'],
  collection: string,
  data?: any
): Promise<string> {
  try {
    const queue = await getQueue();
    
    const item: QueueItem = {
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      collection,
      data,
      timestamp: Date.now(),
      retries: 0,
    };

    queue.push(item);
    await saveQueue(queue);

    console.log(`📤 Item adicionado à fila: ${type} ${collection}`);
    return item.id;
  } catch (error) {
    console.error('❌ Erro ao adicionar à fila:', error);
    throw error;
  }
}

export async function getQueue(): Promise<QueueItem[]> {
  try {
    const queueJson = await AsyncStorage.getItem(QUEUE_KEY);
    return queueJson ? JSON.parse(queueJson) : [];
  } catch (error) {
    console.error('❌ Erro ao obter fila:', error);
    return [];
  }
}

async function saveQueue(queue: QueueItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('❌ Erro ao salvar fila:', error);
  }
}

export async function removeFromQueue(id: string): Promise<void> {
  try {
    const queue = await getQueue();
    const updatedQueue = queue.filter(item => item.id !== id);
    await saveQueue(updatedQueue);
    console.log(`✅ Item removido da fila: ${id}`);
  } catch (error) {
    console.error('❌ Erro ao remover da fila:', error);
  }
}

export async function clearQueue(): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([]));
    console.log('🗑️ Fila limpa');
  } catch (error) {
    console.error('❌ Erro ao limpar fila:', error);
  }
}

export async function markQueueItemError(id: string, error: string): Promise<void> {
  try {
    const queue = await getQueue();
    const item = queue.find(i => i.id === id);
    
    if (item) {
      item.retries++;
      item.error = error;
      await saveQueue(queue);
      console.log(`⚠️ Item marcado com erro: ${id} (${item.retries} tentativas)`);
    }
  } catch (error) {
    console.error('❌ Erro ao marcar item com erro:', error);
  }
}

export async function processQueue(
  processor: (item: QueueItem) => Promise<void>
): Promise<{ success: number; failed: number }> {
  try {
    const isProcessing = await AsyncStorage.getItem(QUEUE_PROCESSING_KEY);
    if (isProcessing === 'true') {
      console.log('⚠️ Fila já está sendo processada');
      return { success: 0, failed: 0 };
    }

    const online = await isOnline();
    if (!online) {
      console.log('⚠️ Sem conexão, processamento adiado');
      return { success: 0, failed: 0 };
    }

    await AsyncStorage.setItem(QUEUE_PROCESSING_KEY, 'true');

    const queue = await getQueue();
    let successCount = 0;
    let failedCount = 0;

    console.log(`🔄 Processando ${queue.length} itens da fila...`);

    for (const item of queue) {
      if (item.retries >= 3) {
        console.log(`⏭️ Pulando item com muitas falhas: ${item.id}`);
        failedCount++;
        continue;
      }

      try {
        await processor(item);
        await removeFromQueue(item.id);
        successCount++;
        console.log(`✅ Item processado: ${item.id}`);
      } catch (error: any) {
        await markQueueItemError(item.id, error.message);
        failedCount++;
        console.error(`❌ Erro ao processar item ${item.id}:`, error);
      }
    }

    await AsyncStorage.setItem(QUEUE_PROCESSING_KEY, 'false');

    console.log(`📊 Processamento concluído: ${successCount} sucesso, ${failedCount} falhas`);
    return { success: successCount, failed: failedCount };
  } catch (error) {
    await AsyncStorage.setItem(QUEUE_PROCESSING_KEY, 'false');
    console.error('❌ Erro ao processar fila:', error);
    return { success: 0, failed: 0 };
  }
}

export async function getQueueStats(): Promise<QueueStats> {
  try {
    const queue = await getQueue();
    
    const failed = queue.filter(item => item.retries >= 3).length;
    const pending = queue.length - failed;
    
    const lastProcessed = queue.length > 0
      ? Math.max(...queue.map(item => item.timestamp))
      : null;

    return {
      total: queue.length,
      pending,
      failed,
      lastProcessed,
    };
  } catch (error) {
    console.error('❌ Erro ao obter stats da fila:', error);
    return {
      total: 0,
      pending: 0,
      failed: 0,
      lastProcessed: null,
    };
  }
}

export async function cleanOldQueueItems(): Promise<void> {
  try {
    const queue = await getQueue();
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
    const cleaned = queue.filter(item => item.timestamp > sevenDaysAgo);
    const removedCount = queue.length - cleaned.length;
    
    if (removedCount > 0) {
      await saveQueue(cleaned);
      console.log(`🧹 ${removedCount} itens antigos removidos da fila`);
    }
  } catch (error) {
    console.error('❌ Erro ao limpar fila antiga:', error);
  }
}
