import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { parcelService, ContactSuggestion } from '../../src/services/parcelService';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { COLORS, PARCEL_CATEGORIES, FONTS } from '../../src/constants';

export default function CreateParcelScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const params = useLocalSearchParams<{
    sender_name?: string;
    sender_phone?: string;
    recipient_name?: string;
    recipient_phone?: string;
  }>();

  const canCreate = !user || user.role === 'admin' || user.role === 'manager';
  useEffect(() => {
    if (user && !canCreate) {
      router.replace('/(tabs)/parcels');
    }
  }, [user, canCreate]);

  const [form, setForm] = useState({
    tracking_number: '',
    sender_name: params.sender_name ? decodeURIComponent(params.sender_name) : '',
    sender_phone: params.sender_phone ? decodeURIComponent(params.sender_phone) : '',
    recipient_name: params.recipient_name ? decodeURIComponent(params.recipient_name) : '',
    recipient_phone: params.recipient_phone ? decodeURIComponent(params.recipient_phone) : '',
    delivery_address: '',
    description: '',
    items: [{ product_name: '', quantity: '1' }],
    weight: '',
    notes: '',
    delivery_fee: '',
    cod_amount: '0',
    is_cod: false,
    currency: 'MMK' as 'MMK' | 'THB',
    cod_currency: 'MMK' as 'MMK' | 'THB',
    priority: 'NORMAL',
    condition: 'GOOD',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [localImages, setLocalImages] = useState<ImagePicker.ImagePickerAsset[]>([]);

  const [senderSuggestions, setSenderSuggestions] = useState<any[]>([]);
  const [recipientSuggestions, setRecipientSuggestions] = useState<any[]>([]);
  const [showSenderSug, setShowSenderSug] = useState(false);
  const [showRecipientSug, setShowRecipientSug] = useState(false);
  const senderDebounce = useRef<any>(null);
  const recipientDebounce = useRef<any>(null);

  const createMutation = useMutation({
    mutationFn: (data: any) => parcelService.create(data),
    onSuccess: async (createdParcel) => {
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
          // ignore
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

  const [customCategoryInput, setCustomCategoryInput] = useState('');

  function handleSenderInput(field: 'sender_name' | 'sender_phone', value: string) {
    update(field, value);
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

  function handleRecipientInput(field: 'recipient_name' | 'recipient_phone', value: string) {
    update(field, value);
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
      description: form.description || undefined,
      items: form.items
        .filter((it) => it.product_name.trim())
        .map((it) => ({ product_name: it.product_name.trim(), quantity: Number(it.quantity) || 1 })),
      weight: form.weight ? Number(form.weight) : undefined,
      notes: form.notes || undefined,
      delivery_fee: Number(form.delivery_fee),
      cod_amount: Number(form.cod_amount) || 0,
      is_cod: form.is_cod,
      currency: form.currency,
      cod_currency: form.cod_currency,
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
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
            <Ionicons name="save-outline" size={20} color={COLORS.white} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={styles.scrollArea}>
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
            placeholder="အပိုဆောင်း မှတ်ချက်"
          />

          <View>
            <Text style={styles.label}>ထုတ်ကုန်များ (အမည် + အရေအတွက်)</Text>
            {form.items.map((item, idx) => (
              <View key={idx} style={{ flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <View style={{ flex: 2 }}>
                  <TextInput
                    style={styles.textInput}
                    value={item.product_name}
                    onChangeText={(v) => {
                      const next = [...form.items];
                      next[idx] = { ...next[idx], product_name: v };
                      update('items', next);
                    }}
                    placeholder="ထုတ်ကုန်အမည်"
                    placeholderTextColor={COLORS.textLight}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={styles.textInput}
                    value={item.quantity}
                    onChangeText={(v) => {
                      const next = [...form.items];
                      next[idx] = { ...next[idx], quantity: v };
                      update('items', next);
                    }}
                    placeholder="အရေအတွက်"
                    placeholderTextColor={COLORS.textLight}
                    keyboardType="numeric"
                  />
                </View>
                <TouchableOpacity
                  onPress={() => {
                    const next = form.items.filter((_, i) => i !== idx);
                    update('items', next.length ? next : [{ product_name: '', quantity: '1' }]);
                  }}
                  style={{ padding: 8 }}
                >
                  <Text style={{ color: COLORS.error, fontWeight: '700' }}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              onPress={() => update('items', [...form.items, { product_name: '', quantity: '1' }])}
              style={{ alignSelf: 'flex-start', paddingVertical: 6 }}
            >
              <Text style={{ color: COLORS.primary, fontWeight: '600' }}>+ ထုတ်ကုန် ထပ်ထည့်မည်</Text>
            </TouchableOpacity>
          </View>

          <FormField
            label="အလေးချိန် (kg)"
            value={form.weight}
            onChangeText={(v) => update('weight', v)}
            keyboardType="numeric"
            placeholder="ချန်ထားနိုင်"
          />

          <View>
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
          </View>
        </FormSection>

        <FormSection title="ပေးပို့သူ">
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

          {showSenderSug && senderSuggestions.length > 0 && (
            <View style={styles.inlineSugBox}>
              <View style={styles.inlineSugHeader}>
                <Text style={styles.inlineSugHeaderText}>ရှိပြီးသား ဖောက်သည်များ</Text>
                <TouchableOpacity onPress={() => setShowSenderSug(false)}>
                  <Text style={styles.closeText}>×</Text>
                </TouchableOpacity>
              </View>
              {senderSuggestions.map((s, i) => (
                <TouchableOpacity key={i} style={styles.inlineSugItem} onPress={() => applySenderSuggestion(s)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.suggestionName}>{s.name}</Text>
                    <Text style={styles.suggestionPhone}>{s.phone}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </FormSection>

        <FormSection title="လက်ခံသူ *">
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

          {showRecipientSug && recipientSuggestions.length > 0 && (
            <View style={styles.inlineSugBox}>
              <View style={styles.inlineSugHeader}>
                <Text style={styles.inlineSugHeaderText}>ရှိပြီးသား ဖောက်သည်များ</Text>
                <TouchableOpacity onPress={() => setShowRecipientSug(false)}>
                  <Text style={styles.closeText}>×</Text>
                </TouchableOpacity>
              </View>
              {recipientSuggestions.map((s, i) => (
                <TouchableOpacity key={i} style={styles.inlineSugItem} onPress={() => applyRecipientSuggestion(s)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.suggestionName}>{s.name}</Text>
                    <Text style={styles.suggestionPhone}>{s.phone}</Text>
                    {s.delivery_address ? (
                      <Text style={styles.suggestionAddr} numberOfLines={1}>{s.delivery_address}</Text>
                    ) : null}
                  </View>
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
          <View>
            <Text style={styles.label}>ပို့ဆောင်ခ ငွေကြေး *</Text>
            <View style={styles.segmented}>
              {(['MMK', 'THB'] as const).map(cur => (
                <TouchableOpacity
                  key={cur}
                  style={[styles.segmentItem, form.currency === cur && styles.segmentActive]}
                  onPress={() => update('currency', cur)}
                >
                  <Text style={[styles.segmentText, form.currency === cur && styles.segmentActiveText]}>
                    {cur === 'MMK' ? 'ကျပ် (MMK)' : 'ဘတ် (THB)'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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
            <>
              <FormField
                label={`COD ပမာဏ (${form.cod_currency})`}
                value={form.cod_amount}
                onChangeText={(v) => update('cod_amount', v)}
                keyboardType="numeric"
                placeholder="0"
              />
              <View>
                <Text style={styles.label}>COD ငွေကြေး</Text>
                <View style={styles.segmented}>
                  {(['MMK', 'THB'] as const).map(cur => (
                    <TouchableOpacity
                      key={cur}
                      style={[styles.segmentItem, form.cod_currency === cur && styles.segmentActive]}
                      onPress={() => update('cod_currency', cur)}
                    >
                      <Text style={[styles.segmentText, form.cod_currency === cur && styles.segmentActiveText]}>
                        {cur === 'MMK' ? 'ကျပ် (MMK)' : 'ဘတ် (THB)'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
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

        <FormSection title="ပါဆယ် ဓာတ်ပုံများ">
          <View style={styles.imageBtnRow}>
            <TouchableOpacity style={styles.imagePickBtn} onPress={pickImages}>
              <Text style={styles.imagePickBtnText}>ဓာတ်ပုံရွေးရန်</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imagePickBtn} onPress={takePhoto}>
              <Text style={styles.imagePickBtnText}>ဓာတ်ပုံရိုက်ရန်</Text>
            </TouchableOpacity>
          </View>
          {localImages.length > 0 && (
            <View style={styles.imageGrid}>
              {localImages.map((img, index) => (
                <View key={index} style={styles.imageThumbWrap}>
                  <Image source={{ uri: img.uri }} style={styles.imageThumb} />
                  <TouchableOpacity style={styles.imageRemoveBtn} onPress={() => removeLocalImage(index)}>
                    <Text style={styles.imageRemoveText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          <Text style={styles.imageHint}>အများဆုံး 10 ပုံ</Text>
        </FormSection>

        <TouchableOpacity
          style={[styles.submitBtn, createMutation.isPending && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.submitBtnText}>ပါဆယ် မှတ်ပုံတင်မည်</Text>
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
  scrollArea: { flex: 1, backgroundColor: COLORS.background, },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { width: 38, height: 38, borderRadius: 4, backgroundColor: COLORS.muted, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.white, fontFamily: FONTS.semiBold },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.bold, textAlign: 'center' },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  saveBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.white, fontFamily: FONTS.bold },
  content: { padding: 16, paddingBottom: 40 },
  formSection: { minHeight: 48, marginBottom: 16 },
  formSectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 8, fontFamily: FONTS.bold },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 4,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  formField: {},
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6, fontFamily: FONTS.semiBold },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: 10,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.white,
    fontFamily: FONTS.regular,
  },
  textArea: { height: 76, textAlignVertical: 'top' },
  inputError: { borderColor: COLORS.error },
  errorText: { fontSize: 12, color: COLORS.error, marginTop: 4, fontFamily: FONTS.regular },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: FONTS.semiBold,
  },
  categoryChipTextActive: { color: COLORS.white },
  customCategoryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  customCategoryInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: COLORS.white,
    fontFamily: FONTS.regular,
  },
  addCategoryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    borderRadius: 4,
  },
  addCategoryBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  selectedCountText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  segmentItem: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  segmentActive: { backgroundColor: COLORS.primary },
  segmentText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, fontFamily: FONTS.semiBold },
  segmentActiveText: { color: COLORS.white },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  switchLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text, fontFamily: FONTS.semiBold },
  switchSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, fontFamily: FONTS.regular },
  submitBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    padding: 16,
    marginTop: 8,
  },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.white, fontFamily: FONTS.bold },
  imageBtnRow: { flexDirection: 'row', gap: 10 },
  imagePickBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  imagePickBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.text, fontFamily: FONTS.semiBold },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  imageThumbWrap: { position: 'relative' },
  imageThumb: { width: 76, height: 76, borderRadius: 4},
  imageRemoveBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageRemoveText: { fontSize: 14, lineHeight: 16, color: COLORS.error, fontFamily: FONTS.bold },
  imageHint: { fontSize: 11, color: COLORS.textLight, marginTop: 6, textAlign: 'center', fontFamily: FONTS.regular },
  acField: { gap: 2 },
  inlineSugBox: {
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    overflow: 'hidden',
  },
  inlineSugHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  inlineSugHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    fontFamily: FONTS.semiBold,
  },
  inlineSugItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeText: { fontSize: 18, color: COLORS.textLight, fontFamily: FONTS.bold, lineHeight: 20 },
  suggestionName: { fontSize: 14, fontWeight: '600', color: COLORS.text, fontFamily: FONTS.semiBold },
  suggestionPhone: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1, fontFamily: FONTS.regular },
  suggestionAddr: { fontSize: 11, color: COLORS.textLight, marginTop: 1, fontFamily: FONTS.regular },
});
