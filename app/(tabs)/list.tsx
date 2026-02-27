import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { deleteWasteLocation, getWasteLocations } from '@/utils/storage';
import { useOccurrences } from '@/hooks/useOccurrences';

export default function ListScreen() {
  const [wasteLocations, setWasteLocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { fetchOccurrences } = useOccurrences();

  const getLocationName = (latitude?: number, longitude?: number): string => {
    if (latitude === undefined || longitude === undefined) return 'Localização indisponível';
    return `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;
  };

  const getRelativeDate = (timestamp: string): string => {
    if (!timestamp) return 'Data indisponível';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffInHours < 1) return 'Agora há pouco';
    if (diffInHours < 24) return `Há ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    if (diffInHours < 48) return 'Ontem';
    return date.toLocaleDateString('pt-BR');
  };

  const loadWasteLocations = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetchOccurrences();
      
      const apiItems = response?.data || (Array.isArray(response) ? response : []);
      const localItems = await getWasteLocations() || [];
      
      const combined = [...apiItems, ...localItems];
      
      const uniqueMap = new Map();
      combined.forEach(item => {
        if (item.id) uniqueMap.set(item.id, item);
      });

      const sorted = Array.from(uniqueMap.values()).sort((a, b) => {
        const dateA = new Date(a.createdAt || a.timestamp).getTime();
        const dateB = new Date(b.createdAt || b.timestamp).getTime();
        return dateB - dateA;
      });

      setWasteLocations(sorted);
    } catch (error) {
      console.error('Erro ao processar lista:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchOccurrences]);

  useFocusEffect(
    useCallback(() => {
      loadWasteLocations();
    }, [loadWasteLocations])
  );

  const renderWasteItem = ({ item }: { item: any }) => (
    <View style={styles.itemCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <MaterialIcons name="report-problem" size={24} color="#FF9800" />
          <ThemedText style={styles.cardTitle} numberOfLines={2}>
            {item.description || 'Sem descrição'}
          </ThemedText>
        </View>
      </View>

      {/* FOTO REAL */}
      {item.photos && item.photos.length > 0 && (
        <View style={styles.photosSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {item.photos.map((photo: any, index: number) => {
              
              const imageUrl = typeof photo === 'string' ? photo : (photo.filePath || photo.url || photo.uri);
              
              if (imageUrl && imageUrl.includes('imagem_virtual')) return null;

              return (
                <Image
                  key={index}
                  source={{ uri: imageUrl }}
                  style={styles.photo}
                  contentFit="cover"
                  transition={200} 
                />
              );
            })}
          </ScrollView>
        </View>
      )}

      <View style={styles.detailsSection}>
        <View style={styles.detailRow}>
          <MaterialIcons size={16} color="#2196F3" name="location-on" />
          <ThemedText style={styles.detailValue}>{getLocationName(item.latitude, item.longitude)}</ThemedText>
        </View>
        <View style={styles.detailRow}>
          <MaterialIcons size={16} color="#4CAF50" name="schedule" />
          <ThemedText style={styles.detailValue}>{getRelativeDate(item.createdAt || item.timestamp)}</ThemedText>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.appTitle}>Clean City</ThemedText>
        <View style={styles.statBadge}>
          <ThemedText style={styles.statText}>{wasteLocations.length} registros</ThemedText>
        </View>
      </View>

      <FlatList
        data={wasteLocations}
        renderItem={renderWasteItem}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadWasteLocations} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons size={64} name="inbox" color="#CBD5E0" />
            <ThemedText>Nenhuma ocorrência encontrada</ThemedText>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingHorizontal: 20, paddingBottom: 20,
    backgroundColor: '#1e3c72', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  appTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  statBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statText: { color: '#fff', fontWeight: '600' },
  listContent: { padding: 20, paddingBottom: 100 },
  itemCard: { 
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16,
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 
  },
  cardHeader: { marginBottom: 12 },
  cardTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1A202C' },
  photosSection: { marginBottom: 15 },
  photo: { width: 120, height: 120, borderRadius: 12, backgroundColor: '#EDF2F7' },
  detailsSection: { gap: 8, borderTopWidth: 1, borderTopColor: '#EDF2F7', paddingTop: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailValue: { fontSize: 14, color: '#4A5568' },
  emptyContainer: { alignItems: 'center', marginTop: 100 }
});