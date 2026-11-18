import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Modal,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { parcelService, Parcel } from '../../src/services/parcelService';
import { userService, User } from '../../src/services/userService';
import { useAuth } from '../../src/context/AuthContext';
import {
  COLORS,
  FONTS,
  STATUS_COLORS,
  STATUS_LABELS_MM,
} from '../../src/constants';
import ConfirmModal from '../../src/components/ConfirmModal';

const ASSIGNABLE_STATUSES = ['VERIFIED', 'IN_TRANSIT', 'FAILED'];

export default function AssignStaffScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Permission guard
  const canAssign = user?.role === 'admin' || user?.role === 'accountant';

  // --- State ---
  const [parcelSearch, setParcelSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);

  // Staff selector modal state
  const [staffModalVisible, setStaffModalVisible] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [staffSearch, setStaffSearch] = useState('');
  const [assignTarget, setAssignTarget] = useState<{ id: number; name: string } | null>(null);

  // --- Queries ---
  const {
    data: parcelsData,
    isLoading: parcelsLoading,
    refetch: refetchParcels,
    isRefetching,
  } = useQuery({
    queryKey: ['assignable-parcels', parcelSearch, statusFilter, page],
    queryFn: () =>
      parcelService.list({
        search: parcelSearch || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        per_page: 30,
        page,
        sort_by: 'updated_at',
        sort_dir: 'desc',
      }),
    enabled: canAssign,
  });

  const { data: staffList, isLoading: staffLoading } = useQuery({
    queryKey: ['delivery-staff'],
    queryFn: () => userService.getDeliveryStaff(),
    enabled: canAssign,
  });

  // --- Assign Mutation ---
  const assignMutation = useMutation({
    mutationFn: ({ parcelId, staffId }: { parcelId: number; staffId: number }) =>
      parcelService.assign(parcelId, staffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignable-parcels'] });
      queryClient.invalidateQueries({ queryKey: ['parcels'] });
      setStaffModalVisible(false);
      setSelectedParcel(null);
      setAssignTarget(null);
      setStaffSearch('');
    },
  });

  // --- Handlers ---
  function openStaffModal(parcel: Parcel) {
    setSelectedParcel(parcel);
    setStaffSearch('');
    setAssignTarget(null);
    setStaffModalVisible(true);
  }

  function handleSelectStaff(s: User) {
    setAssignTarget({ id: s.id, name: s.name });
  }

  function handleConfirmAssign() {
    if (!selectedParcel || !assignTarget) return;
    assignMutation.mutate({ parcelId: selectedParcel.id, staffId: assignTarget.id });
  }

  // Filter parcels by assignable statuses on client side if status = ALL
  const parcels: Parcel[] = (parcelsData?.data ?? []).filter(p =>
    ASSIGNABLE_STATUSES.includes(p.status)
  );

  const filteredStaff = (staffList ?? []).filter(s =>
    s.is_active && s.name.toLowerCase().includes(staffSearch.toLowerCase())
  );

  // --- Status filter chips ---
  const STATUS_CHIPS = [
    { label: 'အားလုံး', value: 'ALL' },
    { label: 'စစ်ဆေးပြီး', value: 'VERIFIED' },
    { label: 'ဆောင်ရွက်နေဆဲ', value: 'IN_TRANSIT' },
    { label: 'မအောင်မြင်', value: 'FAILED' },
  ];

  if (!canAssign) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.permissionBox}>
          <Ionicons name="lock-closed-outline" size={40} color={COLORS.textLight} />
          <Text style={styles.permissionText}>ဤစာမျက်နှာကို ကြည့်ရှုခွင့် မရှိပါ</Text>
        </View>
      </View>
    );
  }

  // --- Parcel card ---
  function renderParcel({ item }: { item: Parcel }) {
    const statusColor = STATUS_COLORS[item.status as keyof typeof STATUS_COLORS] || COLORS.textSecondary;
    const statusLabel = STATUS_LABELS_MM[item.status as keyof typeof STATUS_LABELS_MM] || item.status;
    const assignedStaff = item.active_assignment?.staff;

    return (
      <TouchableOpacity
        style={styles.parcelCard}
        activeOpacity={0.85}
        onPress={() => openStaffModal(item)}
      >
        {/* Top row: tracking + status */}
        <View style={styles.cardTopRow}>
          <Text style={styles.trackingNum} numberOfLines={1}>{item.tracking_number}</Text>
          <View style={[styles.statusPill, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusPillText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        {/* Recipient */}
        <Text style={styles.recipientName} numberOfLines={1}>{item.recipient_name}</Text>
        <Text style={styles.addressText} numberOfLines={1}>{item.delivery_address}</Text>

        {/* Current assignment */}
        <View style={styles.cardBottomRow}>
          {assignedStaff ? (
            <View style={styles.assignedBadge}>
              <Ionicons name="person-circle" size={14} color={COLORS.primary} />
              <Text style={styles.assignedName} numberOfLines={1}>{assignedStaff.name}</Text>
            </View>
          ) : (
            <View style={styles.unassignedBadge}>
              <Ionicons name="person-add-outline" size={13} color={COLORS.textSecondary} />
              <Text style={styles.unassignedText}>မချိတ်ဆက်ရသေး</Text>
            </View>
          )}
          <View style={styles.assignBtn}>
            <Ionicons name="swap-horizontal-outline" size={13} color={COLORS.white} />
            <Text style={styles.assignBtnText}>
              {assignedStaff ? 'ပြောင်းမည်' : 'ချိတ်ဆက်မည်'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>ချိတ်ဆက်ထားသောဝန်ထမ်း</Text>
          {parcelsData && (
            <Text style={styles.headerSub}>
              ပါဆယ် {parcels.length} ခု
            </Text>
          )}
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={16} color={COLORS.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="ခြေရာခံနံပါတ် / လက်ခံသူ ရှာမည်..."
          placeholderTextColor={COLORS.textLight}
          value={parcelSearch}
          onChangeText={v => { setParcelSearch(v); setPage(1); }}
          returnKeyType="search"
        />
        {parcelSearch.length > 0 && (
          <TouchableOpacity onPress={() => { setParcelSearch(''); setPage(1); }}>
            <Ionicons name="close-circle" size={16} color={COLORS.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {/* Status filter chips */}
      <View style={styles.chipRow}>
        {STATUS_CHIPS.map(chip => (
          <TouchableOpacity
            key={chip.value}
            style={[styles.chip, statusFilter === chip.value && styles.chipActive]}
            onPress={() => { setStatusFilter(chip.value); setPage(1); }}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, statusFilter === chip.value && styles.chipTextActive]}>
              {chip.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Parcel list */}
      {parcelsLoading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={parcels}
          keyExtractor={item => String(item.id)}
          renderItem={renderParcel}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetchParcels} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="cube-outline" size={40} color={COLORS.textLight} />
              <Text style={styles.emptyText}>ချိတ်ဆက်ရမည့် ပါဆယ် မတွေ့ပါ</Text>
            </View>
          }
        />
      )}

      {/* Staff selector modal */}
      <Modal
        visible={staffModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setStaffModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Modal header */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>ဝန်ထမ်းရွေးချယ်မည်</Text>
                {selectedParcel && (
                  <Text style={styles.modalSub} numberOfLines={1}>
                    {selectedParcel.tracking_number} · {selectedParcel.recipient_name}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setStaffModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Current assignment info */}
            {selectedParcel?.active_assignment?.staff && (
              <View style={styles.currentAssignRow}>
                <Ionicons name="person-circle" size={16} color={COLORS.primary} />
                <Text style={styles.currentAssignText}>
                  လက်ရှိ: {selectedParcel.active_assignment.staff.name}
                </Text>
              </View>
            )}

            {/* Staff search */}
            <View style={styles.staffSearchBox}>
              <Ionicons name="search-outline" size={14} color={COLORS.textLight} />
              <TextInput
                style={styles.staffSearchInput}
                placeholder="အမည်ဖြင့် ရှာရန်..."
                placeholderTextColor={COLORS.textLight}
                value={staffSearch}
                onChangeText={setStaffSearch}
              />
              {staffSearch.length > 0 && (
                <TouchableOpacity onPress={() => setStaffSearch('')}>
                  <Ionicons name="close-circle" size={14} color={COLORS.textLight} />
                </TouchableOpacity>
              )}
            </View>

            {/* Staff list */}
            {staffLoading ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ margin: 16 }} />
            ) : filteredStaff.length === 0 ? (
              <View style={styles.staffEmpty}>
                <Text style={styles.staffEmptyText}>ဝန်ထမ်း မတွေ့ပါ</Text>
              </View>
            ) : (
              <FlatList
                data={filteredStaff}
                keyExtractor={s => String(s.id)}
                style={styles.staffFlatList}
                showsVerticalScrollIndicator={false}
                renderItem={({ item: s }) => {
                  const isCurrentStaff = selectedParcel?.active_assignment?.staff?.id === s.id;
                  const isSelected = assignTarget?.id === s.id;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.staffItem,
                        isCurrentStaff && styles.staffItemCurrent,
                        isSelected && styles.staffItemSelected,
                      ]}
                      onPress={() => handleSelectStaff(s)}
                      activeOpacity={0.7}
                    >
                      {s.profile_image_url ? (
                        <Image source={{ uri: s.profile_image_url }} style={styles.staffAvatar} />
                      ) : (
                        <View style={[
                          styles.staffAvatarPlaceholder,
                          (isSelected || isCurrentStaff) && { backgroundColor: COLORS.primary },
                        ]}>
                          <Text style={[
                            styles.staffAvatarLetter,
                            (isSelected || isCurrentStaff) && { color: COLORS.white },
                          ]}>
                            {s.name[0].toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={[
                          styles.staffName,
                          (isSelected || isCurrentStaff) && { color: COLORS.primary },
                        ]}>
                          {s.name}
                        </Text>
                        {isCurrentStaff && (
                          <Text style={styles.staffCurrentBadge}>လက်ရှိ ချိတ်ဆက်ထားသည်</Text>
                        )}
                      </View>
                      {isSelected ? (
                        <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                      ) : isCurrentStaff ? (
                        <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.primary} />
                      ) : (
                        <Ionicons name="radio-button-off" size={20} color={COLORS.border} />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            )}

            {/* Confirm button */}
            <TouchableOpacity
              style={[
                styles.confirmBtn,
                (!assignTarget || assignMutation.isPending) && { opacity: 0.5 },
              ]}
              onPress={handleConfirmAssign}
              disabled={!assignTarget || assignMutation.isPending}
            >
              {assignMutation.isPending ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name="person-add-outline" size={16} color={COLORS.white} />
                  <Text style={styles.confirmBtnText}>
                    {assignTarget ? `${assignTarget.name} ကို ချိတ်ဆက်မည်` : 'ဝန်ထမ်းရွေးချယ်ပါ'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // Header
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 14,
    paddingTop: 8,
    gap: 8,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: COLORS.white, fontFamily: FONTS.bold },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 1, fontFamily: FONTS.regular },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.white, margin: 12, marginBottom: 8,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9,
    borderWidth: 1, borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1, fontSize: 13, color: COLORS.text,
    fontFamily: FONTS.regular, paddingVertical: 0,
  },

  // Status chips
  chipRow: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingBottom: 10,
  },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 12, color: COLORS.textSecondary, fontFamily: FONTS.medium },
  chipTextActive: { color: COLORS.white },

  // Parcel list
  listContent: { paddingHorizontal: 12, paddingBottom: 24, gap: 10 },

  // Parcel card
  parcelCard: {
    backgroundColor: COLORS.white, borderRadius: 12,
    padding: 14, borderWidth: 1, borderColor: COLORS.border,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  trackingNum: { fontSize: 13, fontWeight: '700', color: COLORS.primary, fontFamily: FONTS.bold, flex: 1, marginRight: 8 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusPillText: { fontSize: 11, fontWeight: '600', fontFamily: FONTS.semiBold },
  recipientName: { fontSize: 14, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.bold, marginBottom: 2 },
  addressText: { fontSize: 12, color: COLORS.textSecondary, fontFamily: FONTS.regular, marginBottom: 10 },

  cardBottomRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border, paddingTop: 10,
  },
  assignedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.primaryBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    flex: 1, marginRight: 8,
  },
  assignedName: { fontSize: 12, color: COLORS.primary, fontFamily: FONTS.semiBold, flex: 1 },
  unassignedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.background, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    flex: 1, marginRight: 8,
  },
  unassignedText: { fontSize: 12, color: COLORS.textSecondary, fontFamily: FONTS.regular },
  assignBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  assignBtnText: { fontSize: 12, color: COLORS.white, fontFamily: FONTS.semiBold },

  // Empty / permission
  emptyBox: { alignItems: 'center', marginTop: 60, gap: 10 },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, fontFamily: FONTS.regular },
  permissionBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  permissionText: { fontSize: 15, color: COLORS.textSecondary, fontFamily: FONTS.regular },

  // Staff modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '80%', paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'flex-start',
    padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border,
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, fontFamily: FONTS.bold },
  modalSub: { fontSize: 12, color: COLORS.textSecondary, fontFamily: FONTS.regular, marginTop: 2 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.background,
    alignItems: 'center', justifyContent: 'center',
  },
  currentAssignRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primaryBg, paddingHorizontal: 16, paddingVertical: 8,
  },
  currentAssignText: { fontSize: 13, color: COLORS.primary, fontFamily: FONTS.medium },
  staffSearchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    margin: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.background, paddingHorizontal: 12, paddingVertical: 8,
  },
  staffSearchInput: {
    flex: 1, fontSize: 13, color: COLORS.text,
    fontFamily: FONTS.regular, paddingVertical: 0,
  },
  staffFlatList: { maxHeight: 300 },
  staffItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border,
  },
  staffItemCurrent: { backgroundColor: COLORS.primaryBg },
  staffItemSelected: { backgroundColor: COLORS.primaryBg },
  staffAvatar: { width: 38, height: 38, borderRadius: 19 },
  staffAvatarPlaceholder: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  staffAvatarLetter: { fontSize: 15, fontWeight: '700', color: COLORS.textSecondary, fontFamily: FONTS.bold },
  staffName: { fontSize: 14, fontWeight: '600', color: COLORS.text, fontFamily: FONTS.semiBold },
  staffCurrentBadge: { fontSize: 11, color: COLORS.primary, fontFamily: FONTS.regular, marginTop: 1 },
  staffEmpty: { padding: 24, alignItems: 'center' },
  staffEmptyText: { fontSize: 13, color: COLORS.textSecondary, fontFamily: FONTS.regular },

  // Confirm
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.primary, marginHorizontal: 16, marginTop: 12,
    paddingVertical: 14, borderRadius: 12,
  },
  confirmBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.white, fontFamily: FONTS.bold },
});

