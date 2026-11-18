import React, { useState } from 'react';
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
import { COLORS, STATUS_COLORS, STATUS_LABELS_MM, FONTS } from '../../src/constants';
import ImagePreviewModal, { PreviewImage } from '../../src/components/ImagePreviewModal';

export default function DeliveryDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Proof photo preview state
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImages, setPreviewImages] = useState<PreviewImage[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);

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
  const isActive = !['COMPLETED', 'FAILED', 'REASSIGNED'].includes(assignment?.status ?? '');

  const assignmentStatusLabel =
    assignment?.status === 'COMPLETED' ? 'ပြီးစီး'
    : assignment?.status === 'FAILED' ? 'မအောင်မြင်'
    : assignment?.status === 'REASSIGNED' ? 'ပြောင်းလဲ'
    : 'ဆောင်ရွက်နေ';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {parcel?.tracking_number || 'ချိတ်ဆက်မှု'}
          </Text>
          {assignment?.staff && (
            <Text style={styles.headerSubtitle} numberOfLines={1}>{assignment.staff.name}</Text>
          )}
        </View>
        <View style={[styles.headerStatusBadge, { backgroundColor: statusColor + '18' }]}>
          <Text style={[styles.headerStatusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[styles.content, { paddingBottom: isActive ? (insets.bottom + 100) : (insets.bottom + 40) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Parcel info */}
        <InfoSection title="ပါဆယ် အချက်အလက်">
          <InfoRow label="ခြေရာခံ" value={parcel?.tracking_number || '—'} />
          <InfoRow label="လက်ခံသူ" value={parcel?.recipient_name || '—'} />
          <InfoRow
            label="ဖုန်းနံပါတ်"
            value={parcel?.recipient_phone || '—'}
            onPress={parcel?.recipient_phone ? () => Linking.openURL(`tel:${parcel.recipient_phone}`) : undefined}
          />
          <InfoRow label="လိပ်စာ" value={parcel?.delivery_address || '—'} />
          {parcel?.category && (
            <InfoRow label="အမျိုးအစား" value={parcel.category} />
          )}
          {parcel?.description && (
            <InfoRow label="ဖော်ပြချက်" value={parcel.description} />
          )}
          {parcel?.received_at && (
            <InfoRow label="လက်ခံရက်" value={new Date(parcel.received_at).toLocaleString('my-MM')} />
          )}
          {parcel?.status === 'DELIVERED' && (parcel?.delivered_at || parcel?.updated_at) && (
            <InfoRow
              label="ပို့ဆောင်ပြီးရက်"
              value={new Date((parcel.delivered_at || parcel.updated_at)!).toLocaleString('my-MM')}
              valueColor={COLORS.success}
            />
          )}
          {parcel?.status === 'FAILED' && (parcel?.failed_at || parcel?.updated_at) && (
            <InfoRow
              label="မအောင်မြင်ရက်"
              value={new Date((parcel.failed_at || parcel.updated_at)!).toLocaleString('my-MM')}
              valueColor={COLORS.error}
            />
          )}
        </InfoSection>

        {/* Fee & COD section */}
        {parcel && (Number(parcel.delivery_fee) > 0 || parcel.is_cod) && (() => {
          const currency = parcel.currency ?? 'MMK';
          const currencySymbol = currency === 'THB' ? '฿' : 'K';
          const feeRows: { label: string; value: string; color: string }[] = [];
          if (Number(parcel.delivery_fee) > 0) {
            feeRows.push({
              label: 'ပို့ဆောင်ခ',
              value: `${Number(parcel.delivery_fee).toLocaleString()} ${currencySymbol}`,
              color: COLORS.success,
            });
          }
          if (parcel.is_cod) {
            feeRows.push({
              label: 'COD',
              value: `${Number(parcel.cod_amount).toLocaleString()} ${currencySymbol}`,
              color: COLORS.warning,
            });
          }
          return (
            <InfoSection title="ငွေကြေး အချက်အလက်">
              {feeRows.map((row) => (
                <InfoRow key={row.label} label={row.label} value={row.value} valueColor={row.color} />
              ))}
              <InfoRow label="ငွေကြေး" value={currency === 'THB' ? 'ထိုင်းဘတ် (฿)' : 'ကျပ် (K)'} />
            </InfoSection>
          );
        })()}

        {/* Parcel images (admin-uploaded) */}
        {parcel?.images && parcel.images.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ပါဆယ် ဓာတ်ပုံများ ({parcel.images.length})</Text>
            <View style={styles.parcelImgGrid}>
              {parcel.images.map((img: any, idx: number) => (
                <TouchableOpacity
                  key={img.id || idx}
                  activeOpacity={0.85}
                  style={styles.parcelImgWrap}
                  onPress={() => {
                    const imgs: PreviewImage[] = parcel.images!.map((item: any, i: number) => ({
                      id: item.id || `img-${i}`,
                      url: item.url,
                    }));
                    setPreviewImages(imgs);
                    setPreviewIndex(idx);
                    setPreviewVisible(true);
                  }}
                >
                  <Image source={{ uri: img.url }} style={styles.parcelImgThumb} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Assignment info */}
        <InfoSection title="ချိတ်ဆက်မှု အချက်အလက်">
          {assignment?.staff && (
            <InfoRow label="ဝန်ထမ်း" value={assignment.staff.name} />
          )}
          {assignment?.assigned_by && (
            <InfoRow label="ချိတ်ဆက်သူ" value={assignment.assigned_by.name} />
          )}
          {assignment?.assigned_at && (
            <InfoRow
              label="ချိတ်ဆက်ရက်"
              value={new Date(assignment.assigned_at).toLocaleString('my-MM')}
            />
          )}
          {assignment?.notes && (
            <InfoRow label="မှတ်ချက်" value={assignment.notes} />
          )}
          {assignment?.status && (
            <InfoRow label="အခြေအနေ" value={assignmentStatusLabel} />
          )}
        </InfoSection>

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
                      <Text style={[styles.attemptBadgeText, { color: delivered ? COLORS.success : COLORS.error }]}>
                        {delivered ? 'ပို့ဆောင်ပြီး' : 'မအောင်မြင်'}
                      </Text>
                    </View>
                    <Text style={styles.attemptTime}>
                      {new Date(attempt.attempted_at).toLocaleString('my-MM')}
                    </Text>
                  </View>
                  {attempt.failure_reason && (
                    <Text style={styles.attemptDetail}>{attempt.failure_reason}</Text>
                  )}
                  {attempt.recipient_name && (
                    <Text style={styles.attemptDetail}>{attempt.recipient_name}</Text>
                  )}
                  {attempt.notes && (
                    <Text style={[styles.attemptDetail, { fontStyle: 'italic' }]}>{attempt.notes}</Text>
                  )}
                  {/* Proof Photos */}
                  {attempt.proof_photos && attempt.proof_photos.length > 0 && (
                    <View style={styles.proofSection}>
                      <Text style={styles.proofSectionTitle}>
                        သက်သေဓာတ်ပုံ ({attempt.proof_photos.length})
                      </Text>
                      <View style={styles.proofGrid}>
                        {attempt.proof_photos.map((p: any, pIdx: number) => (
                          <TouchableOpacity
                            key={p.id || pIdx}
                            activeOpacity={0.8}
                            onPress={() => {
                              const imgs: PreviewImage[] = attempt.proof_photos.map((item: any, i: number) => ({
                                id: item.id || `proof-${i}`,
                                url: item.file_url,
                              }));
                              setPreviewImages(imgs);
                              setPreviewIndex(pIdx);
                              setPreviewVisible(true);
                            }}
                            style={styles.proofThumbWrap}
                          >
                            <Image source={{ uri: p.file_url }} style={styles.proofThumb} />
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Sticky footer button — always visible when assignment is active */}
      {isActive && (
        <View style={[styles.stickyFooter, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            style={styles.recordBtn}
            onPress={() => router.push(`/deliveries/attempt/${id}`)}
            activeOpacity={0.85}
          >
            <Text style={styles.recordBtnText}>ရလဒ် မှတ်တမ်းတင်မည်</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Image Preview Modal */}
      <ImagePreviewModal
        visible={previewVisible}
        images={previewImages}
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

function InfoRow({ label, value, valueColor, onPress }: {
  label: string; value: string; valueColor?: string; onPress?: () => void;
}) {
  const content = (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text
        style={[styles.infoValue, valueColor ? { color: valueColor, fontWeight: '700' } : {}]}
        numberOfLines={3}
      >
        {value}
      </Text>
    </View>
  );
  return onPress ? <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{content}</TouchableOpacity> : content;
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollArea: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingBottom: 16, gap: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.bold },
  headerSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, fontFamily: FONTS.regular },
  headerStatusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, alignSelf: 'flex-start' },
  headerStatusText: { fontSize: 11, fontWeight: '600', fontFamily: FONTS.semiBold },
  content: { padding: 16, paddingBottom: 32 },

  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 8, fontFamily: FONTS.bold },
  infoCard: {
    backgroundColor: COLORS.white, borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.border,
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 11, gap: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  infoLabel: { fontSize: 13, color: COLORS.textSecondary, width: 96, fontFamily: FONTS.regular },
  infoValue: { flex: 1, fontSize: 14, color: COLORS.text, fontWeight: '500', fontFamily: FONTS.medium },

  // Parcel (admin-uploaded) images
  parcelImgGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  parcelImgWrap: { borderRadius: 10, overflow: 'hidden' },
  parcelImgThumb: { width: 90, height: 90, borderRadius: 10, backgroundColor: COLORS.border },

  attemptCard: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.border,
  },
  attemptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  attemptBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  attemptDelivered: { backgroundColor: '#E8F8EF' },
  attemptFailed: { backgroundColor: '#FDE8E8' },
  attemptBadgeText: { fontSize: 13, fontWeight: '700', fontFamily: FONTS.bold },
  attemptTime: { fontSize: 12, color: COLORS.textLight, fontFamily: FONTS.regular },
  attemptDetail: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, fontFamily: FONTS.regular },

  // Proof photo section inside attempt card
  proofSection: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  proofSectionTitle: { fontSize: 12, fontWeight: '700', color: COLORS.primary, marginBottom: 8, fontFamily: FONTS.bold },
  proofGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  proofThumbWrap: { borderRadius: 8, overflow: 'hidden' },
  proofThumb: { width: 72, height: 72, borderRadius: 8, backgroundColor: COLORS.border },

  // Sticky footer
  stickyFooter: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  recordBtn: {
    backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  recordBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700', fontFamily: FONTS.bold },
});