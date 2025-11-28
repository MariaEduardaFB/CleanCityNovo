import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Platform,
  RefreshControl,
  TouchableOpacity,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const formatNoiseLevel = (value?: number | null): string => {
  if (value === null || value === undefined) return 'N/A';
  // show one decimal and unit
  return `${value.toFixed(1)} dB`;
};

const formatLightLevel = (value?: number | null): string => {
  if (value === null || value === undefined) return 'N/A';
  // round to integer lux
  return `${Math.round(value)} lx`;
};

const formatAccelerometer = (accel?: { x: number; y: number; z: number } | null): string => {
  if (!accel) return 'N/A';
  const magnitude = Math.sqrt(accel.x * accel.x + accel.y * accel.y + accel.z * accel.z);
  return `${magnitude.toFixed(2)} m/s²`;
};

import { deleteWasteLocation, getWasteLocations, WasteLocation } from '@/utils/storage';
import { styles } from './styles/explore.styles';
import { SyncIndicator } from '@/components/SyncIndicator';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { getCache, setCache } from '@/services/cache.service';

// Importação condicional do MapView (não funciona na web)
let MapView: any;
let Marker: any;
let PROVIDER_DEFAULT: any;

if (Platform.OS !== 'web') {
  const MapModule = require('react-native-maps');
  MapView = MapModule.default;
  Marker = MapModule.Marker;
  PROVIDER_DEFAULT = MapModule.PROVIDER_DEFAULT;
}

export default function WasteLocationsScreen() {
  const [wasteLocations, setWasteLocations] = useState<WasteLocation[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [isLoading, setIsLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const mapRef = useRef<any>(null);
  const { isOnline } = useNetworkStatus();

 
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
      
      // Tenta buscar do cache primeiro
      const cacheKey = 'waste_locations_list';
      const cachedData = await getCache<WasteLocation[]>(cacheKey);
      
      if (cachedData) {
        console.log('✅ Dados carregados do cache');
        setWasteLocations(cachedData);
        setIsLoading(false);
      }
      
      // Busca dados atualizados
      const locations = await getWasteLocations();
      console.log('📍 Localizações carregadas:', locations);
      console.log('📊 Total de localizações:', locations.length);
      setWasteLocations(locations);
      
      // Atualiza cache
      await setCache(cacheKey, locations, 15); // 15 minutos
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

      {/* Dados dos Sensores */}
      {(item.noiseLevel || item.lightLevel || item.accelerometer) && (
        <ThemedView style={styles.sensorSection}>
          <ThemedText style={styles.sensorSectionTitle}>
            📊 Dados Ambientais
          </ThemedText>
          {item.noiseLevel !== null && item.noiseLevel !== undefined && (
            <ThemedView style={styles.detailRow}>
              <MaterialIcons size={16} color="#2196F3" name="volume-up" />
              <ThemedText style={styles.detailText}>
                {formatNoiseLevel(item.noiseLevel)}
              </ThemedText>
            </ThemedView>
          )}
          {item.lightLevel !== null && item.lightLevel !== undefined && (
            <ThemedView style={styles.detailRow}>
              <MaterialIcons size={16} color="#FFC107" name="wb-sunny" />
              <ThemedText style={styles.detailText}>
                {formatLightLevel(item.lightLevel)}
              </ThemedText>
            </ThemedView>
          )}
          {item.accelerometer && (
            <ThemedView style={styles.detailRow}>
              <MaterialIcons size={16} color="#4CAF50" name="motion-photos-on" />
              <ThemedText style={styles.detailText}>
                {formatAccelerometer(item.accelerometer)}
              </ThemedText>
            </ThemedView>
          )}
        </ThemedView>
      )}
    </ThemedView>
  );

  return (
    <View style={styles.container}>
      {/* Renderizar mapa apenas em plataformas nativas */}
      {Platform.OS !== 'web' && MapView ? (
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
      ) : (
        <ThemedView style={styles.backgroundMap}>
          <ThemedView style={styles.webMapPlaceholder}>
            <MaterialIcons size={64} name="map" color="#ccc" />
            <ThemedText style={styles.webMapText}>
              Mapa disponível apenas no app móvel
            </ThemedText>
          </ThemedView>
        </ThemedView>
      )}

      
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

        <SyncIndicator onPress={loadWasteLocations} />

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

