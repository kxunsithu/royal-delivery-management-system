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
import { COLORS, PRIORITY_COLORS, PRIORITY_LABELS_MM, ASSIGNMENT_STATUS_LABELS_MM, ASSIGNMENT_STATUS_COLORS, FONTS } from '../../src/constants';

const STATUS_FILTERS = [
  { label: 'အားလုံး', value: '' },
  { label: 'ဆောင်ရွက်နေ', value: 'ACTIVE' },
  { label: 'ပြီးစီး', value: 'COMPLETED' },
  { label: 'မအောင်မြင်', value: 'FAILED' },
];

export default function MyAssignmentsScreen() {
  const insets = useSafeAreaInsets();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['my-assignments', statusFilter, page],
    queryFn: () => deliveryService.myAssignments({
      status: statusFilter || undefined,
      page,
      per_page: 20,
    }),
  });

  const assignments = data?.data ?? [];
  const meta = data?.meta;

  // Counts from backend (active = not completed/failed/reassigned)
  const activeCount    = meta?.active_count    ?? (data?.data ?? []).filter((a: Assignment) => !['COMPLETED','FAILED','REASSIGNED'].includes(a.status)).length;
  const completedCount = meta?.completed_count ?? (data?.data ?? []).filter((a: Assignment) => a.status === 'COMPLETED').length;
  const totalCount     = meta?.total_count     ?? (meta?.total ?? 0);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.navigate('/(tabs)/more')}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>ကျွန်ုပ်၏ လုပ်ငန်းများ</Text>
            <Text style={styles.headerSub}>ပို့ဆောင်ရေး လုပ်ငန်းစဉ်များ</Text>
          </View>
        </View>

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
      </View>

      <View style={styles.contentArea}>
        <View style={styles.filterRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterList}
          >
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

        <View style={styles.listArea}>
          {isLoading ? (
            <ActivityIndicator style={styles.loader} size="large" color={COLORS.primary} />
          ) : (
            <FlatList
              data={assignments}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={() => { setPage(1); refetch(); }} tintColor={COLORS.primary} />}
              renderItem={({ item }) => <MyAssignmentCard assignment={item} />}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>
                    {statusFilter === 'ACTIVE'
                      ? 'ဆောင်ရွက်နေသော လုပ်ငန်းမရှိပါ'
                      : statusFilter === 'COMPLETED'
                      ? 'ပြီးစီးသောလုပ်ငန်း မတွေ့ပါ'
                      : statusFilter === 'FAILED'
                      ? 'မအောင်မြင်သောလုပ်ငန်း မတွေ့ပါ'
                      : 'လုပ်ငန်းများ မတွေ့ပါ'}
                  </Text>
                  <Text style={styles.emptySubText}>ပါဆယ် ချိတ်ဆက်မှုများ ဤနေရာတွင် ပေါ်ပါမည်</Text>
                </View>
              }
              ListFooterComponent={
                meta && meta.last_page > 1 ? (
                  <View style={styles.pagination}>
                    <TouchableOpacity style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]} onPress={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                      <Text style={[styles.pageBtnText, page <= 1 && { color: COLORS.textLight }]}>နှုတ်</Text>
                    </TouchableOpacity>
                    <View style={styles.pageInfoBox}>
                      <Text style={styles.pageInfo}>{page} / {meta.last_page}</Text>
                    </View>
                    <TouchableOpacity style={[styles.pageBtn, page >= meta.last_page && styles.pageBtnDisabled]} onPress={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={page >= meta.last_page}>
                      <Text style={[styles.pageBtnText, page >= meta.last_page && { color: COLORS.textLight }]}>နောက်</Text>
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

function MyAssignmentCard({ assignment }: { assignment: Assignment }) {
  const parcel = assignment.parcel;
  const priority = parcel?.priority ?? 'NORMAL';
  const priorityColor = PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] || COLORS.success;
  const priorityLabel = PRIORITY_LABELS_MM[priority as keyof typeof PRIORITY_LABELS_MM] || priority;
  const assignStatus = assignment.status ?? '';
  const assignColor = ASSIGNMENT_STATUS_COLORS[assignStatus] || COLORS.textSecondary;
  const assignLabel = ASSIGNMENT_STATUS_LABELS_MM[assignStatus] || assignStatus;
  const isTerminal = ['COMPLETED', 'FAILED', 'REASSIGNED'].includes(assignStatus);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/deliveries/${assignment.id}`)}
      activeOpacity={0.85}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.trackingNumber}>{parcel?.tracking_number}</Text>
        <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '18' }]}>
          <Text style={[styles.priorityText, { color: priorityColor }]}>{priorityLabel}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.infoSection}>
        <Text style={styles.recipientName} numberOfLines={1}>{parcel?.recipient_name}</Text>
        <Text style={styles.infoText}>{parcel?.recipient_phone}</Text>
        <Text style={styles.infoText} numberOfLines={2}>{parcel?.delivery_address}</Text>
      </View>

      {/* Parcel create & complete dates */}
      <View style={styles.parcelDetails}>
        <Text style={styles.detailText}>လက်ခံရက်စွဲ: {parcel?.received_at ? new Date(parcel.received_at).toLocaleString() : (parcel?.created_at ? new Date(parcel.created_at).toLocaleString() : '-')}</Text>
        {parcel?.status === 'DELIVERED' && parcel?.delivered_at ? (
          <Text style={styles.detailText}>ပို့ဆောင်ပြီးရက်စွဲ: {new Date(parcel.delivered_at).toLocaleString()}</Text>
        ) : null}
      </View>

      <View style={styles.cardFooter}>
        <View style={[styles.statusBadge, { backgroundColor: assignColor + '18' }]}>
          <View style={[styles.statusDot, { backgroundColor: assignColor }]} />
          <Text style={[styles.statusText, { color: assignColor }]}>{assignLabel}</Text>
        </View>
        <View style={styles.footerRight}>
          {parcel?.is_cod && (
            <View style={styles.codBadge}>
              <Text style={styles.codText}>COD {Number(parcel.cod_amount).toLocaleString()}</Text>
            </View>
          )}
          {!isTerminal && (
            <TouchableOpacity
              style={styles.attemptBtn}
              onPress={() => router.push(`/deliveries/attempt/${assignment.id}`)}
            >
              <Text style={styles.attemptBtnText}>ရလဒ် မှတ်တမ်းတင်</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white,
    fontFamily: FONTS.bold,
  },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2,
    fontFamily: FONTS.regular,
  },
  statStrip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12, padding: 12, marginTop: 14,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '800', color: COLORS.white,
    fontFamily: FONTS.bold,
  },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2,
    fontFamily: FONTS.regular,
  },
  statDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.3)' },
  contentArea: { flex: 1, backgroundColor: COLORS.background, marginTop: -1 },
  filterRow: { height: 56 },
  filterList: { paddingHorizontal: 16, paddingVertical: 8, gap: 8, alignItems: 'center' },
  listArea: { flex: 1 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border,
    height: 36, justifyContent: 'center', alignSelf: 'center',
  },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  filterChipTextActive: { color: COLORS.white },
  loader: { marginTop: 60 },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },

  card: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trackingNumber: { fontSize: 13, fontWeight: '700', color: COLORS.primary,
    fontFamily: FONTS.bold,
  },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  priorityText: { fontSize: 11, fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 10 },
  infoSection: { gap: 4, marginBottom: 4 },
  parcelDetails: { marginTop: 8, gap: 2 },
  detailText: { fontSize: 12, color: COLORS.textSecondary, fontFamily: FONTS.regular },
  recipientName: { fontSize: 15, fontWeight: '700', color: COLORS.text,
    fontFamily: FONTS.bold,
  },
  infoText: { fontSize: 13, color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
  },
  cardFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  codBadge: {
    backgroundColor: '#E8F4FB', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  codText: { fontSize: 11, fontWeight: '700', color: COLORS.info,
    fontFamily: FONTS.bold,
  },
  attemptBtn: {
    backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8,
  },
  attemptBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.white,
    fontFamily: FONTS.bold,
  },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 6,
    fontFamily: FONTS.bold,
  },
  emptySubText: { fontSize: 13, color: COLORS.textLight, textAlign: 'center',
    fontFamily: FONTS.regular,
  },

  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  pageBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 8 },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  pageInfoBox: { backgroundColor: COLORS.white, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  pageInfo: { fontSize: 13, color: COLORS.text, fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
});