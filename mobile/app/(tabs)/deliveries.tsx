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
import { COLORS, STATUS_COLORS, STATUS_LABELS_MM, FONTS } from '../../src/constants';

const STATUS_FILTERS = [
  { label: 'အားလုံး', value: '' },
  { label: 'ဆောင်ရွက်နေ', value: 'ACTIVE' },
  { label: 'ပြီးစီး', value: 'COMPLETED' },
  { label: 'မအောင်မြင်', value: 'FAILED' },
];

export default function DeliveriesScreen() {
  const insets = useSafeAreaInsets();
  const [statusFilter, setStatusFilter] = useState('');
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.navigate('/(tabs)/more')}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>ပို့ဆောင်မှုများ</Text>
            <Text style={styles.headerSubtitle}>စုစုပေါင်း {meta?.total ?? 0} ခု</Text>
          </View>
        </View>
      </View>

      <View style={styles.contentArea}>
        {/* Filter chips */}
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
                activeOpacity={0.8}
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
              refreshControl={
                <RefreshControl
                  refreshing={isFetching && !isLoading}
                  onRefresh={() => { setPage(1); refetch(); }}
                  tintColor={COLORS.primary}
                />
              }
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
                    <TouchableOpacity
                      style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
                      onPress={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.pageBtnText, page <= 1 && { color: COLORS.textLight }]}>
                        {'<'} နှုတ်
                      </Text>
                    </TouchableOpacity>
                    <View style={styles.pageInfoBox}>
                      <Text style={styles.pageInfo}>{page} / {meta.last_page}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.pageBtn, page >= meta.last_page && styles.pageBtnDisabled]}
                      onPress={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                      disabled={page >= meta.last_page}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.pageBtnText, page >= meta.last_page && { color: COLORS.textLight }]}>
                        နောက် {'>'}
                      </Text>
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

      {/* Parcel create & complete dates */}
      <View style={styles.parcelDetails}>
        <Text style={styles.detailText}>လက်ခံရက်စွဲ: {parcel?.received_at ? new Date(parcel.received_at).toLocaleString() : (parcel?.created_at ? new Date(parcel.created_at).toLocaleString() : '-')}</Text>
        {parcel?.status === 'DELIVERED' && parcel?.delivered_at ? (
          <Text style={styles.detailText}>ပို့ဆောင်ပြီးရက်စွဲ: {new Date(parcel.delivered_at).toLocaleString()}</Text>
        ) : null}
      </View>

      {assignment.staff && (
        <Text style={styles.metaLine}>ဝန်ထမ်း: {assignment.staff.name}</Text>
      )}

      <View style={styles.cardBottom}>
        <View style={[styles.assignBadge, { backgroundColor: isActive ? '#FFF3DC' : '#E8F8EF' }]}>
          <Text style={[styles.assignBadgeText, { color: assignColor }]}>{assignLabel}</Text>
        </View>
        {parcel?.is_cod && (
          <View style={styles.codBadge}>
            <Text style={styles.codText}>COD {Number(parcel.cod_amount).toLocaleString()} ကျပ်</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  contentArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    marginTop: -1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
    fontFamily: FONTS.bold,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
    fontFamily: FONTS.regular,
  },
  filterRow: { height: 60 },
  filterList: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, alignItems: 'center' },
  listArea: { flex: 1 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    height: 38,
    justifyContent: 'center',
    alignSelf: 'center',
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  filterChipTextActive: { color: COLORS.white },
  loader: { marginTop: 60 },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },

  // Card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
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
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  recipient: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
    fontFamily: FONTS.bold,
  },
  address: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    fontFamily: FONTS.regular,
  },
  metaLine: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 6,
    fontFamily: FONTS.regular,
  },
  parcelDetails: { marginTop: 8, gap: 2 },
  detailText: { fontSize: 12, color: COLORS.textSecondary, fontFamily: FONTS.regular },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  assignBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  assignBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  codBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#E8F4FB',
  },
  codText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.info,
    fontFamily: FONTS.bold,
  },

  // Empty
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
    fontFamily: FONTS.bold,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textLight,
    textAlign: 'center',
    fontFamily: FONTS.regular,
  },

  // Pagination
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pageBtn: { padding: 8 },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  pageInfoBox: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pageInfo: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
});
