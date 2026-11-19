import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { deliveryService } from '../../../src/services/deliveryService';
import { COLORS, FONTS } from '../../../src/constants';
import ImagePreviewModal from '../../../src/components/ImagePreviewModal';

const FAILURE_REASONS = [
  { value: 'RECIPIENT_UNAVAILABLE', label: 'လက်ခံသူ မရှိ' },
  { value: 'PHONE_UNREACHABLE', label: 'ဖုန်းမကောင်း' },
  { value: 'WRONG_ADDRESS', label: 'လိပ်စာ မှား' },
  { value: 'REFUSED', label: 'ငြင်းဆန်' },
  { value: 'RESCHEDULED', label: 'ချိန်းဆိုမှုပြောင်း' },
  { value: 'OTHER', label: 'အခြား' },
];

export default function RecordAttemptScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: assignment, isLoading } = useQuery({
    queryKey: ['assignment', id],
    queryFn: () => deliveryService.getAssignment(Number(id)),
  });

  const [result, setResult] = useState<'DELIVERED' | 'FAILED' | ''>('');
  const [failureReason, setFailureReason] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [notes, setNotes] = useState('');
  // Photo proof state
  const [proofPhotos, setProofPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  // Hidden web file input ref
  const webFileRef = React.useRef<HTMLInputElement | null>(null);

  const attemptMutation = useMutation({
    mutationFn: (data: any) => deliveryService.recordAttempt(Number(id), data),
    onSuccess: async (res) => {
      // After recording attempt, upload proof photos if any
      const attemptId = (res as any)?.data?.attempt_id;
      if (proofPhotos.length > 0 && attemptId) {
        setUploadingProof(true);
        try {
          const formData = new FormData();
          formData.append('delivery_attempt_id', String(attemptId));
          formData.append('type', 'PHOTO');

          for (const photo of proofPhotos) {
            if (Platform.OS === 'web') {
              let blob = (photo as any)._rawFile;
              if (!blob && photo.uri) {
                try {
                  const blobRes = await fetch(photo.uri);
                  blob = await blobRes.blob();
                } catch {
                  // ignore
                }
              }
              if (blob) {
                formData.append('files[]', blob, photo.fileName || `proof_${Date.now()}.jpg`);
              }
            } else {
              formData.append('files[]', {
                uri: photo.uri,
                name: photo.fileName ?? `proof_${Date.now()}.jpg`,
                type: photo.mimeType ?? 'image/jpeg',
              } as any);
            }
          }

          await deliveryService.uploadProof(Number(id), formData);
        } catch (uploadError: any) {
          console.error('Proof photo upload failed:', uploadError?.response?.data || uploadError);
          const errDetail = uploadError?.response?.data?.message || 'သက်သေဓာတ်ပုံ တင်မရပါ';
          if (Platform.OS === 'web') {
            window.alert(`သတိပေးချက်: ပို့ဆောင်မှု မှတ်တမ်းတင်ပြီးသော်လည်း ${errDetail}`);
          } else {
            Alert.alert('သတိပေးချက်', `ပို့ဆောင်မှု မှတ်တမ်းတင်ပြီးသော်လည်း ${errDetail}`);
          }
        } finally {
          setUploadingProof(false);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['my-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignment', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      const isDelivered = (res as any)?.data?.result === 'DELIVERED' || (res as any)?.result === 'DELIVERED';
      if (Platform.OS === 'web') {
        window.alert(isDelivered ? 'ပါဆယ် အောင်မြင်စွာ ပို့ဆောင်ပြီးပါပြီ' : 'မအောင်မြင်မှု မှတ်တမ်းတင်ပြီးပါပြီ');
        router.back();
      } else {
        Alert.alert(
          isDelivered ? 'ပို့ဆောင်အောင်မြင်' : 'မအောင်မြင်မှု မှတ်တမ်းတင်ပြီး',
          isDelivered ? 'ပါဆယ် အောင်မြင်စွာ ပို့ဆောင်ပြီးပါပြီ' : 'မအောင်မြင်မှု မှတ်တမ်းတင်ပြီးပါပြီ',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'မှတ်တမ်းတင်မှု မအောင်မြင်ပါ';
      if (Platform.OS === 'web') {
        window.alert(`အမှား: ${msg}`);
      } else {
        Alert.alert('အမှားဖြစ်ပွားသည်', msg);
      }
    },
  });

  async function pickProofPhoto() {
    if (Platform.OS === 'web') {
      webFileRef.current?.click();
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('ခွင့်မပြု', 'ဓာတ်ပုံ တင်ရန် ခွင့်ပြုချက် လိုအပ်သည်');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5,
    });
    if (!res.canceled) {
      setProofPhotos(prev => [...prev, ...res.assets].slice(0, 5));
    }
  }

  async function takeProofPhoto() {
    if (Platform.OS === 'web') {
      webFileRef.current?.click();
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('ခွင့်မပြု', 'ကင်မရာ သုံးရန် ခွင့်ပြုချက် လိုအပ်သည်');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.85 });
    if (!res.canceled && proofPhotos.length < 5) {
      setProofPhotos(prev => [...prev, res.assets[0]]);
    }
  }

  function removeProofPhoto(index: number) {
    setProofPhotos(prev => prev.filter((_, i) => i !== index));
  }

  function handleWebFileChange(e: any) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newAssets = Array.from(files).map((file: any) => ({
      uri: URL.createObjectURL(file),
      fileName: file.name,
      mimeType: file.type || 'image/jpeg',
      width: 0,
      height: 0,
      fileSize: file.size,
      type: 'image' as const,
      _rawFile: file,
    }));
    setProofPhotos(prev => [...prev, ...newAssets].slice(0, 5));
    e.target.value = '';
  }

  function handleSubmit() {
    if (!result) {
      if (Platform.OS === 'web') {
        window.alert('ပို့ဆောင်ရလဒ် ရွေးချယ်ပါ');
      } else {
        Alert.alert('ရလဒ် ရွေးပါ', 'ပို့ဆောင်ရလဒ် ရွေးချယ်ပါ');
      }
      return;
    }
    if (result === 'FAILED' && !failureReason) {
      if (Platform.OS === 'web') {
        window.alert('မအောင်မြင်မှု အကြောင်းအရင်း ရွေးချယ်ပါ');
      } else {
        Alert.alert('အကြောင်းအရင်း ရွေးပါ', 'မအောင်မြင်မှု အကြောင်းအရင်း ရွေးချယ်ပါ');
      }
      return;
    }
    // Warn if delivered but no proof photo
    if (result === 'DELIVERED' && proofPhotos.length === 0) {
      if (Platform.OS === 'web') {
        const confirmed = window.confirm('သက်သေဓာတ်ပုံ မပါဘဲ တင်မည်လား?');
        if (!confirmed) return;
        doSubmit();
      } else {
        Alert.alert(
          'သက်သေဓာတ်ပုံ မပါ',
          'သက်သေဓာတ်ပုံ ထည့်ရန် အကြံပြုသည်။ ဓာတ်ပုံ မပါဘဲ ဆက်လုပ်မည်လား?',
          [
            { text: 'ဓာတ်ပုံ ထည့်မည်', style: 'cancel' },
            { text: 'ဆက်လုပ်မည်', onPress: doSubmit },
          ]
        );
      }
      return;
    }
    doSubmit();
  }

  function doSubmit() {
    attemptMutation.mutate({
      result,
      failure_reason: result === 'FAILED' ? failureReason : undefined,
      recipient_name: recipientName || undefined,
      notes: notes || undefined,
    });
  }

  const parcel = assignment?.parcel;
  const isPending = attemptMutation.isPending || uploadingProof;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Hidden web file input */}
      {Platform.OS === 'web' && (
        <input
          ref={webFileRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleWebFileChange}
        />
      )}

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>ရလဒ် မှတ်တမ်းတင်မည်</Text>
          {parcel && <Text style={styles.headerSubtitle} numberOfLines={1}>{parcel.tracking_number}</Text>}
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Parcel Info */}
        {parcel && (
          <InfoSection title="ပါဆယ် အချက်အလက်">
            <InfoRow label="ခြေရာခံ" value={parcel.tracking_number} />
            <InfoRow label="လက်ခံသူ" value={parcel.recipient_name} />
            <InfoRow label="ဖုန်းနံပါတ်" value={parcel.recipient_phone} />
            <InfoRow label="လိပ်စာ" value={parcel.delivery_address} />
            {parcel.is_cod && (
              <InfoRow label="COD" value={`${Number(parcel.cod_amount).toLocaleString()} ကျပ်`} valueColor={COLORS.info} />
            )}
          </InfoSection>
        )}

        {/* Result Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ပို့ဆောင်ရလဒ် *</Text>
          <View style={styles.resultRow}>
            <TouchableOpacity
              style={[styles.resultBtn, result === 'DELIVERED' && styles.resultBtnDelivered]}
              onPress={() => setResult('DELIVERED')}
              activeOpacity={0.8}
            >
              <Text style={[styles.resultBtnText, result === 'DELIVERED' && { color: COLORS.white }]}>
                ပို့ဆောင်ပြီး
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.resultBtn, result === 'FAILED' && styles.resultBtnFailed]}
              onPress={() => setResult('FAILED')}
              activeOpacity={0.8}
            >
              <Text style={[styles.resultBtnText, result === 'FAILED' && { color: COLORS.white }]}>
                မအောင်မြင်
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Failure Reason */}
        {result === 'FAILED' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>မအောင်မြင်မှု အကြောင်းအရင်း *</Text>
            <View style={styles.reasonGrid}>
              {FAILURE_REASONS.map(r => (
                <TouchableOpacity
                  key={r.value}
                  style={[styles.reasonChip, failureReason === r.value && styles.reasonChipActive]}
                  onPress={() => setFailureReason(r.value)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.reasonChipText, failureReason === r.value && styles.reasonChipTextActive]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Recipient name (for delivered) */}
        {result === 'DELIVERED' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>လက်ခံသူ နာမည်</Text>
            <View style={styles.inputCard}>
              <TextInput
                style={styles.textInput}
                value={recipientName}
                onChangeText={setRecipientName}
                placeholder="လက်ခံသူ၏ နာမည်"
                placeholderTextColor={COLORS.textLight}
              />
            </View>
          </View>
        )}

        {/* Proof Photo Section */}
        {result === 'DELIVERED' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>သက်သေဓာတ်ပုံ (အကြံပြု)</Text>
            <Text style={styles.proofHint}>
              ပို့ဆောင်ပြီးကြောင်း သက်သေဓာတ်ပုံ ရိုက်ပါ — လက်ခံသူ၊ ပါဆယ်နဲ့ တစ်ပါတည်း ရိုက်ပေးပါ
            </Text>

            <View style={styles.photoBtnRow}>
              <TouchableOpacity style={styles.photoBtn} onPress={takeProofPhoto} activeOpacity={0.8}>
                <Text style={styles.photoBtnText}>ဓာတ်ပုံရိုက်ရန်</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoBtn} onPress={pickProofPhoto} activeOpacity={0.8}>
                <Text style={styles.photoBtnText}>ဓာတ်ပုံရွေးရန်</Text>
              </TouchableOpacity>
            </View>

            {proofPhotos.length > 0 && (
              <View style={styles.photoGrid}>
                {proofPhotos.map((photo, idx) => (
                  <View key={idx} style={styles.photoThumbWrap}>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => {
                        setPreviewIndex(idx);
                        setPreviewVisible(true);
                      }}
                      style={styles.photoThumbTouch}
                    >
                      <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.photoRemoveBtn} onPress={() => removeProofPhoto(idx)}>
                      <Text style={styles.photoRemoveText}>×</Text>
                    </TouchableOpacity>
                    <View style={styles.photoIndexBadge}>
                      <Text style={styles.photoIndexText}>{idx + 1}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {proofPhotos.length === 0 && (
              <View style={styles.noPhotoBox}>
                <Text style={styles.noPhotoText}>ဓာတ်ပုံ မရှိသေးပါ</Text>
                <Text style={styles.noPhotoSubText}>အများဆုံး 5 ပုံ တင်နိုင်သည်</Text>
              </View>
            )}
          </View>
        )}

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>မှတ်ချက် (ချန်ထားနိုင်)</Text>
          <View style={styles.inputCard}>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="အပိုသတင်းအချက်အလက်..."
              placeholderTextColor={COLORS.textLight}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Upload status indicator */}
        {uploadingProof && (
          <View style={styles.uploadingRow}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.uploadingText}>သက်သေဓာတ်ပုံ တင်နေသည်...</Text>
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            result === 'DELIVERED' ? styles.submitDelivered : result === 'FAILED' ? styles.submitFailed : styles.submitDisabled,
            isPending && { opacity: 0.6 },
          ]}
          onPress={handleSubmit}
          disabled={!result || isPending}
          activeOpacity={0.85}
        >
          {isPending ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.submitBtnText}>
              {result === 'DELIVERED' ? 'ပို့ဆောင်ပြီး အတည်ပြုမည်' : result === 'FAILED' ? 'မအောင်မြင်မှု တင်မည်' : 'ရလဒ် ရွေးပါ'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Proof Photo Preview Modal */}
      <ImagePreviewModal
        visible={previewVisible}
        images={proofPhotos.map((p, i) => ({
          id: i,
          url: p.uri,
          original_name: p.fileName || `သက်သေပုံ #${i + 1}`,
        }))}
        initialIndex={previewIndex}
        onClose={() => setPreviewVisible(false)}
      />
    </View>
  );
}

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.infoCard}>{children}</View>
    </View>
  );
}

function InfoRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor ? { color: valueColor, fontWeight: '700' } : {}]} numberOfLines={3}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  container: { flex: 1, backgroundColor: COLORS.primary },
  scrollArea: { flex: 1, backgroundColor: COLORS.background, },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
    backgroundColor: COLORS.primary,
  },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.white, fontFamily: FONTS.bold },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2, fontFamily: FONTS.regular },
  content: { padding: 16, paddingBottom: 40 },

  section: { minHeight: 48, marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 8, fontFamily: FONTS.bold },
  infoCard: { minHeight: 80, minWidth: 120,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: { fontSize: 13, color: COLORS.textSecondary, width: 96, fontFamily: FONTS.regular },
  infoValue: { flex: 1, fontSize: 14, color: COLORS.text, fontWeight: '500', fontFamily: FONTS.medium },

  resultRow: { flexDirection: 'row', gap: 10 },
  resultBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  resultBtnDelivered: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  resultBtnFailed: { backgroundColor: COLORS.error, borderColor: COLORS.error },
  resultBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.bold },

  reasonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reasonChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  reasonChipActive: { backgroundColor: COLORS.error, borderColor: COLORS.error },
  reasonChipText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, fontFamily: FONTS.semiBold },
  reasonChipTextActive: { color: COLORS.white },

  inputCard: { minHeight: 80, minWidth: 120,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 4,
  },
  textInput: {
    borderWidth: 0,
    padding: 10,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.white,
    fontFamily: FONTS.regular,
  },
  textArea: { height: 76, textAlignVertical: 'top' },

  proofHint: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 12, fontFamily: FONTS.regular, lineHeight: 18 },
  photoBtnRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  photoBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  photoBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.text, fontFamily: FONTS.semiBold },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoThumbWrap: { position: 'relative' },
  photoThumbTouch: { flex: 1, width: '100%', height: '100%' },
  photoThumb: { width: 80, height: 80, borderRadius: 8, backgroundColor: COLORS.border },
  photoRemoveBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveText: { fontSize: 14, lineHeight: 16, color: COLORS.error, fontFamily: FONTS.bold },
  photoIndexBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  photoIndexText: { fontSize: 11, color: COLORS.white, fontWeight: '700' },
  noPhotoBox: {
    alignItems: 'center',
    paddingVertical: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    backgroundColor: COLORS.white,
  },
  noPhotoText: { fontSize: 14, color: COLORS.textSecondary, fontFamily: FONTS.regular },
  noPhotoSubText: { fontSize: 12, color: COLORS.textLight, marginTop: 4, fontFamily: FONTS.regular },
  uploadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12, justifyContent: 'center' },
  uploadingText: { fontSize: 14, color: COLORS.primary, fontFamily: FONTS.regular },

  submitBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    padding: 16,
    marginTop: 8,
  },
  submitDelivered: { backgroundColor: COLORS.success },
  submitFailed: { backgroundColor: COLORS.error },
  submitDisabled: { backgroundColor: COLORS.textLight },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.white, fontFamily: FONTS.bold },
});