import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import parcelService from '../../services/parcelService';
import { useAuth } from '../../contexts/AuthContext';

const STATUSES = ['RECEIVED','VERIFIED','IN_TRANSIT','DELIVERED','FAILED','DAMAGED'];

export default function ParcelsScreen() {
  const navigation = useNavigation<any>();
  const { hasRole } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['parcels', search, statusFilter, page],
    queryFn: () => parcelService.list({ search: search || undefined, status: (statusFilter || undefined) as any, page, per_page: 20 }).then((r: any) => r.data),
    keepPreviousData: true,
  } as any);

  const parcels = (data as any)?.data ?? [];
  const meta = (data as any)?.meta;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Parcels</Text>
        {hasRole(['admin','manager']) && (
          <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('RegisterParcel')}>
            <Text style={styles.addButtonText}>+ Register</Text>
          </TouchableOpacity>
        )}
      </View>
      <TextInput style={styles.search} placeholder="Search..." value={search} onChangeText={(v) => { setSearch(v); setPage(1); }} />
      <View style={styles.filterRow}>
        <TouchableOpacity style={[styles.chip, statusFilter === '' && styles.chipActive]} onPress={() => { setStatusFilter(''); setPage(1); }}>
          <Text style={statusFilter === '' ? styles.chipTextActive : styles.chipText}>All</Text>
        </TouchableOpacity>
        {STATUSES.map(s => (
          <TouchableOpacity key={s} style={[styles.chip, statusFilter === s && styles.chipActive]} onPress={() => { setStatusFilter(s); setPage(1); }}>
            <Text style={statusFilter === s ? styles.chipTextActive : styles.chipText}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {isLoading ? <ActivityIndicator style={{ marginTop: 20 }} /> : (
        <FlatList
          data={parcels}
          keyExtractor={(item: any) => String(item.id)}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { refetch(); }} />}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('ParcelDetail', { id: item.id })}>
              <View style={{ flex: 1 }}>
                <Text style={styles.tracking}>{item.tracking_number}</Text>
                <Text style={styles.sub}>{item.recipient_name} • {item.recipient_phone}</Text>
                <Text style={styles.sub}>{item.delivery_address}</Text>
              </View>
              <Text style={styles.status}>{item.status}</Text>
            </TouchableOpacity>
          )}
          ListFooterComponent={meta && meta.last_page > 1 ? (
            <View style={styles.pagination}>
              <TouchableOpacity disabled={page <= 1} onPress={() => setPage(p => p - 1)}><Text style={styles.pageBtn}>Prev</Text></TouchableOpacity>
              <Text>{page}/{meta.last_page}</Text>
              <TouchableOpacity disabled={page >= meta.last_page} onPress={() => setPage(p => p + 1)}><Text style={styles.pageBtn}>Next</Text></TouchableOpacity>
            </View>
          ) : undefined}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  title: { fontSize: 22, fontWeight: '700' },
  addButton: { backgroundColor: '#2563eb', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  addButtonText: { color: '#fff', fontWeight: '600' },
  search: { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 8, padding: 10, marginBottom: 8 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 6, marginBottom: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#e5e7eb' },
  chipActive: { backgroundColor: '#2563eb' },
  chipText: { fontSize: 11, color: '#374151' },
  chipTextActive: { fontSize: 11, color: '#fff' },
  row: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, borderRadius: 8, padding: 12, flexDirection: 'row', alignItems: 'center' },
  tracking: { fontWeight: '700', color: '#2563eb' },
  sub: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  status: { fontSize: 11, color: '#374151', fontWeight: '600' },
  pagination: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  pageBtn: { color: '#2563eb', fontWeight: '600' },
});
