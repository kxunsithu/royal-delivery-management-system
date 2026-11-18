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
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { deliveryService, Assignment, DeliverySummary } from '../../src/services/deliveryService';
import { COLORS, STATUS_COLORS, STATUS_LABELS_MM, FONTS } from '../../src/constants';

const STATUS_FILTERS = [
  { label: 'အားလုံး', value: '' },
  { label: 'ဆောင်ရွက်နေ', value: 'ACTIVE' },
  { label: 'ပြီးစီး', value: 'COMPLETED' },
  { label: 'မအောင်မြင်', value: 'FAILED' },
];

function formatPeriodLabel(period: string, groupBy: 'day' | 'month'): string {
  if (groupBy === 'month') {
    const [y, m] = period.split('-');
    const months = ['ဇန်နဝါရီ', 'ဖေဖော်ဝါရီ', 'မတ်', 'ဧပြီ', 'မေ', 'ဇွန်', 'ဇူလိုင်', 'သြဂုတ်', 'စက်တင်ဘာ', 'အောက်တိုဘာ', 'နိုဝင်ဘာ', 'ဒီဇင်ဘာ'];
    return `${months[Number(m) - 1]} ${y}`;
  }
  const d = new Date(period + 'T00:00:00');
  const months = ['ဇန်နဝါရီ', 'ဖေဖော်ဝါရီ', 'မတ်', 'ဧပြီ', 'မေ', 'ဇွန်', 'ဇူလိုင်', 'သြဂုတ်', 'စက်တင်ဘာ', 'အောက်တိုဘာ', 'နိုဝင်ဘာ', 'ဒီဇင်ဘာ'];
  const days = ['တနင်္ဂနွေ', 'တနင်္လာ', 'အင်္ဂါ', 'ဗုဒ္ဓဟူး', 'ကြာသပတေး', 'သောကြာ', 'စနေ'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}၊ ${days[d.getDay()]}`;
}

export default function DeliveriesScreen() {
  const insets = useSafeAreaInsets();
  const [groupBy, setGroupBy] = useState<'day' | 'month'>('day');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [view, setView] = useState<'summary' | 'list'>('summary');
  const [selected, setSelected] = useState<{ from: string; to: string; label: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const hasDateFilter = !!(dateFrom || dateTo);

  const { data: summaryData, isLoading: summaryLoading, isFetching: summaryFetching, refetch: refetchSummary } = useQuery({
    queryKey: ['delivery-summary', groupBy, dateFrom, dateTo],
    queryFn: () => deliveryService.summary({ group_by: groupBy, date_from: dateFrom || undefined, date_to: dateTo || undefined }),
    enabled: view === 'summary',
  });

  const summaries = summaryData ?? [];
  const todayStr = new Date().toISOString().slice(0, 10);
  const displaySummaries = groupBy === 'day'
    ? (summaries.some((s) => s.period === todayStr)
        ? summaries
        : [{ period: todayStr, date_from: todayStr, date_to: todayStr, total_count: 0, completed_count: 0, failed_count: 0, in_transit_count: 0 }, ...summaries])
    : summaries;

  const { data: listData, isLoading: listLoading, isFetching: listFetching, refetch: refetchList } = useQuery({
    queryKey: ['delivery-list', selected?.from, selected?.to, statusFilter, page],
    queryFn: () => deliveryService.allAssignments({
      status: statusFilter || undefined,
      date_from: selected?.from,
      date_to: selected?.to,
      page,
      per_page: 20,
    }),
    enabled: view === 'list' && !!selected,
  });

  const assignments = listData?.data ?? [];
  const meta = listData?.meta;

  const openPeriod = (s: DeliverySummary) => {
    setSelected({ from: s.date_from, to: s.date_to, label: formatPeriodLabel(s.period, groupBy) });
    setStatusFilter('');
    setPage(1);
    setView('list');
  };

  const backToSummary = () => {
    setView('summary');
    setSelected(null);
  };

  if (view === 'list' && selected) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            <TouchableOpacity style={styles.backBtn} onPress={backToSummary} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={22} color={COLORS.white} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle} numberOfLines={1}>{selected.label}</Text>
              <Text style={styles.headerSubtitle}>စုစုပေါင်း {meta?.total ?? 0} ခု</Text>
            </View>
          </View>
        </View>

        <View style={styles.contentArea}>
          <View style={styles.filterRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterList}>
              {STATUS_FILTERS.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={[styles.filterChip, statusFilter === item.value && styles.filterChipActive]}
                  onPress={() => { setStatusFilter(item.value); setPage(1); }}
                >
                  <Text style={[styles.filterChipText, statusFilter === item.value && styles.filterChipTextActive]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Fee / COD total bar */}
          {meta && ((meta.fee_mmk ?? 0) > 0 || (meta.cod_mmk ?? 0) > 0 || (meta.fee_thb ?? 0) > 0 || (meta.cod_thb ?? 0) > 0) && (() => {
            const feeStats: { value: number; label: string; color: string }[] = [];
            if ((meta.fee_mmk ?? 0) > 0) feeStats.push({ value: meta.fee_mmk!, label: 'ပို့ဆောင်ခ (K)', color: COLORS.success });
            if ((meta.cod_mmk ?? 0) > 0) feeStats.push({ value: meta.cod_mmk!, label: 'COD (K)', color: COLORS.warning });
            if ((meta.fee_thb ?? 0) > 0) feeStats.push({ value: meta.fee_thb!, label: 'ပို့ဆောင်ခ (฿)', color: COLORS.success });
            if ((meta.cod_thb ?? 0) > 0) feeStats.push({ value: meta.cod_thb!, label: 'COD (฿)', color: COLORS.warning });
            return (
              <View style={styles.feeSummaryBar}>
                {feeStats.map((stat, index) => (
                  <React.Fragment key={stat.label}>
                    {index > 0 && <View style={styles.feeSummaryDivider} />}
                    <View style={styles.feeSummaryItem}>
                      <Text style={[styles.feeSummaryValue, { color: stat.color }]}>
                        {stat.value.toLocaleString()}
                      </Text>
                      <Text style={styles.feeSummaryLabel}>{stat.label}</Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            );
          })()}

          <View style={styles.listArea}>
            {listLoading ? (
              <ActivityIndicator style={styles.loader} size="large" color={COLORS.primary} />
            ) : (
              <FlatList
                data={assignments}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={listFetching && !listLoading} onRefresh={() => { setPage(1); void refetchList(); }} tintColor={COLORS.primary} />}
                renderItem={({ item }) => <AssignmentCard assignment={item} />}
                ListEmptyComponent={
                  <View style={styles.empty}>
                    <Text style={styles.emptyTitle}>ပို့ဆောင်မှု မတွေ့ပါ</Text>
                    <Text style={styles.emptySub}>ရွေးချယ်ထားသော filter နှင့် မကိုက်ညီပါ</Text>
                  </View>
                }
                ListFooterComponent={
                  meta && meta.last_page > 1 ? (
                    <View style={styles.pagination}>
                      <TouchableOpacity style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]} onPress={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                        <Text style={[styles.pageBtnText, page <= 1 && { color: COLORS.textLight }]}>{'<'} နှုတ်</Text>
                      </TouchableOpacity>
                      <View style={styles.pageInfoBox}>
                        <Text style={styles.pageInfo}>{page} / {meta.last_page}</Text>
                      </View>
                      <TouchableOpacity style={[styles.pageBtn, page >= meta.last_page && styles.pageBtnDisabled]} onPress={() => setPage((p) => Math.min(meta.last_page, p + 1))} disabled={page >= meta.last_page}>
                        <Text style={[styles.pageBtnText, page >= meta.last_page && { color: COLORS.textLight }]}>နောက် {'>'}</Text>
                      </TouchableOpacity>
                    </View>
                  ) : undefined
                }
              />
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.navigate('/(tabs)/more')} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>ပို့ဆောင်မှုများ</Text>
            <Text style={styles.headerSubtitle}>စုစုပေါင်း {summaries.reduce((s, x) => s + x.total_count, 0)} ခု</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <TouchableOpacity style={[styles.toggleBtn, groupBy === 'day' && styles.toggleBtnActive]} onPress={() => setGroupBy('day')}>
            <Text style={[styles.toggleText, groupBy === 'day' && styles.toggleTextActive]}>နေ့</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleBtn, groupBy === 'month' && styles.toggleBtnActive]} onPress={() => setGroupBy('month')}>
            <Text style={[styles.toggleText, groupBy === 'month' && styles.toggleTextActive]}>လ</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.contentArea}>
        {/* Date filter could be added here; keep simple */}
        {summaryLoading ? (
          <ActivityIndicator style={styles.loader} size="large" color={COLORS.primary} />
        ) : (
          <FlatList
            data={displaySummaries}
            keyExtractor={(item) => item.period}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={summaryFetching && !summaryLoading} onRefresh={() => { void refetchSummary(); }} tintColor={COLORS.primary} />}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.summaryCard} onPress={() => openPeriod(item)} activeOpacity={0.85}>
                <View style={styles.cardTop}>
                  <Text style={styles.periodText}>{item.period === todayStr && groupBy === 'day' ? 'ဒီနေ့' : formatPeriodLabel(item.period, groupBy)}</Text>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
                </View>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{item.total_count}</Text>
                    <Text style={styles.statLabel}>စုစုပေါင်း</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: COLORS.success }]}>{item.completed_count}</Text>
                    <Text style={styles.statLabel}>ပို့ဆောင်ပြီး</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: COLORS.primary }]}>{item.in_transit_count}</Text>
                    <Text style={styles.statLabel}>ဆောင်ရွက်နေဆဲ</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: COLORS.error }]}>{item.failed_count}</Text>
                    <Text style={styles.statLabel}>မအောင်မြင်</Text>
                  </View>
                </View>
                {/* Fee / COD row - same style as daily-summary */}
                {(() => {
                  const feeStats: { value: number; label: string; color: string }[] = [];
                  if ((item.fee_mmk ?? 0) > 0) feeStats.push({ value: item.fee_mmk ?? 0, label: 'ပို့ဆောင်ခ (K)', color: COLORS.success });
                  if ((item.cod_mmk ?? 0) > 0) feeStats.push({ value: item.cod_mmk ?? 0, label: 'COD (K)', color: COLORS.warning });
                  if ((item.fee_thb ?? 0) > 0) feeStats.push({ value: item.fee_thb ?? 0, label: 'ပို့ဆောင်ခ (฿)', color: COLORS.success });
                  if ((item.cod_thb ?? 0) > 0) feeStats.push({ value: item.cod_thb ?? 0, label: 'COD (฿)', color: COLORS.warning });
                  if (feeStats.length === 0) return null;
                  return (
                    <>
                      <View style={styles.rowDivider} />
                      <View style={styles.statsRow}>
                        {feeStats.map((stat, index) => (
                          <React.Fragment key={stat.label}>
                            {index > 0 && <View style={styles.statDivider} />}
                            <View style={styles.statItem}>
                              <Text style={[styles.statValue, { color: stat.color, fontSize: 13 }]}>
                                {stat.value.toLocaleString()}
                              </Text>
                              <Text style={styles.statLabel}>{stat.label}</Text>
                            </View>
                          </React.Fragment>
                        ))}
                      </View>
                    </>
                  );
                })()}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>ပို့ဆောင်မှု မတွေ့ပါ</Text>
                <Text style={styles.emptySub}>မှတ်တမ်း မရှိသေးပါ</Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

function AssignmentCard({ assignment }: { assignment: Assignment }) {
  const parcel = assignment.parcel;
  const parcelStatus = parcel?.status ?? '';
  const statusColor = STATUS_COLORS[parcelStatus as keyof typeof STATUS_COLORS] || COLORS.textSecondary;
  const statusLabel = STATUS_LABELS_MM[parcelStatus as keyof typeof STATUS_LABELS_MM] || parcelStatus;
  const assignStatus = assignment.status ?? '';
  const isActive = !['COMPLETED', 'FAILED', 'REASSIGNED'].includes(assignStatus);

  const assignLabel =
    assignStatus === 'COMPLETED' ? 'ပြီးစီး'
    : assignStatus === 'FAILED' ? 'မအောင်မြင်'
    : assignStatus === 'REASSIGNED' ? 'ပြောင်းလဲ'
    : 'ဆောင်ရွက်ဆဲ';

  const assignColor = isActive ? COLORS.primary : COLORS.success;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/deliveries/${assignment.id}`)}
      activeOpacity={0.85}
    >
      <View style={styles.cardTop}>
        <Text style={styles.trackingNumber}>{parcel?.tracking_number}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      <Text style={styles.recipient} numberOfLines={1}>{parcel?.recipient_name}</Text>
      <Text style={styles.address} numberOfLines={2}>{parcel?.delivery_address}</Text>

      {assignment.staff && (
        <Text style={styles.metaLine}>ဝန်ထမ်း: {assignment.staff.name}</Text>
      )}

      <View style={styles.cardBottom}>
        <View style={[styles.assignBadge, { backgroundColor: isActive ? '#FFF3DC' : '#E8F8EF' }]}>
          <Text style={[styles.assignBadgeText, { color: assignColor }]}>{assignLabel}</Text>
        </View>
        {parcel && Number(parcel.delivery_fee) > 0 && (
          <View style={styles.feeBadge}>
            <Text style={styles.feeText}>
              {parcel.currency === 'THB'
                ? `ပို့ဆောင်ခ ${Number(parcel.delivery_fee).toLocaleString()} ฿`
                : `ပို့ဆောင်ခ ${Number(parcel.delivery_fee).toLocaleString()} K`}
            </Text>
          </View>
        )}
        {parcel?.is_cod && (
          <View style={styles.codBadge}>
            <Text style={styles.codText}>
              {parcel.currency === 'THB'
                ? `COD ${Number(parcel.cod_amount).toLocaleString()} ฿`
                : `COD ${Number(parcel.cod_amount).toLocaleString()} K`}
            </Text>
          </View>
        )}
      </View>

      {/* Parcel create & complete dates */}
      <View style={styles.parcelDetails}>
        <Text style={styles.detailText}>လက်ခံရက်စွဲ: {parcel?.received_at ? new Date(parcel.received_at).toLocaleString() : (parcel?.created_at ? new Date(parcel.created_at).toLocaleString() : '-')}</Text>
        {parcel?.status === 'DELIVERED' && (parcel?.delivered_at || parcel?.updated_at) ? (
          <Text style={styles.detailText}>ပို့ဆောင်ပြီးရက်စွဲ: {new Date((parcel?.delivered_at || parcel?.updated_at)!).toLocaleString()}</Text>
        ) : null}
        {parcel?.status === 'FAILED' && (parcel?.failed_at || parcel?.updated_at) ? (
          <Text style={styles.detailText}>မအောင်မြင်ရက်စွဲ: {new Date((parcel?.failed_at || parcel?.updated_at)!).toLocaleString()}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  contentArea: { flex: 1, backgroundColor: COLORS.background, marginTop: -1, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  header: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingBottom: 16 },
  backBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white, fontFamily: FONTS.bold },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2, fontFamily: FONTS.regular },
  content: { flex: 1 },
  filterRow: { height: 60 },
  filterList: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, alignItems: 'center' },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border, height: 38, justifyContent: 'center', alignSelf: 'center' },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600', fontFamily: FONTS.semiBold },
  filterChipTextActive: { color: COLORS.white },
  loader: { marginTop: 60 },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  listArea: { flex: 1 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 6, fontFamily: FONTS.bold },
  emptySub: { fontSize: 13, color: COLORS.textLight, textAlign: 'center', fontFamily: FONTS.regular },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  pageBtn: { padding: 8 },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.primary, fontFamily: FONTS.semiBold },
  pageInfoBox: { backgroundColor: COLORS.white, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  pageInfo: { fontSize: 13, color: COLORS.text, fontWeight: '600', fontFamily: FONTS.semiBold },

  // Summary cards
  summaryCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 10 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  periodText: { fontSize: 15, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.bold },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: COLORS.text, fontFamily: FONTS.bold },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2, fontFamily: FONTS.regular },
  statDivider: { width: 1, height: 32, backgroundColor: COLORS.border },
  rowDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 10 },

  // Fee summary bar in list view
  feeSummaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  feeSummaryItem: { flex: 1, alignItems: 'center' },
  feeSummaryValue: { fontSize: 15, fontWeight: '800', fontFamily: FONTS.bold },
  feeSummaryLabel: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2, fontFamily: FONTS.regular },
  feeSummaryDivider: { width: 1, height: 28, backgroundColor: COLORS.border },

  // Assignment card
  card: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  trackingNumber: { fontSize: 14, fontWeight: '700', color: COLORS.primary, fontFamily: FONTS.bold },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '600', fontFamily: FONTS.semiBold },
  recipient: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 2, fontFamily: FONTS.bold },
  address: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18, fontFamily: FONTS.regular },
  metaLine: { fontSize: 12, color: COLORS.textLight, marginTop: 6, fontFamily: FONTS.regular },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border },
  assignBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  assignBadgeText: { fontSize: 12, fontWeight: '600', fontFamily: FONTS.semiBold },
  codBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, backgroundColor: '#E8F4FB' },
  codText: { fontSize: 11, fontWeight: '700', color: COLORS.info, fontFamily: FONTS.bold },
  feeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, backgroundColor: '#E8F8EF' },
  feeText: { fontSize: 11, fontWeight: '700', color: COLORS.success, fontFamily: FONTS.bold },
  parcelDetails: { marginTop: 8, gap: 2 },
  detailText: { fontSize: 12, color: COLORS.textSecondary, fontFamily: FONTS.regular },

  toggleBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.18)' },
  toggleBtnActive: { backgroundColor: COLORS.white },
  toggleText: { fontSize: 12, fontWeight: '700', color: COLORS.white, fontFamily: FONTS.semiBold },
  toggleTextActive: { color: COLORS.primary },
});