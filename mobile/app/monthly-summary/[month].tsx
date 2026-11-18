import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { parcelService, Parcel } from '../../src/services/parcelService';
import { COLORS, FONTS, STATUS_COLORS, STATUS_LABELS_MM } from '../../src/constants';

const MONTHS_MM = [
  'ဇန်နဝါရီ', 'ဖေဖော်ဝါရီ', 'မတ်', 'ဧပြီ', 'မေ', 'ဇွန်',
  'ဇူလိုင်', 'သြဂုတ်', 'စက်တင်ဘာ', 'အောက်တိုဘာ', 'နိုဝင်ဘာ', 'ဒီဇင်ဘာ',
];

function parseMonth(monthStr: string): { firstDay: string; lastDay: string; label: string } {
  const [y, m] = monthStr.split('-');
  const year = Number(y);
  const month = Number(m) - 1;
  const firstDay = `${y}-${m}-01`;
  const lastDayDate = new Date(year, month + 1, 0);
  const lastDay = `${y}-${m}-${String(lastDayDate.getDate()).padStart(2, '0')}`;
  const label = `${MONTHS_MM[month]} ${year}`;
  return { firstDay, lastDay, label };
}

const STATUS_FILTERS = [
  { label: 'အားလုံး', value: '' },
  { label: 'လက်ခံ', value: 'RECEIVED' },
  { label: 'စစ်ဆေးပြီး', value: 'VERIFIED' },
  { label: 'ဆောင်ရွက်နေဆဲ', value: 'IN_TRANSIT' },
  { label: 'ပို့ဆောင်ပြီး', value: 'DELIVERED' },
  { label: 'မအောင်မြင်', value: 'FAILED' },
  { label: 'ပျက်ဆီး', value: 'DAMAGED' },
];

export default function MonthlySummaryDetailScreen() {
  const insets = useSafeAreaInsets();
  const { month } = useLocalSearchParams<{ month: string }>();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { firstDay, lastDay, label } = parseMonth(month ?? '');

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['parcels-monthly-detail', month, statusFilter, page],
    queryFn: () =>
      parcelService.list({
        date_from: firstDay,
        date_to: lastDay,
        status: statusFilter || undefined,
        page,
        per_page: 50,
      }),
    enabled: !!month,
  });

  const parcels = data?.data ?? [];
  const meta = data?.meta;

  const feeMmk = parcels.filter(p => p.currency === 'MMK').reduce((s, p) => s + Number(p.delivery_fee), 0);
  const feeThb = parcels.filter(p => p.currency === 'THB').reduce((s, p) => s + Number(p.delivery_fee), 0);
  const codMmk = parcels.filter(p => p.currency === 'MMK' && p.is_cod).reduce((s, p) => s + Number(p.cod_amount), 0);
  const codThb = parcels.filter(p => p.currency === 'THB' && p.is_cod).reduce((s, p) => s + Number(p.cod_amount), 0);
  const uniqueSenders = new Set(parcels.map(p => p.sender_phone).filter(Boolean)).size;
  const uniqueRecipients = new Set(parcels.map(p => p.recipient_phone)).size;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>လစဉ် မှတ်တမ်း</Text>
          {label ? <Text style={styles.headerDate}>{label}</Text> : null}
        </View>
      </View>

      {!isLoading && parcels.length > 0 && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{meta?.total ?? parcels.length}</Text>
              <Text style={styles.summaryLabel}>ပါဆယ် ခု</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{uniqueSenders}</Text>
              <Text style={styles.summaryLabel}>ပို့သူ ဦး</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: COLORS.info }]}>{uniqueRecipients}</Text>
              <Text style={styles.summaryLabel}>လက်ခံသူ ဦး</Text>
            </View>
          </View>

          {(feeMmk > 0 || codMmk > 0 || feeThb > 0 || codThb > 0) && (
            <>
              <View style={styles.rowDivider} />
              <View style={styles.summaryRow}>
                {feeMmk > 0 && (
                  <>
                    <View style={styles.summaryItem}>
                      <Text style={[styles.summaryValue, { color: COLORS.success }]}>{feeMmk.toLocaleString()}</Text>
                      <Text style={styles.summaryLabel}>ပို့ဆောင်ခ (K)</Text>
                    </View>
                    {(codMmk > 0 || feeThb > 0 || codThb > 0) && <View style={styles.summaryDivider} />}
                  </>
                )}
                {codMmk > 0 && (
                  <>
                    <View style={styles.summaryItem}>
                      <Text style={[styles.summaryValue, { color: COLORS.warning }]}>{codMmk.toLocaleString()}</Text>
                      <Text style={styles.summaryLabel}>COD (K)</Text>
                    </View>
                    {(feeThb > 0 || codThb > 0) && <View style={styles.summaryDivider} />}
                  </>
                )}
                {feeThb > 0 && (
                  <>
                    <View style={styles.summaryItem}>
                      <Text style={[styles.summaryValue, { color: COLORS.success }]}>{feeThb.toLocaleString()}</Text>
                      <Text style={styles.summaryLabel}>ပို့ဆောင်ခ (฿)</Text>
                    </View>
                    {codThb > 0 && <View style={styles.summaryDivider} />}
                  </>
                )}
                {codThb > 0 && (
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryValue, { color: COLORS.warning }]}>{codThb.toLocaleString()}</Text>
                    <Text style={styles.summaryLabel}>COD (฿)</Text>
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      )}

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
              <Text style={styles.emptyTitle}>ပါဆယ် မတွေ့ပါ</Text>
              <Text style={styles.emptySub}>ဤလအတွင်း ပါဆယ် မှတ်တမ်း မရှိပါ</Text>
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
        <Text style={styles.trackingNumber}>{parcel.tracking_number}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.infoGroup}>
        <Text style={styles.infoText} numberOfLines={1}>{parcel.recipient_name}</Text>
        {parcel.recipient_phone ? <Text style={styles.infoText}>{parcel.recipient_phone}</Text> : null}
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

      <View style={styles.cardFooter}>
        <Text style={styles.feeText}>
          {Number(parcel.delivery_fee).toLocaleString()} {parcel.currency === 'THB' ? 'THB' : 'MMK'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  filterRow: { height: 52, backgroundColor: COLORS.background },
  filterList: { paddingHorizontal: 16, paddingVertical: 8, gap: 8, alignItems: 'center' },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border,
    height: 32, justifyContent: 'center', alignSelf: 'center',
  },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600', fontFamily: FONTS.semiBold },
  filterChipTextActive: { color: COLORS.white },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 14,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 4 },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.bold },
  headerDate: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2, fontFamily: FONTS.regular },
  summaryCard: {
    backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: 16, marginBottom: 4,
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 14,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  rowDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 10 },
  summaryItem: { alignItems: 'center', gap: 2, flex: 1 },
  summaryDivider: { width: 1, height: 36, backgroundColor: COLORS.border },
  summaryValue: { fontSize: 15, fontWeight: '800', color: COLORS.primary, fontFamily: FONTS.bold, marginTop: 2 },
  summaryLabel: { fontSize: 10, color: COLORS.textSecondary, fontFamily: FONTS.regular },
  loader: { marginTop: 60 },
  list: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24, gap: 10 },
  listEmpty: { flex: 1, justifyContent: 'center' },
  card: { backgroundColor: COLORS.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  trackingNumber: { fontSize: 14, fontWeight: '700', color: COLORS.primary, fontFamily: FONTS.bold, flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '600', fontFamily: FONTS.semiBold },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 10 },
  infoGroup: { gap: 4 },
  infoText: { fontSize: 13, color: COLORS.text, fontFamily: FONTS.regular },
  cardFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  parcelDetails: { marginTop: 8, gap: 2 },
  detailText: { fontSize: 12, color: COLORS.textSecondary, fontFamily: FONTS.regular },
  feeText: { fontSize: 14, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.bold },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.bold, marginBottom: 6 },
  emptySub: { fontSize: 13, color: COLORS.textSecondary, fontFamily: FONTS.regular, textAlign: 'center', paddingHorizontal: 32 },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 16 },
  pageBtn: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: COLORS.white, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.border },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.primary, fontFamily: FONTS.semiBold },
  pageInfoBox: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: COLORS.primary, borderRadius: 10 },
  pageInfo: { fontSize: 13, fontWeight: '700', color: COLORS.white, fontFamily: FONTS.bold },
});