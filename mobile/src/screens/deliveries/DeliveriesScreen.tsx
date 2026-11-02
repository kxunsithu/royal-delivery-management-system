import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import deliveryService from '../../services/deliveryService';
import userService from '../../services/userService';

const STATUSES = ['ACTIVE','COMPLETED','REASSIGNED','CANCELLED'];

export default function DeliveriesScreen() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const [staffFilter, setStaffFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['assignments', staffFilter, statusFilter, page],
    queryFn: () => deliveryService.allAssignments({ staff_id: staffFilter ? parseInt(staffFilter) : undefined, status: statusFilter || undefined, page, per_page: 20 }).then((r: any) => r.data),
  } as any);

  const { data: staffData } = useQuery({ queryKey: ['delivery-staff'], queryFn: () => userService.deliveryStaff().then((r: any) => r.data.data) });

  const assignments = (data as any)?.data ?? [];
  const meta = (data as any)?.meta;
  const filtered = assignments.filter((a: any) =>
    !search ||
    a.parcel?.tracking_number?.toLowerCase().includes(search.toLowerCase()) ||
    a.parcel?.recipient_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.staff?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Deliveries</Text>
      </View>
      <TextInput style={styles.search} placeholder="Search..." value={search} onChangeText={setSearch} />
      {/* staff filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 16, marginBottom: 8 }} contentContainerStyle={{ gap: 6 }}>
        <TouchableOpacity style={[styles.chip, staffFilter === '' && styles.chipActive]} onPress={() => { setStaffFilter(''); setPage(1); }}>
          <Text style={staffFilter === '' ? styles.chipTextActive : styles.chipText}>All Staff</Text>
        </TouchableOpacity>
        {(staffData || []).map((s: any) => (
          <TouchableOpacity key={s.id} style={[styles.chip, staffFilter === String(s.id) && styles.chipActive]} onPress={() => { setStaffFilter(String(s.id)); setPage(1); }}>
            <Text style={staffFilter === String(s.id) ? styles.chipTextActive : styles.chipText}>{s.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {/* status filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 16, marginBottom: 8 }} contentContainerStyle={{ gap: 6 }}>
        <TouchableOpacity style={[styles.chip, statusFilter === '' && styles.chipActive]} onPress={() => { setStatusFilter(''); setPage(1); }}>
          <Text style={statusFilter === '' ? styles.chipTextActive : styles.chipText}>All Status</Text>
        </TouchableOpacity>
        {STATUSES.map(s => (
          <TouchableOpacity key={s} style={[styles.chip, statusFilter === s && styles.chipActive]} onPress={() => { setStatusFilter(s); setPage(1); }}>
            <Text style={statusFilter === s ? styles.chipTextActive : styles.chipText}>{s}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? <ActivityIndicator style={{ marginTop: 20 }} /> : (
        <FlatList
          data={filtered}
          keyExtractor={(item: any) => String(item.id)}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { refetch(); }} />}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('AssignmentDetail', { id: item.id })}>
              <View style={{ flex: 1 }}>
                <Text style={styles.tracking}>{item.parcel?.tracking_number ?? '-'}</Text>
                <Text style={styles.sub}>{item.parcel?.recipient_name ?? '-'}</Text>
                <Text style={styles.sub}>Staff: {item.staff?.name ?? '-'}</Text>
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
  header: { padding: 16 },
  title: { fontSize: 22, fontWeight: '700' },
  search: { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 8, padding: 10, marginBottom: 8 },
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
