import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { parcelService, Parcel } from '../../src/services/parcelService';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS, STATUS_COLORS, STATUS_LABELS_MM, PRIORITY_LABELS_MM, PRIORITY_COLORS } from '../../src/constants';
import ConfirmModal from '../../src/components/ConfirmModal';

const STATUS_FILTERS = [
  { label: 'အားလုံး', value: '' },
  { label: 'လက်ခံပြီး', value: 'RECEIVED' },
  { label: 'စစ်ဆေးပြီး', value: 'VERIFIED' },
  { label: 'ပို့ဆောင်နေ', value: 'IN_TRANSIT' },
  { label: 'ပို့ဆောင်ပြီး', value: 'DELIVERED' },
  { label: 'မအောင်မြင်', value: 'FAILED' },
  { label: 'ပျက်စီး', value: 'DAMAGED' },
];

export default function ParcelsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [searchDebounced, setSearchDebounced] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFromInput, setDateFromInput] = useState('');
  const [dateToInput, setDateToInput] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // accountant can NOT create parcels; admin and manager can
  const canCreateParcel = user?.role === 'admin' || user?.role === 'manager';
  // admin, manager, accountant can change status
  const canChangeStatus = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'accountant';

  const debounceRef = React.useRef<any>(null);

  const handleSearch = (text: string) => {
    setSearch(text);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchDebounced(text);
      setPage(1);
    }, 500);
  };

  const handleApplyDateFilter = () => {
    setDateFrom(dateFromInput);
    setDateTo(dateToInput);
    setPage(1);
  };

  const handleClearDateFilter = () => {
    setDateFromInput('');
    setDateToInput('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const hasActiveDateFilter = !!(dateFrom || dateTo);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['parcels', searchDebounced, statusFilter, page, dateFrom, dateTo],
    queryFn: () => parcelService.list({
      search: searchDebounced || undefined,
      status: statusFilter || undefined,
      page,
      per_page: 20,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    }),
  });

  const parcels = data?.data ?? [];
  const meta = data?.meta;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.headerTitle}>ပါဆယ်များ</Text>
          {meta && (
            <Text style={styles.headerSub}>စုစုပေါင်း {meta.total} ခု</Text>
          )}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.calendarBtn, hasActiveDateFilter && styles.calendarBtnActive]}
            onPress={() => setShowDateFilter(v => !v)}
          >
            <Ionicons
              name="calendar-outline"
              size={20}
              color={hasActiveDateFilter ? COLORS.white : COLORS.primary}
            />
          </TouchableOpacity>
          {canCreateParcel && (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => router.push('/parcels/create')}
            >
              <Ionicons name="add" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.contentArea}>
        {/* Search */}
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={18} color={COLORS.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="ပါဆယ်၊ ပေးပို့သူ၊ လက်ခံသူ၊ လိပ်စာ ရှာဖွေမည်..."
            placeholderTextColor={COLORS.textLight}
            value={search}
            onChangeText={handleSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); setSearchDebounced(''); }}>
              <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
            </TouchableOpacity>
          )}
        </View>

        {/* Status Filter Chips */}
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

        {/* Date Range Filter (collapsible) */}
        {showDateFilter && (
          <View style={styles.dateFilterBox}>
            <View style={styles.dateFilterRow}>
              <View style={styles.dateInputWrap}>
                <Text style={styles.dateLabel}>မှ ရက်စွဲ</Text>
                <TextInput
                  style={styles.dateInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={COLORS.textLight}
                  value={dateFromInput}
                  onChangeText={setDateFromInput}
                  keyboardType="numbers-and-punctuation"
                  maxLength={10}
                />
              </View>
              <Ionicons name="arrow-forward" size={16} color={COLORS.textLight} style={styles.dateArrow} />
              <View style={styles.dateInputWrap}>
                <Text style={styles.dateLabel}>ထိ ရက်စွဲ</Text>
                <TextInput
                  style={styles.dateInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={COLORS.textLight}
                  value={dateToInput}
                  onChangeText={setDateToInput}
                  keyboardType="numbers-and-punctuation"
                  maxLength={10}
                />
              </View>
            </View>
            <View style={styles.dateFilterActions}>
              <TouchableOpacity style={styles.dateApplyBtn} onPress={handleApplyDateFilter}>
                <Ionicons name="search" size={14} color={COLORS.white} />
                <Text style={styles.dateApplyBtnText}>🔍 ရှာဖွေမည်</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dateClearBtn} onPress={handleClearDateFilter}>
                <Ionicons name="close" size={14} color={COLORS.textSecondary} />
                <Text style={styles.dateClearBtnText}>✕ ဖျက်မည်</Text>
              </TouchableOpacity>
            </View>
            {hasActiveDateFilter && (
              <View style={styles.dateActiveIndicator}>
                <Ionicons name="checkmark-circle" size={13} color={COLORS.primary} />
                <Text style={styles.dateActiveText}>
                  {dateFrom && dateTo
                    ? `${dateFrom} မှ ${dateTo} ထိ`
                    : dateFrom
                    ? `${dateFrom} မှ`
                    : `${dateTo} ထိ`}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Parcel List */}
        <View style={styles.listArea}>
          {isLoading ? (
            <ActivityIndicator style={styles.loader} size="large" color={COLORS.primary} />
          ) : (
            <FlatList
            data={parcels}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <ParcelCard parcel={item} canChangeStatus={canChangeStatus} queryClient={queryClient} />}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={() => { setPage(1); refetch(); }} tintColor={COLORS.primary} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="cube-outline" size={48} color={COLORS.primary} />
                </View>
                <Text style={styles.emptyTitle}>ပါဆယ် မတွေ့ပါ</Text>
                <Text style={styles.emptySub}>
                  {search ? `"${search}" နှင့် မကိုက်ညီပါ` : 'ရွေးချယ်ထားသော filter နှင့် မကိုက်ညီပါ'}
                </Text>
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

function ParcelCard({ parcel, canChangeStatus, queryClient }: {
  parcel: Parcel;
  canChangeStatus: boolean;
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  const statusColor = STATUS_COLORS[parcel.status as keyof typeof STATUS_COLORS] || COLORS.textSecondary;
  const statusLabel = STATUS_LABELS_MM[parcel.status as keyof typeof STATUS_LABELS_MM] || parcel.status;
  const priorityColor = PRIORITY_COLORS[parcel.priority as keyof typeof PRIORITY_COLORS] || COLORS.textSecondary;
  const priorityLabel = PRIORITY_LABELS_MM[parcel.priority as keyof typeof PRIORITY_LABELS_MM] || parcel.priority;
  const firstImage = parcel.images && parcel.images.length > 0 ? parcel.images[0] : null;

  const [verifyModalVisible, setVerifyModalVisible] = useState(false);

  const verifyMutation = useMutation({
    mutationFn: () => parcelService.statusTransition(parcel.id, 'VERIFIED'),
    onSuccess: () => {
      setVerifyModalVisible(false);
      queryClient.invalidateQueries({ queryKey: ['parcels'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Status ပြောင်း၍ မရပါ';
      if (Platform.OS === 'web') window.alert(`အမှား: ${msg}`);
      else Alert.alert('အမှား', msg);
    },
  });

  function handleVerify() {
    setVerifyModalVisible(true);
  }

  const isReceived = parcel.status === 'RECEIVED';
  const canVerify = canChangeStatus && isReceived;

  return (
    <>
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/parcels/${parcel.id}`)}
        activeOpacity={0.85}
      >
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={styles.trackingRow}>
          <View style={styles.trackingIcon}>
            <Ionicons name="barcode-outline" size={14} color={COLORS.primary} />
          </View>
          <Text style={styles.trackingNumber}>{parcel.tracking_number}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Card Body — image thumbnail + info side by side */}
      <View style={styles.cardBody}>
        {firstImage ? (
          <Image
            source={{ uri: firstImage.url }}
            style={styles.parcelThumb}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.parcelThumbPlaceholder}>
            <Ionicons name="cube-outline" size={22} color={COLORS.primary + '60'} />
          </View>
        )}

        <View style={styles.infoSide}>
          {/* Sender */}
          {(parcel.sender_name || parcel.sender_phone) && (
            <View style={styles.senderBox}>
              <Ionicons name="arrow-up-circle-outline" size={12} color={COLORS.textLight} />
              <Text style={styles.senderText} numberOfLines={1}>
                {parcel.sender_name || ''}{parcel.sender_name && parcel.sender_phone ? ' · ' : ''}{parcel.sender_phone || ''}
              </Text>
            </View>
          )}
          {/* Recipient */}
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={13} color={COLORS.textSecondary} />
            <Text style={styles.infoText} numberOfLines={1}>{parcel.recipient_name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={13} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>{parcel.recipient_phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={13} color={COLORS.textSecondary} />
            <Text style={styles.infoText} numberOfLines={1}>{parcel.delivery_address}</Text>
          </View>
        </View>
      </View>

      {/* Quick Verify Button — shown only for RECEIVED parcels with permission */}
      {canVerify && (
        <TouchableOpacity
          style={[styles.verifyBtn, verifyMutation.isPending && { opacity: 0.6 }]}
          onPress={handleVerify}
          disabled={verifyMutation.isPending}
          activeOpacity={0.8}
        >
          {verifyMutation.isPending ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={15} color={COLORS.white} />
              <Text style={styles.verifyBtnText}>စစ်ဆေးပြီး အတည်ပြုမည်</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Card Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.footerLeft}>
          <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '18' }]}>
            <Text style={[styles.priorityText, { color: priorityColor }]}>{priorityLabel}</Text>
          </View>
          {parcel.is_cod && (
            <View style={styles.codBadge}>
              <Ionicons name="cash-outline" size={11} color={COLORS.info} />
              <Text style={styles.codText}>COD</Text>
            </View>
          )}
          {firstImage && (
            <View style={styles.imgCountBadge}>
              <Ionicons name="images-outline" size={11} color={COLORS.textSecondary} />
              <Text style={styles.imgCountText}>{parcel.images!.length}</Text>
            </View>
          )}
        </View>
        <Text style={styles.feeText}>{Number(parcel.delivery_fee).toLocaleString()} {parcel.currency === 'THB' ? 'THB' : 'MMK'}</Text>
      </View>
    </TouchableOpacity>

    <ConfirmModal
      visible={verifyModalVisible}
      onClose={() => setVerifyModalVisible(false)}
      onConfirm={() => verifyMutation.mutate()}
      title="စစ်ဆေးပြီး အတည်ပြုမည်"
      message={`${parcel.tracking_number} ကို စစ်ဆေးပြီး (VERIFIED) status သို့ ပြောင်းမည်လား?`}
      confirmText="အတည်ပြုမည်"
      confirmColor={STATUS_COLORS.VERIFIED || COLORS.primary}
      icon="shield-checkmark"
      isLoading={verifyMutation.isPending}
    />
  </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  contentArea: { flex: 1, backgroundColor: COLORS.background, marginTop: -1 },

  // Header
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
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2,
    fontFamily: 'NotoSansMyanmar_400Regular',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calendarBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  calendarBtnActive: {
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },

  // Search
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    borderRadius: 14,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text,
    fontFamily: 'NotoSansMyanmar_400Regular',
  },

  // Filter chips
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
    alignSelf: 'center',
    height: 40,
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600',
    fontFamily: 'NotoSansMyanmar_600SemiBold',
  },
  filterChipTextActive: { color: COLORS.white },

  // Date Filter
  dateFilterBox: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  dateFilterRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  dateInputWrap: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
    fontFamily: 'NotoSansMyanmar_600SemiBold',
  },
  dateInput: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.text,
    fontFamily: 'NotoSansMyanmar_400Regular',
  },
  dateArrow: {
    marginBottom: 10,
  },
  dateFilterActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  dateApplyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 9,
  },
  dateApplyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  dateClearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  dateClearBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    fontFamily: 'NotoSansMyanmar_600SemiBold',
  },
  dateActiveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    backgroundColor: COLORS.primary + '12',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  dateActiveText: {
    fontSize: 12,
    color: COLORS.primary,
    fontFamily: 'NotoSansMyanmar_400Regular',
  },

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
  cardBody: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  parcelThumb: {
    width: 68, height: 68, borderRadius: 10,
    backgroundColor: '#F3F4F6',
    flexShrink: 0,
  },
  parcelThumbPlaceholder: {
    width: 68, height: 68, borderRadius: 10,
    backgroundColor: '#FFF3DC',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  infoSide: { flex: 1, gap: 5 },
  senderBox: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F3F4F6', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  senderText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500', flexShrink: 1,
    fontFamily: 'NotoSansMyanmar_500Medium',
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 13, color: COLORS.text, flex: 1,
    fontFamily: 'NotoSansMyanmar_400Regular',
  },
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
  priorityText: { fontSize: 11, fontWeight: '700',
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  codBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F4FB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  codText: { fontSize: 11, fontWeight: '700', color: COLORS.info,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  imgCountBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 7, paddingVertical: 4, borderRadius: 20,
  },
  imgCountText: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary,
    fontFamily: 'NotoSansMyanmar_600SemiBold',
  },
  verifyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: COLORS.success,
    borderRadius: 10, paddingVertical: 9, marginTop: 10,
  },
  verifyBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.white,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  feeText: { fontSize: 14, fontWeight: '700', color: COLORS.text,
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
