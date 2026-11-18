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
  const displaySummaries =
    groupBy === 'day' && !summaries.some((s) => s.period === todayStr)
      ? [{ period: todayStr, total_count: 0, completed_count: 0, failed_count: 0, active_count: 0, assignments: [] }, ...summaries]
      : summaries;

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
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
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
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
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
              return (
                <TouchableOpacity
                  style={[styles.summaryCard, allDone && styles.summaryCardDone]}
                  onPress={() => item.total_count > 0 && openPeriod(item)}
                  activeOpacity={0.85}
                >
                  {/* Card header */}
                  <View style={styles.cardHeader}>
                    <View style={styles.dateIconWrap}>
                      <Ionicons name="calendar" size={15} color={COLORS.primary} />
                    </View>
                    <Text style={styles.periodText} numberOfLines={1}>
                      {isToday ? 'ဒီနေ့' : formatPeriodLabel(item.period, groupBy)}
                    </Text>
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
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.empty}>
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
      <View style={styles.cardTop}>
        <Text style={styles.trackingNumber}>{parcel?.tracking_number}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      <Text style={styles.recipient} numberOfLines={1}>{parcel?.recipient_name}</Text>
      <Text style={styles.address} numberOfLines={2}>{parcel?.delivery_address}</Text>

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

      {/* Dates */}
      <View style={styles.parcelDetails}>
        <Text style={styles.detailText}>
          ချိတ်ဆက်ရက်: {new Date(new Date(assignment.assigned_at).getTime() + (6*60+30)*60000).toLocaleString()}
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
        >
          <Text style={styles.attemptBtnText}>ရလဒ် မှတ်တမ်းတင်</Text>
        </TouchableOpacity>
      )}
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
  filterRow: { height: 60 },
  filterList: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, alignItems: 'center' },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border, height: 38, justifyContent: 'center', alignSelf: 'center' },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600', fontFamily: FONTS.semiBold },
  filterChipTextActive: { color: COLORS.white },
  loader: { marginTop: 60 },
  list: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, gap: 10 },
  listArea: { flex: 1 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 6, fontFamily: FONTS.bold },
  emptySub: { fontSize: 13, color: COLORS.textLight, textAlign: 'center', fontFamily: FONTS.regular },

  // Summary cards
  summaryCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 },
  summaryCardDone: { borderColor: COLORS.success, borderWidth: 1.5, backgroundColor: '#E8F8EF' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateIconWrap: { width: 28, height: 28, borderRadius: 8, backgroundColor: COLORS.primaryBg ?? '#FFF3E0', alignItems: 'center', justifyContent: 'center' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 10 },
  periodText: { fontSize: 14, fontWeight: '700', color: COLORS.text, flex: 1, fontFamily: FONTS.bold },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 16, fontWeight: '800', color: COLORS.text, fontFamily: FONTS.bold, marginTop: 2 },
  statLabel: { fontSize: 10, color: COLORS.textSecondary, fontFamily: FONTS.regular },
  statDivider: { width: 1, height: 36, backgroundColor: COLORS.border },

  // Assignment card
  card: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  trackingNumber: { fontSize: 14, fontWeight: '700', color: COLORS.primary, fontFamily: FONTS.bold },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '600', fontFamily: FONTS.semiBold },
  recipient: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 2, fontFamily: FONTS.bold },
  address: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18, fontFamily: FONTS.regular },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border, flexWrap: 'wrap' },
  assignBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  assignBadgeText: { fontSize: 12, fontWeight: '600', fontFamily: FONTS.semiBold },
  codBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, backgroundColor: '#E8F4FB' },
  codText: { fontSize: 11, fontWeight: '700', color: COLORS.info, fontFamily: FONTS.bold },
  feeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, backgroundColor: '#E8F8EF' },
  feeText: { fontSize: 11, fontWeight: '700', color: COLORS.success, fontFamily: FONTS.bold },
  parcelDetails: { marginTop: 8, gap: 2 },
  detailText: { fontSize: 12, color: COLORS.textSecondary, fontFamily: FONTS.regular },
  attemptBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginTop: 10, alignSelf: 'flex-end' },
  attemptBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.white, fontFamily: FONTS.bold },

  toggleBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.18)' },
  toggleBtnActive: { backgroundColor: COLORS.white },
  toggleText: { fontSize: 12, fontWeight: '700', color: COLORS.white, fontFamily: FONTS.semiBold },
  toggleTextActive: { color: COLORS.primary },

  togglePill: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 10, padding: 3, gap: 2 },
  togglePillBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  togglePillBtnActive: { backgroundColor: COLORS.white },
  togglePillText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.8)', fontFamily: FONTS.semiBold },
  togglePillTextActive: { color: COLORS.primary },
});
