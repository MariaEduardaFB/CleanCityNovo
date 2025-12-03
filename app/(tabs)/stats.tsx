import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useOccurrences } from '@/hooks/useOccurrences';
import { getWasteLocations } from '@/utils/storage';
import { styles } from './styles/stats.styles';

interface StatCard {
  title: string;
  value: string | number;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  subtitle?: string;
}

interface SensorStats {
  avgAccelerometer: number | null;
  avgLightLevel: number | null;
  totalWithSensors: number;
  totalWithLight: number;
  totalWithAccel: number;
}

interface RegionStats {
  [region: string]: number;
}

export default function StatsScreen() {
  const { occurrences, isLoading, fetchOccurrences } = useOccurrences();
  const [refreshing, setRefreshing] = useState(false);
  const [localOccurrences, setLocalOccurrences] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'all'>('all');

  const loadData = useCallback(async () => {
    await fetchOccurrences();
    const local = await getWasteLocations();
    setLocalOccurrences(local);
  }, [fetchOccurrences]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Filtra por período
  const getFilteredOccurrences = () => {
    const now = new Date();
    const allOccurrences = [...occurrences, ...localOccurrences];

    return allOccurrences.filter((occ) => {
      const occDate = new Date(occ.timestamp || occ.createdAt);
      
      switch (selectedPeriod) {
        case 'today':
          return occDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return occDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return occDate >= monthAgo;
        default:
          return true;
      }
    });
  };

  const filtered = getFilteredOccurrences();

  // Calcula estatísticas de sensores
  const calculateSensorStats = (): SensorStats => {
    let totalAccel = 0;
    let totalLight = 0;
    let countAccel = 0;
    let countLight = 0;

    filtered.forEach((occ) => {
      // Verifica dados do acelerômetro
      const accelMagnitude = occ.sensorData?.accelerometer?.magnitude || occ.accelerometerMagnitude;
      if (accelMagnitude) {
        totalAccel += accelMagnitude;
        countAccel++;
      }
      
      // Verifica dados de luz
      const lightLevel = occ.sensorData?.lightLevel || occ.lightLevel;
      if (lightLevel) {
        totalLight += lightLevel;
        countLight++;
      }
    });

    return {
      avgAccelerometer: countAccel > 0 ? totalAccel / countAccel : null,
      avgLightLevel: countLight > 0 ? totalLight / countLight : null,
      totalWithSensors: filtered.filter((o) => o.sensorData || o.accelerometerMagnitude || o.lightLevel).length,
      totalWithLight: countLight,
      totalWithAccel: countAccel,
    };
  };

  // Calcula estatísticas por região (baseado em coordenadas)
  const calculateRegionStats = (): RegionStats => {
    const regions: RegionStats = {};

    filtered.forEach((occ) => {
      // Verifica se a ocorrência tem localização válida
      const lat = occ.location?.latitude || occ.latitude;
      const lng = occ.location?.longitude || occ.longitude;
      
      if (lat && lng) {
        // Agrupa por "região" usando a parte inteira das coordenadas
        const regionKey = `${Math.floor(lat)},${Math.floor(lng)}`;
        regions[regionKey] = (regions[regionKey] || 0) + 1;
      }
    });

    return regions;
  };

  // Calcula estatísticas por status
  const calculateStatusStats = () => {
    const statusCount = {
      pending: 0,
      verified: 0,
      resolved: 0,
    };

    filtered.forEach((occ) => {
      const status = occ.status?.toLowerCase() || 'pending';
      if (status in statusCount) {
        statusCount[status as keyof typeof statusCount]++;
      }
    });

    return statusCount;
  };

  // Calcula tendência (comparação com período anterior)
  const calculateTrend = (): number => {
    const now = new Date();
    let currentPeriod = 0;
    let previousPeriod = 0;

    const allOccurrences = [...occurrences, ...localOccurrences];

    allOccurrences.forEach((occ) => {
      const occDate = new Date(occ.timestamp || occ.createdAt);
      const daysDiff = Math.floor((now.getTime() - occDate.getTime()) / (1000 * 60 * 60 * 24));

      if (selectedPeriod === 'today') {
        if (daysDiff === 0) currentPeriod++;
        else if (daysDiff === 1) previousPeriod++;
      } else if (selectedPeriod === 'week') {
        if (daysDiff <= 7) currentPeriod++;
        else if (daysDiff <= 14) previousPeriod++;
      } else if (selectedPeriod === 'month') {
        if (daysDiff <= 30) currentPeriod++;
        else if (daysDiff <= 60) previousPeriod++;
      }
    });

    if (previousPeriod === 0) return 0;
    return ((currentPeriod - previousPeriod) / previousPeriod) * 100;
  };

  const sensorStats = calculateSensorStats();
  const regionStats = calculateRegionStats();
  const statusStats = calculateStatusStats();
  const trend = calculateTrend();
  const topRegions = Object.entries(regionStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Cards principais
  const mainCards: StatCard[] = [
    {
      title: 'Total de Ocorrências',
      value: filtered.length,
      icon: 'report',
      color: '#007AFF',
      subtitle: trend !== 0 ? `${trend > 0 ? '+' : ''}${trend.toFixed(1)}% vs período anterior` : undefined,
    },
    {
      title: 'Com Dados de Sensores',
      value: sensorStats.totalWithSensors,
      icon: 'sensors',
      color: '#34C759',
      subtitle: `${((sensorStats.totalWithSensors / (filtered.length || 1)) * 100).toFixed(0)}% do total`,
    },
    {
      title: 'Resolvidas',
      value: statusStats.resolved,
      icon: 'check-circle',
      color: '#32D74B',
      subtitle: `${statusStats.pending} pendentes`,
    },
    {
      title: 'Regiões Ativas',
      value: Object.keys(regionStats).length,
      icon: 'location-on',
      color: '#FF9500',
      subtitle: topRegions[0] ? `Top: ${topRegions[0][1]} ocorrências` : undefined,
    },
  ];

  // Cards de sensores
  const sensorCards: StatCard[] = [
    {
      title: 'Movimento Médio',
      value: sensorStats.avgAccelerometer
        ? `${sensorStats.avgAccelerometer.toFixed(2)} m/s²`
        : 'N/A',
      icon: 'vibration',
      color: '#5856D6',
      subtitle: `${sensorStats.totalWithAccel} leituras`,
    },
    {
      title: 'Luminosidade Média',
      value: sensorStats.avgLightLevel
        ? `${sensorStats.avgLightLevel.toFixed(0)} lx`
        : 'N/A',
      icon: 'light-mode',
      color: '#FFD60A',
      subtitle: `${sensorStats.totalWithLight} leituras`,
    },
    {
      title: 'Com Fotos',
      value: filtered.filter((o) => o.photos && o.photos.length > 0).length,
      icon: 'photo-camera',
      color: '#FF375F',
      subtitle: `${(
        (filtered.filter((o) => o.photos && o.photos.length > 0).length / (filtered.length || 1)) *
        100
      ).toFixed(0)}% do total`,
    },
  ];

  if (isLoading && filtered.length === 0) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <ThemedText style={styles.loadingText}>Carregando estatísticas...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.title}>📊 Estatísticas</ThemedText>
          <ThemedText style={styles.subtitle}>Dados colaborativos em tempo real</ThemedText>
        </View>

        {/* Filtros de Período */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.periodFilters}
          contentContainerStyle={styles.periodFiltersContent}
        >
          {['today', 'week', 'month', 'all'].map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period as any)}
            >
              <ThemedText
                style={[
                  styles.periodButtonText,
                  selectedPeriod === period && styles.periodButtonTextActive,
                ]}
              >
                {period === 'today' && 'Hoje'}
                {period === 'week' && 'Semana'}
                {period === 'month' && 'Mês'}
                {period === 'all' && 'Tudo'}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Cards Principais */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Visão Geral</ThemedText>
          <View style={styles.cardsGrid}>
            {mainCards.map((card, index) => (
              <View key={index} style={styles.card}>
                <View style={[styles.cardIcon, { backgroundColor: card.color + '20' }]}>
                  <MaterialIcons name={card.icon} size={24} color={card.color} />
                </View>
                <View style={styles.cardContent}>
                  <ThemedText style={styles.cardTitle}>{card.title}</ThemedText>
                  <ThemedText style={styles.cardValue}>{card.value}</ThemedText>
                  {card.subtitle && (
                    <ThemedText style={styles.cardSubtitle}>{card.subtitle}</ThemedText>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Cards de Sensores */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Dados dos Sensores</ThemedText>
          <View style={styles.cardsGrid}>
            {sensorCards.map((card, index) => (
              <View key={index} style={styles.card}>
                <View style={[styles.cardIcon, { backgroundColor: card.color + '20' }]}>
                  <MaterialIcons name={card.icon} size={24} color={card.color} />
                </View>
                <View style={styles.cardContent}>
                  <ThemedText style={styles.cardTitle}>{card.title}</ThemedText>
                  <ThemedText style={styles.cardValue}>{card.value}</ThemedText>
                  {card.subtitle && (
                    <ThemedText style={styles.cardSubtitle}>{card.subtitle}</ThemedText>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Top Regiões */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Top 5 Regiões</ThemedText>
          {topRegions.length > 0 ? (
            topRegions.map(([region, count], index) => (
              <View key={region} style={styles.regionItem}>
                <View style={styles.regionRank}>
                  <ThemedText style={styles.regionRankText}>{index + 1}</ThemedText>
                </View>
                <View style={styles.regionInfo}>
                  <ThemedText style={styles.regionName}>Região {region}</ThemedText>
                  <View style={styles.regionBar}>
                    <View
                      style={[
                        styles.regionBarFill,
                        {
                          width: `${(count / topRegions[0][1]) * 100}%`,
                          backgroundColor: '#007AFF',
                        },
                      ]}
                    />
                  </View>
                </View>
                <ThemedText style={styles.regionCount}>{count}</ThemedText>
              </View>
            ))
          ) : (
            <ThemedText style={styles.emptyText}>Nenhum dado disponível</ThemedText>
          )}
        </View>

        {/* Distribuição por Status */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Status das Ocorrências</ThemedText>
          <View style={styles.statusContainer}>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: '#FF9500' }]} />
              <ThemedText style={styles.statusLabel}>Pendentes</ThemedText>
              <ThemedText style={styles.statusValue}>{statusStats.pending}</ThemedText>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: '#007AFF' }]} />
              <ThemedText style={styles.statusLabel}>Verificadas</ThemedText>
              <ThemedText style={styles.statusValue}>{statusStats.verified}</ThemedText>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: '#34C759' }]} />
              <ThemedText style={styles.statusLabel}>Resolvidas</ThemedText>
              <ThemedText style={styles.statusValue}>{statusStats.resolved}</ThemedText>
            </View>
          </View>
        </View>

        {/* Footer Info */}
        <View style={styles.footer}>
          <MaterialIcons name="info-outline" size={16} color="#8E8E93" />
          <ThemedText style={styles.footerText}>
            Dados atualizados em tempo real • {filtered.length} ocorrências analisadas
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}
