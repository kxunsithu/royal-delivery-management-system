import React, { useState } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { deliveryService, Assignment } from '../../src/services/deliveryService';
import {
  COLORS,
  PRIORITY_COLORS,
  PRIORITY_LABELS_MM,
  ASSIGNMENT_STATUS_LABELS_MM,
  ASSIGNMENT_STATUS_COLORS,
  FONTS,
} from '../../src/constants';

type ViewMode = 'day' | 'month';

// Myanmar timezone offset +6:30
function toMyanmarDate(isoStr: string): string {
  const d = new Date(new Date(isoStr).getTime() + (6 * 60 + 30) * 60000);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function toMyanmarMonth(isoStr: string): string {
  return toMyanmarDate(isoStr).slice(0, 7); // YYYY-MM
}

function formatDateMM(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  const months = ['ဇန်နဝါရီ','ဖေဖော်ဝါရီ','မတ်','ဧပြီ','မေ','ဇွန်','ဇူလိုင်','သြဂုတ်','စက်တင်ဘာ','အောက်တိုဘာ','နိုဝင်ဘာ','ဒီဇင်ဘာ'];
  const days = ['တနင်္ဂနွေ','တနင်္လာ','အင်္ဂါ','ဗုဒ္ဓဟူး','ကြာသပတေး','သောကြာ','စနေ'];
  const dateObj = new Date(`${y}-${m}-${d}T00:00:00`);
  const dow = days[dateObj.getDay()];
  return `${d} ${months[parseInt(m, 10) - 1]} ${y}ခု ${dow}နေ့`;
}

function formatMonthMM(monthStr: string): string {
  const [y, m] = monthStr.split('-');
  const months = ['ဇန်နဝါရီ','ဖေဖော်ဝါရီ','မတ်','ဧပြီ','မေ','ဇွန်','ဇူလိုင်','သြဂုတ်','စက်တင်ဘာ','အောက်တိုဘာ','နိုဝင်ဘာ','ဒီဇင်ဘာ'];
  return `${months[parseInt(m, 10) - 1]} ${y}ခု`;
}

function groupByDate(assignments: Assignment[], mode: ViewMode) {
  const map = new Map<string, Assignment[]>();
  for (const a of assignments) {
    const key = mode === 'day'
      ? toMyanmarDate(a.assigned_at)
      : toMyanmarMonth(a.assigned_at);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(a);
  }
  // Sort descending
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, data]) => ({ title: key, data }));
}

export default function MyAssignmentsScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<ViewMode>('day');

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['my-assignments-all'],
    queryFn: () =>
      deliveryService.myAssignments({ per_page: 500 }),
  });

  const assignments = data?.data ?? [];
  const meta = data?.meta;

  const activeCount = meta?.active_count ??
    assignments.filter((a) => !['COMPLETED', 'FAILED', 'REASSIGNED'].includes(a.status)).length;
  const completedCount = meta?.completed_count ??
    assignments.filter((a) => a.status === 'COMPLETED').length;
  const totalCount = meta?.total_count ?? (meta?.total ?? 0);

  const sections = groupByDate(assignments, mode);

  function renderSectionHeader({ section }: { section: { title: string; data: Assignment[] } }) {
    const label = mode === 'day'
      ? formatDateMM(section.title)
      : formatMonthMM(section.title);
    const count = section.data.length;
    const done = section.data.filter((a) => a.status === 'COMPLETED').length;
    const failed = section.data.filter((a) => a.status === 'FAILED').length;
    const active = section.data.filter((a) => !['COMPLETED', 'FAILED', 'REASSIGNED'].includes(a.status)).length;

    return (
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>{label}</Text>
        </View>
        <View style={styles.sectionStats}>
          <Text style={styles.sectionTotal}>{count} ခု</Text>
          {done > 0 && <Text style={[styles.sectionStat, { color: COLORS.success }]}>✓{done}</Text>}
          {active > 0 && <Text style={[styles.sectionStat, { color: COLORS.warning }]}>↻{active}</Text>}
          {failed > 0 && <Text style={[styles.sectionStat, { color: COLORS.error }]}>✗{failed}</Text>}
        </View>
      </View>
    );
  }

  function renderItem({ item }: { item: Assignment }) {
    return <MyAssignmentCard assignment={item} />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ကျွန်ုပ်၏ လုပ်ငန်းများ</Text>

        {/* Quick stat strip */}
        <View style={styles.statStrip}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{activeCount}</Text>
            <Text style={styles.statLabel}>ဆောင်ရွက်နေ</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{completedCount}</Text>
            <Text style={styles.statLabel}>ပြီးစီး</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{totalCount}</Text>
            <Text style={styles.statLabel}>စုစုပေါင်း</Text>
          </View>
        </View>

        {/* Day / Month toggle */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === 'day' && styles.toggleBtnActive]}
            onPress={() => setMode('day')}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleBtnText, mode === 'day' && styles.toggleBtnTextActive]}>နေ့</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === 'month' && styles.toggleBtnActive]}
            onPress={() => setMode('month')}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleBtnText, mode === 'month' && styles.toggleBtnTextActive]}>လ</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={styles.contentArea}>
        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 60 }} size="large" color={COLORS.primary} />
        ) : sections.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="bicycle-outline" size={44} color={COLORS.textLight} />
            <Text style={styles.emptyText}>လုပ်ငန်းများ မတွေ့ပါ</Text>
            <Text style={styles.emptySubText}>ပါဆယ် ချိတ်ဆက်မှုများ ဤနေရာတွင် ပေါ်ပါမည်</Text>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id.toString()}
            renderSectionHeader={renderSectionHeader}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled={false}
            refreshControl={
              <RefreshControl
                refreshing={isFetching && !isLoading}
                onRefresh={refetch}
                tintColor={COLORS.primary}
              />
            }
          />
        )}
      </View>
    </View>
  );
}

function MyAssignmentCard({ assignment }: { assignment: Assignment }) {
  const parcel = assignment.parcel;
  const priority = parcel?.priority ?? 'NORMAL';
  const priorityColor = PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] || COLORS.success;
  const priorityLabel = PRIORITY_LABELS_MM[priority as keyof typeof PRIORITY_LABELS_MM] || priority;
  const assignStatus = assignment.status ?? '';
  const assignColor = ASSIGNMENT_STATUS_COLORS[assignStatus] || COLORS.primary;
  const assignLabel = ASSIGNMENT_STATUS_LABELS_MM[assignStatus] || assignStatus;
  const isTerminal = ['COMPLETED', 'FAILED', 'REASSIGNED'].includes(assignStatus);

  // Format assigned_at in Myanmar time
  const assignedAt = new Date(new Date(assignment.assigned_at).getTime() + (6 * 60 + 30) * 60000);
  const timeStr = assignedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/deliveries/${assignment.id}`)}
      activeOpacity={0.85}
    >
      {/* Top row */}
      <View style={styles.cardHeader}>
        <Text style={styles.trackingNumber}>{parcel?.tracking_number}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '18' }]}>
            <Text style={[styles.priorityText, { color: priorityColor }]}>{priorityLabel}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: assignColor + '18' }]}>
            <View style={[styles.statusDot, { backgroundColor: assignColor }]} />
            <Text style={[styles.statusText, { color: assignColor }]}>{assignLabel}</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Recipient info */}
      <View style={styles.infoSection}>
        <Text style={styles.recipientName} numberOfLines={1}>{parcel?.recipient_name}</Text>
        <Text style={styles.infoText}>{parcel?.recipient_phone}</Text>
        <Text style={styles.infoText} numberOfLines={2}>{parcel?.delivery_address}</Text>
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="time-outline" size={12} color={COLORS.textLight} />
          <Text style={styles.timeText}>{timeStr}</Text>
          {parcel?.is_cod && (
            <View style={styles.codBadge}>
              <Text style={styles.codText}>COD {Number(parcel.cod_amount).toLocaleString()}</Text>
            </View>
          )}
        </View>
        {!isTerminal && (
          <TouchableOpacity
            style={styles.attemptBtn}
            onPress={() => router.push(`/deliveries/attempt/${assignment.id}`)}
          >
            <Text style={styles.attemptBtnText}>ရလဒ် မှတ်တမ်းတင်</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 12,
  },
  headerTitle: {
    fontSize: 22, fontWeight: '800', color: COLORS.white,
    fontFamily: FONTS.bold, marginBottom: 12,
  },

  // Stat strip
  statStrip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12, padding: 12, marginBottom: 12,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '800', color: COLORS.white, fontFamily: FONTS.bold },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2, fontFamily: FONTS.regular },
  statDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.3)' },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10, padding: 3, alignSelf: 'flex-start',
  },
  toggleBtn: {
    paddingHorizontal: 20, paddingVertical: 6, borderRadius: 8,
  },
  toggleBtnActive: { backgroundColor: COLORS.white },
  toggleBtnText: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.75)', fontFamily: FONTS.bold },
  toggleBtnTextActive: { color: COLORS.primary },

  // Content
  contentArea: { flex: 1 },
  list: { paddingHorizontal: 14, paddingBottom: 24, paddingTop: 8, gap: 0 },

  // Section header
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 4, paddingVertical: 10, marginTop: 6,
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.bold },
  sectionStats: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTotal: { fontSize: 12, color: COLORS.textSecondary, fontFamily: FONTS.medium },
  sectionStat: { fontSize: 12, fontWeight: '700', fontFamily: FONTS.bold },

  // Card
  card: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: COLORS.border,
    marginBottom: 8,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trackingNumber: { fontSize: 13, fontWeight: '700', color: COLORS.primary, fontFamily: FONTS.bold },
  priorityBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  priorityText: { fontSize: 10, fontWeight: '700', fontFamily: FONTS.bold },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '600', fontFamily: FONTS.semiBold },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: COLORS.border, marginVertical: 8 },
  infoSection: { gap: 3, marginBottom: 4 },
  recipientName: { fontSize: 14, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.bold },
  infoText: { fontSize: 12, color: COLORS.textSecondary, fontFamily: FONTS.regular },
  cardFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 8, paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border,
  },
  timeText: { fontSize: 11, color: COLORS.textLight, fontFamily: FONTS.regular },
  codBadge: { backgroundColor: '#E8F4FB', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, marginLeft: 6 },
  codText: { fontSize: 10, fontWeight: '700', color: COLORS.info, fontFamily: FONTS.bold },
  attemptBtn: {
    backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
  },
  attemptBtnText: { fontSize: 11, fontWeight: '700', color: COLORS.white, fontFamily: FONTS.bold },

  // Empty
  empty: { alignItems: 'center', paddingVertical: 80, gap: 10 },
  emptyText: { fontSize: 16, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.bold },
  emptySubText: { fontSize: 13, color: COLORS.textLight, textAlign: 'center', fontFamily: FONTS.regular },
});
