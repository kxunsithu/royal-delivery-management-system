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
import { deliveryService, Assignment } from '../../src/services/deliveryService';
import {
  COLORS,
  STATUS_COLORS,
  STATUS_LABELS_MM,
  FONTS,
  PRIORITY_COLORS,
  PRIORITY_LABELS_MM,
} from '../../src/constants';

type GroupBy = 'day' | 'month';

// Myanmar timezone +6:30
function toMMDate(iso: string): string {
  const d = new Date(new Date(iso).getTime() + (6 * 60 + 30) * 60000);
  return d.toISOString().slice(0, 10);
}
function toMMMonth(iso: string): string {
  return toMMDate(iso).slice(0, 7);
}

function formatPeriodLabel(period: string, groupBy: GroupBy): string {
  if (groupBy === 'month') {
    const [y, m] = period.split('-');
    const months = ['ဇန်နဝါရီ','ဖေဖော်ဝါရီ','မတ်','ဧပြီ','မေ','ဇွန်','ဇူလိုင်','သြဂုတ်','စက်တင်ဘာ','အောက်တိုဘာ','နိုဝင်ဘာ','ဒီဇင်ဘာ'];
    return `${months[Number(m) - 1]} ${y}`;
  }
  const d = new Date(period + 'T00:00:00');
  const months = ['ဇန်နဝါရီ','ဖေဖော်ဝါရီ','မတ်','ဧပြီ','မေ','ဇွန်','ဇူလိုင်','သြဂုတ်','စက်တင်ဘာ','အောက်တိုဘာ','နိုဝင်ဘာ','ဒီဇင်ဘာ'];
  const days = ['တနင်္ဂနွေ','တနင်္လာ','အင်္ဂါ','ဗုဒ္ဓဟူး','ကြာသပတေး','သောကြာ','စနေ'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}၊ ${days[d.getDay()]}`;
}

interface PeriodSummary {
  period: string;
  total_count: number;
  completed_count: number;
  failed_count: number;
  active_count: number;
  assignments: Assignment[];
}

function buildSummaries(assignments: Assignment[], groupBy: GroupBy): PeriodSummary[] {
  const map = new Map<string, Assignment[]>();
  for (const a of assignments) {
    const key = groupBy === 'day' ? toMMDate(a.assigned_at) : toMMMonth(a.assigned_at);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(a);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([period, list]) => ({
      period,
      total_count: list.length,
      completed_count: list.filter((a) => a.status === 'COMPLETED').length,
      failed_count: list.filter((a) => a.status === 'FAILED').length,
      active_count: list.filter((a) => a.parcel?.status === 'IN_TRANSIT').length,
      assignments: list,
    }));
}

const STATUS_FILTERS = [
  { label: 'အားလုံး', value: '' },
  { label: 'ပြီးစီး', value: 'COMPLETED' },
  { label: 'မအောင်မြင်', value: 'FAILED' },
];

export default function MyAssignmentsScreen() {
  const insets = useSafeAreaInsets();
  const [groupBy, setGroupBy] = useState<GroupBy>('day');
  const [view, setView] = useState<'summary' | 'list'>('summary');
  const [selected, setSelected] = useState<PeriodSummary | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['my-assignments-all'],
    queryFn: () => deliveryService.myAssignments({ per_page: 500 }),
  });

  // Hide only reassigned assignments; show active, completed, failed
  const allAssignments = (data?.data ?? []).filter(
    (a) => a.status !== 'REASSIGNED'
  );
  const meta = data?.meta;
  const totalCount = allAssignments.length;

  const summaries = buildSummaries(allAssignments, groupBy);

  const todayStr = toMMDate(new Date().toISOString());
  const displaySummaries = summaries;

  function openPeriod(s: PeriodSummary) {
    setSelected(s);
    setStatusFilter('');
    setView('list');
  }

  function backToSummary() {
    setView('summary');
    setSelected(null);
  }

  // ── LIST VIEW ───────────────────────────────────────────────
  if (view === 'list' && selected) {
    const listAssignments = statusFilter === 'COMPLETED'
      ? selected.assignments.filter((a) => a.status === 'COMPLETED')
      : statusFilter === 'FAILED'
      ? selected.assignments.filter((a) => a.status === 'FAILED')
      : selected.assignments;

    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={backToSummary} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {formatPeriodLabel(selected.period, groupBy)}
            </Text>
            <Text style={styles.headerSubtitle}>စုစုပေါင်း {selected.total_count} ခု</Text>
          </View>
        </View>

        <View style={styles.contentArea}>
          {/* Status filter chips */}
          <View style={styles.filterRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterList}>
              {STATUS_FILTERS.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={[styles.filterChip, statusFilter === item.value && styles.filterChipActive]}
                  onPress={() => setStatusFilter(item.value)}
                >
                  <Text style={[styles.filterChipText, statusFilter === item.value && styles.filterChipTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.listArea}>
            <FlatList
              data={listAssignments}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={() => { void refetch(); }} tintColor={COLORS.primary} />}
              renderItem={({ item }) => <AssignmentCard assignment={item} />}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <View style={styles.emptyIconWrap}>
                    <Ionicons name="bicycle" size={36} color={COLORS.textLight} />
                  </View>
                  <Text style={styles.emptyTitle}>ပို့ဆောင်မှု မတွေ့ပါ</Text>
                  <Text style={styles.emptySub}>ရွေးချယ်ထားသော filter နှင့် မကိုက်ညီပါ</Text>
                </View>
              }
            />
          </View>
        </View>
      </View>
    );
  }

  // ── SUMMARY VIEW ────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>ကျွန်ုပ်၏ လုပ်ငန်းများ</Text>
          <Text style={styles.headerSubtitle}>စုစုပေါင်း {totalCount} ခု</Text>
        </View>
        <View style={styles.togglePill}>
          <TouchableOpacity style={[styles.togglePillBtn, groupBy === 'day' && styles.togglePillBtnActive]} onPress={() => setGroupBy('day')} activeOpacity={0.8}>
            <Text style={[styles.togglePillText, groupBy === 'day' && styles.togglePillTextActive]}>နေ့</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.togglePillBtn, groupBy === 'month' && styles.togglePillBtnActive]} onPress={() => setGroupBy('month')} activeOpacity={0.8}>
            <Text style={[styles.togglePillText, groupBy === 'month' && styles.togglePillTextActive]}>လ</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.contentArea}>
        {isLoading ? (
          <ActivityIndicator style={styles.loader} size="large" color={COLORS.primary} />
        ) : (
          <FlatList
            data={displaySummaries}
            keyExtractor={(item) => item.period}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={() => { void refetch(); }} tintColor={COLORS.primary} />}
            renderItem={({ item }) => {
              const isToday = item.period === todayStr && groupBy === 'day';
              const allDone = item.total_count > 0 && item.completed_count === item.total_count;
              const completionPct = item.total_count > 0 ? Math.round((item.completed_count / item.total_count) * 100) : 0;
              return (
                <TouchableOpacity
                  style={[styles.summaryCard, allDone && styles.summaryCardDone]}
                  onPress={() => item.total_count > 0 && openPeriod(item)}
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
                    {item.total_count > 0 && (
                      <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
                    )}
                  </View>

                  <View style={styles.cardDivider} />

                  {/* Stats row */}
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{item.total_count}</Text>
                      <Text style={styles.statLabel}>စုစုပေါင်း</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: COLORS.success }]}>{item.completed_count}</Text>
                      <Text style={styles.statLabel}>ပြီးစီး</Text>
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
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="bicycle" size={36} color={COLORS.textLight} />
                </View>
                <Text style={styles.emptyTitle}>လုပ်ငန်းများ မတွေ့ပါ</Text>
                <Text style={styles.emptySub}>ပါဆယ် ချိတ်ဆက်မှုများ ဤနေရာတွင် ပေါ်ပါမည်</Text>
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
  const isTerminal = !isActive;

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

        {/* Dates */}
        <View style={styles.parcelDetails}>
          <Text style={styles.detailText}>
            ချိတ်ဆက်ရက်: {new Date(assignment.assigned_at).toLocaleString()}
          </Text>
          {parcel?.status === 'DELIVERED' && (parcel?.delivered_at || parcel?.updated_at) && (
            <Text style={styles.detailText}>
              ပို့ဆောင်ပြီးရက်: {new Date((parcel.delivered_at || parcel.updated_at)!).toLocaleString()}
            </Text>
          )}
          {parcel?.status === 'FAILED' && (parcel?.failed_at || parcel?.updated_at) && (
            <Text style={styles.detailText}>
              မအောင်မြင်ရက်: {new Date((parcel.failed_at || parcel.updated_at)!).toLocaleString()}
            </Text>
          )}
        </View>

        {/* Attempt button for active */}
        {!isTerminal && (
          <TouchableOpacity
            style={styles.attemptBtn}
            onPress={() => router.push(`/deliveries/attempt/${assignment.id}`)}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.white} />
            <Text style={styles.attemptBtnText}>ရလဒ် မှတ်တမ်းတင်</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  contentArea: { flex: 1, backgroundColor: COLORS.background, },
  header: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 12, },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.white, fontFamily: FONTS.bold },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2, fontFamily: FONTS.regular },
  filterRow: { height: 58 },
  filterList: { minHeight: 44, paddingHorizontal: 16, paddingVertical: 10, gap: 8, alignItems: 'center' },
  filterChip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 24, backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border, height: 36, justifyContent: 'center' },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600', fontFamily: FONTS.semiBold },
  filterChipTextActive: { color: COLORS.white },
  loader: { marginTop: 60 },
  list: { minHeight: 180, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32, gap: 10 },
  listArea: { flex: 1 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.border, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 6, fontFamily: FONTS.bold },
  emptySub: { fontSize: 13, color: COLORS.textLight, textAlign: 'center', fontFamily: FONTS.regular },

  // Summary cards
  summaryCard: { minHeight: 80, minWidth: 120, backgroundColor: COLORS.white, borderRadius: 16, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 },
  summaryCardDone: { backgroundColor: '#F0FDF4' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dateIconWrap: { width: 30, height: 30, borderRadius: 10, backgroundColor: COLORS.primaryBg, alignItems: 'center', justifyContent: 'center' },
  todayBadge: { backgroundColor: COLORS.primary + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  todayBadgeText: { fontSize: 10, color: COLORS.primary, fontWeight: '700', fontFamily: FONTS.bold },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 10 },
  periodText: { fontSize: 14, fontWeight: '700', color: COLORS.text, flex: 1, fontFamily: FONTS.bold },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 18, fontWeight: '800', color: COLORS.text, fontFamily: FONTS.bold, marginTop: 2 },
  statLabel: { fontSize: 10, color: COLORS.textSecondary, fontFamily: FONTS.regular },
  statDivider: { width: 1, height: 36, backgroundColor: COLORS.border },
  progressSection: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  progressTrack: { flex: 1, height: 5, borderRadius: 3, backgroundColor: COLORS.border, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 3 },
  progressLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, fontFamily: FONTS.semiBold, width: 30, textAlign: 'right' },

  // Assignment card
  card: { minHeight: 80, minWidth: 120, backgroundColor: COLORS.white, borderRadius: 14, flexDirection: 'row', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 },
  cardContent: { flex: 1, padding: 14 },
  trackingNumber: { fontSize: 13, fontWeight: '700', color: COLORS.primary, fontFamily: FONTS.bold },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 24 },
  statusText: { fontSize: 11, fontWeight: '600', fontFamily: FONTS.semiBold },
  recipient: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 4, fontFamily: FONTS.bold },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  address: { flex: 1, fontSize: 12, color: COLORS.textSecondary, fontFamily: FONTS.regular },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border, flexWrap: 'wrap' },
  assignBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 24 },
  assignBadgeText: { fontSize: 11, fontWeight: '600', fontFamily: FONTS.semiBold },
  codBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 24, backgroundColor: '#E8F4FB' },
  codText: { fontSize: 11, fontWeight: '700', color: COLORS.info, fontFamily: FONTS.bold },
  feeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 24, backgroundColor: '#E8F8EF' },
  feeText: { fontSize: 11, fontWeight: '700', color: COLORS.success, fontFamily: FONTS.bold },
  parcelDetails: { marginTop: 8, gap: 2 },
  detailText: { fontSize: 11, color: COLORS.textSecondary, fontFamily: FONTS.regular },
  attemptBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, marginTop: 12,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  attemptBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.white, fontFamily: FONTS.bold },

  togglePill: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 12, padding: 3, gap: 2 },
  togglePillBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  togglePillBtnActive: { backgroundColor: COLORS.white },
  togglePillText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.8)', fontFamily: FONTS.semiBold },
  togglePillTextActive: { color: COLORS.primary },
});
