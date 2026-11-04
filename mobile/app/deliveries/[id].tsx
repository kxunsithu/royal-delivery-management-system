import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { deliveryService } from '../../src/services/deliveryService';
import { COLORS, STATUS_COLORS, STATUS_LABELS_MM } from '../../src/constants';

export default function DeliveryDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: assignment, isLoading, refetch } = useQuery({
    queryKey: ['assignment', id],
    queryFn: () => deliveryService.getAssignment(Number(id)),
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      </View>
    );
  }

  const parcel = assignment?.parcel;
  const parcelStatus = parcel?.status ?? '';
  const statusColor = STATUS_COLORS[parcelStatus as keyof typeof STATUS_COLORS] || COLORS.textSecondary;
  const statusLabel = STATUS_LABELS_MM[parcelStatus as keyof typeof STATUS_LABELS_MM] || parcelStatus;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{parcel?.tracking_number || 'အချိတ်အဆက်'}</Text>
          <Text style={styles.headerSub}>{assignment?.staff?.name || ''}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status card */}
        <View style={[styles.statusCard, { borderColor: statusColor }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusCardText, { color: statusColor }]}>{statusLabel}</Text>
        </View>

        {/* Parcel info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ပါဆယ် အချက်အလက်</Text>
          <View style={styles.card}>
            <InfoRow icon="barcode-outline" label="ခြေရာခံနံပါတ်" value={parcel?.tracking_number || '-'} />
            <InfoRow icon="person" label="လက်ခံသူ" value={parcel?.recipient_name || '-'} />
            <InfoRow
              icon="call"
              label="ဖုန်းနံပါတ်"
              value={parcel?.recipient_phone || '-'}
              onPress={() => Linking.openURL(`tel:${parcel?.recipient_phone}`)}
            />
            <InfoRow icon="location" label="လိပ်စာ" value={parcel?.delivery_address || '-'} />
            {parcel?.delivery_area && <InfoRow icon="map" label="ဒေသ" value={parcel.delivery_area.name} />}
            {parcel?.is_cod && (
              <InfoRow
                icon="cash"
                label="COD"
                value={`${Number(parcel.cod_amount).toLocaleString()} ကျပ် ကောက်ရမည်`}
                valueColor={COLORS.info}
              />
            )}
          </View>
        </View>

        {/* Assignment info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ချိတ်ဆက်မှု အချက်အလက်</Text>
          <View style={styles.card}>
            {assignment?.staff && <InfoRow icon="bicycle" label="ဝန်ထမ်း" value={assignment.staff.name} />}
            {assignment?.assigned_by && <InfoRow icon="person-circle" label="ချိတ်ဆက်သူ" value={assignment.assigned_by.name} />}
            {assignment?.assigned_at && (
              <InfoRow icon="calendar" label="ချိတ်ဆက်သည့်ရက်" value={new Date(assignment.assigned_at).toLocaleString('my-MM')} />
            )}
            {assignment?.notes && <InfoRow icon="document-text" label="မှတ်ချက်" value={assignment.notes} />}
          </View>
        </View>

        {/* Delivery attempts */}
        {assignment?.delivery_attempts && assignment.delivery_attempts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ပို့ဆောင်ကြိုးပမ်းမှုများ</Text>
            {assignment.delivery_attempts.map((attempt: any, i: number) => (
              <View key={attempt.id} style={styles.attemptCard}>
                <View style={styles.attemptHeader}>
                  <View style={[
                    styles.attemptBadge,
                    attempt.result === 'DELIVERED' ? styles.attemptDelivered : styles.attemptFailed
                  ]}>
                    <Ionicons
                      name={attempt.result === 'DELIVERED' ? 'checkmark-circle' : 'close-circle'}
                      size={16}
                      color={attempt.result === 'DELIVERED' ? COLORS.success : COLORS.error}
                    />
                    <Text style={[
                      styles.attemptBadgeText,
                      { color: attempt.result === 'DELIVERED' ? COLORS.success : COLORS.error }
                    ]}>
                      {attempt.result === 'DELIVERED' ? 'ပို့ဆောင်ပြီး' : 'မအောင်မြင်'}
                    </Text>
                  </View>
                  <Text style={styles.attemptTime}>{new Date(attempt.attempted_at).toLocaleString('my-MM')}</Text>
                </View>
                {attempt.failure_reason && (
                  <Text style={styles.attemptReason}>အကြောင်းအရင်း: {attempt.failure_reason}</Text>
                )}
                {attempt.recipient_name && (
                  <Text style={styles.attemptRecipient}>လက်ခံသူ: {attempt.recipient_name}</Text>
                )}
                {attempt.notes && <Text style={styles.attemptNotes}>{attempt.notes}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Record attempt button for active assignments */}
        {assignment?.status === 'ACTIVE' && (
          <TouchableOpacity
            style={styles.recordBtn}
            onPress={() => router.push(`/deliveries/attempt/${id}`)}
          >
            <Ionicons name="add-circle" size={22} color={COLORS.white} />
            <Text style={styles.recordBtnText}>ရလဒ် မှတ်တမ်းတင်မည်</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

function InfoRow({ icon, label, value, valueColor, onPress }: {
  icon: string; label: string; value: string; valueColor?: string; onPress?: () => void;
}) {
  const content = (
    <View style={styles.infoRow}>
      <Ionicons name={icon as any} size={16} color={COLORS.primary} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor ? { color: valueColor, fontWeight: '700' } : {}]} numberOfLines={3}>{value}</Text>
      {onPress && <Ionicons name="chevron-forward" size={14} color={COLORS.textLight} />}
    </View>
  );
  return onPress ? <TouchableOpacity onPress={onPress}>{content}</TouchableOpacity> : content;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  content: { padding: 16, paddingBottom: 32 },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
  },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  statusCardText: { fontSize: 16, fontWeight: '700' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  card: { backgroundColor: COLORS.white, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  infoLabel: { fontSize: 13, color: COLORS.textSecondary, width: 96 },
  infoValue: { flex: 1, fontSize: 14, color: COLORS.text, fontWeight: '500' },
  attemptCard: { backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  attemptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  attemptBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  attemptDelivered: { backgroundColor: '#E8F8EF' },
  attemptFailed: { backgroundColor: '#FDE8E8' },
  attemptBadgeText: { fontSize: 13, fontWeight: '600' },
  attemptTime: { fontSize: 12, color: COLORS.textLight },
  attemptReason: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 },
  attemptRecipient: { fontSize: 13, color: COLORS.text, fontWeight: '600', marginBottom: 4 },
  attemptNotes: { fontSize: 13, color: COLORS.textSecondary, fontStyle: 'italic' },
  recordBtn: {
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
  recordBtnText: { fontSize: 17, fontWeight: '700', color: COLORS.white },
});
