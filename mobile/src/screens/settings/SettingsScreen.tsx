import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, FlatList, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/api';

export default function SettingsScreen() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'settings'|'areas'|'logs'>('settings');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <View style={styles.tabs}>
        {(['settings','areas','logs'] as const).map(t => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={tab === t ? styles.tabTextActive : styles.tabText}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {tab === 'settings' && <SettingsTab qc={qc} />}
      {tab === 'areas' && <AreasTab qc={qc} />}
      {tab === 'logs' && <LogsTab />}
    </View>
  );
}

function SettingsTab({ qc }: any) {
  const { data, isLoading } = useQuery({ queryKey: ['settings'], queryFn: () => apiClient.get('/settings').then((r: any) => r.data.data) });
  const [editing, setEditing] = useState<any>(null);
  const [value, setValue] = useState('');
  const mutation = useMutation({
    mutationFn: ({ key, val }: any) => apiClient.put(`/settings/${key}`, { value: val }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings'] }); setEditing(null); },
    onError: (err: any) => Alert.alert('Error', err?.response?.data?.message || 'Failed'),
  });
  if (isLoading) return <ActivityIndicator />;
  return (
    <ScrollView style={{ flex: 1 }}>
      {(data || []).map((s: any) => (
        <View key={s.key} style={styles.card}>
          <Text style={styles.label}>{s.key}</Text>
          {s.description && <Text style={styles.sub}>{s.description}</Text>}
          {editing === s.key ? (
            <>
              <TextInput style={styles.input} value={value} onChangeText={setValue} />
              <TouchableOpacity style={styles.button} onPress={() => mutation.mutate({ key: s.key, val: value })}>
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
              <Text style={styles.value}>{String(s.value)}</Text>
              <TouchableOpacity onPress={() => { setEditing(s.key); setValue(String(s.value ?? '')); }}>
                <Text style={styles.link}>Edit</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

function AreasTab({ qc }: any) {
  const { data, isLoading, refetch } = useQuery({ queryKey: ['delivery-areas'], queryFn: () => apiClient.get('/settings/delivery-areas').then((r: any) => r.data.data) });
  const [name, setName] = useState('');
  const [nameMm, setNameMm] = useState('');
  const createMutation = useMutation({
    mutationFn: () => apiClient.post('/settings/delivery-areas', { name, name_mm: nameMm || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['delivery-areas'] }); setName(''); setNameMm(''); },
    onError: (err: any) => Alert.alert('Error', err?.response?.data?.message || 'Failed'),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/settings/delivery-areas/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['delivery-areas'] }),
  });
  if (isLoading) return <ActivityIndicator />;
  return (
    <ScrollView style={{ flex: 1 }}>
      <View style={styles.card}>
        <Text style={styles.label}>New Area</Text>
        <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Name (mm)" value={nameMm} onChangeText={setNameMm} />
        <TouchableOpacity style={styles.button} onPress={() => createMutation.mutate()} disabled={!name || createMutation.isPending}>
          <Text style={styles.buttonText}>Create</Text>
        </TouchableOpacity>
      </View>
      {(data || []).map((a: any) => (
        <View key={a.id} style={styles.card}>
          <Text style={styles.value}>{a.name}</Text>
          {a.name_mm && <Text style={styles.sub}>{a.name_mm}</Text>}
          <TouchableOpacity style={[styles.button, { backgroundColor: '#dc2626' }]} onPress={() => {
            Alert.alert('Deactivate area?', '', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Deactivate', style: 'destructive', onPress: () => deleteMutation.mutate(a.id) },
            ]);
          }}>
            <Text style={styles.buttonText}>Deactivate</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

function LogsTab() {
  const { data, isLoading } = useQuery({ queryKey: ['activity-logs'], queryFn: () => apiClient.get('/settings/activity-logs').then((r: any) => r.data) });
  if (isLoading) return <ActivityIndicator />;
  const logs = (data as any)?.data ?? [];
  return (
    <FlatList
      data={logs}
      keyExtractor={(item: any) => String(item.id)}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.value}>{item.action}</Text>
          <Text style={styles.sub}>{item.user?.name ?? 'System'} • {item.created_at}</Text>
          {item.description && <Text style={styles.sub}>{item.description}</Text>}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tab: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#e5e7eb' },
  tabActive: { backgroundColor: '#2563eb' },
  tabText: { color: '#374151' },
  tabTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8 },
  label: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  sub: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  value: { fontSize: 14, marginTop: 2 },
  input: { backgroundColor: '#f3f4f6', borderRadius: 8, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: '#d1d5db' },
  button: { backgroundColor: '#2563eb', borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 6 },
  buttonText: { color: '#fff', fontWeight: '600' },
  link: { color: '#2563eb' },
});
