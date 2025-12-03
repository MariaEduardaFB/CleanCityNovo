import { useState, useEffect, useCallback } from 'react';
import {
  occurrenceApiService,
  CreateOccurrenceData,
  UpdateOccurrenceData,
  GetOccurrencesParams,
  GetByBoundsParams,
} from '@/services/occurrence-api.service';
import type { Occurrence } from '@/services/api.service';

export function useOccurrences() {
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOccurrences = useCallback(async (params?: GetOccurrencesParams) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await occurrenceApiService.getAll(params);
      
      if (response.success && response.data) {
        setOccurrences(response.data);
      } else {
        setError(response.error?.message || 'Erro ao carregar ocorrências');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMyOccurrences = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await occurrenceApiService.getMyOccurrences();
      
      if (response.success && response.data) {
        setOccurrences(response.data);
      } else {
        setError(response.error?.message || 'Erro ao carregar suas ocorrências');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadOccurrencesByBounds = useCallback(async (params: GetByBoundsParams) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await occurrenceApiService.getByBounds(params);
      
      if (response.success && response.data) {
        setOccurrences(response.data);
      } else {
        setError(response.error?.message || 'Erro ao carregar ocorrências');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createOccurrence = useCallback(async (data: CreateOccurrenceData): Promise<Occurrence | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await occurrenceApiService.create(data);
      
      if (response.success && response.data) {
        setOccurrences((prev) => [response.data!, ...prev]);
        return response.data;
      } else {
        setError(response.error?.message || 'Erro ao criar ocorrência');
        return null;
      }
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOccurrence = useCallback(async (
    id: string,
    data: UpdateOccurrenceData
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await occurrenceApiService.update(id, data);
      
      if (response.success && response.data) {
        setOccurrences((prev) =>
          prev.map((occ) => (occ.id === id ? response.data! : occ))
        );
        return true;
      } else {
        setError(response.error?.message || 'Erro ao atualizar ocorrência');
        return false;
      }
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteOccurrence = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await occurrenceApiService.delete(id);
      
      if (response.success) {
        setOccurrences((prev) => prev.filter((occ) => occ.id !== id));
        return true;
      } else {
        setError(response.error?.message || 'Erro ao deletar ocorrência');
        return false;
      }
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getOccurrenceById = useCallback(async (id: string): Promise<Occurrence | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await occurrenceApiService.getById(id);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.error?.message || 'Erro ao buscar ocorrência');
        return null;
      }
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    occurrences,
    loading,
    isLoading: loading,
    error,
    loadOccurrences,
    fetchOccurrences: loadOccurrences,
    loadMyOccurrences,
    loadOccurrencesByBounds,
    createOccurrence,
    updateOccurrence,
    deleteOccurrence,
    getOccurrenceById,
  };
}

export function useOccurrenceStats() {
  const [stats, setStats] = useState<{
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
    rejected: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await occurrenceApiService.getStats();
      
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError(response.error?.message || 'Erro ao carregar estatísticas');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    refreshStats: loadStats,
  };
}
