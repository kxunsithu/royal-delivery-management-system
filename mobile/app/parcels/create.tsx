import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { parcelService } from '../../src/services/parcelService';
import apiClient from '../../src/services/apiClient';
import { COLORS } from '../../src/constants';

interface DeliveryArea {
  id: number;
  name: string;
  name_mm?: string;
}

export default function CreateParcelScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    tracking_number: '',
    sender_name: '',
    sender_phone: '',
    recipient_name: '',
    recipient_phone: '',
    delivery_address: '',
    delivery_area_id: '',
    description: '',
    quantity: '1',
    weight: '',
    notes: '',
    delivery_fee: '',
    cod_amount: '0',
    is_cod: false,
    priority: 'NORMAL',
    condition: 'GOOD',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: areas } = useQuery({
    queryKey: ['delivery-areas'],
    queryFn: async () => {
      const res = await apiClient.get('/settings/delivery-areas');
      return res.data.data as DeliveryArea[];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => parcelService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parcels'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      Alert.alert('အောင်မြင်သည်', 'ပါဆယ် မှတ်ပုံတင်ပြီးပါပြီ', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'ပါဆယ် မှတ်ပုံတင်မှု မအောင်မြင်ပါ';
      Alert.alert('အမှားဖြစ်ပွားသည်', msg);
    },
  });

  function update(field: string, value: any) {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: undefined as any }));
  }

  function validate() {
    const newErrors: Record<string, string> = {};
    if (!form.recipient_name.trim()) newErrors.recipient_name = 'လိုအပ်သည်';
    if (!form.recipient_phone.trim()) newErrors.recipient_phone = 'လိုအပ်သည်';
    if (!form.delivery_address.trim()) newErrors.delivery_address = 'လိုအပ်သည်';
    if (!form.delivery_fee.trim()) newErrors.delivery_fee = 'လိုအပ်သည်';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    createMutation.mutate({
      tracking_number: form.tracking_number || undefined,
      sender_name: form.sender_name || undefined,
      sender_phone: form.sender_phone || undefined,
      recipient_name: form.recipient_name,
      recipient_phone: form.recipient_phone,
      delivery_address: form.delivery_address,
      delivery_area_id: form.delivery_area_id ? Number(form.delivery_area_id) : undefined,
      description: form.description || undefined,
      quantity: Number(form.quantity) || 1,
      weight: form.weight ? Number(form.weight) : undefined,
      notes: form.notes || undefined,
      delivery_fee: Number(form.delivery_fee),
      cod_amount: Number(form.cod_amount) || 0,
      is_cod: form.is_cod,
      priority: form.priority,
      condition: form.condition,
    });
  }

  const priorities = [
    { value: 'NORMAL', label: 'ပုံမှန်' },
    { value: 'HIGH', label: 'အရေးကြီး' },
    { value: 'URGENT', label: 'အရေးပေါ်' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ပါဆယ်အသစ် မှတ်ပုံတင်မည်</Text>
        <TouchableOpacity
          style={[styles.saveBtn, createMutation.isPending && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.saveBtnText}>သိမ်းမည်</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Tracking number */}
        <FormSection title="ပါဆယ် အချက်အလက်">
          <FormField
            label="ခြေရာခံနံပါတ် (ဖောင်ချပါ အလိုအလျောက်)"
            value={form.tracking_number}
            onChangeText={(v) => update('tracking_number', v)}
            placeholder="ဗလာထားပါ - အလိုအလျောက် ဖန်တီးမည်"
          />
          <FormField
            label="ဖော်ပြချက်"
            value={form.description}
            onChangeText={(v) => update('description', v)}
            placeholder="ပစ္စည်းအမျိုးအစား"
          />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <FormField
                label="အရေအတွက်"
                value={form.quantity}
                onChangeText={(v) => update('quantity', v)}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <FormField
                label="အလေးချိန် (kg)"
                value={form.weight}
                onChangeText={(v) => update('weight', v)}
                keyboardType="numeric"
                placeholder="ချန်ထားနိုင်"
              />
            </View>
          </View>

          {/* Priority */}
          <Text style={styles.label}>ဦးစားပေးအဆင့်</Text>
          <View style={styles.segmented}>
            {priorities.map(p => (
              <TouchableOpacity
                key={p.value}
                style={[styles.segmentItem, form.priority === p.value && styles.segmentActive]}
                onPress={() => update('priority', p.value)}
              >
                <Text style={[styles.segmentText, form.priority === p.value && styles.segmentActiveText]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Delivery Area */}
          {areas && areas.length > 0 && (
            <>
              <Text style={styles.label}>ဒေသ</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 4 }}>
                  <TouchableOpacity
                    style={[styles.areaChip, !form.delivery_area_id && styles.areaChipActive]}
                    onPress={() => update('delivery_area_id', '')}
                  >
                    <Text style={[styles.areaChipText, !form.delivery_area_id && styles.areaChipActiveText]}>မသတ်မှတ်</Text>
                  </TouchableOpacity>
                  {areas.map(a => (
                    <TouchableOpacity
                      key={a.id}
                      style={[styles.areaChip, form.delivery_area_id === String(a.id) && styles.areaChipActive]}
                      onPress={() => update('delivery_area_id', String(a.id))}
                    >
                      <Text style={[styles.areaChipText, form.delivery_area_id === String(a.id) && styles.areaChipActiveText]}>
                        {a.name_mm || a.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </>
          )}
        </FormSection>

        <FormSection title="ပေးပို့သူ">
          <FormField
            label="နာမည်"
            value={form.sender_name}
            onChangeText={(v) => update('sender_name', v)}
            placeholder="ပေးပို့သူ နာမည်"
          />
          <FormField
            label="ဖုန်းနံပါတ်"
            value={form.sender_phone}
            onChangeText={(v) => update('sender_phone', v)}
            placeholder="09..."
            keyboardType="phone-pad"
          />
        </FormSection>

        <FormSection title="လက်ခံသူ *">
          <FormField
            label="နာမည် *"
            value={form.recipient_name}
            onChangeText={(v) => update('recipient_name', v)}
            error={errors.recipient_name}
            placeholder="လက်ခံသူ နာမည်"
          />
          <FormField
            label="ဖုန်းနံပါတ် *"
            value={form.recipient_phone}
            onChangeText={(v) => update('recipient_phone', v)}
            error={errors.recipient_phone}
            placeholder="09..."
            keyboardType="phone-pad"
          />
          <FormField
            label="လိပ်စာ *"
            value={form.delivery_address}
            onChangeText={(v) => update('delivery_address', v)}
            error={errors.delivery_address}
            placeholder="တိကျသောလိပ်စာ"
            multiline
          />
        </FormSection>

        <FormSection title="ငွေကြေး">
          <FormField
            label="ပို့ဆောင်ခ (ကျပ်) *"
            value={form.delivery_fee}
            onChangeText={(v) => update('delivery_fee', v)}
            error={errors.delivery_fee}
            keyboardType="numeric"
            placeholder="0"
          />

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>COD (ငွေတောင်းမည်)</Text>
              <Text style={styles.switchSub}>လက်ခံသူထံမှ ငွေကောက်မည်</Text>
            </View>
            <Switch
              value={form.is_cod}
              onValueChange={(v) => update('is_cod', v)}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>

          {form.is_cod && (
            <FormField
              label="COD ပမာဏ (ကျပ်)"
              value={form.cod_amount}
              onChangeText={(v) => update('cod_amount', v)}
              keyboardType="numeric"
              placeholder="0"
            />
          )}
        </FormSection>

        <FormSection title="မှတ်ချက်">
          <FormField
            label="အပိုသတင်းအချက်အလက်"
            value={form.notes}
            onChangeText={(v) => update('notes', v)}
            multiline
            placeholder="မိဆာ သတ်မှတ်ချက် (ချန်ထားနိုင်)"
          />
        </FormSection>

        <TouchableOpacity
          style={[styles.submitBtn, createMutation.isPending && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color={COLORS.white} />
              <Text style={styles.submitBtnText}>ပါဆယ် မှတ်ပုံတင်မည်</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.formSection}>
      <Text style={styles.formSectionTitle}>{title}</Text>
      <View style={styles.formCard}>{children}</View>
    </View>
  );
}

function FormField({
  label, value, onChangeText, placeholder, keyboardType, error, multiline,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; keyboardType?: any; error?: string; multiline?: boolean;
}) {
  return (
    <View style={styles.formField}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.textInput, !!error && styles.inputError, multiline ? styles.textArea : undefined]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textLight}
        keyboardType={keyboardType || 'default'}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
  },
  closeBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: COLORS.white },
  saveBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
  content: { padding: 16, paddingBottom: 40 },
  formSection: { marginBottom: 16 },
  formSectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  formField: {},
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
  textInput: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 11,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  inputError: { borderColor: COLORS.error },
  errorText: { fontSize: 12, color: COLORS.error, marginTop: 4 },
  row: { flexDirection: 'row', gap: 12 },
  segmented: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: 4,
  },
  segmentItem: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  segmentActive: { backgroundColor: COLORS.primary },
  segmentText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  segmentActiveText: { color: COLORS.white },
  areaChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  areaChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  areaChipText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  areaChipActiveText: { color: COLORS.white },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  switchLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  switchSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 18,
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: { fontSize: 17, fontWeight: '700', color: COLORS.white },
});
