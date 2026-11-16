import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { parcelService, Parcel } from '../../src/services/parcelService';
import { COLORS, STATUS_COLORS, STATUS_LABELS_MM, PRIORITY_COLORS, PRIORITY_LABELS_MM, FONTS } from '../../src/constants';
import { useAuth } from '../../src/context/AuthContext';

export default function CustomerDetailScreen() {
  const insets = useSafeAreaInsets();
  const { phone, type, name } = useLocalSearchParams<{ phone: string; type: string; name: string }>();
  const { user } = useAuth();
  const [page, setPage] = useState(1);

  const decodedName = name ? decodeURIComponent(name as string) : (phone as string);
  const isRecipient = type !== 'sender';

  // Only admin and manager can create parcels
  const canCreateParcel = user?.role === 'admin' || user?.role === 'manager';

  // Build the create URL with pre-filled fields based on customer type
  const handleAddParcel = () => {
    const params = new URLSearchParams();
    if (isRecipient) {
      params.set('recipient_name', encodeURIComponent(decodedName));
      params.set('recipient_phone', encodeURIComponent(phone as string));
    } else {
      params.set('sender_name', encodeURIComponent(decodedName));
      params.set('sender_phone', encodeURIComponent(phone as string));
    }
    router.push(`/parcels/create?${params.toString()}`);
  };

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['customer-parcels', phone, page],
    queryFn: () =>
      parcelService.list({ search: phone as string, page, per_page: 20 }),
    enabled: !!phone,
  });

  const parcels = data?.data ?? [];
  const meta = data?.meta;

  // Calculate totals
  const totalMMK = parcels
    .filter(p => p.currency === 'MMK')
    .reduce((s, p) => s + Number(p.delivery_fee), 0);
  const totalTHB = parcels
    .filter(p => p.currency === 'THB')
    .reduce((s, p) => s + Number(p.delivery_fee), 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>{decodedName}</Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {phone}  ·  {isRecipient ? 'လက်ခံသူ' : 'ပို့သူ'}
          </Text>
        </View>
        {canCreateParcel && (
          <TouchableOpacity style={styles.addBtn} onPress={handleAddParcel} activeOpacity={0.8}>
            <Text style={styles.addBtnText}>ထည့်မည်</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{meta?.total ?? parcels.length}</Text>
          <Text style={styles.statLabel}>ပါဆယ်</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalMMK.toLocaleString()}</Text>
          <Text style={styles.statLabel}>MMK</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalTHB.toLocaleString()}</Text>
          <Text style={styles.statLabel}>THB</Text>
        </View>
      </View>

      {/* Parcel List */}
      {isLoading ? (
        <ActivityIndicator style={styles.loader} size="large" color={COLORS.primary} />
      ) : (
        <FlatList
          data={parcels}
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
          renderItem={({ item }) => <ParcelRow parcel={item} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>ပါဆယ် မတွေ့ပါ</Text>
            </View>
          }
          ListFooterComponent={
            meta && meta.last_page > 1 ? (
              <View style={styles.pagination}>
                <TouchableOpacity
                  style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
                  onPress={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pageBtnText, page <= 1 && { color: COLORS.textLight }]}>နှုတ်</Text>
                </TouchableOpacity>
                <View style={styles.pageInfoBox}>
                  <Text style={styles.pageInfo}>{page} / {meta.last_page}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.pageBtn, page >= meta.last_page && styles.pageBtnDisabled]}
                  onPress={() => setPage(p => Math.min(meta.last_page, p + 1))}
                  disabled={page >= meta.last_page}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pageBtnText, page >= meta.last_page && { color: COLORS.textLight }]}>နောက်</Text>
                </TouchableOpacity>
              </View>
            ) : undefined
          }
        />
      )}
    </View>
  );
}

function ParcelRow({ parcel }: { parcel: Parcel }) {
  const statusColor = STATUS_COLORS[parcel.status as keyof typeof STATUS_COLORS] || COLORS.textSecondary;
  const statusLabel = STATUS_LABELS_MM[parcel.status as keyof typeof STATUS_LABELS_MM] || parcel.status;
  const priorityColor = PRIORITY_COLORS[parcel.priority as keyof typeof PRIORITY_COLORS] || COLORS.textSecondary;
  const priorityLabel = PRIORITY_LABELS_MM[parcel.priority as keyof typeof PRIORITY_LABELS_MM] || parcel.priority;

  return (
    <TouchableOpacity
      style={styles.parcelCard}
      onPress={() => router.push(`/parcels/${parcel.id}`)}
      activeOpacity={0.85}
    >
      {/* Top row */}
      <View style={styles.cardTop}>
        <Text style={styles.trackingNumber}>{parcel.tracking_number}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Info */}
      <View style={styles.infoGroup}>
        <Text style={styles.infoText} numberOfLines={1}>{parcel.recipient_name}</Text>
        <Text style={styles.infoText}>{parcel.recipient_phone}</Text>
        <Text style={styles.infoText} numberOfLines={1}>{parcel.delivery_address}</Text>
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.footerLeft}>
          <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '18' }]}>
            <Text style={[styles.priorityText, { color: priorityColor }]}>{priorityLabel}</Text>
          </View>
          {parcel.is_cod && (
            <View style={styles.codBadge}>
              <Text style={styles.codText}>COD</Text>
            </View>
          )}
        </View>
        <Text style={styles.feeText}>
          {Number(parcel.delivery_fee).toLocaleString()} {parcel.currency}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 4 },
  headerInfo: { flex: 1 },
  headerName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: FONTS.bold,
  },
  headerSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontFamily: FONTS.regular,
  },
  addBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
    fontFamily: FONTS.bold,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: COLORS.border },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: FONTS.bold,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
  },

  loader: { marginTop: 60 },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 10, paddingTop: 4 },

  // Parcel card
  parcelCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
  statusText: { fontSize: 12, fontWeight: '600', fontFamily: FONTS.semiBold },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 10 },
  infoGroup: { gap: 4 },
  infoText: { fontSize: 13, color: COLORS.text, fontFamily: FONTS.regular },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerLeft: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  priorityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  priorityText: { fontSize: 11, fontWeight: '700', fontFamily: FONTS.bold },
  codBadge: {
    backgroundColor: '#E8F4FB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  codText: { fontSize: 11, fontWeight: '700', color: COLORS.info, fontFamily: FONTS.bold },
  feeText: { fontSize: 14, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.bold },

  // Empty
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 15, color: COLORS.textSecondary, fontFamily: FONTS.regular },

  // Pagination
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  pageInfoBox: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
  },
  pageInfo: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
    fontFamily: FONTS.bold,
  },
});