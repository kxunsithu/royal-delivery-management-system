import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import deliveryService from '../../services/deliveryService';

export default function AssignmentDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const id = route.params?.id;
  const { data: assignment, isLoading } = useQuery({ queryKey: ['assignment', id], queryFn: () => deliveryService.get(Number(id)).then((r: any) => r.data.data) });

  if (isLoading || !assignment) return <ActivityIndicator style={{ marginTop: 40 }} />;

  const a = assignment as any;
  const p = a.parcel;

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← Back</Text></TouchableOpacity>
      <Text style={styles.title}>Delivery Assignment</Text>
      {p && (
        <View style={styles.card}>
          <Text style={styles.section}>Parcel</Text>
          <Text style={styles.value}>{p.tracking_number}</Text>
          <Text style={styles.sub}>{p.recipient_name} • {p.recipient_phone}</Text>
          <Text style={styles.sub}>{p.delivery_address}</Text>
          <TouchableOpacity onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.delivery_address)}`)}>
            <Text style={styles.link}>Open in Maps</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('ParcelDetail', { id: p.id })}>
            <Text style={styles.link}>View Parcel Details</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.card}>
        <Text style={styles.section}>Assignment</Text>
        <Text style={styles.sub}>Staff: {a.staff?.name ?? '-'}</Text>
        <Text style={styles.sub}>Assigned by: {a.assigned_by?.name ?? '-'}</Text>
        <Text style={styles.sub}>Status: {a.status}</Text>
        <Text style={styles.sub}>Assigned at: {a.assigned_at}</Text>
        {a.completed_at && <Text style={styles.sub}>Completed at: {a.completed_at}</Text>}
        {a.notes && <Text style={styles.sub}>Notes: {a.notes}</Text>}
      </View>

      {a.delivery_attempts && a.delivery_attempts.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.section}>Attempts</Text>
          {a.delivery_attempts.map((da: any) => (
            <View key={da.id} style={styles.attempt}>
              <Text style={styles.value}>{da.result}</Text>
              <Text style={styles.sub}>{da.attempted_at}</Text>
              {da.failure_reason && <Text style={styles.sub}>{da.failure_reason}</Text>}
              {da.recipient_name && <Text style={styles.sub}>Received by: {da.recipient_name}</Text>}
              {da.notes && <Text style={styles.sub}>{da.notes}</Text>}
            </View>
          ))}
        </View>
      )}

      {a.status === 'ACTIVE' && (
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('RecordAttempt', { id: a.id })}>
          <Text style={styles.buttonText}>Record Attempt</Text>
        </TouchableOpacity>
      )}
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 16 },
  back: { color: '#2563eb', marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 12 },
  section: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  value: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  sub: { color: '#6b7280', fontSize: 13, marginTop: 2 },
  link: { color: '#2563eb', marginTop: 6 },
  attempt: { borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 8, marginTop: 8 },
  button: { backgroundColor: '#2563eb', borderRadius: 8, padding: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
});
