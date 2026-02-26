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
import { deleteWasteLocation, getWasteLocations, WasteLocation } from '@/utils/storage';
import { styles } from '../styles/explore.styles';
import { SyncIndicator } from '@/components/SyncIndicator';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { getCache, setCache } from '@/services/cache.service';

const formatNoiseLevel = (value?: number | null): string => {
  if (value === null || value === undefined) return 'N/A';
  return `${value.toFixed(1)} dB`;
};

const formatLightLevel = (value?: number | null): string => {
  if (value === null || value === undefined) return 'N/A';
  return `${Math.round(value)} lx`;
};

const formatAccelerometer = (x?: number, y?: number, z?: number): string => {
  if (x === undefined || y === undefined || z === undefined) return 'N/A';
  const magnitude = Math.sqrt(x * x + y * y + z * z);
  return `${magnitude.toFixed(2)} m/s²`;
};

// Importação do MapView
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
  const [wasteLocations, setWasteLocations] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [isLoading, setIsLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const mapRef = useRef<any>(null);
  const { isOnline } = useNetworkStatus();

  const getLocationName = (latitude: number, longitude: number): string => {
    return `${latitude?.toFixed(4)}°, ${longitude?.toFixed(4)}°`;
  };

  const getRelativeDate = (timestamp: string): string => {
    if (!timestamp) return 'Data desconhecida';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Agora há pouco';
    if (diffInHours < 24) return `Há ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    if (diffInHours < 48) return 'Ontem';
    return date.toLocaleDateString('pt-BR');
  };

  const { fetchOccurrences, occurrences } = useOccurrences();

  const loadWasteLocations = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // (API)
      const apiData = await fetchOccurrences(); 
      
      const localData = await getWasteLocations();
      
      const combined = [...apiData, ...localData];
      
      const uniqueLocations = Array.from(new Map(combined.map(item => [item.id, item])).values());
      
      setWasteLocations(uniqueLocations);
      
    } catch (error) {
      console.error('❌ Erro ao carregar localizações:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchOccurrences]);

  const getCurrentLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setCurrentLocation(newLocation);

      if (mapRef.current) {
        mapRef.current.animateToRegion({
          ...newLocation,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }, 1000);
      }
    } catch (error) {
      console.error('❌ Erro ao obter localização:', error);
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
      `Deseja excluir "${description}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWasteLocation(id);
              await loadWasteLocations();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir.');
            }
          },
        },
      ]
    );
  };

  const renderWasteItem = ({ item }: { item: any }) => (
    <ThemedView style={styles.itemContainer}>
      <ThemedView style={styles.itemHeader}>
        <ThemedText style={styles.itemDescription}>
          {item.description || 'Sem descrição'}
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
            {/* Acessando latitude */}
            {getLocationName(item.latitude, item.longitude)}
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.detailRow}>
          <MaterialIcons size={16} color="#666" name="schedule" />
          <ThemedText style={styles.detailText}>
            {getRelativeDate(item.createdAt || item.timestamp)}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      {/* Dados dos Sensores */}
      <ThemedView style={styles.sensorSection}>
        <ThemedText style={styles.sensorSectionTitle}>📊 Dados Ambientais</ThemedText>
        
        <ThemedView style={styles.detailRow}>
          <MaterialIcons size={16} color="#2196F3" name="volume-up" />
          <ThemedText style={styles.detailText}>
            Ruído: {formatNoiseLevel(item.noiseLevel)}
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.detailRow}>
          <MaterialIcons size={16} color="#FFC107" name="wb-sunny" />
          <ThemedText style={styles.detailText}>
            Luz: {formatLightLevel(item.lightLevel)}
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.detailRow}>
          <MaterialIcons size={16} color="#4CAF50" name="motion-photos-on" />
          <ThemedText style={styles.detailText}>
            Vibração: {formatAccelerometer(item.accelerometerX, item.accelerometerY, item.accelerometerZ)}
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );

  return (
    <View style={styles.container}>
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
        >
          {wasteLocations.map((item) => (
            <Marker
              key={item.id}
              coordinate={{
                latitude: item.latitude,
                longitude: item.longitude,
              }}
              title={item.description}
            />
          ))}
        </MapView>
      ) : (
        <View style={styles.backgroundMap} />
      )}

      <TouchableOpacity style={styles.centerLocationButton} onPress={getCurrentLocation}>
        <MaterialIcons size={24} color="#007AFF" name="my-location" />
      </TouchableOpacity>

      <View style={styles.bottomPanel}>
        <ThemedView style={styles.panelHeader}>
          <ThemedView style={styles.headerContent}>
            <MaterialIcons size={24} color="#007AFF" name="place" />
            <ThemedText type="subtitle" style={styles.panelTitle}>
              Locais ({wasteLocations.length})
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.toggleContainer}>
            <TouchableOpacity 
              style={[styles.toggleButton, viewMode === 'list' && styles.activeToggle]} 
              onPress={() => setViewMode('list')}
            >
              <MaterialIcons size={18} color={viewMode === 'list' ? '#fff' : '#666'} name="list" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleButton, viewMode === 'map' && styles.activeToggle]} 
              onPress={() => setViewMode('map')}
            >
              <MaterialIcons size={18} color={viewMode === 'map' ? '#fff' : '#666'} name="map" />
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>

        <SyncIndicator onPress={loadWasteLocations} />

        {wasteLocations.length === 0 ? (
          <ThemedView style={styles.emptyContainer}>
            <ThemedText>Nenhuma ocorrência encontrada.</ThemedText>
          </ThemedView>
        ) : (
          viewMode === 'list' ? (
            <FlatList
              data={wasteLocations}
              renderItem={renderWasteItem}
              keyExtractor={(item) => item.id.toString()}
              refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadWasteLocations} />}
            />
          ) : (
            <ThemedView style={styles.mapFocusContainer}>
              <ThemedText style={styles.mapFocusText}>Visualize os pins no mapa</ThemedText>
            </ThemedView>
          )
        )}
      </View>
    </View>
  );
}