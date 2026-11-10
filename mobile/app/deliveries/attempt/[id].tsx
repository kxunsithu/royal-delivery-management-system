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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { deliveryService } from '../../../src/services/deliveryService';
import { COLORS, STATUS_COLORS, STATUS_LABELS_MM} from '../../../src/constants';

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

  const attemptMutation = useMutation({
    mutationFn: (data: any) => deliveryService.recordAttempt(Number(id), data),
    onSuccess: (res) => {
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

  function handleSubmit() {
    if (!result) {
      Alert.alert('ရလဒ် ရွေးပါ', 'ပို့ဆောင်ရလဒ် ရွေးချယ်ပါ');
      return;
    }
    if (result === 'FAILED' && !failureReason) {
      Alert.alert('အကြောင်းအရင်း ရွေးပါ', 'မအောင်မြင်မှု အကြောင်းအရင်း ရွေးချယ်ပါ');
      return;
    }

    attemptMutation.mutate({
      result,
      failure_reason: result === 'FAILED' ? failureReason : undefined,
      recipient_name: recipientName || undefined,
      notes: notes || undefined,
    });
  }

  const parcel = assignment?.parcel;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>ရလဒ် မှတ်တမ်းတင်မည်</Text>
          {parcel && <Text style={styles.headerSub}>{parcel.tracking_number}</Text>}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" style={styles.scrollArea}>
        {/* Parcel Info */}
        {parcel && (
          <View style={styles.parcelCard}>
            <View style={styles.parcelHeader}>
              <Ionicons name="barcode-outline" size={18} color={COLORS.primary} />
              <Text style={styles.trackingNum}>{parcel.tracking_number}</Text>
            </View>
            <Text style={styles.recipientName}>{parcel.recipient_name}</Text>
            <View style={styles.infoRow}>
              <Ionicons name="call" size={14} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>{parcel.recipient_phone}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="location" size={14} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>{parcel.delivery_address}</Text>
            </View>
            {parcel.is_cod && (
              <View style={styles.codInfo}>
                <Ionicons name="cash" size={16} color={COLORS.info} />
                <Text style={styles.codText}>COD ကောက်ရမည် - {Number(parcel.cod_amount).toLocaleString()} ကျပ်</Text>
              </View>
            )}
          </View>
        )}

        {/* Result Selection */}
        <Text style={styles.sectionTitle}>ပို့ဆောင်ရလဒ် *</Text>
        <View style={styles.resultRow}>
          <TouchableOpacity
            style={[styles.resultBtn, result === 'DELIVERED' && styles.resultBtnDelivered]}
            onPress={() => setResult('DELIVERED')}
          >
            <Ionicons
              name="checkmark-circle"
              size={28}
              color={result === 'DELIVERED' ? COLORS.white : COLORS.success}
            />
            <Text style={[styles.resultBtnText, result === 'DELIVERED' && { color: COLORS.white }]}>
              ပို့ဆောင်ပြီး
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.resultBtn, result === 'FAILED' && styles.resultBtnFailed]}
            onPress={() => setResult('FAILED')}
          >
            <Ionicons
              name="close-circle"
              size={28}
              color={result === 'FAILED' ? COLORS.white : COLORS.error}
            />
            <Text style={[styles.resultBtnText, result === 'FAILED' && { color: COLORS.white }]}>
              မအောင်မြင်
            </Text>
          </TouchableOpacity>
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
            <TextInput
              style={styles.textInput}
              value={recipientName}
              onChangeText={setRecipientName}
              placeholder="လက်ခံသူ၏ နာမည်"
              placeholderTextColor={COLORS.textLight}
            />
          </View>
        )}

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>မှတ်ချက် (ချန်ထားနိုင်)</Text>
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

        {/* Submit */}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            result === 'DELIVERED' ? styles.submitDelivered : result === 'FAILED' ? styles.submitFailed : styles.submitDisabled,
            attemptMutation.isPending && { opacity: 0.6 },
          ]}
          onPress={handleSubmit}
          disabled={!result || attemptMutation.isPending}
        >
          {attemptMutation.isPending ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons
                name={result === 'DELIVERED' ? 'checkmark-circle' : 'close-circle'}
                size={22}
                color={COLORS.white}
              />
              <Text style={styles.submitBtnText}>
                {result === 'DELIVERED' ? 'ပို့ဆောင်ပြီး အတည်ပြုမည်' : result === 'FAILED' ? 'မအောင်မြင်မှု တင်မည်' : 'ရလဒ် ရွေးပါ'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  scrollArea: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.white,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2,
    fontFamily: 'NotoSansMyanmar_400Regular',
  },
  content: { padding: 16, paddingBottom: 40 },
  parcelCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  parcelHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  trackingNum: { fontSize: 15, fontWeight: '700', color: COLORS.primary,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  recipientName: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 8,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  infoText: { fontSize: 14, color: COLORS.textSecondary,
    fontFamily: 'NotoSansMyanmar_400Regular',
  },
  codInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E8F4FB',
    padding: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  codText: { fontSize: 14, fontWeight: '700', color: COLORS.info,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 10,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  section: { marginBottom: 18 },
  resultRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  resultBtn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  resultBtnDelivered: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  resultBtnFailed: { backgroundColor: COLORS.error, borderColor: COLORS.error },
  resultBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.text,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  reasonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reasonChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  reasonChipActive: { backgroundColor: COLORS.error, borderColor: COLORS.error },
  reasonChipText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary,
    fontFamily: 'NotoSansMyanmar_600SemiBold',
  },
  reasonChipTextActive: { color: COLORS.white },
  textInput: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.white,
    fontFamily: 'NotoSansMyanmar_400Regular',
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 16,
    padding: 18,
    marginTop: 8,
  },
  submitDelivered: { backgroundColor: COLORS.success, shadowColor: COLORS.success, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 5 },
  submitFailed: { backgroundColor: COLORS.error, shadowColor: COLORS.error, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 5 },
  submitDisabled: { backgroundColor: COLORS.textLight },
  submitBtnText: { fontSize: 17, fontWeight: '700', color: COLORS.white,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
});
