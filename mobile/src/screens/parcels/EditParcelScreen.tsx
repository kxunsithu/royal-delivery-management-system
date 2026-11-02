import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import parcelService from '../../services/parcelService';
import dashboardService from '../../services/dashboardService';

export default function EditParcelScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const id = route.params?.id;
  const qc = useQueryClient();
  const { data: parcel, isLoading } = useQuery({ queryKey: ['parcel', id], queryFn: () => parcelService.get(Number(id)).then((r: any) => r.data.data) });
  const { data: areasData } = useQuery({ queryKey: ['delivery-areas'], queryFn: () => dashboardService.deliveryAreas().then((r: any) => r.data.data) });
  const areas = areasData ?? [];

  const [form, setForm] = useState<any>(null);
  useEffect(() => {
    if (parcel && !form) {
      const p = parcel as any;
      setForm({
        tracking_number: p.tracking_number || '',
        sender_name: p.sender_name || '',
        sender_phone: p.sender_phone || '',
        recipient_name: p.recipient_name || '',
        recipient_phone: p.recipient_phone || '',
        delivery_address: p.delivery_address || '',
        delivery_area_id: p.delivery_area?.id ? String(p.delivery_area.id) : '',
        description: p.description || '',
        quantity: String(p.quantity ?? 1),
        weight: p.weight ? String(p.weight) : '',
        notes: p.notes || '',
        delivery_fee: String(p.delivery_fee ?? ''),
        cod_amount: String(p.cod_amount ?? 0),
        is_cod: !!p.is_cod,
        condition: p.condition || 'GOOD',
        priority: p.priority || 'NORMAL',
        received_at: p.received_at || '',
        damage_description: p.damage_description || '',
      });
    }
  }, [parcel]);

  const mutation = useMutation({
    mutationFn: (payload: any) => parcelService.update(Number(id), payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['parcel', id] }); navigation.goBack(); },
    onError: (err: any) => Alert.alert('Error', err?.response?.data?.message || 'Failed'),
  });

  if (isLoading || !form) return <ActivityIndicator style={{ marginTop: 40 }} />;

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleSubmit = () => {
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
      <Text style={styles.title}>Edit Parcel</Text>
      <InputField label="Tracking Number" value={form.tracking_number} onChange={(v: string) => set('tracking_number', v)} />
      <InputField label="Sender Name" value={form.sender_name} onChange={(v: string) => set('sender_name', v)} />
      <InputField label="Sender Phone" value={form.sender_phone} onChange={(v: string) => set('sender_phone', v)} keyboardType="phone-pad" />
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
      <InputField label="Description" value={form.description} onChange={(v: string) => set('description', v)} />
      <InputField label="Quantity" value={form.quantity} onChange={(v: string) => set('quantity', v)} keyboardType="numeric" />
      <InputField label="Weight" value={form.weight} onChange={(v: string) => set('weight', v)} keyboardType="numeric" />
      <InputField label="Notes" value={form.notes} onChange={(v: string) => set('notes', v)} />
      <InputField label="Delivery Fee" value={form.delivery_fee} onChange={(v: string) => set('delivery_fee', v)} keyboardType="numeric" />
      <InputField label="COD Amount" value={form.cod_amount} onChange={(v: string) => set('cod_amount', v)} keyboardType="numeric" />
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
      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={mutation.isPending}>
        <Text style={styles.buttonText}>{mutation.isPending ? 'Saving...' : 'Save Changes'}</Text>
      </TouchableOpacity>
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  label: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  input: { backgroundColor: '#fff', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#d1d5db', marginBottom: 4 },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#e5e7eb' },
  chipActive: { backgroundColor: '#2563eb' },
  chipText: { fontSize: 12, color: '#374151' },
  chipTextActive: { fontSize: 12, color: '#fff' },
  button: { backgroundColor: '#2563eb', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 12 },
  buttonText: { color: '#fff', fontWeight: '600' },
});
