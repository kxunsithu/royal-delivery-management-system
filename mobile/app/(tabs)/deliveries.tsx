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
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';

const STATUS_FILTERS = [
  { label: 'အားလုံး', value: '' },
  { label: 'ပြီးစီး', value: 'COMPLETED' },
  { label: 'မအောင်မြင်', value: 'FAILED' },
];

function toMMDate(iso: string): string {
  const d = new Date(new Date(iso).getTime() + (6 * 60 + 30) * 60000);
  return d.toISOString().slice(0, 10);
}

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
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const isStaff = user?.role === 'delivery_staff';
  const staffId = isStaff ? user?.id : undefined;

  const [groupBy, setGroupBy] = useState<'day' | 'month'>('day');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [view, setView] = useState<'summary' | 'list'>('summary');
  const [selected, setSelected] = useState<{ from: string; to: string; label: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const hasDateFilter = !!(dateFrom || dateTo);

  const { data: summaryData, isLoading: summaryLoading, isFetching: summaryFetching, refetch: refetchSummary } = useQuery({
    queryKey: ['delivery-summary', groupBy, dateFrom, dateTo, staffId],
    queryFn: () => deliveryService.summary({ group_by: groupBy, date_from: dateFrom || undefined, date_to: dateTo || undefined, staff_id: staffId }),
    enabled: view === 'summary',
  });

  const summaries = summaryData ?? [];
  const todayStr = toMMDate(new Date().toISOString());
  const displaySummaries = groupBy === 'day'
    ? (summaries.some((s) => s.period === todayStr)
        ? summaries
        : [{ period: todayStr, date_from: todayStr, date_to: todayStr, total_count: 0, completed_count: 0, failed_count: 0, in_transit_count: 0 }, ...summaries])
    : summaries;

  const { data: listData, isLoading: listLoading, isFetching: listFetching, refetch: refetchList } = useQuery({
    queryKey: ['delivery-list', selected?.from, selected?.to, statusFilter, page, staffId],
    queryFn: () => deliveryService.allAssignments({
      staff_id: staffId,
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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
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
                    <View style={styles.emptyIconWrap}>
                      <Ionicons name="car-outline" size={36} color={COLORS.textLight} />
                    </View>
                    <Text style={styles.emptyTitle}>ပို့ဆောင်မှု မတွေ့ပါ</Text>
                    <Text style={styles.emptySub}>ရွေးချယ်ထားသော filter နှင့် မကိုက်ညီပါ</Text>
                  </View>
                }
                ListFooterComponent={
                  meta && meta.last_page > 1 ? (
                    <View style={styles.pagination}>
                      <TouchableOpacity style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]} onPress={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                        <Ionicons name="chevron-back" size={16} color={page <= 1 ? COLORS.textLight : COLORS.primary} />
                        <Text style={[styles.pageBtnText, page <= 1 && { color: COLORS.textLight }]}>နှုတ်</Text>
                      </TouchableOpacity>
                      <View style={styles.pageInfoBox}>
                        <Text style={styles.pageInfo}>{page} / {meta.last_page}</Text>
                      </View>
                      <TouchableOpacity style={[styles.pageBtn, page >= meta.last_page && styles.pageBtnDisabled]} onPress={() => setPage((p) => Math.min(meta.last_page, p + 1))} disabled={page >= meta.last_page}>
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
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
          {!isStaff && (
            <TouchableOpacity style={styles.backBtn} onPress={() => router.navigate('/(tabs)/more')} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={22} color={COLORS.white} />
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>ပို့ဆောင်မှုများ</Text>
            <Text style={styles.headerSubtitle}>စုစုပေါင်း {summaries.reduce((s, x) => s + x.total_count, 0)} ခု</Text>
          </View>
        </View>
        <View style={styles.togglePill}>
          <TouchableOpacity style={[styles.togglePillBtn, groupBy === 'day' && styles.togglePillBtnActive]} onPress={() => setGroupBy('day')} activeOpacity={0.8}>
            <Text style={[styles.togglePillText, groupBy === 'day' && styles.togglePillTextActive]}>နေ့စဉ်</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.togglePillBtn, groupBy === 'month' && styles.togglePillBtnActive]} onPress={() => setGroupBy('month')} activeOpacity={0.8}>
            <Text style={[styles.togglePillText, groupBy === 'month' && styles.togglePillTextActive]}>လစဉ်</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.contentArea}>
        {summaryLoading ? (
          <ActivityIndicator style={styles.loader} size="large" color={COLORS.primary} />
        ) : (
          <FlatList
            data={displaySummaries}
            keyExtractor={(item) => item.period}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={summaryFetching && !summaryLoading} onRefresh={() => { void refetchSummary(); }} tintColor={COLORS.primary} />}
            renderItem={({ item: rawItem }) => {
              const item = rawItem as any;
              const isToday = item.period === todayStr && groupBy === 'day';
              const allDone = item.total_count > 0 && item.completed_count === item.total_count;
              const feeStats: { value: number; label: string; color: string }[] = [];
              if ((item.fee_mmk ?? 0) > 0) feeStats.push({ value: item.fee_mmk ?? 0, label: 'ပို့ဆောင်ခ (K)', color: COLORS.success });
              if ((item.cod_mmk ?? 0) > 0) feeStats.push({ value: item.cod_mmk ?? 0, label: 'COD (K)', color: COLORS.warning });
              if ((item.fee_thb ?? 0) > 0) feeStats.push({ value: item.fee_thb ?? 0, label: 'ပို့ဆောင်ခ (฿)', color: COLORS.success });
              if ((item.cod_thb ?? 0) > 0) feeStats.push({ value: item.cod_thb ?? 0, label: 'COD (฿)', color: COLORS.warning });

              const completionPct = item.total_count > 0 ? Math.round((item.completed_count / item.total_count) * 100) : 0;

              return (
                <TouchableOpacity
                  style={[styles.summaryCard, allDone && styles.summaryCardDone]}
                  onPress={() => openPeriod(item)}
                  activeOpacity={0.85}
                >
                  {/* Card header */}
                  <View style={styles.cardHeader}>
                    <View style={[styles.dateIconWrap, isToday && { backgroundColor: COLORS.primary }]}>
                      <Ionicons name="calendar" size={15} color={isToday ? COLORS.white : COLORS.primary} />
                    </View>
                    <Text style={styles.periodText} numberOfLines={1}>
                      {isToday ? 'ဒီနေ့' : formatPeriodLabel(item.period, groupBy)}
                    </Text>
                    {isToday && <View style={styles.todayBadge}><Text style={styles.todayBadgeText}>Today</Text></View>}
                    <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
                  </View>

                  <View style={styles.cardDivider} />

                  {/* Delivery counts */}
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
                      <Text style={[styles.statValue, { color: COLORS.error }]}>{item.failed_count}</Text>
                      <Text style={styles.statLabel}>မအောင်မြင်</Text>
                    </View>
                  </View>

                  {/* Progress bar */}
                  {item.total_count > 0 && (
                    <View style={styles.progressSection}>
                      <View style={styles.progressTrack}>
                        <View style={[styles.progressBar, { width: `${completionPct}%` as any, backgroundColor: allDone ? COLORS.success : COLORS.primary }]} />
                      </View>
                      <Text style={styles.progressLabel}>{completionPct}%</Text>
                    </View>
                  )}

                  {/* Fee / COD row */}
                  {feeStats.length > 0 && (
                    <>
                      <View style={styles.rowDivider} />
                      <View style={styles.statsRow}>
                        {feeStats.map((stat, index) => (
                          <React.Fragment key={stat.label}>
                            {index > 0 && <View style={styles.statDivider} />}
                            <View style={styles.statItem}>
                              <Text style={[styles.statValue, { color: stat.color, fontSize: 14 }]}>
                                {stat.value.toLocaleString()}
                              </Text>
                              <Text style={styles.statLabel}>{stat.label}</Text>
                            </View>
                          </React.Fragment>
                        ))}
                      </View>
                    </>
                  )}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="car-outline" size={36} color={COLORS.textLight} />
                </View>
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
      <View style={styles.cardContent}>
        <View style={styles.cardTop}>
          <Text style={styles.trackingNumber}>{parcel?.tracking_number}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        <Text style={styles.recipient} numberOfLines={1}>{parcel?.recipient_name}</Text>
        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={12} color={COLORS.textLight} />
          <Text style={styles.address} numberOfLines={1}>{parcel?.delivery_address}</Text>
        </View>

        {assignment.staff && (
          <View style={styles.staffRow}>
            <Ionicons name="person-outline" size={11} color={COLORS.textLight} />
            <Text style={styles.metaLine}>{assignment.staff.name}</Text>
          </View>
        )}

        <View style={styles.cardBottom}>
          <View style={[styles.assignBadge, { backgroundColor: isActive ? '#FFF3DC' : '#E8F8EF' }]}>
            <Text style={[styles.assignBadgeText, { color: assignColor }]}>{assignLabel}</Text>
          </View>
          {parcel && Number(parcel.delivery_fee) > 0 && (
            <View style={styles.feeBadge}>
              <Text style={styles.feeText}>
                {parcel.currency === 'THB'
                  ? `${Number(parcel.delivery_fee).toLocaleString()} ฿`
                  : `${Number(parcel.delivery_fee).toLocaleString()} K`}
              </Text>
            </View>
          )}
          {parcel?.is_cod && (
            <View style={styles.codBadge}>
              <Text style={styles.codText}>
                COD {parcel.currency === 'THB'
                  ? `${Number(parcel.cod_amount).toLocaleString()} ฿`
                  : `${Number(parcel.cod_amount).toLocaleString()} K`}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.parcelDetails}>
          <Text style={styles.detailText}>လက်ခံရက်: {parcel?.received_at ? new Date(parcel.received_at).toLocaleString() : (parcel?.created_at ? new Date(parcel.created_at).toLocaleString() : '-')}</Text>
          {parcel?.status === 'DELIVERED' && (parcel?.delivered_at || parcel?.updated_at) ? (
            <Text style={styles.detailText}>ပို့ဆောင်ပြီးရက်: {new Date((parcel?.delivered_at || parcel?.updated_at)!).toLocaleString()}</Text>
          ) : null}
          {parcel?.status === 'FAILED' && (parcel?.failed_at || parcel?.updated_at) ? (
            <Text style={styles.detailText}>မအောင်မြင်ရက်: {new Date((parcel?.failed_at || parcel?.updated_at)!).toLocaleString()}</Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  contentArea: { flex: 1, backgroundColor: COLORS.background, },
  header: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingBottom: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', },
  backBtn: { width: 38, height: 38, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.white, fontFamily: FONTS.bold },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2, fontFamily: FONTS.regular },
  filterRow: { height: 58 },
  filterList: { minHeight: 44, paddingHorizontal: 16, paddingVertical: 10, gap: 8, alignItems: 'center' },
  filterChip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 6, backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border, height: 36, justifyContent: 'center' },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600', fontFamily: FONTS.semiBold },
  filterChipTextActive: { color: COLORS.white },
  loader: { marginTop: 60 },
  list: { minHeight: 180, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32, gap: 10 },
  listArea: { flex: 1 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 6,
    backgroundColor: COLORS.border, alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 6, fontFamily: FONTS.bold },
  emptySub: { fontSize: 13, color: COLORS.textLight, textAlign: 'center', fontFamily: FONTS.regular },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  pageBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 8 },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.primary, fontFamily: FONTS.semiBold },
  pageInfoBox: { backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: COLORS.border },
  pageInfo: { fontSize: 13, color: COLORS.text, fontWeight: '600', fontFamily: FONTS.semiBold },

  // Summary cards
  summaryCard: { minHeight: 80, minWidth: 120,
    backgroundColor: COLORS.white, borderRadius: 6, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  summaryCardDone: { backgroundColor: '#F0FDF4' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dateIconWrap: {
    width: 30, height: 30, borderRadius: 6,
    backgroundColor: COLORS.primaryBg, alignItems: 'center', justifyContent: 'center',
  },
  todayBadge: { backgroundColor: COLORS.primary + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  todayBadgeText: { fontSize: 10, color: COLORS.primary, fontWeight: '700', fontFamily: FONTS.bold },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 10 },
  periodText: { fontSize: 14, fontWeight: '700', color: COLORS.text, flex: 1, fontFamily: FONTS.bold },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 18, fontWeight: '800', color: COLORS.text, fontFamily: FONTS.bold, marginTop: 2 },
  statLabel: { fontSize: 10, color: COLORS.textSecondary, fontFamily: FONTS.regular },
  statDivider: { width: 1, height: 36, backgroundColor: COLORS.border },
  rowDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 10 },
  progressSection: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  progressTrack: { flex: 1, height: 5, borderRadius: 3, backgroundColor: COLORS.border, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 3 },
  progressLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, fontFamily: FONTS.semiBold, width: 30, textAlign: 'right' },

  // Fee summary bar
  feeSummaryBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    marginHorizontal: 16, marginBottom: 10, borderRadius: 6, paddingVertical: 10, paddingHorizontal: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  feeSummaryItem: { flex: 1, alignItems: 'center' },
  feeSummaryValue: { fontSize: 15, fontWeight: '800', fontFamily: FONTS.bold },
  feeSummaryLabel: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2, fontFamily: FONTS.regular },
  feeSummaryDivider: { width: 1, height: 28, backgroundColor: COLORS.border },

  // Assignment card
  card: { minHeight: 80, minWidth: 120,
    backgroundColor: COLORS.white, borderRadius: 6, flexDirection: 'row', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  cardContent: { flex: 1, padding: 14 },
  trackingNumber: { fontSize: 13, fontWeight: '700', color: COLORS.primary, fontFamily: FONTS.bold },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '600', fontFamily: FONTS.semiBold },
  recipient: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 4, fontFamily: FONTS.bold },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  address: { flex: 1, fontSize: 12, color: COLORS.textSecondary, fontFamily: FONTS.regular },
  staffRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  metaLine: { fontSize: 12, color: COLORS.textLight, fontFamily: FONTS.regular },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border, flexWrap: 'wrap' },
  assignBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  assignBadgeText: { fontSize: 11, fontWeight: '600', fontFamily: FONTS.semiBold },
  codBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#E8F4FB' },
  codText: { fontSize: 11, fontWeight: '700', color: COLORS.info, fontFamily: FONTS.bold },
  feeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#E8F8EF' },
  feeText: { fontSize: 11, fontWeight: '700', color: COLORS.success, fontFamily: FONTS.bold },
  parcelDetails: { marginTop: 8, gap: 2 },
  detailText: { fontSize: 11, color: COLORS.textSecondary, fontFamily: FONTS.regular },

  togglePill: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 6, padding: 3, gap: 2 },
  togglePillBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  togglePillBtnActive: { backgroundColor: COLORS.white },
  togglePillText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.8)', fontFamily: FONTS.semiBold },
  togglePillTextActive: { color: COLORS.primary },
});
