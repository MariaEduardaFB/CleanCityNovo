import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { ThemedText } from '@/components/themed-text';
import { useOccurrences } from '@/hooks/useOccurrences';

let MapView: any, Marker: any, Callout: any;
if (Platform.OS !== 'web') {
  const MapModule = require('react-native-maps');
  MapView = MapModule.default;
  Marker = MapModule.Marker;
  Callout = MapModule.Callout;
}

export default function MapScreen() {
  const { fetchOccurrences } = useOccurrences();
  const [points, setPoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState<any>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchOccurrences();
      const data = res?.data || (Array.isArray(res) ? res : []);
      setPoints(data);
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setRegion({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [fetchOccurrences]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  return (
    <View style={styles.container}>
      {/* Header Estilizado */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.brandContainer}>
            <MaterialIcons name="eco" size={28} color="#fff" />
            <ThemedText style={styles.title}>Clean City Mapa</ThemedText>
          </View>
          <View style={styles.badge}>
            <ThemedText style={styles.badgeText}>{points.length} Pontos</ThemedText>
          </View>
        </View>
      </View>

      {Platform.OS !== 'web' && MapView ? (
        <MapView
          style={styles.map}
          region={region}
          showsUserLocation={true}
          loadingEnabled={true}
        >
          {points.map((p, index) => (
            <Marker
              key={p.id || index}
              coordinate={{ 
                latitude: Number(p.latitude), 
                longitude: Number(p.longitude) 
              }}
              pinColor="#FF4444"
            >
              <Callout>
                <View style={styles.callout}>
                  <ThemedText style={{ fontWeight: 'bold' }}>Ocorrência</ThemedText>
                  <ThemedText>{p.description || "Sem descrição"}</ThemedText>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      ) : null}

      {loading && (
        <ActivityIndicator style={styles.loader} size="large" color="#1e3c72" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    height: 100,
    backgroundColor: '#1e3c72',
    paddingTop: 40,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  badge: { backgroundColor: '#4CAF50', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 15 },
  badgeText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  map: { flex: 1 },
  callout: { padding: 10, maxWidth: 200 },
  loader: { position: 'absolute', top: '50%', left: '50%', marginLeft: -15 }
});