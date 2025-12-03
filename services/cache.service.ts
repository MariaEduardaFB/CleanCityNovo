import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'cache_';
const CACHE_METADATA_KEY = 'cache_metadata';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface CacheMetadata {
  [key: string]: {
    lastAccessed: number;
    size: number;
  };
}

export async function setCache<T>(
  key: string,
  data: T,
  ttlMinutes: number = 30
): Promise<void> {
  try {
    const now = Date.now();
    const cacheEntry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttlMinutes * 60 * 1000,
    };

    const cacheKey = `${CACHE_PREFIX}${key}`;
    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheEntry));

    await updateCacheMetadata(key, JSON.stringify(cacheEntry).length);

    console.log(`💾 Cache salvo: ${key} (${ttlMinutes}min TTL)`);
  } catch (error) {
    console.error('❌ Erro ao salvar cache:', error);
  }
}

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const cached = await AsyncStorage.getItem(cacheKey);

    if (!cached) {
      console.log(`⚠️ Cache miss: ${key}`);
      return null;
    }

    const cacheEntry: CacheEntry<T> = JSON.parse(cached);
    const now = Date.now();

    if (now > cacheEntry.expiresAt) {
      console.log(`⏰ Cache expirado: ${key}`);
      await deleteCache(key);
      return null;
    }

    await updateCacheMetadata(key, cached.length);

    console.log(`✅ Cache hit: ${key}`);
    return cacheEntry.data;
  } catch (error) {
    console.error('❌ Erro ao buscar cache:', error);
    return null;
  }
}

export async function deleteCache(key: string): Promise<void> {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    await AsyncStorage.removeItem(cacheKey);
    await removeCacheMetadata(key);
    console.log(`🗑️ Cache deletado: ${key}`);
  } catch (error) {
    console.error('❌ Erro ao deletar cache:', error);
  }
}

export async function clearAllCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
    
    await AsyncStorage.multiRemove(cacheKeys);
    await AsyncStorage.removeItem(CACHE_METADATA_KEY);
    
    console.log(`🗑️ ${cacheKeys.length} entradas de cache deletadas`);
  } catch (error) {
    console.error('❌ Erro ao limpar cache:', error);
  }
}

export async function isCacheValid(key: string): Promise<boolean> {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const cached = await AsyncStorage.getItem(cacheKey);

    if (!cached) return false;

    const cacheEntry: CacheEntry<unknown> = JSON.parse(cached);
    const now = Date.now();

    return now <= cacheEntry.expiresAt;
  } catch (error) {
    return false;
  }
}

async function updateCacheMetadata(key: string, size: number): Promise<void> {
  try {
    const metadataJson = await AsyncStorage.getItem(CACHE_METADATA_KEY);
    const metadata: CacheMetadata = metadataJson ? JSON.parse(metadataJson) : {};

    metadata[key] = {
      lastAccessed: Date.now(),
      size,
    };

    await AsyncStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(metadata));
  } catch (error) {
    console.error('❌ Erro ao atualizar metadata:', error);
  }
}

async function removeCacheMetadata(key: string): Promise<void> {
  try {
    const metadataJson = await AsyncStorage.getItem(CACHE_METADATA_KEY);
    if (!metadataJson) return;

    const metadata: CacheMetadata = JSON.parse(metadataJson);
    delete metadata[key];

    await AsyncStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(metadata));
  } catch (error) {
    console.error('❌ Erro ao remover metadata:', error);
  }
}

export async function getCacheStats(): Promise<{
  entries: number;
  totalSize: number;
  oldestEntry: number | null;
}> {
  try {
    const metadataJson = await AsyncStorage.getItem(CACHE_METADATA_KEY);
    if (!metadataJson) {
      return { entries: 0, totalSize: 0, oldestEntry: null };
    }

    const metadata: CacheMetadata = JSON.parse(metadataJson);
    const entries = Object.keys(metadata).length;
    const totalSize = Object.values(metadata).reduce((sum, entry) => sum + entry.size, 0);
    const oldestEntry = Object.values(metadata).reduce(
      (oldest, entry) => Math.min(oldest, entry.lastAccessed),
      Date.now()
    );

    return { entries, totalSize, oldestEntry };
  } catch (error) {
    console.error('❌ Erro ao obter stats do cache:', error);
    return { entries: 0, totalSize: 0, oldestEntry: null };
  }
}

export async function cleanOldCache(maxAgeMinutes: number = 60): Promise<void> {
  try {
    const metadataJson = await AsyncStorage.getItem(CACHE_METADATA_KEY);
    if (!metadataJson) return;

    const metadata: CacheMetadata = JSON.parse(metadataJson);
    const now = Date.now();
    const maxAge = maxAgeMinutes * 60 * 1000;

    let deletedCount = 0;

    for (const [key, meta] of Object.entries(metadata)) {
      if (now - meta.lastAccessed > maxAge) {
        await deleteCache(key);
        deletedCount++;
      }
    }

    console.log(`🧹 ${deletedCount} entradas antigas de cache removidas`);
  } catch (error) {
    console.error('❌ Erro ao limpar cache antigo:', error);
  }
}
