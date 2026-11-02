import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import deliveryService from '../../services/deliveryService';
import { queryClient } from '../../lib/queryClient';

const FAILURE_REASONS = ['RECIPIENT_UNAVAILABLE','PHONE_UNREACHABLE','WRONG_ADDRESS','REFUSED','RESCHEDULED','OTHER'];

export default function RecordAttemptScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const id = route.params?.id;
  const qc = useQueryClient();
  const [result, setResult] = useState<'DELIVERED'|'FAILED'>('DELIVERED');
  const [failureReason, setFailureReason] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [notes, setNotes] = useState('');

  const mutation = useMutation({
    mutationFn: () => deliveryService.recordAttempt(Number(id), {
      result,
      failure_reason: failureReason || undefined,
      recipient_name: recipientName || undefined,
      notes: notes || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-assignments'] });
      qc.invalidateQueries({ queryKey: ['assignment', id] });
      navigation.goBack();
    },
    onError: (err: any) => Alert.alert('Error', err?.response?.data?.message || 'Failed'),
  });

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Record Attempt</Text>
      <View style={styles.toggleRow}>
        <TouchableOpacity style={[styles.toggle, result === 'DELIVERED' && styles.toggleActiveSuccess]} onPress={() => setResult('DELIVERED')}>
          <Text>Delivered</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toggle, result === 'FAILED' && styles.toggleActiveFail]} onPress={() => setResult('FAILED')}>
          <Text>Failed</Text>
        </TouchableOpacity>
      </View>
      {result === 'DELIVERED' && (
        <TextInput style={styles.input} placeholder="Recipient name" value={recipientName} onChangeText={setRecipientName} />
      )}
      {result === 'FAILED' && (
        <View style={styles.chipRow}>
          {FAILURE_REASONS.map(r => (
            <TouchableOpacity key={r} style={[styles.chip, failureReason === r && styles.chipActive]} onPress={() => setFailureReason(r)}>
              <Text style={failureReason === r ? styles.chipTextActive : styles.chipText}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <TextInput style={styles.input} placeholder="Notes" value={notes} onChangeText={setNotes} multiline />
      <TouchableOpacity style={styles.button} onPress={() => mutation.mutate()} disabled={mutation.isPending}>
        <Text style={styles.buttonText}>{mutation.isPending ? 'Saving...' : 'Submit'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  toggleRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  toggle: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#e5e7eb', alignItems: 'center' },
  toggleActiveSuccess: { backgroundColor: '#dcfce7' },
  toggleActiveFail: { backgroundColor: '#fee2e2' },
  input: { backgroundColor: '#fff', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#d1d5db', marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#e5e7eb' },
  chipActive: { backgroundColor: '#2563eb' },
  chipText: { fontSize: 11, color: '#374151' },
  chipTextActive: { fontSize: 11, color: '#fff' },
  button: { backgroundColor: '#2563eb', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 12 },
  buttonText: { color: '#fff', fontWeight: '600' },
});
