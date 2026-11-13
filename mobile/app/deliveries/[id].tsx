import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { deliveryService } from '../../src/services/deliveryService';
import { COLORS, STATUS_COLORS, STATUS_LABELS_MM} from '../../src/constants';

export default function DeliveryDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: assignment, isLoading } = useQuery({
    queryKey: ['assignment', id],
    queryFn: () => deliveryService.getAssignment(Number(id)),
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const parcel = assignment?.parcel;
  const parcelStatus = parcel?.status ?? '';
  const statusColor = STATUS_COLORS[parcelStatus as keyof typeof STATUS_COLORS] || COLORS.textSecondary;
  const statusLabel = STATUS_LABELS_MM[parcelStatus as keyof typeof STATUS_LABELS_MM] || parcelStatus;
  const isActive = assignment?.status === 'IN_PROGRESS' || assignment?.status === 'PENDING';

  return (
    <View style={[styles.container, { backgroundColor: statusColor }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: statusColor, paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {parcel?.tracking_number || 'ချိတ်ဆက်မှု'}
          </Text>
          {assignment?.staff && (
            <Text style={styles.headerSub}>🚲 {assignment.staff.name}</Text>
          )}
        </View>
        <View style={styles.assignStatusPill}>
          <Text style={styles.assignStatusText}>
            {assignment?.status === 'IN_PROGRESS' ? 'ဆောင်ရွက်နေ'
              : assignment?.status === 'PENDING' ? 'စောင့်ဆိုင်း'
              : assignment?.status === 'COMPLETED' ? 'ပြီးစီး'
              : assignment?.status === 'FAILED' ? 'မအောင်မြင်'
              : assignment?.status === 'REASSIGNED' ? 'ပြောင်းလဲ'
              : (assignment?.status ?? '')}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Status hero */}
        <View style={[styles.statusHero, { backgroundColor: statusColor + '18', borderColor: statusColor + '40' }]}>
          <View style={[styles.statusDotLg, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusHeroLabel, { color: statusColor }]}>{statusLabel}</Text>
        </View>

        {/* Parcel info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ပါဆယ် အချက်အလက်</Text>
          <View style={styles.card}>
            <InfoRow icon="barcode-outline"   label="ခြေရာခံ"    value={parcel?.tracking_number || '—'} />
            <InfoRow icon="person-outline"    label="လက်ခံသူ"   value={parcel?.recipient_name  || '—'} />
            <InfoRow
              icon="call-outline" label="ဖုန်းနံပါတ်"
              value={parcel?.recipient_phone || '—'}
              onPress={parcel?.recipient_phone ? () => Linking.openURL(`tel:${parcel.recipient_phone}`) : undefined}
            />
            <InfoRow icon="location-outline"  label="လိပ်စာ"     value={parcel?.delivery_address || '—'} />
            {parcel?.delivery_area && (
              <InfoRow icon="map-outline" label="ဒေသ" value={parcel.delivery_area.name} />
            )}
            {parcel?.is_cod && (
              <InfoRow
                icon="cash-outline" label="COD"
                value={`${Number(parcel.cod_amount).toLocaleString()} ကျပ်`}
                valueColor={COLORS.info}
              />
            )}
          </View>
        </View>

        {/* Assignment info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ချိတ်ဆက်မှု အချက်အလက်</Text>
          <View style={styles.card}>
            {assignment?.staff && (
              <InfoRow icon="bicycle-outline" label="ဝန်ထမ်း" value={assignment.staff.name} />
            )}
            {assignment?.assigned_by && (
              <InfoRow icon="person-circle-outline" label="ချိတ်ဆက်သူ" value={assignment.assigned_by.name} />
            )}
            {assignment?.assigned_at && (
              <InfoRow
                icon="calendar-outline" label="ချိတ်ဆက်ရက်"
                value={new Date(assignment.assigned_at).toLocaleString('my-MM')}
              />
            )}
            {assignment?.notes && (
              <InfoRow icon="document-text-outline" label="မှတ်ချက်" value={assignment.notes} />
            )}
          </View>
        </View>

        {/* Delivery attempts */}
        {assignment?.delivery_attempts && assignment.delivery_attempts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              ပို့ဆောင်ကြိုးပမ်းမှုများ ({assignment.delivery_attempts.length})
            </Text>
            {[...assignment.delivery_attempts].reverse().map((attempt: any, i: number) => {
              const delivered = attempt.result === 'DELIVERED';
              return (
                <View key={attempt.id ?? i} style={styles.attemptCard}>
                  <View style={styles.attemptHeader}>
                    <View style={[styles.attemptBadge, delivered ? styles.attemptDelivered : styles.attemptFailed]}>
                      <Ionicons
                        name={delivered ? 'checkmark-circle' : 'close-circle'}
                        size={14}
                        color={delivered ? COLORS.success : COLORS.error}
                      />
                      <Text style={[styles.attemptBadgeText, { color: delivered ? COLORS.success : COLORS.error }]}>
                        {delivered ? 'ပို့ဆောင်ပြီး' : 'မအောင်မြင်'}
                      </Text>
                    </View>
                    <Text style={styles.attemptTime}>
                      {new Date(attempt.attempted_at).toLocaleString('my-MM')}
                    </Text>
                  </View>
                  {attempt.failure_reason && (
                    <View style={styles.attemptDetailRow}>
                      <Ionicons name="alert-circle-outline" size={13} color={COLORS.error} />
                      <Text style={styles.attemptDetailText}>{attempt.failure_reason}</Text>
                    </View>
                  )}
                  {attempt.recipient_name && (
                    <View style={styles.attemptDetailRow}>
                      <Ionicons name="person-outline" size={13} color={COLORS.textSecondary} />
                      <Text style={styles.attemptDetailText}>{attempt.recipient_name}</Text>
                    </View>
                  )}
                  {attempt.notes && (
                    <View style={styles.attemptDetailRow}>
                      <Ionicons name="chatbubble-outline" size={13} color={COLORS.textSecondary} />
                      <Text style={[styles.attemptDetailText, { fontStyle: 'italic' }]}>{attempt.notes}</Text>
                    </View>
                  )}
                  {/* Proof Photos */}
                  {attempt.proof_photos && attempt.proof_photos.length > 0 && (
                    <View style={styles.proofSection}>
                      <View style={styles.proofSectionHeader}>
                        <Ionicons name="camera-outline" size={13} color={COLORS.primary} />
                        <Text style={styles.proofSectionTitle}>
                          သက်သေဓာတ်ပုံ ({attempt.proof_photos.length})
                        </Text>
                      </View>
                      <View style={styles.proofGrid}>
                        {attempt.proof_photos.map((p: any) => (
                          <Image key={p.id} source={{ uri: p.file_url }} style={styles.proofThumb} />
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Record attempt button */}
        {isActive && (
          <TouchableOpacity
            style={styles.recordBtn}
            onPress={() => router.push(`/deliveries/attempt/${id}`)}
            activeOpacity={0.85}
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
      <View style={styles.infoIconBox}>
        <Ionicons name={icon as any} size={16} color={COLORS.primary} />
      </View>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text
        style={[styles.infoValue, valueColor ? { color: valueColor, fontWeight: '700' } : {}]}
        numberOfLines={3}
      >
        {value}
      </Text>
      {onPress && <Ionicons name="chevron-forward" size={14} color={COLORS.textLight} />}
    </View>
  );
  return onPress ? <TouchableOpacity onPress={onPress}>{content}</TouchableOpacity> : content;
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  container: { flex: 1 },
  scrollArea: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingBottom: 20, gap: 12, borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.white,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2,
    fontFamily: 'NotoSansMyanmar_400Regular',
  },
  assignStatusPill: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  assignStatusText: { fontSize: 12, fontWeight: '700', color: COLORS.white,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  content: { padding: 16, paddingBottom: 32 },

  statusHero: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1.5,
  },
  statusDotLg: { width: 14, height: 14, borderRadius: 7 },
  statusHeroLabel: { fontSize: 17, fontWeight: '800',
    fontFamily: 'NotoSansMyanmar_700Bold',
  },

  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 8,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  card: {
    backgroundColor: COLORS.white, borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12, gap: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  infoIconBox: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: COLORS.primary + '15', alignItems: 'center', justifyContent: 'center',
  },
  infoLabel: { fontSize: 13, color: COLORS.textSecondary, width: 86,
    fontFamily: 'NotoSansMyanmar_400Regular',
  },
  infoValue: { flex: 1, fontSize: 14, color: COLORS.text, fontWeight: '500',
    fontFamily: 'NotoSansMyanmar_500Medium',
  },

  attemptCard: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  attemptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  attemptBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  attemptDelivered: { backgroundColor: '#E8F8EF' },
  attemptFailed: { backgroundColor: '#FDE8E8' },
  attemptBadgeText: { fontSize: 13, fontWeight: '700',
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  attemptTime: { fontSize: 12, color: COLORS.textLight,
    fontFamily: 'NotoSansMyanmar_400Regular',
  },
  attemptDetailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 5 },
  attemptDetailText: { flex: 1, fontSize: 13, color: COLORS.textSecondary,
    fontFamily: 'NotoSansMyanmar_400Regular',
  },

  // Proof photo section inside attempt card
  proofSection: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  proofSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  proofSectionTitle: { fontSize: 12, fontWeight: '700', color: COLORS.primary,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  proofGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  proofThumb: { width: 72, height: 72, borderRadius: 8, backgroundColor: COLORS.border },

  recordBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: COLORS.primary, borderRadius: 16, padding: 18, marginTop: 8,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 5,
  },
  recordBtnText: { fontSize: 17, fontWeight: '700', color: COLORS.white,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
});
