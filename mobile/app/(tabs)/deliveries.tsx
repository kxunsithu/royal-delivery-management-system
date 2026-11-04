import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { deliveryService, Assignment } from '../../src/services/deliveryService';
import { COLORS, STATUS_COLORS, STATUS_LABELS_MM, PRIORITY_COLORS, PRIORITY_LABELS_MM } from '../../src/constants';

const STATUS_FILTERS = [
  { label: 'အားလုံး', value: '' },
  { label: 'တက်ကြွ', value: 'ACTIVE' },
  { label: 'ပြီးစီး', value: 'COMPLETED' },
  { label: 'ပြောင်းလဲ', value: 'REASSIGNED' },
];

export default function DeliveriesScreen() {
  const insets = useSafeAreaInsets();
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
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
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>ပို့ဆောင်မှုများ</Text>
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={STATUS_FILTERS}
        keyExtractor={(item) => item.value}
        contentContainerStyle={styles.filterList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterTab, statusFilter === item.value && styles.filterTabActive]}
            onPress={() => { setStatusFilter(item.value); setPage(1); }}
          >
            <Text style={[styles.filterTabText, statusFilter === item.value && styles.filterTabTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

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
              <Ionicons name="car-outline" size={64} color={COLORS.border} />
              <Text style={styles.emptyText}>ပို့ဆောင်မှု မတွေ့ပါ</Text>
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
  );
}

function AssignmentCard({ assignment }: { assignment: Assignment }) {
  const parcel = assignment.parcel;
  const parcelStatus = parcel?.status ?? '';
  const statusColor = STATUS_COLORS[parcelStatus as keyof typeof STATUS_COLORS] || COLORS.textSecondary;
  const statusLabel = STATUS_LABELS_MM[parcelStatus as keyof typeof STATUS_LABELS_MM] || parcelStatus;
  const assignStatus = assignment.status;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/deliveries/${assignment.id}`)}
      activeOpacity={0.85}
    >
      <View style={styles.cardHeader}>
        <View style={styles.trackingRow}>
          <Ionicons name="barcode-outline" size={16} color={COLORS.primary} />
          <Text style={styles.trackingNumber}>{parcel?.tracking_number}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Ionicons name="person" size={14} color={COLORS.textSecondary} />
          <Text style={styles.infoText} numberOfLines={1}>{parcel?.recipient_name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location" size={14} color={COLORS.textSecondary} />
          <Text style={styles.infoText} numberOfLines={1}>{parcel?.delivery_address}</Text>
        </View>
        {assignment.staff && (
          <View style={styles.infoRow}>
            <Ionicons name="bicycle" size={14} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>{assignment.staff.name}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        <View style={[styles.assignStatusBadge, assignStatus === 'ACTIVE' ? styles.activeBadge : styles.doneBadge]}>
          <Text style={assignStatus === 'ACTIVE' ? styles.activeText : styles.doneText}>
            {assignStatus === 'ACTIVE' ? 'တက်ကြွ' : assignStatus === 'COMPLETED' ? 'ပြီးစီး' : 'ပြောင်းလဲ'}
          </Text>
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
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  filterList: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterTab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border },
  filterTabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterTabText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  filterTabTextActive: { color: COLORS.white },
  loader: { marginTop: 60 },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  trackingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trackingNumber: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '600' },
  cardBody: { gap: 6, marginBottom: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 14, color: COLORS.text, flex: 1 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  assignStatusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  activeBadge: { backgroundColor: '#FFF3DC' },
  doneBadge: { backgroundColor: '#E8F8EF' },
  activeText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  doneText: { fontSize: 12, fontWeight: '600', color: COLORS.success },
  codBadge: { backgroundColor: '#E8F4FB', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  codText: { fontSize: 11, fontWeight: '700', color: COLORS.info },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: COLORS.textLight, marginTop: 12 },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 16 },
  pageBtn: { padding: 8 },
  pageBtnDisabled: { opacity: 0.4 },
  pageInfo: { fontSize: 14, color: COLORS.textSecondary },
});
