import React, { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import parcelService from '../../services/parcelService';
import dashboardService from '../../services/dashboardService';
import { queryClient } from '../../lib/queryClient';

export default function RegisterParcelScreen() {
  const navigation = useNavigation<any>();
  const qc = useQueryClient();
  const { data: areasData } = useQuery({ queryKey: ['delivery-areas'], queryFn: () => dashboardService.deliveryAreas().then((r: any) => r.data.data) });
  const areas = areasData ?? [];

  const [form, setForm] = useState<any>({
    tracking_number: '', sender_name: '', sender_phone: '',
    recipient_name: '', recipient_phone: '', delivery_address: '',
    delivery_area_id: '', description: '', quantity: '1', weight: '',
    notes: '', delivery_fee: '', cod_amount: '0', is_cod: false,
    condition: 'GOOD', priority: 'NORMAL', received_at: '', damage_description: '',
  });
  const [localImages, setLocalImages] = useState<any[]>([]);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const pickImages = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection: true, mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (res.canceled) return;
    const imgs = res.assets.map((a) => ({ uri: a.uri, name: a.fileName || 'image.jpg', type: a.mimeType || 'image/jpeg' }));
    const combined = [...localImages, ...imgs];
    if (combined.length > 10) { Alert.alert('Max 10 images'); return; }
    setLocalImages(combined);
  };

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await parcelService.create(payload);
      const parcelId = (res.data as any).data.id;
      if (localImages.length > 0) {
        try { await parcelService.uploadImages(parcelId, localImages as any); } catch {}
      }
      return parcelId;
    },
    onSuccess: (parcelId) => {
      qc.invalidateQueries({ queryKey: ['parcels'] });
      navigation.replace('ParcelDetail', { id: parcelId });
    },
    onError: (err: any) => Alert.alert('Error', err?.response?.data?.message || 'Failed'),
  });

  const handleSubmit = () => {
    if (!form.recipient_name || !form.recipient_phone || !form.delivery_address) {
      Alert.alert('Validation', 'Recipient name, phone, address required');
      return;
    }
    const payload: any = {
      recipient_name: form.recipient_name,
      recipient_phone: form.recipient_phone,
      delivery_address: form.delivery_address,
      delivery_fee: parseFloat(form.delivery_fee) || 0,
      quantity: parseInt(form.quantity) || 1,
      is_cod: form.is_cod,
      cod_amount: parseFloat(form.cod_amount) || 0,
      condition: form.condition,
      priority: form.priority,
    };
    if (form.tracking_number) payload.tracking_number = form.tracking_number;
    if (form.sender_name) payload.sender_name = form.sender_name;
    if (form.sender_phone) payload.sender_phone = form.sender_phone;
    if (form.delivery_area_id) payload.delivery_area_id = parseInt(form.delivery_area_id);
    if (form.description) payload.description = form.description;
    if (form.weight) payload.weight = parseFloat(form.weight);
    if (form.notes) payload.notes = form.notes;
    if (form.received_at) payload.received_at = form.received_at;
    if (form.damage_description) payload.damage_description = form.damage_description;
    mutation.mutate(payload);
  };

  const InputField = ({ label, value, onChange, ...props }: any) => (
    <View style={{ marginBottom: 10 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} value={value} onChangeText={onChange} {...props} />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Register Parcel</Text>

      <Text style={styles.section}>Sender Info</Text>
      <InputField label="Tracking Number (optional)" value={form.tracking_number} onChange={(v: string) => set('tracking_number', v)} />
      <InputField label="Sender Name" value={form.sender_name} onChange={(v: string) => set('sender_name', v)} />
      <InputField label="Sender Phone" value={form.sender_phone} onChange={(v: string) => set('sender_phone', v)} keyboardType="phone-pad" />

      <Text style={styles.section}>Recipient Info</Text>
      <InputField label="Recipient Name *" value={form.recipient_name} onChange={(v: string) => set('recipient_name', v)} />
      <InputField label="Recipient Phone *" value={form.recipient_phone} onChange={(v: string) => set('recipient_phone', v)} keyboardType="phone-pad" />
      <InputField label="Delivery Address *" value={form.delivery_address} onChange={(v: string) => set('delivery_address', v)} />
      <Text style={styles.label}>Delivery Area</Text>
      <View style={styles.pickerRow}>
        <TouchableOpacity style={[styles.chip, form.delivery_area_id === '' && styles.chipActive]} onPress={() => set('delivery_area_id', '')}>
          <Text style={form.delivery_area_id === '' ? styles.chipTextActive : styles.chipText}>None</Text>
        </TouchableOpacity>
        {areas.map((a: any) => (
          <TouchableOpacity key={a.id} style={[styles.chip, String(form.delivery_area_id) === String(a.id) && styles.chipActive]} onPress={() => set('delivery_area_id', String(a.id))}>
            <Text style={String(form.delivery_area_id) === String(a.id) ? styles.chipTextActive : styles.chipText}>{a.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.section}>Parcel Details</Text>
      <InputField label="Description" value={form.description} onChange={(v: string) => set('description', v)} />
      <InputField label="Quantity" value={form.quantity} onChange={(v: string) => set('quantity', v)} keyboardType="numeric" />
      <InputField label="Weight" value={form.weight} onChange={(v: string) => set('weight', v)} keyboardType="numeric" />
      <InputField label="Notes" value={form.notes} onChange={(v: string) => set('notes', v)} />
      <InputField label="Delivery Fee" value={form.delivery_fee} onChange={(v: string) => set('delivery_fee', v)} keyboardType="numeric" />
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <TouchableOpacity onPress={() => set('is_cod', !form.is_cod)} style={styles.checkbox}>
          <Text>{form.is_cod ? '☑' : '☐'} COD</Text>
        </TouchableOpacity>
      </View>
      {form.is_cod && <InputField label="COD Amount" value={form.cod_amount} onChange={(v: string) => set('cod_amount', v)} keyboardType="numeric" />}
      <Text style={styles.label}>Condition</Text>
      <View style={styles.pickerRow}>
        {['GOOD','DAMAGED','MISSING'].map(c => (
          <TouchableOpacity key={c} style={[styles.chip, form.condition === c && styles.chipActive]} onPress={() => set('condition', c)}>
            <Text style={form.condition === c ? styles.chipTextActive : styles.chipText}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.label}>Priority</Text>
      <View style={styles.pickerRow}>
        {['NORMAL','HIGH','URGENT'].map(c => (
          <TouchableOpacity key={c} style={[styles.chip, form.priority === c && styles.chipActive]} onPress={() => set('priority', c)}>
            <Text style={form.priority === c ? styles.chipTextActive : styles.chipText}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <InputField label="Received At (optional)" value={form.received_at} onChange={(v: string) => set('received_at', v)} placeholder="YYYY-MM-DD HH:MM" />
      {form.condition === 'DAMAGED' && <InputField label="Damage Description" value={form.damage_description} onChange={(v: string) => set('damage_description', v)} />}

      <Text style={styles.section}>Images</Text>
      <TouchableOpacity style={styles.buttonSecondary} onPress={pickImages}>
        <Text style={styles.buttonSecondaryText}>Pick Images ({localImages.length})</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={mutation.isPending}>
        <Text style={styles.buttonText}>{mutation.isPending ? 'Saving...' : 'Register Parcel'}</Text>
      </TouchableOpacity>
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  section: { fontSize: 16, fontWeight: '600', marginTop: 12, marginBottom: 8 },
  label: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  input: { backgroundColor: '#fff', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#d1d5db', marginBottom: 4 },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#e5e7eb' },
  chipActive: { backgroundColor: '#2563eb' },
  chipText: { fontSize: 12, color: '#374151' },
  chipTextActive: { fontSize: 12, color: '#fff' },
  checkbox: { padding: 8 },
  button: { backgroundColor: '#2563eb', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 12 },
  buttonText: { color: '#fff', fontWeight: '600' },
  buttonSecondary: { backgroundColor: '#e5e7eb', borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 8 },
  buttonSecondaryText: { color: '#374151', fontWeight: '600' },
});
