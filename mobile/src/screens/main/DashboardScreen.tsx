import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import dashboardService from '../../services/dashboardService';
import { useAuth } from '../../contexts/AuthContext';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardService.get().then((r: any) => r.data.data),
  });

  if (isLoading) return <ActivityIndicator style={{ marginTop: 40 }} />;

  const d = data || {};
  const stats = d.parcel_stats || {};

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { refetch(); }} />}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>{user?.name}</Text>
      {Object.keys(stats).length > 0 && (
        <View style={styles.grid}>
          {Object.entries(stats).map(([k, v]) => (
            <View key={k} style={styles.card}>
              <Text style={styles.cardValue}>{String(v)}</Text>
              <Text style={styles.cardLabel}>{k.replace(/_/g, ' ')}</Text>
            </View>
          ))}
        </View>
      )}
      {!Object.keys(stats).length && (
        <View style={styles.card}>
          <Text>{JSON.stringify(d).slice(0, 500)}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  subtitle: { color: '#6b7280', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 16, width: '47%', marginBottom: 12 },
  cardValue: { fontSize: 20, fontWeight: '700' },
  cardLabel: { color: '#6b7280', fontSize: 12, marginTop: 4 },
});
