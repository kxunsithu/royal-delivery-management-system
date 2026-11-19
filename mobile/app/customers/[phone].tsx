import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { parcelService, Parcel } from '../../src/services/parcelService';
import { COLORS, STATUS_COLORS, STATUS_LABELS_MM, PRIORITY_COLORS, PRIORITY_LABELS_MM, FONTS } from '../../src/constants';
import { useAuth } from '../../src/context/AuthContext';

const STATUS_FILTERS = [
  { label: 'အားလုံး', value: '' },
  { label: 'လက်ခံ', value: 'RECEIVED' },
  { label: 'စစ်ဆေးပြီး', value: 'VERIFIED' },
  { label: 'ဆောင်ရွက်နေဆဲ', value: 'IN_TRANSIT' },
  { label: 'ပို့ဆောင်ပြီး', value: 'DELIVERED' },
  { label: 'မအောင်မြင်', value: 'FAILED' },
  { label: 'ပျက်ဆီး', value: 'DAMAGED' },
];

export default function CustomerDetailScreen() {
  const insets = useSafeAreaInsets();
  const { phone, type, name, rc, vc, ic, dc, fc, dam } = useLocalSearchParams<{
    phone: string; type: string; name: string;
    rc?: string; vc?: string; ic?: string; dc?: string; fc?: string; dam?: string;
  }>();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const receivedCount = Number(rc ?? 0);
  const verifiedCount = Number(vc ?? 0);
  const inTransitCount = Number(ic ?? 0);
  const deliveredCount = Number(dc ?? 0);
  const failedCount = Number(fc ?? 0);
  const damagedCount = Number(dam ?? 0);

  const decodedName = name ? decodeURIComponent(name as string) : (phone as string);
  const isRecipient = type !== 'sender';

  // Only admin and manager can create parcels
  const canCreateParcel = user?.role === 'admin' || user?.role === 'manager';

  // Build the create URL with pre-filled fields based on customer type
  const handleAddParcel = () => {
    const params = new URLSearchParams();
    if (isRecipient) {
      params.set('recipient_name', encodeURIComponent(decodedName));
      params.set('recipient_phone', encodeURIComponent(phone as string));
    } else {
      params.set('sender_name', encodeURIComponent(decodedName));
      params.set('sender_phone', encodeURIComponent(phone as string));
    }
    router.push(`/parcels/create?${params.toString()}`);
  };

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['customer-parcels', phone, statusFilter, page],
    queryFn: () =>
      parcelService.list({ search: phone as string, status: statusFilter || undefined, page, per_page: 20 }),
    enabled: !!phone,
  });

  const parcels = data?.data ?? [];
  const meta = data?.meta;

  // Calculate totals
  const totalMMK = parcels
    .filter(p => p.currency === 'MMK')
    .reduce((s, p) => s + Number(p.delivery_fee), 0);
  const totalTHB = parcels
    .filter(p => p.currency === 'THB')
    .reduce((s, p) => s + Number(p.delivery_fee), 0);
  const codMMK = parcels
    .filter(p => p.currency === 'MMK' && p.is_cod)
    .reduce((s, p) => s + Number(p.cod_amount), 0);
  const codTHB = parcels
    .filter(p => p.currency === 'THB' && p.is_cod)
    .reduce((s, p) => s + Number(p.cod_amount), 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>{decodedName}</Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {phone}  ·  {isRecipient ? 'လက်ခံသူ' : 'ပို့သူ'}
          </Text>
        </View>
        {canCreateParcel && (
          <TouchableOpacity style={styles.addBtn} onPress={handleAddParcel} activeOpacity={0.8}>
            <Text style={styles.addBtnText}>ထည့်မည်</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* White content area */}
      <View style={styles.contentArea}>
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{meta?.total ?? parcels.length}</Text>
            <Text style={styles.statLabel}>ပါဆယ်</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalMMK.toLocaleString()}</Text>
            <Text style={styles.statLabel}>MMK</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalTHB.toLocaleString()}</Text>
            <Text style={styles.statLabel}>THB</Text>
          </View>
        </View>

        {(codMMK > 0 || codTHB > 0) && (
          <View style={styles.statsRow}>
            {codMMK > 0 && (
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: COLORS.warning }]}>{codMMK.toLocaleString()}</Text>
                <Text style={styles.statLabel}>COD (K)</Text>
              </View>
            )}
            {codMMK > 0 && codTHB > 0 && <View style={styles.statDivider} />}
            {codTHB > 0 && (
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: COLORS.warning }]}>{codTHB.toLocaleString()}</Text>
                <Text style={styles.statLabel}>COD (฿)</Text>
              </View>
            )}
          </View>
        )}

        {/* Status counts */}
        <View style={styles.statusCountRow}>
          <Text style={styles.statusCountBadge}>လက်ခံ {receivedCount}</Text>
          <Text style={styles.statusCountBadge}>စစ်ဆေး {verifiedCount}</Text>
          <Text style={styles.statusCountBadge}>ဆောင်ရွက် {inTransitCount}</Text>
          <Text style={styles.statusCountBadge}>ပို့ပြီး {deliveredCount}</Text>
          <Text style={styles.statusCountBadge}>မအောင် {failedCount}</Text>
          <Text style={styles.statusCountBadge}>ပျက် {damagedCount}</Text>
        </View>

        {/* Status Filter */}
        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterList}>
            {STATUS_FILTERS.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[styles.filterChip, statusFilter === item.value && styles.filterChipActive]}
                onPress={() => { setStatusFilter(item.value); setPage(1); }}
              >
                <Text style={[styles.filterChipText, statusFilter === item.value && styles.filterChipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Parcel List */}
        {isLoading ? (
          <ActivityIndicator style={styles.loader} size="large" color={COLORS.primary} />
        ) : (
          <FlatList
            data={parcels}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isFetching && !isLoading}
                onRefresh={() => { setPage(1); refetch(); }}
                tintColor={COLORS.primary}
              />
            }
            renderItem={({ item }) => <ParcelRow parcel={item} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="cube-outline" size={36} color={COLORS.primary} />
                </View>
                <Text style={styles.emptyText}>ပါဆယ် မတွေ့ပါ</Text>
              </View>
            }
            ListFooterComponent={
              meta && meta.last_page > 1 ? (
                <View style={styles.pagination}>
                  <TouchableOpacity
                    style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
                    onPress={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pageBtnText, page <= 1 && { color: COLORS.textLight }]}>နှုတ်</Text>
                  </TouchableOpacity>
                  <View style={styles.pageInfoBox}>
                    <Text style={styles.pageInfo}>{page} / {meta.last_page}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.pageBtn, page >= meta.last_page && styles.pageBtnDisabled]}
                    onPress={() => setPage(p => Math.min(meta.last_page, p + 1))}
                    disabled={page >= meta.last_page}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pageBtnText, page >= meta.last_page && { color: COLORS.textLight }]}>နောက်</Text>
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

function ParcelRow({ parcel }: { parcel: Parcel }) {
  const statusColor = STATUS_COLORS[parcel.status as keyof typeof STATUS_COLORS] || COLORS.textSecondary;
  const statusLabel = STATUS_LABELS_MM[parcel.status as keyof typeof STATUS_LABELS_MM] || parcel.status;
  const priorityColor = PRIORITY_COLORS[parcel.priority as keyof typeof PRIORITY_COLORS] || COLORS.textSecondary;
  const priorityLabel = PRIORITY_LABELS_MM[parcel.priority as keyof typeof PRIORITY_LABELS_MM] || parcel.priority;

  return (
    <TouchableOpacity
      style={styles.parcelCard}
      onPress={() => router.push(`/parcels/${parcel.id}`)}
      activeOpacity={0.85}
    >
      {/* Top row */}
      <View style={styles.cardTop}>
        <Text style={styles.trackingNumber}>{parcel.tracking_number}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Info */}
      <View style={styles.infoGroup}>
        <Text style={styles.infoText} numberOfLines={1}>{parcel.recipient_name}</Text>
        <Text style={styles.infoText}>{parcel.recipient_phone}</Text>
        <Text style={styles.infoText} numberOfLines={1}>{parcel.delivery_address}</Text>
      </View>

      {/* Parcel create & complete dates */}
      <View style={styles.parcelDetails}>
        <Text style={styles.detailText}>လက်ခံရက်စွဲ: {new Date(parcel.received_at || parcel.created_at).toLocaleString()}</Text>
        {parcel.status === 'DELIVERED' && (parcel.delivered_at || parcel.updated_at) ? (
          <Text style={styles.detailText}>ပို့ဆောင်ပြီးရက်စွဲ: {new Date((parcel.delivered_at || parcel.updated_at)!).toLocaleString()}</Text>
        ) : null}
        {parcel.status === 'FAILED' && (parcel.failed_at || parcel.updated_at) ? (
          <Text style={styles.detailText}>မအောင်မြင်ရက်စွဲ: {new Date((parcel.failed_at || parcel.updated_at)!).toLocaleString()}</Text>
        ) : null}
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.footerLeft}>
          <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '18' }]}>
            <Text style={[styles.priorityText, { color: priorityColor }]}>{priorityLabel}</Text>
          </View>
          {parcel.is_cod && (
            <View style={styles.codBadge}>
              <Text style={styles.codText}>COD {Number(parcel.cod_amount).toLocaleString()} {parcel.currency === 'THB' ? 'THB' : 'MMK'}</Text>
            </View>
          )}
        </View>
        <Text style={styles.feeText}>
          {Number(parcel.delivery_fee).toLocaleString()} {parcel.currency}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 24,
    backgroundColor: COLORS.primary,
  },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1 },
  headerName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
    fontFamily: FONTS.bold,
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
    fontFamily: FONTS.regular,
  },
  addBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
    fontFamily: FONTS.bold,
  },

  // White content area
  contentArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  statusCountRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  statusCountBadge: {
    fontSize: 11, color: COLORS.textSecondary, fontFamily: FONTS.semiBold,
    backgroundColor: COLORS.white, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  filterRow: { height: 48 },
  filterList: { paddingHorizontal: 16, paddingVertical: 6, gap: 8, alignItems: 'center' },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    height: 30,
    justifyContent: 'center',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  filterChipActive: { backgroundColor: COLORS.primary },
  filterChipText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600', fontFamily: FONTS.semiBold },
  filterChipTextActive: { color: COLORS.white },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: COLORS.border },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: FONTS.bold,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
  },

  loader: { marginTop: 60 },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 10, paddingTop: 4 },

  // Parcel card
  parcelCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trackingNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: FONTS.bold,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: { fontSize: 12, fontWeight: '600', fontFamily: FONTS.semiBold },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 10 },
  infoGroup: { gap: 4 },
  infoText: { fontSize: 13, color: COLORS.text, fontFamily: FONTS.regular },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerLeft: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  priorityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  priorityText: { fontSize: 11, fontWeight: '700', fontFamily: FONTS.bold },
  codBadge: {
    backgroundColor: '#E8F4FB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  codText: { fontSize: 11, fontWeight: '700', color: COLORS.info, fontFamily: FONTS.bold },
  parcelDetails: { marginTop: 8, gap: 2 },
  detailText: { fontSize: 12, color: COLORS.textSecondary, fontFamily: FONTS.regular },
  feeText: { fontSize: 14, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.bold },

  // Empty
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: { fontSize: 15, color: COLORS.textSecondary, fontFamily: FONTS.regular },

  // Pagination
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  pageInfoBox: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
  },
  pageInfo: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
    fontFamily: FONTS.bold,
  },
});