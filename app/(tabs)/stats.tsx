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
  Platform,
  StatusBar,
  StyleSheet
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useOccurrences } from '@/hooks/useOccurrences';
import { getWasteLocations } from '@/utils/storage';
import { useAuth } from '@/contexts/AuthContext';

const { width } = Dimensions.get('window');

export default function StatsScreen() {
  const { user } = useAuth();
  const { occurrences, isLoading, fetchOccurrences } = useOccurrences();
  const [refreshing, setRefreshing] = useState(false);
  const [localOccurrences, setLocalOccurrences] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'all'>('all');

  const loadData = useCallback(async () => {
    try {
      await fetchOccurrences();
      const local = await getWasteLocations();
      setLocalOccurrences(local || []);
    } catch (e) {
      console.error(e);
    }
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

  const getFilteredOccurrences = () => {
    const all = [...occurrences, ...localOccurrences];
    const unique = Array.from(new Map(all.map(item => [item.id || Math.random(), item])).values());
    
    if (selectedPeriod === 'all') return unique;
    const now = new Date();
    return unique.filter((occ) => {
      const dateStr = occ.createdAt || occ.timestamp;
      if (!dateStr) return false;
      const occDate = new Date(dateStr);
      if (selectedPeriod === 'today') return occDate.toDateString() === now.toDateString();
      if (selectedPeriod === 'week') return occDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      if (selectedPeriod === 'month') return occDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return true;
    });
  };

  const filtered = getFilteredOccurrences();

  // IMPACTO (PESSOAL)
  // Pega o ID real do usuário logado agora

  const currentUserId = user?.uid || user?.id;

  const myOccurrences = filtered.filter((occ: any) => {
    if (!currentUserId) return false;
    const donoDaOcorrencia = occ.userId || occ.authorId || occ.creatorId || occ.user_id;
    return donoDaOcorrencia && donoDaOcorrencia === currentUserId;
  });

  const myTotal = myOccurrences.length;

  // IMPACTO DA CIDADE (GLOBAL)
  const total = filtered.length;

  // FOTOOO

  const withPhotos = filtered.filter((occ: any) => {
    if (!occ.photos) return false;

    if (Array.isArray(occ.photos)) {
      return occ.photos.length > 0 && occ.photos[0] !== null && occ.photos[0] !== "";
    }
    
    if (typeof occ.photos === 'string') {
      return occ.photos.length > 5; 
    }

    return false;
  }).length;

  if (isLoading && total === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1e3c72" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3c72" translucent={false} />
      
      {/* HEADER PROPORCIONAL */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <ThemedText style={styles.headerTitle}>📊 Estatísticas</ThemedText>
          <View style={styles.occurrenceBadge}>
            <ThemedText style={styles.occurrenceBadgeText}>{total} Registros na Cidade</ThemedText>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* FILTROS DOSS PERÍODOS */}
        <View style={styles.filterSection}>
          <ThemedText style={styles.sectionLabel}>Período de análise:</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {['today', 'week', 'month', 'all'].map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setSelectedPeriod(p as any)}
                style={[styles.filterBtn, selectedPeriod === p && styles.filterBtnActive]}
              >
                <ThemedText style={[styles.filterBtnText, selectedPeriod === p && styles.filterBtnTextActive]}>
                  {p === 'today' ? 'Hoje' : p === 'week' ? 'Semana' : p === 'month' ? 'Mês' : 'Geral'}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* USUÁRIO LOGADO */}
        <View style={styles.personalImpactContainer}>
          <View style={styles.personalImpactHeader}>
            <MaterialIcons name="stars" size={24} color="#FFD700" />
            <ThemedText style={styles.personalImpactTitle}>Seu Impacto</ThemedText>
          </View>
          <View style={styles.personalCard}>
            <View style={styles.personalCardLeft}>
              <ThemedText style={styles.personalCardNumber}>{myTotal}</ThemedText>
              <ThemedText style={styles.personalCardText}>Problemas relatados por você</ThemedText>
            </View>
            <View style={styles.personalCardRight}>
              <MaterialIcons name="emoji-events" size={40} color="#00D084" />
            </View>
          </View>
        </View>

        {/* REGISTROS DA COMUNIDADE */}
        <View style={styles.globalImpactContainer}>
          <ThemedText style={styles.sectionLabel}>Impacto da Comunidade (Global)</ThemedText>
          <View style={styles.grid}>
            <StatCard label="Total Geral" value={total} icon="analytics" color="#1e3c72" />
            <StatCard label="Com Fotos" value={withPhotos} icon="camera-alt" color="#ff4757" />
            <StatCard label="Locais Únicos" value={new Set(filtered.map(o => o.latitude)).size} icon="map" color="#ffa502" />
            <StatCard label="Eficiência" value={`${((withPhotos / (total || 1)) * 100).toFixed(0)}%`} icon="bolt" color="#2ed573" />
          </View>
        </View>

        <View style={styles.infoFooter}>
          <MaterialIcons name="sync" size={18} color="#747d8c" />
          <ThemedText style={styles.infoFooterText}>Dados sincronizados com o servidor central</ThemedText>
        </View>
      </ScrollView>
    </View>
  );
}

function StatCard({ label, value, icon, color }: any) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconWrapper, { backgroundColor: color + '15' }]}>
        <MaterialIcons name={icon} size={28} color={color} />
      </View>
      <ThemedText style={styles.cardValue}>{value}</ThemedText>
      <ThemedText style={styles.cardLabel}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#1e3c72',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  headerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    lineHeight: 34,
  },
  occurrenceBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  occurrenceBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  content: { flex: 1 },
  
  filterSection: { marginTop: 20, marginBottom: 15 },
  sectionLabel: { 
    marginLeft: 20, 
    fontSize: 16, 
    color: '#1e3c72', 
    marginBottom: 12, 
    fontWeight: 'bold' 
  },
  filterScroll: { paddingLeft: 20 },
  filterBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#fff',
    marginRight: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterBtnActive: { backgroundColor: '#1e3c72', borderColor: '#1e3c72' },
  filterBtnText: { color: '#64748b', fontWeight: 'bold', fontSize: 13 },
  filterBtnTextActive: { color: '#fff' },
  
  personalImpactContainer: {
    marginHorizontal: 20,
    marginBottom: 25,
  },
  personalImpactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  personalImpactTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#b8860b',
  },
  personalCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    borderLeftWidth: 5,
    borderLeftColor: '#00D084',
  },
  personalCardLeft: {
    flex: 1,
  },
  personalCardNumber: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 5,
  },
  personalCardText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  personalCardRight: {
    backgroundColor: 'rgba(0, 208, 132, 0.1)',
    padding: 15,
    borderRadius: 20,
  },

  globalImpactContainer: {
    marginTop: 10,
  },
  grid: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: '#fff',
    width: (width / 2) - 28,
    padding: 20,
    borderRadius: 24,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  iconWrapper: { padding: 14, borderRadius: 18, marginBottom: 12 },
  cardValue: { fontSize: 28, fontWeight: 'bold', color: '#1e293b', lineHeight: 34 },
  cardLabel: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  
  infoFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  infoFooterText: { fontSize: 13, color: '#64748b', fontWeight: '500' }
});