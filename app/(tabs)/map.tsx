import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { useCallback, useRef, useState } from 'react';
import { Alert, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getWasteLocations, WasteLocation } from '@/utils/storage';

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
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

  
  fullscreenMap: {
    flex: 1,
    marginTop: 110,
  },

  
  calloutContainer: {
    width: 280,
    borderRadius: 16,
    overflow: 'hidden',
  },
  calloutContent: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  calloutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A202C',
    flex: 1,
    lineHeight: 20,
  },
  calloutDetails: {
    gap: 8,
  },
  calloutDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calloutDetailText: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '500',
  },

  
  floatingButtons: {
    position: 'absolute',
    top: 130,
    right: 20,
    gap: 12,
  },
  floatingButton: {
    backgroundColor: '#2196F3',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  locationButton: {
    backgroundColor: '#4CAF50',
  },

  
  infoCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#F0F4F8',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A202C',
    letterSpacing: 0.3,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2196F3',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Estado vazio
  emptyOverlay: {
    position: 'absolute',
    top: 110,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  emptyContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F0F4F8',
    maxWidth: 300,
    margin: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A202C',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  webMapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  webMapText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontWeight: '600',
  },
  webMapSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
