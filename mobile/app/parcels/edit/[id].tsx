import { useTheme } from '../../../src/context/ThemeContext';
import React, { useState, useEffect } from 'react';
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { parcelService, ParcelImage } from '../../../src/services/parcelService';
import { useAuth } from '../../../src/context/AuthContext';
import { COLORS, PARCEL_CATEGORIES, FONTS } from '../../../src/constants';

export default function EditParcelScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Guard: only admin and manager can edit parcels — redirect accountant away
  const canEdit = !user || user.role === 'admin' || user.role === 'manager';
  useEffect(() => {
    if (user && !canEdit) {
      router.replace(`/parcels/${id}`);
    }
  }, [user, canEdit]);

  const { data: parcel, isLoading } = useQuery({
    queryKey: ['parcel', id],
    queryFn: () => parcelService.get(Number(id)),
  });

  const [form, setForm] = useState({
    sender_name: '', sender_phone: '',
    recipient_name: '', recipient_phone: '',
    delivery_address: '',
    description: '', category: '', weight: '', notes: '',
    delivery_fee: '', cod_amount: '0', is_cod: false,
    currency: 'MMK' as 'MMK' | 'THB',
    priority: 'NORMAL',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [existingImages, setExistingImages] = useState<ParcelImage[]>([]);
  const [newImages, setNewImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    if (parcel) {
      setForm({
        sender_name: parcel.sender_name || '',
        sender_phone: parcel.sender_phone || '',
        recipient_name: parcel.recipient_name || '',
        recipient_phone: parcel.recipient_phone || '',
        delivery_address: parcel.delivery_address || '',
        description: parcel.description || '',
        category: parcel.category || '',
        weight: parcel.weight ? String(parcel.weight) : '',
        notes: parcel.notes || '',
        delivery_fee: String(parcel.delivery_fee || 0),
        cod_amount: String(parcel.cod_amount || 0),
        is_cod: parcel.is_cod || false,
        currency: (parcel.currency as 'MMK' | 'THB') || 'MMK',
        priority: parcel.priority || 'NORMAL',
      });
      setExistingImages(parcel.images ?? []);
    }
  }, [parcel]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => parcelService.update(Number(id), data),
    onSuccess: async () => {
      // Upload new images if any
      if (newImages.length > 0) {
        setUploadingImages(true);
        try {
          const formData = new FormData();
          newImages.forEach((img) => {
            formData.append('images[]', {
              uri: img.uri,
              name: img.fileName ?? `parcel_${Date.now()}.jpg`,
              type: img.mimeType ?? 'image/jpeg',
            } as any);
          });
          await parcelService.uploadImages(Number(id), formData);
        } catch {
          // ignore upload error
        } finally {
          setUploadingImages(false);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['parcel', id] });
      queryClient.invalidateQueries({ queryKey: ['parcels'] });
      Alert.alert('အောင်မြင်သည်', 'ပါဆယ် ပြင်ဆင်မှု ပြီးပါပြီ', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'ပြင်ဆင်မှု မအောင်မြင်ပါ';
      Alert.alert('အမှားဖြစ်ပွားသည်', msg);
    },
  });

  function update(field: string, value: any) {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: undefined as any }));
  }

  const [customCategoryInput, setCustomCategoryInput] = useState('');

  // Multi-select categories
  const selectedCategories = form.category
    ? form.category.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  function toggleCategory(catValue: string) {
    const current = form.category
      ? form.category.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    let next: string[];
    if (current.includes(catValue)) {
      next = current.filter((c) => c !== catValue);
    } else {
      next = [...current, catValue];
    }
    update('category', next.join(', '));
  }

  function handleAddCustomCategory() {
    const trimmed = customCategoryInput.trim();
    if (!trimmed) return;
    const current = form.category
      ? form.category.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    if (!current.includes(trimmed)) {
      update('category', [...current, trimmed].join(', '));
    }
    setCustomCategoryInput('');
  }

  async function pickImages() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('ခွင့်မပြု', 'ဓာတ်ပုံ တင်ရန် ခွင့်ပြုချက် လိုအပ်သည်'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true, quality: 0.8, selectionLimit: 10,
    });
    if (!result.canceled) setNewImages(prev => [...prev, ...result.assets].slice(0, 10));
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('ခွင့်မပြု', 'ကင်မရာ သုံးရန် ခွင့်ပြုချက် လိုအပ်သည်'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) setNewImages(prev => [...prev, result.assets[0]]);
  }

  async function deleteExistingImage(imageId: number) {
    Alert.alert('ဓာတ်ပုံ ဖျက်မည်', 'ဤဓာတ်ပုံကို ဖျက်မည်လား?', [
      { text: 'မဖျက်ပါ', style: 'cancel' },
      {
        text: 'ဖျက်မည်', style: 'destructive',
        onPress: async () => {
          try {
            await parcelService.deleteImage(Number(id), imageId);
            setExistingImages(prev => prev.filter(img => img.id !== imageId));
            queryClient.invalidateQueries({ queryKey: ['parcel', id] });
          } catch {
            Alert.alert('အမှား', 'ဓာတ်ပုံ ဖျက်မှု မအောင်မြင်ပါ');
          }
        },
      },
    ]);
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
    updateMutation.mutate({
      sender_name: form.sender_name || undefined,
      sender_phone: form.sender_phone || undefined,
      recipient_name: form.recipient_name,
      recipient_phone: form.recipient_phone,
      delivery_address: form.delivery_address,
      description: form.description || undefined,
      category: form.category || undefined,
      weight: form.weight ? Number(form.weight) : undefined,
      notes: form.notes || undefined,
      delivery_fee: Number(form.delivery_fee),
      cod_amount: Number(form.cod_amount) || 0,
      is_cod: form.is_cod,
      currency: form.currency,
      priority: form.priority,
    });
  }

  const priorities = [
    { value: 'NORMAL', label: 'ပုံမှန်' },
    { value: 'HIGH', label: 'အရေးကြီး' },
    { value: 'URGENT', label: 'အရေးပေါ်' },
  ];

  if (isLoading || !canEdit) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ပါဆယ် ပြင်ဆင်မည်</Text>
        <TouchableOpacity
          style={[styles.saveBtn, updateMutation.isPending && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Ionicons name="save-outline" size={20} color={COLORS.white} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={styles.scrollArea}>
        <FormSection title="ပါဆယ် အချက်အလက်">
          <FormField
            label="ဖော်ပြချက် (ပစ္စည်းအမျိုးအမည်များ / ထပ်ပေါင်းပစ္စည်း)"
            value={form.description}
            onChangeText={v => update('description', v)}
            placeholder="ဥပမာ - အင်္ကျီ ၂ ထည်၊ ဖုန်း ၁ လုံး"
            multiline
          />
          <View>
            <View style={styles.labelRow}>
              <Text style={styles.label}>အမျိုးအစား (တစ်ခုထက်မက ရွေးနိုင်သည်)</Text>
              {selectedCategories.length > 0 && (
                <Text style={styles.selectedCountText}>{selectedCategories.length} မျိုး ရွေးထားသည်</Text>
              )}
            </View>
            <View style={styles.categoryRow}>
              {PARCEL_CATEGORIES.map(cat => {
                const isSelected = selectedCategories.includes(cat.value);
                return (
                  <TouchableOpacity
                    key={cat.value}
                    style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                    onPress={() => toggleCategory(cat.value)}
                  >
                    <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {selectedCategories
                .filter((c) => !PARCEL_CATEGORIES.some((p) => p.value === c))
                .map((customCat) => (
                  <TouchableOpacity
                    key={customCat}
                    style={[styles.categoryChip, styles.categoryChipActive]}
                    onPress={() => toggleCategory(customCat)}
                  >
                    <Text style={[styles.categoryChipText, styles.categoryChipTextActive]}>
                      {customCat}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>
          </View>

          <View style={styles.customCategoryRow}>
            <TextInput
              style={styles.customCategoryInput}
              value={customCategoryInput}
              onChangeText={setCustomCategoryInput}
              placeholder="အခြား အမျိုးအစား ရိုက်ထည့်ပါ (ဥပမာ - အလှကုန်)..."
              placeholderTextColor={COLORS.textLight}
              onSubmitEditing={handleAddCustomCategory}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[styles.addCategoryBtn, !customCategoryInput.trim() && { opacity: 0.5 }]}
              onPress={handleAddCustomCategory}
              disabled={!customCategoryInput.trim()}
            >
              <Text style={styles.addCategoryBtnText}>ထည့်မည်</Text>
            </TouchableOpacity>
          </View>
          <FormField label="အလေးချိန် (kg)" value={form.weight} onChangeText={v => update('weight', v)} keyboardType="numeric" placeholder="ချန်ထားနိုင်" />
          <View>
            <Text style={styles.label}>ဦးစားပေးအဆင့်</Text>
            <View style={styles.segmented}>
              {priorities.map(p => (
                <TouchableOpacity key={p.value} style={[styles.segmentItem, form.priority === p.value && styles.segmentActive]} onPress={() => update('priority', p.value)}>
                  <Text style={[styles.segmentText, form.priority === p.value && styles.segmentActiveText]}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </FormSection>

        <FormSection title="ပေးပို့သူ">
          <FormField label="နာမည်" value={form.sender_name} onChangeText={v => update('sender_name', v)} placeholder="ပေးပို့သူ နာမည်" />
          <FormField label="ဖုန်းနံပါတ်" value={form.sender_phone} onChangeText={v => update('sender_phone', v)} placeholder="09..." keyboardType="phone-pad" />
        </FormSection>

        <FormSection title="လက်ခံသူ *">
          <FormField label="နာမည် *" value={form.recipient_name} onChangeText={v => update('recipient_name', v)} error={errors.recipient_name} placeholder="လက်ခံသူ နာမည်" />
          <FormField label="ဖုန်းနံပါတ် *" value={form.recipient_phone} onChangeText={v => update('recipient_phone', v)} error={errors.recipient_phone} placeholder="09..." keyboardType="phone-pad" />
          <FormField label="လိပ်စာ *" value={form.delivery_address} onChangeText={v => update('delivery_address', v)} error={errors.delivery_address} placeholder="တိကျသောလိပ်စာ" multiline />
        </FormSection>

        <FormSection title="ငွေကြေး">
          <View>
            <Text style={styles.label}>ငွေကြေးအမျိုးအစား *</Text>
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
          <FormField label={`ပို့ဆောင်ခ (${form.currency}) *`} value={form.delivery_fee} onChangeText={v => update('delivery_fee', v)} error={errors.delivery_fee} keyboardType="numeric" placeholder="0" />
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>COD (ငွေတောင်းမည်)</Text>
              <Text style={styles.switchSub}>လက်ခံသူထံမှ ငွေကောက်မည်</Text>
            </View>
            <Switch value={form.is_cod} onValueChange={v => update('is_cod', v)} trackColor={{ false: COLORS.border, true: COLORS.primary }} thumbColor={COLORS.white} />
          </View>
          {form.is_cod && <FormField label={`COD ပမာဏ (${form.currency})`} value={form.cod_amount} onChangeText={v => update('cod_amount', v)} keyboardType="numeric" placeholder="0" />}
        </FormSection>

        <FormSection title="မှတ်ချက်">
          <FormField label="မှတ်ချက်" value={form.notes} onChangeText={v => update('notes', v)} multiline placeholder="ချန်ထားနိုင်" />
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

          {existingImages.length > 0 && (
            <>
              <Text style={styles.imageGroupLabel}>လက်ရှိ ဓာတ်ပုံများ</Text>
              <View style={styles.imageGrid}>
                {existingImages.map((img) => (
                  <View key={img.id} style={styles.imageThumbWrap}>
                    <Image source={{ uri: img.url }} style={styles.imageThumb} />
                    <TouchableOpacity style={styles.imageRemoveBtn} onPress={() => deleteExistingImage(img.id)}>
                      <Text style={styles.imageRemoveText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </>
          )}

          {newImages.length > 0 && (
            <>
              <Text style={styles.imageGroupLabel}>ထည့်မည့် ဓာတ်ပုံများ</Text>
              <View style={styles.imageGrid}>
                {newImages.map((img, i) => (
                  <View key={i} style={styles.imageThumbWrap}>
                    <Image source={{ uri: img.uri }} style={styles.imageThumb} />
                    <TouchableOpacity style={styles.imageRemoveBtn} onPress={() => setNewImages(p => p.filter((_, idx) => idx !== i))}>
                      <Text style={styles.imageRemoveText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </>
          )}

          {existingImages.length === 0 && newImages.length === 0 && (
            <Text style={styles.imageHint}>ဓာတ်ပုံ မရှိသေးပါ</Text>
          )}
          <Text style={styles.imageHint}>အများဆုံး 10 ပုံ • JPEG, PNG • 5MB အောက်</Text>
        </FormSection>

        <TouchableOpacity style={[styles.submitBtn, (updateMutation.isPending || uploadingImages) && { opacity: 0.6 }]} onPress={handleSubmit} disabled={updateMutation.isPending || uploadingImages}>
          {(updateMutation.isPending || uploadingImages) ? <ActivityIndicator color={COLORS.white} /> : (
            <Text style={styles.submitBtnText}>ပြင်ဆင်မှု သိမ်းမည်</Text>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  imageGroupLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, fontFamily: FONTS.semiBold, marginTop: 4 },
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
});