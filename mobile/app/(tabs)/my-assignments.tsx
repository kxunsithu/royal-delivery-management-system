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
import { router } from 'expo-router';
import { deliveryService, Assignment } from '../../src/services/deliveryService';
import { COLORS, STATUS_COLORS, STATUS_LABELS_MM, PRIORITY_COLORS, PRIORITY_LABELS_MM, ASSIGNMENT_STATUS_LABELS_MM, ASSIGNMENT_STATUS_COLORS} from '../../src/constants';

const STATUS_FILTERS = [
  { label: 'အားလုံး', value: '' },
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
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>ကျွန်ုပ်၏ လုပ်ငန်းများ</Text>
            <Text style={styles.headerSub}>ပို့ဆောင်ရေး လုပ်ငန်းစဉ်များ</Text>
          </View>
          <View style={styles.headerCountBadge}>
            <Ionicons name="bicycle" size={16} color={COLORS.primary} />
            <Text style={styles.headerCountText}>{totalCount}</Text>
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
                style={[styles.filterTab, statusFilter === item.value && styles.filterTabActive]}
                onPress={() => { setStatusFilter(item.value); setPage(1); }}
              >
                <Text style={[styles.filterTabText, statusFilter === item.value && styles.filterTabTextActive]}>
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
                  <View style={styles.emptyIconWrap}>
                    <Ionicons name="bicycle-outline" size={48} color={COLORS.primary} />
                  </View>
                  <Text style={styles.emptyText}>
                  {statusFilter === 'COMPLETED'
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
                      <Ionicons name="chevron-back" size={18} color={page <= 1 ? COLORS.textLight : COLORS.primary} />
                    </TouchableOpacity>
                    <Text style={styles.pageInfo}>{page} / {meta.last_page}</Text>
                    <TouchableOpacity style={[styles.pageBtn, page >= meta.last_page && styles.pageBtnDisabled]} onPress={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={page >= meta.last_page}>
                      <Ionicons name="chevron-forward" size={18} color={page >= meta.last_page ? COLORS.textLight : COLORS.primary} />
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
  const parcelStatus = parcel?.status ?? '';
  const statusColor = STATUS_COLORS[parcelStatus as keyof typeof STATUS_COLORS] || COLORS.textSecondary;
  const statusLabel = STATUS_LABELS_MM[parcelStatus as keyof typeof STATUS_LABELS_MM] || parcelStatus;
  const priority = parcel?.priority ?? 'NORMAL';
  const priorityColor = PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] || COLORS.success;
  const priorityLabel = PRIORITY_LABELS_MM[priority as keyof typeof PRIORITY_LABELS_MM] || priority;
  const assignStatus = assignment.status ?? '';
  const assignColor = ASSIGNMENT_STATUS_COLORS[assignStatus] || COLORS.textSecondary;
  const assignLabel = ASSIGNMENT_STATUS_LABELS_MM[assignStatus] || assignStatus;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/deliveries/${assignment.id}`)}
      activeOpacity={0.85}
    >
      {/* Top accent bar colored by priority */}
      <View style={[styles.cardAccent, { backgroundColor: priorityColor }]} />
      <View style={styles.cardBody}>
        {/* Header row */}
        <View style={styles.cardHeader}>
          <View style={styles.trackingRow}>
            <View style={styles.trackingIcon}>
              <Ionicons name="barcode-outline" size={14} color={COLORS.primary} />
            </View>
            <Text style={styles.trackingNumber}>{parcel?.tracking_number}</Text>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '20' }]}>
            <Text style={[styles.priorityText, { color: priorityColor }]}>{priorityLabel}</Text>
          </View>
        </View>

        {/* Info rows */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Ionicons name="person" size={15} color={COLORS.textSecondary} />
            <Text style={styles.infoName}>{parcel?.recipient_name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call" size={15} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>{parcel?.recipient_phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location" size={15} color={COLORS.textSecondary} />
            <Text style={styles.infoText} numberOfLines={2}>{parcel?.delivery_address}</Text>
          </View>
          {parcel?.delivery_area && (
            <View style={styles.infoRow}>
              <Ionicons name="map" size={15} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>{parcel.delivery_area.name}</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {/* Assignment status */}
            <View style={[styles.statusBadge, { backgroundColor: assignColor + '20' }]}>
              <Text style={[styles.statusText, { color: assignColor }]}>{assignLabel}</Text>
            </View>
          </View>
          <View style={styles.footerRight}>
            {parcel?.is_cod && (
              <View style={styles.codBadge}>
                <Ionicons name="cash" size={12} color={COLORS.info} />
                <Text style={styles.codText}>COD {Number(parcel.cod_amount).toLocaleString()}</Text>
              </View>
            )}
            {/* Only show attempt button for non-terminal assignments */}
            {!['COMPLETED', 'FAILED', 'REASSIGNED'].includes(assignStatus) && (
              <TouchableOpacity
                style={styles.attemptBtn}
                onPress={() => router.push(`/deliveries/attempt/${assignment.id}`)}
              >
                <Ionicons name="add-circle-outline" size={14} color={COLORS.white} />
                <Text style={styles.attemptBtnText}>ရလဒ် မှတ်တမ်းတင်</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  contentArea: { flex: 1, backgroundColor: '#F3F4F6', marginTop: -16, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2,
    fontFamily: 'NotoSansMyanmar_400Regular',
  },
  headerCountBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  headerCountText: { fontSize: 15, fontWeight: '800', color: COLORS.primary,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  statStrip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14, padding: 12,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '800', color: COLORS.white,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2,
    fontFamily: 'NotoSansMyanmar_400Regular',
  },
  statDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.3)' },
  filterRow: { height: 64 },
  filterList: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, alignItems: 'center' },
  listArea: { flex: 1 },
  filterTab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border, height: 40, justifyContent: 'center', alignSelf: 'center' },
  filterTabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterTabText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600',
    fontFamily: 'NotoSansMyanmar_600SemiBold',
  },
  filterTabTextActive: { color: COLORS.white },
  loader: { marginTop: 60 },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  card: {
    backgroundColor: COLORS.white, borderRadius: 18, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },
  cardAccent: { height: 4, backgroundColor: COLORS.primary },
  cardBody: { padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  trackingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trackingIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#FFF3DC', alignItems: 'center', justifyContent: 'center' },
  trackingNumber: { fontSize: 14, fontWeight: '700', color: COLORS.primary,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  priorityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  priorityText: { fontSize: 12, fontWeight: '700',
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  infoSection: { gap: 7, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  infoName: { fontSize: 16, fontWeight: '700', color: COLORS.text, flex: 1,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  infoText: { fontSize: 14, color: COLORS.textSecondary, flex: 1,
    fontFamily: 'NotoSansMyanmar_400Regular',
  },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E7EB' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '600',
    fontFamily: 'NotoSansMyanmar_600SemiBold',
  },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  codBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E8F4FB', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  codText: { fontSize: 11, fontWeight: '700', color: COLORS.info,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  attemptBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  attemptBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.white,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIconWrap: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#FFF3DC', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyText: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 6,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  emptySubText: { fontSize: 13, color: COLORS.textLight,
    fontFamily: 'NotoSansMyanmar_400Regular',
  },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 16 },
  pageBtn: { padding: 8 },
  pageBtnDisabled: { opacity: 0.4 },
  pageInfo: { fontSize: 14, color: COLORS.textSecondary,
    fontFamily: 'NotoSansMyanmar_400Regular',
  },
});
