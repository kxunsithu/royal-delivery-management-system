import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import userService from '../../services/userService';

export default function CreateUserScreen() {
  const navigation = useNavigation<any>();
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', employee_id: '', role: 'delivery_staff' });
  const [showPassword, setShowPassword] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => userService.create(form as any),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); navigation.goBack(); },
    onError: (err: any) => Alert.alert('Error', err?.response?.data?.message || 'Failed'),
  });

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Create User</Text>
      {['name','email','phone','password','employee_id'].map(k => (
        <View key={k} style={{ marginBottom: 10 }}>
          <Text style={styles.label}>{k}</Text>
          {k === 'password' ? (
            <View style={styles.passwordRow}>
              <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} value={(form as any)[k]} onChangeText={(v) => set(k, v)} secureTextEntry={!showPassword} keyboardType="default" autoCapitalize="sentences" />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(v => !v)}>
                <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TextInput style={styles.input} value={(form as any)[k]} onChangeText={(v) => set(k, v)} secureTextEntry={k === 'password'} keyboardType={k === 'email' ? 'email-address' : 'default'} autoCapitalize={k === 'email' ? 'none' : 'sentences'} />
          )}
        </View>
      ))}
      <Text style={styles.label}>Role</Text>
      <View style={styles.chipRow}>
        {['admin','manager','accountant','delivery_staff'].map(r => (
          <TouchableOpacity key={r} style={[styles.chip, form.role === r && styles.chipActive]} onPress={() => set('role', r)}>
            <Text style={form.role === r ? styles.chipTextActive : styles.chipText}>{r}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.button} onPress={() => mutation.mutate()} disabled={mutation.isPending}>
        {mutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  label: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  input: { backgroundColor: '#fff', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#d1d5db', marginBottom: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#e5e7eb' },
  chipActive: { backgroundColor: '#2563eb' },
  chipText: { fontSize: 12, color: '#374151' },
  chipTextActive: { fontSize: 12, color: '#fff' },
  button: { backgroundColor: '#2563eb', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 12 },
  buttonText: { color: '#fff', fontWeight: '600' },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  eyeBtn: { paddingHorizontal: 10, paddingVertical: 10 },
  eyeText: { color: '#2563eb', fontWeight: '600' },
});
