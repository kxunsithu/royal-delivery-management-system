import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Modal, Linking, ScrollView } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import deliveryService from '../../services/deliveryService';
import { queryClient } from '../../lib/queryClient';

const FAILURE_REASONS = ['RECIPIENT_UNAVAILABLE','PHONE_UNREACHABLE','WRONG_ADDRESS','REFUSED','RESCHEDULED','OTHER'];

export default function MyAssignmentsScreen() {
  const navigation = useNavigation<any>();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'active'|'completed'>('active');
  const [search, setSearch] = useState('');
  const [showAttempt, setShowAttempt] = useState<number | null>(null);
  const [attemptForm, setAttemptForm] = useState({ result: 'DELIVERED' as 'DELIVERED'|'FAILED', failure_reason: '', recipient_name: '', notes: '' });

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['my-assignments', activeTab],
    queryFn: () => deliveryService.myAssignments({ status: activeTab === 'active' ? 'ACTIVE' : 'COMPLETED', per_page: 50 }).then((r: any) => r.data),
    refetchInterval: 30000,
  } as any);

  const assignments = (data as any)?.data ?? [];
  const filtered = assignments.filter((a: any) =>
    !search ||
    a.parcel?.tracking_number?.toLowerCase().includes(search.toLowerCase()) ||
    a.parcel?.recipient_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.parcel?.recipient_phone?.includes(search)
  );

  const attemptMutation = useMutation({
    mutationFn: (assignmentId: number) => deliveryService.recordAttempt(assignmentId, {
      result: attemptForm.result,
      failure_reason: attemptForm.failure_reason || undefined,
      recipient_name: attemptForm.recipient_name || undefined,
      notes: attemptForm.notes || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-assignments'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setShowAttempt(null);
      setAttemptForm({ result: 'DELIVERED', failure_reason: '', recipient_name: '', notes: '' });
    },
    onError: (err: any) => alert(err?.response?.data?.message || 'Failed'),
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Assignments</Text>
      </View>
      <View style={styles.tabs}>
        {(['active','completed'] as const).map(tab => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
            <Text style={activeTab === tab ? styles.tabTextActive : styles.tabText}>{tab === 'active' ? 'Active' : 'Completed'}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput style={styles.search} placeholder="Search..." value={search} onChangeText={setSearch} />

      {isLoading ? <ActivityIndicator style={{ marginTop: 20 }} /> : (
        <FlatList
          data={filtered}
          keyExtractor={(item: any) => String(item.id)}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { refetch(); }} />}
          renderItem={({ item }) => {
            const p = item.parcel;
            if (!p) return null;
            return (
              <View style={styles.card}>
                <View style={styles.rowBetween}>
                  <Text style={styles.tracking}>{p.tracking_number}</Text>
                  <Text style={styles.status}>{p.status}</Text>
                </View>
                <Text style={styles.sub}>{p.recipient_name}</Text>
                <Text style={styles.sub}>{p.recipient_phone}</Text>
                <Text style={styles.sub}>{p.delivery_address}</Text>
                {p.priority !== 'NORMAL' && <Text style={styles.priority}>{p.priority}</Text>}
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.smallBtn} onPress={() => navigation.navigate('ParcelDetail', { id: p.id })}>
                    <Text style={styles.smallBtnText}>View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.smallBtn} onPress={() => navigation.navigate('AssignmentDetail', { id: item.id })}>
                    <Text style={styles.smallBtnText}>Details</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.smallBtn} onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.delivery_address)}`)}>
                    <Text style={styles.smallBtnText}>Maps</Text>
                  </TouchableOpacity>
                  {item.status === 'ACTIVE' && (
                    <TouchableOpacity style={[styles.smallBtn, { backgroundColor: '#2563eb' }]} onPress={() => setShowAttempt(item.id)}>
                      <Text style={[styles.smallBtnText, { color: '#fff' }]}>Record</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}

      <Modal visible={showAttempt !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Record Attempt</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity style={[styles.toggle, attemptForm.result === 'DELIVERED' && styles.toggleActiveSuccess]} onPress={() => setAttemptForm(f => ({ ...f, result: 'DELIVERED' }))}>
                <Text>Delivered</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toggle, attemptForm.result === 'FAILED' && styles.toggleActiveFail]} onPress={() => setAttemptForm(f => ({ ...f, result: 'FAILED' }))}>
                <Text>Failed</Text>
              </TouchableOpacity>
            </View>
            {attemptForm.result === 'DELIVERED' && (
              <TextInput style={styles.input} placeholder="Recipient name" value={attemptForm.recipient_name} onChangeText={(v) => setAttemptForm(f => ({ ...f, recipient_name: v }))} />
            )}
            {attemptForm.result === 'FAILED' && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }} contentContainerStyle={{ gap: 6 }}>
                {FAILURE_REASONS.map(r => (
                  <TouchableOpacity key={r} style={[styles.chip, attemptForm.failure_reason === r && styles.chipActive]} onPress={() => setAttemptForm(f => ({ ...f, failure_reason: r }))}>
                    <Text style={attemptForm.failure_reason === r ? styles.chipTextActive : styles.chipText}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            <TextInput style={styles.input} placeholder="Notes" value={attemptForm.notes} onChangeText={(v) => setAttemptForm(f => ({ ...f, notes: v }))} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.buttonSecondary} onPress={() => setShowAttempt(null)}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => showAttempt && attemptMutation.mutate(showAttempt)} disabled={attemptMutation.isPending}>
                <Text style={styles.buttonText}>{attemptMutation.isPending ? 'Saving...' : 'Submit'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { padding: 16 },
  title: { fontSize: 22, fontWeight: '700' },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#e5e7eb' },
  tabActive: { backgroundColor: '#2563eb' },
  tabText: { color: '#374151' },
  tabTextActive: { color: '#fff' },
  search: { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 8, padding: 10, marginBottom: 8 },
  card: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 10, borderRadius: 10, padding: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tracking: { fontWeight: '700', color: '#2563eb' },
  status: { fontSize: 11, color: '#374151', fontWeight: '600' },
  sub: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  priority: { color: '#dc2626', fontSize: 11, marginTop: 4, fontWeight: '600' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  smallBtn: { backgroundColor: '#e5e7eb', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  smallBtnText: { fontSize: 12, color: '#374151' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 16 },
  modalCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  toggleRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  toggle: { flex: 1, padding: 10, borderRadius: 8, backgroundColor: '#e5e7eb', alignItems: 'center' },
  toggleActiveSuccess: { backgroundColor: '#dcfce7' },
  toggleActiveFail: { backgroundColor: '#fee2e2' },
  input: { backgroundColor: '#f3f4f6', borderRadius: 8, padding: 10, marginBottom: 8 },
  modalActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  button: { flex: 1, backgroundColor: '#2563eb', borderRadius: 8, padding: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
  buttonSecondary: { flex: 1, backgroundColor: '#e5e7eb', borderRadius: 8, padding: 12, alignItems: 'center' },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#e5e7eb' },
  chipActive: { backgroundColor: '#2563eb' },
  chipText: { fontSize: 11, color: '#374151' },
  chipTextActive: { fontSize: 11, color: '#fff' },
});
