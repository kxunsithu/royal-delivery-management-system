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
import { COLORS, STATUS_COLORS, STATUS_LABELS_MM} from '../../src/constants';

const STATUS_FILTERS = [
  { label: 'အားလုံး', value: '' },
  { label: 'ဆောင်ရွက်နေ', value: 'IN_PROGRESS' },
  { label: 'ပြီးစီး', value: 'COMPLETED' },
  { label: 'မအောင်မြင်', value: 'FAILED' },
];

export default function DeliveriesScreen() {
  const insets = useSafeAreaInsets();
  const [statusFilter, setStatusFilter] = useState('IN_PROGRESS');
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['assignments', statusFilter, page],
    queryFn: () => deliveryService.allAssignments({
      status: statusFilter || undefined,
      page,
      per_page: 20,
    }),
  });

  const assignments = data?.data ?? [];
  const meta = data?.meta;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>ပို့ဆောင်မှုများ</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{meta?.total ?? 0}</Text>
        </View>
      </View>

      <View style={styles.contentArea}>
        {/* Filter Chips */}
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

        {/* List */}
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
            renderItem={({ item }) => <AssignmentCard assignment={item} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="car-outline" size={48} color={COLORS.primary} />
                </View>
                <Text style={styles.emptyTitle}>ပို့ဆောင်မှု မတွေ့ပါ</Text>
                <Text style={styles.emptySub}>ရွေးချယ်ထားသော filter နှင့် မကိုက်ညီပါ</Text>
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
    </View>
  );
}

function AssignmentCard({ assignment }: { assignment: Assignment }) {
  const parcel = assignment.parcel;
  const parcelStatus = parcel?.status ?? '';
  const statusColor = STATUS_COLORS[parcelStatus as keyof typeof STATUS_COLORS] || COLORS.textSecondary;
  const statusLabel = STATUS_LABELS_MM[parcelStatus as keyof typeof STATUS_LABELS_MM] || parcelStatus;
  const assignStatus = assignment.status;
  const isActive = !['COMPLETED', 'FAILED', 'REASSIGNED'].includes(assignStatus ?? '');

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/deliveries/${assignment.id}`)}
      activeOpacity={0.85}
    >
      {/* Card Top */}
      <View style={styles.cardHeader}>
        <View style={styles.trackingRow}>
          <View style={styles.trackingIcon}>
            <Ionicons name="barcode-outline" size={14} color={COLORS.primary} />
          </View>
          <Text style={styles.trackingNumber}>{parcel?.tracking_number}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Card Body */}
      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.infoText} numberOfLines={1}>{parcel?.recipient_name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.infoText} numberOfLines={2}>{parcel?.delivery_address}</Text>
        </View>
        {assignment.staff && (
          <View style={styles.infoRow}>
            <Ionicons name="bicycle-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>{assignment.staff.name}</Text>
          </View>
        )}
      </View>

      {/* Card Footer */}
      <View style={styles.cardFooter}>
        <View style={[
          styles.assignBadge,
          isActive ? styles.assignBadgeActive : styles.assignBadgeDone,
        ]}>
          <Ionicons
            name={isActive ? 'flash' : 'checkmark-circle'}
            size={12}
            color={isActive ? COLORS.primary : COLORS.success}
          />
          <Text style={[styles.assignBadgeText, { color: isActive ? COLORS.primary : COLORS.success }]}>
              {assignStatus === 'IN_PROGRESS' ? 'ဆောင်ရွက်နေ'
                : assignStatus === 'COMPLETED' ? 'ပြီးစီး'
                : assignStatus === 'FAILED' ? 'မအောင်မြင်'
                : assignStatus === 'REASSIGNED' ? 'ပြောင်းလဲ'
                : 'ဆောင်ရွက်နေ'}
            </Text>
        </View>
        {parcel?.is_cod && (
          <View style={styles.codBadge}>
            <Ionicons name="cash-outline" size={12} color={COLORS.info} />
            <Text style={styles.codText}>COD {Number(parcel.cod_amount).toLocaleString()} ကျပ်</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={16} color={COLORS.border} style={{ marginLeft: 'auto' }} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  contentArea: { flex: 1, backgroundColor: COLORS.background, marginTop: -1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  headerBadgeText: { fontSize: 13, fontWeight: '700', color: COLORS.white,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  filterRow: { height: 64 },
  filterList: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, alignItems: 'center' },
  listArea: { flex: 1 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    height: 40,
    justifyContent: 'center',
    alignSelf: 'center',
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600',
    fontFamily: 'NotoSansMyanmar_600SemiBold',
  },
  filterChipTextActive: { color: COLORS.white },
  loader: { marginTop: 60 },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },

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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trackingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  trackingIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFF3DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackingNumber: { fontSize: 13, fontWeight: '700', color: COLORS.primary,
    fontFamily: 'NotoSansMyanmar_700Bold',
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
  statusText: { fontSize: 12, fontWeight: '600',
    fontFamily: 'NotoSansMyanmar_600SemiBold',
  },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 10 },
  cardBody: { gap: 6 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  infoText: { fontSize: 13, color: COLORS.text, flex: 1, lineHeight: 24,
    fontFamily: 'NotoSansMyanmar_400Regular',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  assignBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  assignBadgeActive: { backgroundColor: '#FFF3DC' },
  assignBadgeDone: { backgroundColor: '#E8F8EF' },
  assignBadgeText: { fontSize: 12, fontWeight: '600',
    fontFamily: 'NotoSansMyanmar_600SemiBold',
  },
  codBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E8F4FB', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  codText: { fontSize: 11, fontWeight: '700', color: COLORS.info,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },

  // Empty
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FFF3DC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 6,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  emptySub: { fontSize: 13, color: COLORS.textLight, textAlign: 'center',
    fontFamily: 'NotoSansMyanmar_400Regular',
  },

  // Pagination
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  pageBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 8 },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.primary,
    fontFamily: 'NotoSansMyanmar_600SemiBold',
  },
  pageInfoBox: { backgroundColor: COLORS.white, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  pageInfo: { fontSize: 13, color: COLORS.text, fontWeight: '600',
    fontFamily: 'NotoSansMyanmar_600SemiBold',
  },
});
