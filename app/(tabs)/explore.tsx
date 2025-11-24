import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  deleteWasteLocation,
  getWasteLocations,
  WasteLocation,
} from '@/utils/storage';

export default function WasteLocationsScreen() {
  const [wasteLocations, setWasteLocations] = useState<WasteLocation[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [isLoading, setIsLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const mapRef = useRef<MapView>(null);

 
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
      console.log('🔄 Carregando localizações...');
      const locations = await getWasteLocations();
      console.log('📍 Localizações carregadas:', locations);
      console.log('📊 Total de localizações:', locations.length);
      setWasteLocations(locations);
    } catch (error) {
      console.error('❌ Erro ao carregar localizações:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  
  const getCurrentLocation = useCallback(async () => {
    try {
      console.log('🔄 Solicitando localização atual...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('❌ Permissão de localização negada');
        Alert.alert(
          'Permissão necessária',
          'Para mostrar sua localização atual, permita o acesso à localização nas configurações.'
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setCurrentLocation(newLocation);
      console.log('✅ Localização atual obtida:', newLocation);

      
      if (mapRef.current) {
        mapRef.current.animateToRegion(
          {
            latitude: newLocation.latitude,
            longitude: newLocation.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          },
          1000
        );
        console.log('🗺️ Mapa centralizado na localização atual');
      }
    } catch (error) {
      console.error('❌ Erro ao obter localização atual:', error);
      Alert.alert(
        'Erro de localização',
        'Não foi possível obter sua localização atual. Verifique se o GPS está ativado.'
      );
    }
  }, []);

  
  useFocusEffect(
    useCallback(() => {
      loadWasteLocations();
      getCurrentLocation();
    }, [loadWasteLocations, getCurrentLocation])
  );

  const handleDeleteLocation = async (id: string, description: string) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir "${description}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWasteLocation(id);
              await loadWasteLocations();
              Alert.alert('Sucesso', 'Local excluído com sucesso!');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir o local.');
              console.error('Erro ao excluir:', error);
            }
          },
        },
      ]
    );
  };

  const renderWasteItem = ({ item }: { item: WasteLocation }) => (
    <ThemedView style={styles.itemContainer}>
      <ThemedView style={styles.itemHeader}>
        <ThemedText style={styles.itemDescription}>
          {item.description}
        </ThemedText>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteLocation(item.id, item.description)}
        >
          <MaterialIcons size={22} color="#e74c3c" name="delete" />
        </TouchableOpacity>
      </ThemedView>
      <ThemedView style={styles.itemDetails}>
        <ThemedView style={styles.detailRow}>
          <MaterialIcons size={16} color="#666" name="location-on" />
          <ThemedText style={styles.detailText}>
            {getLocationName(item.location.latitude, item.location.longitude)}
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.detailRow}>
          <MaterialIcons size={16} color="#666" name="schedule" />
          <ThemedText style={styles.detailText}>
            {getRelativeDate(item.timestamp)}
          </ThemedText>
        </ThemedView>
      </ThemedView>
      {item.photos.length > 0 && (
        <ThemedView style={styles.detailRow}>
          <MaterialIcons size={16} color="#666" name="photo-camera" />
          <ThemedText style={styles.photoCount}>
            {item.photos.length} foto{item.photos.length > 1 ? 's' : ''}
          </ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );

  return (
    <View style={styles.container}>
      
      <MapView
        ref={mapRef}
        style={styles.backgroundMap}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          
          latitude: currentLocation?.latitude || -15.7935,
          longitude: currentLocation?.longitude || -47.8828,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        followsUserLocation={false}
        loadingEnabled={true}
      >
        {wasteLocations.map((item) => (
          <Marker
            key={item.id}
            coordinate={{
              latitude: item.location.latitude,
              longitude: item.location.longitude,
            }}
            title={item.description}
            description={`📅 ${new Date(item.timestamp).toLocaleDateString(
              'pt-BR'
            )}`}
          />
        ))}
      </MapView>

      
      <TouchableOpacity
        style={styles.centerLocationButton}
        onPress={getCurrentLocation}
      >
        <MaterialIcons size={24} color="#007AFF" name="my-location" />
      </TouchableOpacity>

      
      <View style={styles.bottomPanel}>
        <ThemedView style={styles.panelHeader}>
          <ThemedView style={styles.headerContent}>
            <MaterialIcons size={24} color="#007AFF" name="place" />
            <ThemedText type="subtitle" style={styles.panelTitle}>
              Locais Registrados ({wasteLocations.length})
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                viewMode === 'list' && styles.activeToggle,
              ]}
              onPress={() => setViewMode('list')}
            >
              <MaterialIcons
                size={18}
                color={viewMode === 'list' ? '#fff' : '#666'}
                name="list"
              />
              <ThemedText
                style={[
                  styles.toggleText,
                  viewMode === 'list' && styles.activeToggleText,
                ]}
              >
                Visualizar Lista
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                viewMode === 'map' && styles.activeToggle,
              ]}
              onPress={() => setViewMode('map')}
            >
              <MaterialIcons
                size={18}
                color={viewMode === 'map' ? '#fff' : '#666'}
                name="map"
              />
              <ThemedText
                style={[
                  styles.toggleText,
                  viewMode === 'map' && styles.activeToggleText,
                ]}
              >
                Focar no Mapa
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>

        {wasteLocations.length === 0 ? (
          <ThemedView style={styles.emptyContainer}>
            <MaterialIcons size={64} name="location-off" color="#999" />
            <ThemedText style={styles.emptyText}>
              Nenhuma ocorrência registrada
            </ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Use a aba &quot;Registrar&quot; para reportar novos problemas
            </ThemedText>
          </ThemedView>
        ) : (
          <>
            {viewMode === 'list' ? (
              <FlatList
                data={wasteLocations}
                renderItem={renderWasteItem}
                keyExtractor={(item) => item.id}
                style={styles.list}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={isLoading}
                    onRefresh={loadWasteLocations}
                    colors={['#007AFF']}
                    tintColor="#007AFF"
                  />
                }
              />
            ) : (
              <ThemedView style={styles.mapFocusContainer}>
                <ThemedText style={styles.mapFocusText}>
                  🗺️ Visualizando {wasteLocations.length} locais no mapa acima
                </ThemedText>
                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={loadWasteLocations}
                >
                  <ThemedText style={styles.refreshButtonText}>
                    🔄 Atualizar
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const { height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundMap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Math.max(screenHeight * 0.6, 400), 
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  panelHeader: {
    paddingHorizontal: Math.max(screenHeight * 0.025, 16), 
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  panelTitle: {
    fontSize: Math.max(screenHeight * 0.028, 18), 
    fontWeight: '700', 
    color: '#1a1a1a', 
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  activeToggle: {
    backgroundColor: '#007AFF',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6c757d',
  },
  activeToggleText: {
    color: '#fff',
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingVertical: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
    color: '#6c757d',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    color: '#999',
  },
  mapFocusContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  mapFocusText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  itemContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  deleteButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#fdf2f2',
  },
  itemDescription: {
    fontSize: 17,
    fontWeight: '700', 
    lineHeight: 24, 
    marginRight: 8,
    color: '#1a1a1a', 
  },
  itemDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 15, 
    color: '#555', 
    fontWeight: '600', 
  },
  coordinates: {
    fontSize: 12,
    color: '#6c757d',
    fontFamily: 'monospace',
  },
  timestamp: {
    fontSize: 12,
    color: '#6c757d',
  },
  photoCount: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
    fontStyle: 'italic',
  },
  centerLocationButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: '#fff',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
