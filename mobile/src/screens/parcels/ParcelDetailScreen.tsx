import React, { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, TouchableOpacity, TextInput, Image, Alert, Platform } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import parcelService from '../../services/parcelService';
import userService from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';
import { queryClient } from '../../lib/queryClient';

const STATUS_TRANSITIONS: Record<string, string[]> = {
  RECEIVED: ['VERIFIED', 'DAMAGED'],
  VERIFIED: ['IN_TRANSIT', 'DELIVERED', 'FAILED', 'DAMAGED'],
  IN_TRANSIT: ['DELIVERED', 'FAILED'],
  DELIVERED: [],
  FAILED: ['IN_TRANSIT', 'DELIVERED'],
  DAMAGED: [],
};

export default function ParcelDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const id = route.params?.id;
  const { hasRole } = useAuth();
  const qc = useQueryClient();

  const [showAssign, setShowAssign] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<number | null>(null);
  const [assignNotes, setAssignNotes] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');

  const { data: parcel, isLoading } = useQuery({
    queryKey: ['parcel', id],
    queryFn: () => parcelService.get(Number(id)).then((r: any) => r.data.data),
  });

  const { data: staffData } = useQuery({
    queryKey: ['delivery-staff'],
    queryFn: () => userService.deliveryStaff().then((r: any) => r.data.data),
    enabled: showAssign,
  });

  const statusMutation = useMutation({
    mutationFn: () => parcelService.statusTransition(Number(id), selectedStatus as any, statusReason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['parcel', id] }); setSelectedStatus(''); setStatusReason(''); },
  });

  const assignMutation = useMutation({
    mutationFn: () => parcelService.assign(Number(id), selectedStaff as number, assignNotes),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['parcel', id] }); setShowAssign(false); setSelectedStaff(null); setAssignNotes(''); },
  });

  const deleteMutation = useMutation({
    mutationFn: () => parcelService.delete(Number(id)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['parcels'] }); navigation.goBack(); },
  });

  const uploadMutation = useMutation({
    mutationFn: (files: any[]) => parcelService.uploadImages(Number(id), files),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parcel', id] }),
  });

  const deleteImageMutation = useMutation({
    mutationFn: (imageId: number) => parcelService.deleteImage(Number(id), imageId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parcel', id] }),
  });

  if (isLoading || !parcel) return <ActivityIndicator style={{ marginTop: 40 }} />;

  const p = parcel as any;
  const images = p.images ?? [];
  const canAssign = hasRole(['admin', 'manager']) && ['VERIFIED','IN_TRANSIT','FAILED'].includes(p.status);
  const canChangeStatus = hasRole('admin') || (hasRole('manager') && p.status !== 'IN_TRANSIT');
  const possibleTransitions = (STATUS_TRANSITIONS[p.status] ?? []).filter((s: string) => !(hasRole('manager') && s === 'IN_TRANSIT' && false));
  const canEdit = hasRole('admin') || (hasRole('manager') && !['DELIVERED','FAILED','DAMAGED'].includes(p.status));
  const canManageImages = hasRole('admin') || (hasRole('manager') && !['DELIVERED','FAILED','DAMAGED'].includes(p.status));

  const pickImages = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection: true, mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (res.canceled) return;
    const files = res.assets.map((a) => ({ uri: a.uri, name: a.fileName || 'image.jpg', type: a.mimeType || 'image/jpeg' })) as any;
    uploadMutation.mutate(files);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← Back</Text></TouchableOpacity>
        <Text style={styles.tracking}>{p.tracking_number}</Text>
        <Text style={styles.status}>{p.status}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Recipient</Text>
        <Text style={styles.value}>{p.recipient_name} • {p.recipient_phone}</Text>
        <Text style={styles.label}>Address</Text>
        <Text style={styles.value}>{p.delivery_address}</Text>
        {p.delivery_area && <Text style={styles.value}>{p.delivery_area.name}</Text>}
        <Text style={styles.label}>Sender</Text>
        <Text style={styles.value}>{p.sender_name || '-'} {p.sender_phone || ''}</Text>
        <Text style={styles.label}>Fee / COD</Text>
        <Text style={styles.value}>{p.delivery_fee} / {p.cod_amount} (COD: {p.is_cod ? 'Yes' : 'No'})</Text>
        <Text style={styles.label}>Priority / Condition</Text>
        <Text style={styles.value}>{p.priority} / {p.condition}</Text>
      </View>

      {/* Status transitions */}
      {canChangeStatus && possibleTransitions.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Change Status</Text>
          <View style={styles.rowWrap}>
            {possibleTransitions.map((s) => (
              <TouchableOpacity key={s} style={[styles.chip, selectedStatus === s && styles.chipActive]} onPress={() => setSelectedStatus(s)}>
                <Text style={selectedStatus === s ? styles.chipTextActive : styles.chipText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {selectedStatus ? (
            <>
              <TextInput style={styles.input} placeholder="Reason (optional)" value={statusReason} onChangeText={setStatusReason} />
              <TouchableOpacity style={styles.button} onPress={() => statusMutation.mutate()} disabled={statusMutation.isPending}>
                <Text style={styles.buttonText}>{statusMutation.isPending ? 'Updating...' : 'Update Status'}</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      )}

      {/* Assign */}
      {canAssign && (
        <View style={styles.card}>
          <TouchableOpacity onPress={() => setShowAssign(!showAssign)}>
            <Text style={styles.sectionTitle}>{p.active_assignment ? 'Reassign' : 'Assign'} Staff {showAssign ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {showAssign && (
            <>
              {(staffData || []).map((s: any) => (
                <TouchableOpacity key={s.id} style={[styles.staffRow, selectedStaff === s.id && styles.staffRowActive]} onPress={() => setSelectedStaff(s.id)}>
                  <Text>{s.name}</Text>
                </TouchableOpacity>
              ))}
              <TextInput style={styles.input} placeholder="Notes" value={assignNotes} onChangeText={setAssignNotes} />
              <TouchableOpacity style={styles.button} onPress={() => assignMutation.mutate()} disabled={!selectedStaff || assignMutation.isPending}>
                <Text style={styles.buttonText}>{assignMutation.isPending ? 'Assigning...' : 'Assign'}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* Images */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Images</Text>
        <View style={styles.imageGrid}>
          {images.map((img: any) => (
            <View key={img.id} style={styles.imageWrap}>
              <Image source={{ uri: img.url }} style={styles.image} />
              {canManageImages && (
                <TouchableOpacity style={styles.deleteImage} onPress={() => deleteImageMutation.mutate(img.id)}>
                  <Text style={{ color: '#fff', fontSize: 10 }}>X</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
        {canManageImages && (
          <TouchableOpacity style={styles.button} onPress={pickImages} disabled={uploadMutation.isPending}>
            <Text style={styles.buttonText}>{uploadMutation.isPending ? 'Uploading...' : 'Upload Images'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {canEdit && (
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('EditParcel', { id: p.id })}>
            <Text style={styles.buttonText}>Edit</Text>
          </TouchableOpacity>
        )}
        {hasRole(['admin','manager']) && (
          <TouchableOpacity style={[styles.button, { backgroundColor: '#dc2626' }]} onPress={() => {
            Alert.alert('Delete parcel?', 'This cannot be undone.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() },
            ]);
          }}>
            <Text style={styles.buttonText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 16 },
  header: { marginBottom: 12 },
  back: { color: '#2563eb', marginBottom: 8 },
  tracking: { fontSize: 20, fontWeight: '700' },
  status: { color: '#6b7280', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 12 },
  label: { color: '#6b7280', fontSize: 12, marginTop: 8 },
  value: { fontSize: 14, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#e5e7eb' },
  chipActive: { backgroundColor: '#2563eb' },
  chipText: { fontSize: 12, color: '#374151' },
  chipTextActive: { fontSize: 12, color: '#fff' },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, marginVertical: 8 },
  button: { backgroundColor: '#2563eb', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '600' },
  staffRow: { padding: 10, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, marginBottom: 6 },
  staffRowActive: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  imageWrap: { position: 'relative' },
  image: { width: 90, height: 90, borderRadius: 8 },
  deleteImage: { position: 'absolute', top: 4, right: 4, backgroundColor: '#dc2626', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  actions: { gap: 8, marginBottom: 24 },
});
