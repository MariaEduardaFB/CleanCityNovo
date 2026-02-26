import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#8E8E93',
  },
  periodFilters: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  periodFiltersContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    marginRight: 8,
  },
  periodButtonActive: {
    backgroundColor: '#007AFF',
  },
  periodButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 16,
  },
  cardsGrid: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
  },
  regionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  regionRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  regionRankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  regionInfo: {
    flex: 1,
  },
  regionName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  regionBar: {
    height: 6,
    backgroundColor: '#F2F2F7',
    borderRadius: 3,
    overflow: 'hidden',
  },
  regionBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  regionCount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
    color: '#007AFF',
  },
  statusContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusLabel: {
    flex: 1,
    fontSize: 16,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 15,
    color: '#8E8E93',
    paddingVertical: 32,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    paddingHorizontal: 20,
    gap: 8,
  },
  footerText: {
    fontSize: 13,
    color: '#8E8E93',
  },
});
