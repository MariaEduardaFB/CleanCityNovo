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
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import {
  deleteWasteLocation,
  getWasteLocations,
  WasteLocation,
} from '@/utils/storage';

export default function ListScreen() {
  const [wasteLocations, setWasteLocations] = useState<WasteLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  
  const getLocationName = (latitude: number, longitude: number): string => {
    return `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;
  };

  
  const getRelativeDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) {
      return 'Agora há pouco';
    } else if (diffInHours < 24) {
      return `Há ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    } else if (diffInHours < 48) {
      return 'Ontem';
    } else if (diffInHours < 24 * 7) {
      const days = Math.floor(diffInHours / 24);
      return `Há ${days} dia${days > 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  };

  const loadWasteLocations = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('📋 Carregando lista detalhada de ocorrências...');
      const locations = await getWasteLocations();
      console.log('📍 Ocorrências carregadas na lista:', locations.length);
      setWasteLocations(locations);
    } catch (error) {
      console.error('❌ Erro ao carregar lista de ocorrências:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  
  useFocusEffect(
    useCallback(() => {
      loadWasteLocations();
    }, [loadWasteLocations])
  );

  const handleDeleteLocation = async (id: string, description: string) => {
    Alert.alert(
      'Confirmar exclusão',
      `Tem certeza que deseja excluir o registro "${description}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWasteLocation(id);
              await loadWasteLocations();
              console.log('🗑️ Registro excluído com sucesso');
            } catch (error) {
              console.error('❌ Erro ao excluir registro:', error);
              Alert.alert('Erro', 'Não foi possível excluir o registro.');
            }
          },
        },
      ]
    );
  };

  const renderWasteItem = ({ item }: { item: WasteLocation }) => (
    <View style={styles.itemCard}>
      
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <MaterialIcons name="report-problem" size={24} color="#FF9800" />
          <ThemedText style={styles.cardTitle} numberOfLines={2}>
            {item.description}
          </ThemedText>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteLocation(item.id, item.description)}
        >
          <MaterialIcons size={20} color="#FF4444" name="delete-outline" />
        </TouchableOpacity>
      </View>

      
      {item.photos.length > 0 && (
        <View style={styles.photosSection}>
          <View style={styles.photoHeader}>
            <MaterialIcons size={18} color="#9C27B0" name="photo-library" />
            <ThemedText style={styles.photoHeaderText}>
              {item.photos.length} evidência{item.photos.length > 1 ? 's' : ''}{' '}
              fotográfica{item.photos.length > 1 ? 's' : ''}
            </ThemedText>
          </View>
          <ScrollView
            horizontal
            style={styles.photosContainer}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.photosContent}
          >
            {item.photos.map((photo, index) => (
              <View key={index} style={styles.photoWrapper}>
                <Image
                  source={{ uri: photo }}
                  style={styles.photo}
                  contentFit="cover"
                />
                <View style={styles.photoIndex}>
                  <ThemedText style={styles.photoIndexText}>
                    {index + 1}
                  </ThemedText>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      
      <View style={styles.detailsSection}>
        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <MaterialIcons size={16} color="#2196F3" name="location-on" />
          </View>
          <View style={styles.detailContent}>
            <ThemedText style={styles.detailLabel}>Localização</ThemedText>
            <ThemedText style={styles.detailValue}>
              {getLocationName(item.location.latitude, item.location.longitude)}
            </ThemedText>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <MaterialIcons size={16} color="#4CAF50" name="schedule" />
          </View>
          <View style={styles.detailContent}>
            <ThemedText style={styles.detailLabel}>Registrado</ThemedText>
            <ThemedText style={styles.detailValue}>
              {getRelativeDate(item.timestamp)}
            </ThemedText>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <MaterialIcons size={16} color="#FF9800" name="gps-fixed" />
          </View>
          <View style={styles.detailContent}>
            <ThemedText style={styles.detailLabel}>Coordenadas</ThemedText>
            <ThemedText style={styles.coordsValue}>
              {item.location.latitude.toFixed(6)},{' '}
              {item.location.longitude.toFixed(6)}
            </ThemedText>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.brandContainer}>
            <MaterialIcons name="eco" size={32} color="#ffffff" />
            <View style={styles.brandText}>
              <ThemedText style={styles.appTitle}>Clean City</ThemedText>
              <ThemedText style={styles.appSubtitle}>
                Lista Detalhada
              </ThemedText>
            </View>
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statBadge}>
              <MaterialIcons name="list-alt" size={16} color="#4CAF50" />
              <ThemedText style={styles.statText}>
                {wasteLocations.length}
              </ThemedText>
            </View>
          </View>
        </View>
      </View>

      
      {wasteLocations.length === 0 ? (
        <View style={styles.emptyOverlay}>
          <View style={styles.emptyContainer}>
            <MaterialIcons size={64} name="inbox" color="#E2E8F0" />
            <ThemedText style={styles.emptyText}>
              Nenhuma ocorrência registrada
            </ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Use a aba &quot;Registrar&quot; para reportar novos problemas
            </ThemedText>
          </View>
        </View>
      ) : (
        <FlatList
          data={wasteLocations}
          renderItem={renderWasteItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={loadWasteLocations}
              colors={['#2196F3']}
              tintColor="#2196F3"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 110,
    backgroundColor: '#1e3c72',
    zIndex: 1000,
    paddingTop: 50,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 60,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandText: {
    flexDirection: 'column',
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: 12,
    color: '#B3D4FC',
    fontWeight: '500',
    marginTop: -2,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '700',
  },

 
  list: {
    flex: 1,
    marginTop: 110,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },

  
  itemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F0F4F8',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A202C',
    lineHeight: 24,
    flex: 1,
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },

  
  photosSection: {
    marginBottom: 20,
  },
  photoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  photoHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9C27B0',
  },
  photosContainer: {
    flexDirection: 'row',
  },
  photosContent: {
    gap: 12,
  },
  photoWrapper: {
    position: 'relative',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  photoIndex: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#9C27B0',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#9C27B0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  photoIndexText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },

  
  detailsSection: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailIcon: {
    backgroundColor: '#F7FAFC',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#718096',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    lineHeight: 20,
  },
  coordsValue: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: '600',
    color: '#4A5568',
    lineHeight: 18,
  },

  
  emptyOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 110,
  },
  emptyContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#F0F4F8',
    maxWidth: 320,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A202C',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
});
