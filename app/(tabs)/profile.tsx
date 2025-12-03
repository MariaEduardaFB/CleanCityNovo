import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { getCacheStats } from '@/services/cache.service';
import { getQueueStats } from '@/services/offline-queue.service';
import { useEffect, useState } from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useOccurrenceStats } from '@/hooks/useOccurrences';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { stats: occurrenceStats } = useOccurrenceStats();
  const [stats, setStats] = useState({
    cacheEntries: 0,
    queuePending: 0,
  });

  const isAdmin = false; // Remover sistema de admin local

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const queueStats = await getQueueStats();
      const cacheStats = await getCacheStats();
      
      setStats({
        cacheEntries: cacheStats.entries,
        queuePending: queueStats.pending,
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Carregando...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <View style={styles.avatarContainer}>
          <MaterialIcons 
            name={isAdmin ? "admin-panel-settings" : "account-circle"} 
            size={100} 
            color={isAdmin ? "#FF9800" : "#4CAF50"} 
          />
        </View>
        <ThemedText style={styles.name}>{user.fullName}</ThemedText>
        <ThemedText style={styles.email}>{user.email}</ThemedText>
        <ThemedText style={styles.date}>
          Membro desde {new Date(user.createdAt).toLocaleDateString('pt-BR')}
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>📊 Estatísticas</ThemedText>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <MaterialIcons name="pending" size={32} color="#FF9800" />
            <ThemedText style={styles.statNumber}>{occurrenceStats?.pending || 0}</ThemedText>
            <ThemedText style={styles.statLabel}>Pendentes</ThemedText>
          </View>

          <View style={styles.statCard}>
            <MaterialIcons name="build" size={32} color="#2196F3" />
            <ThemedText style={styles.statNumber}>{occurrenceStats?.inProgress || 0}</ThemedText>
            <ThemedText style={styles.statLabel}>Em Progresso</ThemedText>
          </View>

          <View style={styles.statCard}>
            <MaterialIcons name="check-circle" size={32} color="#4CAF50" />
            <ThemedText style={styles.statNumber}>{occurrenceStats?.resolved || 0}</ThemedText>
            <ThemedText style={styles.statLabel}>Resolvidas</ThemedText>
          </View>

          <View style={styles.statCard}>
            <MaterialIcons name="report" size={32} color="#9C27B0" />
            <ThemedText style={styles.statNumber}>{occurrenceStats?.total || 0}</ThemedText>
            <ThemedText style={styles.statLabel}>Total</ThemedText>
          </View>
        </View>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>👤 Dados do Usuário</ThemedText>
        
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialIcons name="badge" size={20} color="#666" />
            <View style={styles.infoContent}>
              <ThemedText style={styles.infoLabel}>ID</ThemedText>
              <ThemedText style={styles.infoValue}>{user.id}</ThemedText>
            </View>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="email" size={20} color="#666" />
            <View style={styles.infoContent}>
              <ThemedText style={styles.infoLabel}>Email</ThemedText>
              <ThemedText style={styles.infoValue}>{user.email}</ThemedText>
            </View>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="person" size={20} color="#666" />
            <View style={styles.infoContent}>
              <ThemedText style={styles.infoLabel}>Nome</ThemedText>
              <ThemedText style={styles.infoValue}>{user.fullName}</ThemedText>
            </View>
          </View>

          {user.phone && (
            <View style={styles.infoRow}>
              <MaterialIcons name="phone" size={20} color="#666" />
              <View style={styles.infoContent}>
                <ThemedText style={styles.infoLabel}>Telefone</ThemedText>
                <ThemedText style={styles.infoValue}>{user.phone}</ThemedText>
              </View>
            </View>
          )}

          <View style={styles.infoRow}>
            <MaterialIcons name="event" size={20} color="#666" />
            <View style={styles.infoContent}>
              <ThemedText style={styles.infoLabel}>Criado em</ThemedText>
              <ThemedText style={styles.infoValue}>
                {new Date(user.createdAt).toLocaleString('pt-BR')}
              </ThemedText>
            </View>
          </View>
        </View>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>⚙️ Ações</ThemedText>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={loadStats}
        >
          <MaterialIcons name="refresh" size={24} color="#4CAF50" />
          <ThemedText style={styles.actionText}>Atualizar Estatísticas</ThemedText>
          <MaterialIcons name="chevron-right" size={24} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.logoutButton]}
          onPress={handleLogout}
        >
          <MaterialIcons name="logout" size={24} color="#f44336" />
          <ThemedText style={[styles.actionText, styles.logoutText]}>Sair</ThemedText>
          <MaterialIcons name="chevron-right" size={24} color="#999" />
        </TouchableOpacity>
      </ThemedView>

      <View style={styles.footer}>
        <ThemedText style={styles.footerText}>
          CleanCity v1.0.0 - API Integrada
        </ThemedText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    marginBottom: 12,
  },
  adminBadgeText: {
    color: '#FF9800',
    fontSize: 12,
    fontWeight: '700',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: '#999',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  infoCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#ffebee',
  },
  logoutText: {
    color: '#f44336',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});
