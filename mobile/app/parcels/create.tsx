import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Image,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { parcelService, ContactSuggestion } from '../../src/services/parcelService';
import apiClient from '../../src/services/apiClient';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS} from '../../src/constants';

interface DeliveryArea {
  id: number;
  name: string;
  name_mm?: string;
}

export default function CreateParcelScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Guard: only admin and manager can create parcels — redirect accountant away
  const canCreate = !user || user.role === 'admin' || user.role === 'manager';
  useEffect(() => {
    if (user && !canCreate) {
      router.replace('/(tabs)/parcels');
    }
  }, [user, canCreate]);

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
    currency: 'MMK' as 'MMK' | 'THB',
    priority: 'NORMAL',
    condition: 'GOOD',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [localImages, setLocalImages] = useState<ImagePicker.ImagePickerAsset[]>([]);

  // ── Autocomplete state ──────────────────────────────────────────────────────
  const [senderSuggestions, setSenderSuggestions] = useState<any[]>([]);
  const [recipientSuggestions, setRecipientSuggestions] = useState<any[]>([]);
  const [showSenderSug, setShowSenderSug] = useState(false);
  const [showRecipientSug, setShowRecipientSug] = useState(false);
  const senderDebounce = useRef<any>(null);
  const recipientDebounce = useRef<any>(null);

  const { data: areas } = useQuery({
    queryKey: ['delivery-areas'],
    queryFn: async () => {
      const res = await apiClient.get('/settings/delivery-areas');
      return res.data.data as DeliveryArea[];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => parcelService.create(data),
    onSuccess: async (createdParcel) => {
      // Upload images after parcel creation
      if (localImages.length > 0) {
        try {
          const formData = new FormData();
          localImages.forEach((img) => {
            formData.append('images[]', {
              uri: img.uri,
              name: img.fileName ?? `parcel_${Date.now()}.jpg`,
              type: img.mimeType ?? 'image/jpeg',
            } as any);
          });
          await parcelService.uploadImages(createdParcel.id, formData);
        } catch {
          // Image upload failed but parcel was created — still proceed
        }
      }
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

  // ── Sender autocomplete ──────────────────────────────────────────────────────
  function handleSenderInput(field: 'sender_name' | 'sender_phone', value: string) {
    update(field, value);
    // Close recipient suggestions when typing in sender section
    setShowRecipientSug(false);
    clearTimeout(senderDebounce.current);
    if (value.trim().length < 1) { setSenderSuggestions([]); setShowSenderSug(false); return; }
    senderDebounce.current = setTimeout(async () => {
      try {
        const results = await parcelService.searchContacts(value, 'sender');
        setSenderSuggestions(results);
        setShowSenderSug(results.length > 0);
      } catch { /* ignore */ }
    }, 400);
  }

  function applySenderSuggestion(s: ContactSuggestion) {
    update('sender_name', s.name);
    update('sender_phone', s.phone);
    setSenderSuggestions([]);
    setShowSenderSug(false);
  }

  // ── Recipient autocomplete ───────────────────────────────────────────────────
  function handleRecipientInput(field: 'recipient_name' | 'recipient_phone', value: string) {
    update(field, value);
    // Close sender suggestions when typing in recipient section
    setShowSenderSug(false);
    clearTimeout(recipientDebounce.current);
    if (value.trim().length < 1) { setRecipientSuggestions([]); setShowRecipientSug(false); return; }
    recipientDebounce.current = setTimeout(async () => {
      try {
        const results = await parcelService.searchContacts(value, 'recipient');
        setRecipientSuggestions(results);
        setShowRecipientSug(results.length > 0);
      } catch { /* ignore */ }
    }, 400);
  }

  function applyRecipientSuggestion(s: ContactSuggestion) {
    update('recipient_name', s.name);
    update('recipient_phone', s.phone);
    if (s.delivery_address) update('delivery_address', s.delivery_address);
    setRecipientSuggestions([]);
    setShowRecipientSug(false);
  }

  async function pickImages() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('ခွင့်မပြု', 'ဓာတ်ပုံ တင်ရန် ခွင့်ပြုချက် လိုအပ်သည်');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10,
    });
    if (!result.canceled) {
      setLocalImages(prev => [...prev, ...result.assets].slice(0, 10));
    }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('ခွင့်မပြု', 'ကင်မရာ သုံးရန် ခွင့်ပြုချက် လိုအပ်သည်');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });
    if (!result.canceled && localImages.length < 10) {
      setLocalImages(prev => [...prev, result.assets[0]]);
    }
  }

  function removeLocalImage(index: number) {
    setLocalImages(prev => prev.filter((_, i) => i !== index));
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
      currency: form.currency,
      priority: form.priority,
      condition: form.condition,
    });
  }

  const priorities = [
    { value: 'NORMAL', label: 'ပုံမှန်' },
    { value: 'HIGH', label: 'အရေးကြီး' },
    { value: 'URGENT', label: 'အရေးပေါ်' },
  ];

  if (!canCreate) return null;

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

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={styles.scrollArea}>
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
          {/* Sender Phone — first */}
          <View style={styles.acField}>
            <Text style={styles.label}>ဖုန်းနံပါတ်</Text>
            <TextInput
              style={styles.textInput}
              value={form.sender_phone}
              onChangeText={v => handleSenderInput('sender_phone', v)}
              onFocus={() => setShowRecipientSug(false)}
              placeholder="09..."
              placeholderTextColor={COLORS.textLight}
              keyboardType="phone-pad"
            />
          </View>

          {/* Sender Name — second */}
          <View style={styles.acField}>
            <Text style={styles.label}>နာမည်</Text>
            <TextInput
              style={styles.textInput}
              value={form.sender_name}
              onChangeText={v => handleSenderInput('sender_name', v)}
              onFocus={() => setShowRecipientSug(false)}
              placeholder="ပေးပို့သူ နာမည်"
              placeholderTextColor={COLORS.textLight}
            />
          </View>

          {/* Sender suggestions — inline */}
          {showSenderSug && senderSuggestions.length > 0 && (
            <View style={styles.inlineSugBox}>
              <View style={styles.inlineSugHeader}>
                <Ionicons name="search-outline" size={12} color={COLORS.primary} />
                <Text style={styles.inlineSugHeaderText}>ရှိပြီးသား ဖောက်သည်များ</Text>
                <TouchableOpacity onPress={() => setShowSenderSug(false)}>
                  <Ionicons name="close" size={14} color={COLORS.textLight} />
                </TouchableOpacity>
              </View>
              {senderSuggestions.map((s, i) => (
                <TouchableOpacity key={i} style={styles.inlineSugItem} onPress={() => applySenderSuggestion(s)}>
                  <Ionicons name="person-circle-outline" size={28} color={COLORS.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.suggestionName}>{s.name}</Text>
                    <Text style={styles.suggestionPhone}>{s.phone}</Text>
                  </View>
                  <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.primary} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </FormSection>

        <FormSection title="လက်ခံသူ *">
          {/* Recipient Phone — first */}
          <View style={styles.acField}>
            <Text style={styles.label}>ဖုန်းနံပါတ် *</Text>
            <TextInput
              style={[styles.textInput, !!errors.recipient_phone && styles.inputError]}
              value={form.recipient_phone}
              onChangeText={v => handleRecipientInput('recipient_phone', v)}
              onFocus={() => setShowSenderSug(false)}
              placeholder="09..."
              placeholderTextColor={COLORS.textLight}
              keyboardType="phone-pad"
            />
            {errors.recipient_phone && <Text style={styles.errorText}>{errors.recipient_phone}</Text>}
          </View>

          {/* Recipient Name — second */}
          <View style={styles.acField}>
            <Text style={styles.label}>နာမည် *</Text>
            <TextInput
              style={[styles.textInput, !!errors.recipient_name && styles.inputError]}
              value={form.recipient_name}
              onChangeText={v => handleRecipientInput('recipient_name', v)}
              onFocus={() => setShowSenderSug(false)}
              placeholder="လက်ခံသူ နာမည်"
              placeholderTextColor={COLORS.textLight}
            />
            {errors.recipient_name && <Text style={styles.errorText}>{errors.recipient_name}</Text>}
          </View>

          {/* Recipient suggestions — inline */}
          {showRecipientSug && recipientSuggestions.length > 0 && (
            <View style={styles.inlineSugBox}>
              <View style={styles.inlineSugHeader}>
                <Ionicons name="search-outline" size={12} color={COLORS.primary} />
                <Text style={styles.inlineSugHeaderText}>ရှိပြီးသား ဖောက်သည်များ</Text>
                <TouchableOpacity onPress={() => setShowRecipientSug(false)}>
                  <Ionicons name="close" size={14} color={COLORS.textLight} />
                </TouchableOpacity>
              </View>
              {recipientSuggestions.map((s, i) => (
                <TouchableOpacity key={i} style={styles.inlineSugItem} onPress={() => applyRecipientSuggestion(s)}>
                  <Ionicons name="person-circle-outline" size={28} color={COLORS.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.suggestionName}>{s.name}</Text>
                    <Text style={styles.suggestionPhone}>{s.phone}</Text>
                    {s.delivery_address ? (
                      <Text style={styles.suggestionAddr} numberOfLines={1}>{s.delivery_address}</Text>
                    ) : null}
                  </View>
                  <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.primary} />
                </TouchableOpacity>
              ))}
            </View>
          )}

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
          {/* Currency Selector */}
          <Text style={styles.label}>ငွေကြေးအမျိုးအစား *</Text>
          <View style={styles.segmented}>
            {(['MMK', 'THB'] as const).map(cur => (
              <TouchableOpacity
                key={cur}
                style={[styles.segmentItem, form.currency === cur && styles.segmentActive]}
                onPress={() => update('currency', cur)}
              >
                <Text style={[styles.segmentText, form.currency === cur && styles.segmentActiveText]}>
                  {cur === 'MMK' ? '🇲🇲 ကျပ် (MMK)' : '🇹🇭 ဘတ် (THB)'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <FormField
            label={`ပို့ဆောင်ခ (${form.currency}) *`}
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
              label={`COD ပမာဏ (${form.currency})`}
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

        {/* Images Section */}
        <FormSection title="ပါဆယ် ဓာတ်ပုံများ">
          <View style={styles.imageBtnRow}>
            <TouchableOpacity style={styles.imagePickBtn} onPress={pickImages}>
              <Ionicons name="images-outline" size={20} color={COLORS.primary} />
              <Text style={styles.imagePickBtnText}>ဓာတ်ပုံရွေးရန်</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imagePickBtn} onPress={takePhoto}>
              <Ionicons name="camera-outline" size={20} color={COLORS.primary} />
              <Text style={styles.imagePickBtnText}>ဓာတ်ပုံရိုက်ရန်</Text>
            </TouchableOpacity>
          </View>
          {localImages.length > 0 && (
            <View style={styles.imageGrid}>
              {localImages.map((img, index) => (
                <View key={index} style={styles.imageThumbWrap}>
                  <Image source={{ uri: img.uri }} style={styles.imageThumb} />
                  <TouchableOpacity style={styles.imageRemoveBtn} onPress={() => removeLocalImage(index)}>
                    <Ionicons name="close-circle" size={20} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          <Text style={styles.imageHint}>အများဆုံး 10 ပုံ • JPEG, PNG • 5MB အောက်</Text>
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
  container: { flex: 1, backgroundColor: COLORS.primary },
  scrollArea: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  closeBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: COLORS.white,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  saveBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.white,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  content: { padding: 16, paddingBottom: 40 },
  formSection: { marginBottom: 16 },
  formSectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 8,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
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
    overflow: 'visible',
  },
  formField: {},
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6,
    fontFamily: 'NotoSansMyanmar_600SemiBold',
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 11,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.background,
    fontFamily: 'NotoSansMyanmar_400Regular',
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  inputError: { borderColor: COLORS.error },
  errorText: { fontSize: 12, color: COLORS.error, marginTop: 4,
    fontFamily: 'NotoSansMyanmar_400Regular',
  },
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
  segmentText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary,
    fontFamily: 'NotoSansMyanmar_600SemiBold',
  },
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
  areaChipText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary,
    fontFamily: 'NotoSansMyanmar_600SemiBold',
  },
  areaChipActiveText: { color: COLORS.white },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  switchLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text,
    fontFamily: 'NotoSansMyanmar_600SemiBold',
  },
  switchSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2,
    fontFamily: 'NotoSansMyanmar_400Regular',
  },
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
  submitBtnText: { fontSize: 17, fontWeight: '700', color: COLORS.white,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  imageBtnRow: { flexDirection: 'row', gap: 10 },
  imagePickBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5,
    borderColor: COLORS.primary, backgroundColor: '#FFF9EE',
  },
  imagePickBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.primary,
    fontFamily: 'NotoSansMyanmar_600SemiBold',
  },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  imageThumbWrap: { position: 'relative' },
  imageThumb: { width: 80, height: 80, borderRadius: 10 },
  imageRemoveBtn: { position: 'absolute', top: -8, right: -8, backgroundColor: COLORS.white, borderRadius: 10 },
  imageHint: { fontSize: 11, color: COLORS.textLight, marginTop: 6, textAlign: 'center',
    fontFamily: 'NotoSansMyanmar_400Regular',
  },
  // ── Autocomplete ────────────────────────────────────────────────────────────
  acField: {},
  autocompleteWrap: {},
  // Inline suggestion box — no absolute positioning, pushes content down
  inlineSugBox: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.primary + '40',
    backgroundColor: COLORS.primary + '08',
    overflow: 'hidden',
    marginTop: 2,
  },
  inlineSugHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: COLORS.primary + '15',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary + '25',
  },
  inlineSugHeaderText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: 'NotoSansMyanmar_600SemiBold',
  },
  inlineSugItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary + '15',
    backgroundColor: '#FFFFFF',
  },
  // Keep these for backward compat (unused now but avoids TS errors)
  suggestionBox: { display: 'none' as any },
  suggestionBoxAbove: { display: 'none' as any },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  suggestionName: { fontSize: 14, fontWeight: '600', color: COLORS.text,
    fontFamily: 'NotoSansMyanmar_600SemiBold',
  },
  suggestionPhone: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1,
    fontFamily: 'NotoSansMyanmar_400Regular',
  },
  suggestionAddr: { fontSize: 11, color: COLORS.textLight, marginTop: 1,
    fontFamily: 'NotoSansMyanmar_400Regular',
  },
});
