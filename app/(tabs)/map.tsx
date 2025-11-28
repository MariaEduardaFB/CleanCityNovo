import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { useCallback, useRef, useState } from 'react';
import { Alert, Platform, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  formatNoiseLevel,
  formatLightLevel,
  formatAccelerometer,
} from '@/utils/sensors';
import { getWasteLocations, WasteLocation } from '@/utils/storage';
import { styles } from './styles/map.styles';

// Importação condicional do MapView (não funciona na web)
let MapView: any;
let Marker: any;
let Callout: any;
let PROVIDER_DEFAULT: any;

if (Platform.OS !== 'web') {
  const MapModule = require('react-native-maps');
  MapView = MapModule.default;
  Marker = MapModule.Marker;
  Callout = MapModule.Callout;
  PROVIDER_DEFAULT = MapModule.PROVIDER_DEFAULT;
}

export default function MapScreen() {
  const [wasteLocations, setWasteLocations] = useState<WasteLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const mapRef = useRef<any>(null);

  
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
      console.log('🗺️ Carregando localizações para o mapa...');
      const locations = await getWasteLocations();
      console.log('📍 Localizações carregadas no mapa:', locations.length);
      setWasteLocations(locations);
    } catch (error) {
      console.error('❌ Erro ao carregar localizações no mapa:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  
  const getCurrentLocation = useCallback(async () => {
    try {
      console.log('🔄 Obtendo localização atual para o mapa...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('❌ Permissão de localização negada');
        Alert.alert(
          'Permissão necessária',
          'Para mostrar sua localização atual no mapa, permita o acesso à localização.'
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
      console.log('✅ Localização atual obtida para o mapa:', newLocation);

      
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

  return (
    <View style={styles.container}>
      
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.brandContainer}>
            <MaterialIcons name="eco" size={32} color="#ffffff" />
            <View style={styles.brandText}>
              <ThemedText style={styles.appTitle}>Clean City</ThemedText>
              <ThemedText style={styles.appSubtitle}>
                Mapa de Ocorrências
              </ThemedText>
            </View>
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statBadge}>
              <MaterialIcons name="place" size={16} color="#4CAF50" />
              <ThemedText style={styles.statText}>
                {wasteLocations.length}
              </ThemedText>
            </View>
          </View>
        </View>
      </View>

      {/* Renderizar mapa apenas em plataformas nativas */}
      {Platform.OS !== 'web' && MapView ? (
        <MapView
          ref={mapRef}
          style={styles.fullscreenMap}
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
              pinColor="#FF4444"
            >
              <Callout style={styles.calloutContainer}>
                <View style={styles.calloutContent}>
                  <View style={styles.calloutHeader}>
                    <MaterialIcons
                      name="report-problem"
                      size={20}
                      color="#FF4444"
                    />
                    <ThemedText style={styles.calloutTitle} numberOfLines={2}>
                      {item.description}
                    </ThemedText>
                  </View>
                  <View style={styles.calloutDetails}>
                    <View style={styles.calloutDetailRow}>
                      <MaterialIcons size={14} color="#666" name="location-on" />
                      <ThemedText style={styles.calloutDetailText}>
                        {getLocationName(
                          item.location.latitude,
                          item.location.longitude
                        )}
                      </ThemedText>
                  </View>
                  <View style={styles.calloutDetailRow}>
                    <MaterialIcons size={14} color="#666" name="schedule" />
                    <ThemedText style={styles.calloutDetailText}>
                      {getRelativeDate(item.timestamp)}
                    </ThemedText>
                  </View>
                  {item.photos.length > 0 && (
                    <View style={styles.calloutDetailRow}>
                      <MaterialIcons
                        size={14}
                        color="#666"
                        name="photo-camera"
                      />
                      <ThemedText style={styles.calloutDetailText}>
                        {item.photos.length} foto
                        {item.photos.length > 1 ? 's' : ''}
                      </ThemedText>
                    </View>
                  )}
                  
                  {/* Dados dos Sensores */}
                  {(item.noiseLevel || item.lightLevel || item.accelerometer) && (
                    <View style={styles.sensorDivider} />
                  )}
                  {item.noiseLevel !== null && item.noiseLevel !== undefined && (
                    <View style={styles.calloutDetailRow}>
                      <MaterialIcons size={14} color="#2196F3" name="volume-up" />
                      <ThemedText style={styles.calloutDetailText}>
                        {formatNoiseLevel(item.noiseLevel)}
                      </ThemedText>
                    </View>
                  )}
                  {item.lightLevel !== null && item.lightLevel !== undefined && (
                    <View style={styles.calloutDetailRow}>
                      <MaterialIcons size={14} color="#FFC107" name="wb-sunny" />
                      <ThemedText style={styles.calloutDetailText}>
                        {formatLightLevel(item.lightLevel)}
                      </ThemedText>
                    </View>
                  )}
                  {item.accelerometer && (
                    <View style={styles.calloutDetailRow}>
                      <MaterialIcons size={14} color="#4CAF50" name="motion-photos-on" />
                      <ThemedText style={styles.calloutDetailText}>
                        {formatAccelerometer(item.accelerometer)}
                      </ThemedText>
                    </View>
                  )}
                </View>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
      ) : (
        <ThemedView style={styles.fullscreenMap}>
          <ThemedView style={styles.webMapPlaceholder}>
            <MaterialIcons size={64} name="map" color="#ccc" />
            <ThemedText style={styles.webMapText}>
              Mapa disponível apenas no app móvel
            </ThemedText>
            <ThemedText style={styles.webMapSubtext}>
              {wasteLocations.length} locais registrados
            </ThemedText>
          </ThemedView>
        </ThemedView>
      )}

     
      <View style={styles.floatingButtons}>
        <TouchableOpacity
          style={[styles.floatingButton, styles.locationButton]}
          onPress={getCurrentLocation}
        >
          <MaterialIcons size={24} color="#ffffff" name="my-location" />
        </TouchableOpacity>
      </View>

      
      {wasteLocations.length > 0 && (
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <MaterialIcons name="analytics" size={24} color="#2196F3" />
            <ThemedText style={styles.infoTitle}>Estatísticas</ThemedText>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>
                {wasteLocations.length}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Total</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>
                {wasteLocations.reduce(
                  (acc, loc) => acc + loc.photos.length,
                  0
                )}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Fotos</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>
                {
                  new Set(
                    wasteLocations.map((loc) =>
                      getLocationName(
                        loc.location.latitude,
                        loc.location.longitude
                      )
                    )
                  ).size
                }
              </ThemedText>
              <ThemedText style={styles.statLabel}>Áreas</ThemedText>
            </View>
          </View>
        </View>
      )}

      
      {wasteLocations.length === 0 && !isLoading && (
        <View style={styles.emptyOverlay}>
          <View style={styles.emptyContainer}>
            <MaterialIcons size={64} name="location-off" color="#E2E8F0" />
            <ThemedText style={styles.emptyText}>
              Nenhuma ocorrência no mapa
            </ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Use a aba &quot;Registrar&quot; para adicionar novos problemas
            </ThemedText>
          </View>
        </View>
      )}
    </View>
  );
}
