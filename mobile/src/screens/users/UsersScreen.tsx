import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import userService from '../../services/userService';

export default function UsersScreen() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['users', search, roleFilter, statusFilter, page],
    queryFn: () => userService.list({ search: search || undefined, role: roleFilter || undefined, is_active: statusFilter === '' ? undefined : statusFilter === 'active', page, per_page: 20 }).then((r: any) => r.data),
  } as any);

  const users = (data as any)?.data ?? [];
  const meta = (data as any)?.meta;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Users</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('CreateUser')}>
          <Text style={styles.addButtonText}>+ Create</Text>
        </TouchableOpacity>
      </View>
      <TextInput style={styles.search} placeholder="Search..." value={search} onChangeText={(v) => { setSearch(v); setPage(1); }} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 16, marginBottom: 8 }} contentContainerStyle={{ gap: 6 }}>
        {['', 'admin','manager','accountant','delivery_staff'].map(r => (
          <TouchableOpacity key={r} style={[styles.chip, roleFilter === r && styles.chipActive]} onPress={() => { setRoleFilter(r); setPage(1); }}>
            <Text style={roleFilter === r ? styles.chipTextActive : styles.chipText}>{r || 'All Roles'}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 16, marginBottom: 8 }} contentContainerStyle={{ gap: 6 }}>
        {['', 'active', 'inactive'].map(s => (
          <TouchableOpacity key={s} style={[styles.chip, statusFilter === s && styles.chipActive]} onPress={() => { setStatusFilter(s); setPage(1); }}>
            <Text style={statusFilter === s ? styles.chipTextActive : styles.chipText}>{s || 'All Status'}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {isLoading ? <ActivityIndicator style={{ marginTop: 20 }} /> : (
        <FlatList
          data={users}
          keyExtractor={(item: any) => String(item.id)}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { refetch(); }} />}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('UserDetail', { id: item.id })}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.sub}>{item.email} • {item.role}</Text>
                <Text style={styles.sub}>{item.is_active ? 'Active' : 'Inactive'}</Text>
              </View>
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
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#e5e7eb' },
  chipActive: { backgroundColor: '#2563eb' },
  chipText: { fontSize: 11, color: '#374151' },
  chipTextActive: { fontSize: 11, color: '#fff' },
  row: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, borderRadius: 8, padding: 12 },
  name: { fontWeight: '700' },
  sub: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  pagination: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  pageBtn: { color: '#2563eb', fontWeight: '600' },
});
