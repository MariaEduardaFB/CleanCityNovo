import { useState, useEffect, useCallback } from 'react';
import {
  getQueueStats,
  processQueue,
  QueueStats,
  QueueItem,
} from '@/services/offline-queue.service';
import { useNetworkStatus } from './useNetworkStatus';

export function useOfflineQueue(
  processor?: (item: QueueItem) => Promise<void>
) {
  const [stats, setStats] = useState<QueueStats>({
    total: 0,
    pending: 0,
    failed: 0,
    lastProcessed: null,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const { isOnline } = useNetworkStatus();

  const refreshStats = useCallback(async () => {
    const newStats = await getQueueStats();
    setStats(newStats);
  }, []);

  const process = useCallback(async () => {
    if (!processor || !isOnline || isProcessing) return;

    setIsProcessing(true);
    try {
      await processQueue(processor);
      await refreshStats();
    } catch (error) {
      console.error('❌ Erro ao processar fila:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [processor, isOnline, isProcessing, refreshStats]);

  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 5000); // Atualiza a cada 5s

    return () => clearInterval(interval);
  }, [refreshStats]);

  // Auto-processa quando voltar online
  useEffect(() => {
    if (isOnline && stats.pending > 0 && processor) {
      process();
    }
  }, [isOnline]);

  return {
    stats,
    isProcessing,
    process,
    refreshStats,
  };
}
