import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { parcelService, Parcel } from '../../src/services/parcelService';
import { COLORS, FONTS, STATUS_COLORS, STATUS_LABELS_MM } from '../../src/constants';

function formatDateHeader(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['တနင်္ဂနွေ', 'တနင်္လာ', 'အင်္ဂါ', 'ဗုဒ္ဓဟူး', 'ကြာသပတေး', 'သောကြာ', 'စနေ'];
  const months = [
    'ဇန်နဝါရီ', 'ဖေဖော်ဝါရီ', 'မတ်', 'ဧပြီ', 'မေ', 'ဇွန်',
    'ဇူလိုင်', 'သြဂုတ်', 'စက်တင်ဘာ', 'အောက်တိုဘာ', 'နိုဝင်ဘာ', 'ဒီဇင်ဘာ',
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}၊ ${days[d.getDay()]}`;
}

export default function DailySummaryDetailScreen() {
  const insets = useSafeAreaInsets();
  const { date } = useLocalSearchParams<{ date: string }>();
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['parcels-daily-detail', date, page],
    queryFn: () =>
      parcelService.list({
        date_from: date,
        date_to: date,
        page,
        per_page: 50,
      }),
    enabled: !!date,
  });

  const parcels = data?.data ?? [];
  const meta = data?.meta;

  // Calculate summary stats from loaded parcels
  const feeMmk = parcels.filter(p => p.currency === 'MMK').reduce((s, p) => s + Number(p.delivery_fee), 0);
  const feeThb = parcels.filter(p => p.currency === 'THB').reduce((s, p) => s + Number(p.delivery_fee), 0);
  const codMmk = parcels.filter(p => p.currency === 'MMK' && p.is_cod).reduce((s, p) => s + Number(p.cod_amount), 0);
  const codThb = parcels.filter(p => p.currency === 'THB' && p.is_cod).reduce((s, p) => s + Number(p.cod_amount), 0);
  const uniqueSenders = new Set(parcels.map(p => p.sender_phone).filter(Boolean)).size;
  const uniqueRecipients = new Set(parcels.map(p => p.recipient_phone)).size;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>နေ့စဉ် မှတ်တမ်း</Text>
          {date ? <Text style={styles.headerDate}>{formatDateHeader(date)}</Text> : null}
        </View>
        <View style={{ width: 42 }} />
      </View>

      <View style={styles.contentArea}>
        {/* Summary Stats Card */}
        {!isLoading && parcels.length > 0 && (
          <View style={styles.summaryCard}>
            {/* Row 1: Parcel | Sender | Recipient */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Ionicons name="cube-outline" size={18} color={COLORS.primary} />
                <Text style={styles.summaryValue}>{meta?.total ?? parcels.length}</Text>
                <Text style={styles.summaryLabel}>ပါဆယ် ခု</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Ionicons name="arrow-up-circle-outline" size={18} color={COLORS.textSecondary} />
                <Text style={styles.summaryValue}>{uniqueSenders}</Text>
                <Text style={styles.summaryLabel}>ပို့သူ ဦး</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Ionicons name="person-outline" size={18} color={COLORS.info} />
                <Text style={[styles.summaryValue, { color: COLORS.info }]}>{uniqueRecipients}</Text>
                <Text style={styles.summaryLabel}>လက်ခံသူ ဦး</Text>
              </View>
            </View>

            {/* Row 2: Fee + COD breakdown — only if any amount > 0 */}
            {(feeMmk > 0 || codMmk > 0 || feeThb > 0 || codThb > 0) && (
              <>
                <View style={styles.rowDivider} />
                <View style={styles.summaryRow}>
                  {feeMmk > 0 && (
                    <>
                      <View style={styles.summaryItem}>
                        <Ionicons name="car-outline" size={18} color={COLORS.success} />
                        <Text style={[styles.summaryValue, { color: COLORS.success }]}>{feeMmk.toLocaleString()}</Text>
                        <Text style={styles.summaryLabel}>ပို့ဆောင်ခ (K)</Text>
                      </View>
                      {(codMmk > 0 || feeThb > 0 || codThb > 0) && <View style={styles.summaryDivider} />}
                    </>
                  )}
                  {codMmk > 0 && (
                    <>
                      <View style={styles.summaryItem}>
                        <Ionicons name="cash-outline" size={18} color={COLORS.warning} />
                        <Text style={[styles.summaryValue, { color: COLORS.warning }]}>{codMmk.toLocaleString()}</Text>
                        <Text style={styles.summaryLabel}>COD (K)</Text>
                      </View>
                      {(feeThb > 0 || codThb > 0) && <View style={styles.summaryDivider} />}
                    </>
                  )}
                  {feeThb > 0 && (
                    <>
                      <View style={styles.summaryItem}>
                        <Ionicons name="car-outline" size={18} color={COLORS.success} />
                        <Text style={[styles.summaryValue, { color: COLORS.success }]}>{feeThb.toLocaleString()}</Text>
                        <Text style={styles.summaryLabel}>ပို့ဆောင်ခ (฿)</Text>
                      </View>
                      {codThb > 0 && <View style={styles.summaryDivider} />}
                    </>
                  )}
                  {codThb > 0 && (
                    <View style={styles.summaryItem}>
                      <Ionicons name="cash-outline" size={18} color={COLORS.warning} />
                      <Text style={[styles.summaryValue, { color: COLORS.warning }]}>{codThb.toLocaleString()}</Text>
                      <Text style={styles.summaryLabel}>COD (฿)</Text>
                    </View>
                  )}
                </View>
              </>
            )}
          </View>
        )}

        {/* Parcel List */}
        {isLoading ? (
          <ActivityIndicator style={styles.loader} size="large" color={COLORS.primary} />
        ) : (
          <FlatList
            data={parcels}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <ParcelCard parcel={item} />}
            contentContainerStyle={[styles.list, parcels.length === 0 && styles.listEmpty]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isFetching && !isLoading}
                onRefresh={() => { setPage(1); refetch(); }}
                tintColor={COLORS.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="cube-outline" size={48} color={COLORS.primary} />
                </View>
                <Text style={styles.emptyTitle}>ပါဆယ် မတွေ့ပါ</Text>
                <Text style={styles.emptySub}>ဤနေ့တွင် ပါဆယ် မှတ်တမ်း မရှိပါ</Text>
              </View>
            }
            ListFooterComponent={
              meta && meta.last_page > 1 ? (
                <View style={styles.pagination}>
                  <TouchableOpacity
                    style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
                    onPress={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <Ionicons name="chevron-back" size={16} color={page <= 1 ? COLORS.textLight : COLORS.primary} />
                    <Text style={[styles.pageBtnText, page <= 1 && { color: COLORS.textLight }]}>နှုတ်</Text>
                  </TouchableOpacity>
                  <View style={styles.pageInfoBox}>
                    <Text style={styles.pageInfo}>{page} / {meta.last_page}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.pageBtn, page >= meta.last_page && styles.pageBtnDisabled]}
                    onPress={() => setPage(p => Math.min(meta.last_page, p + 1))}
                    disabled={page >= meta.last_page}
                  >
                    <Text style={[styles.pageBtnText, page >= meta.last_page && { color: COLORS.textLight }]}>နောက်</Text>
                    <Ionicons name="chevron-forward" size={16} color={page >= meta.last_page ? COLORS.textLight : COLORS.primary} />
                  </TouchableOpacity>
                </View>
              ) : undefined
            }
          />
        )}
      </View>
    </View>
  );
}

function ParcelCard({ parcel }: { parcel: Parcel }) {
  const statusColor = STATUS_COLORS[parcel.status as keyof typeof STATUS_COLORS] || COLORS.textSecondary;
  const statusLabel = STATUS_LABELS_MM[parcel.status as keyof typeof STATUS_LABELS_MM] || parcel.status;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/parcels/${parcel.id}`)}
      activeOpacity={0.85}
    >
      <View style={styles.cardHeader}>
        <View style={styles.trackingRow}>
          <View style={styles.trackingIcon}>
            <Ionicons name="barcode-outline" size={14} color={COLORS.primary} />
          </View>
          <Text style={styles.trackingNumber}>{parcel.tracking_number}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={13} color={COLORS.textSecondary} />
          <Text style={styles.infoText} numberOfLines={1}>{parcel.recipient_name}</Text>
        </View>
        {parcel.recipient_phone ? (
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={13} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>{parcel.recipient_phone}</Text>
          </View>
        ) : null}
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={13} color={COLORS.textSecondary} />
          <Text style={styles.infoText} numberOfLines={1}>{parcel.delivery_address}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.feeText}>
          {Number(parcel.delivery_fee).toLocaleString()} {parcel.currency === 'THB' ? 'THB' : 'MMK'}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  contentArea: { flex: 1, backgroundColor: COLORS.background, marginTop: -1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.white,
    fontFamily: FONTS.bold,
  },
  headerDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.80)',
    marginTop: 2,
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },

  // Summary card
  summaryCard: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  rowDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 10,
  },
  summaryItem: {
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
    fontFamily: FONTS.bold,
    marginTop: 2,
  },
  summaryLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
  },

  loader: { marginTop: 60 },
  list: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 24, gap: 10 },
  listEmpty: { flex: 1, justifyContent: 'center' },

  // Card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  trackingIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFF3DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackingNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: FONTS.bold,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '600', fontFamily: FONTS.semiBold },

  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 10 },

  cardBody: { gap: 5 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 13, color: COLORS.text, flex: 1, fontFamily: FONTS.regular },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  feeText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: FONTS.bold,
  },

  // Empty state
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF3DC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: FONTS.bold,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    paddingHorizontal: 32,
  },

  // Pagination
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  pageBtnDisabled: {
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  pageBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  pageInfoBox: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  pageInfo: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
  },
});
