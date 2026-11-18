import React, { useState } from 'react';
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

const ASSIGNABLE_STATUSES = ['VERIFIED', 'IN_TRANSIT', 'FAILED'];

export default function AssignStaffScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const canAssign = user?.role === 'admin' || user?.role === 'accountant';

  // Selected staff to view their parcels
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);

  // Reassign modal state
  const [reassignModalVisible, setReassignModalVisible] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [staffSearch, setStaffSearch] = useState('');
  const [assignTarget, setAssignTarget] = useState<{ id: number; name: string } | null>(null);

  // Fetch ALL active delivery staff (for the tab strip)
  const { data: staffList, isLoading: staffLoading } = useQuery({
    queryKey: ['delivery-staff'],
    queryFn: () => userService.getDeliveryStaff(),
    enabled: canAssign,
  });

  // Fetch parcels assigned BY the current user
  const {
    data: myParcels,
    isLoading: parcelsLoading,
    refetch: refetchParcels,
    isRefetching,
  } = useQuery({
    queryKey: ['my-assigned-parcels', user?.id],
    queryFn: () =>
      parcelService.list({
        assigned_by_id: user?.id,
        per_page: 200,
        sort_by: 'updated_at',
        sort_dir: 'desc',
      }),
    enabled: canAssign && !!user?.id,
    select: (data) => ({
      ...data,
      // Keep only parcels with assignable statuses
      data: data.data.filter((p) => ASSIGNABLE_STATUSES.includes(p.status)),
    }),
  });

  // Assign / Reassign mutation
  const assignMutation = useMutation({
    mutationFn: ({ parcelId, staffId }: { parcelId: number; staffId: number }) =>
      parcelService.assign(parcelId, staffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-assigned-parcels'] });
      queryClient.invalidateQueries({ queryKey: ['parcels'] });
      setReassignModalVisible(false);
      setSelectedParcel(null);
      setAssignTarget(null);
      setStaffSearch('');
    },
  });

  function openReassignModal(parcel: Parcel) {
    setSelectedParcel(parcel);
    setStaffSearch('');
    setAssignTarget(null);
    setReassignModalVisible(true);
  }

  function handleConfirmAssign() {
    if (!selectedParcel || !assignTarget) return;
    assignMutation.mutate({ parcelId: selectedParcel.id, staffId: assignTarget.id });
  }

  const allParcels = myParcels?.data ?? [];

  // Build staff tabs: only staff who have at least one parcel assigned (by me)
  const staffWithParcels = React.useMemo(() => {
    const staffMap = new Map<number, { staff: { id: number; name: string }; count: number }>();
    allParcels.forEach((p) => {
      const s = p.active_assignment?.staff;
      if (!s) return;
      const existing = staffMap.get(s.id);
      if (existing) existing.count++;
      else staffMap.set(s.id, { staff: s, count: 1 });
    });
    return Array.from(staffMap.values());
  }, [allParcels]);

  // Parcels filtered by selected staff
  const filteredParcels =
    selectedStaffId === null
      ? allParcels
      : allParcels.filter((p) => p.active_assignment?.staff?.id === selectedStaffId);

  const filteredModalStaff = (staffList ?? []).filter(
    (s) => s.is_active && s.name.toLowerCase().includes(staffSearch.toLowerCase())
  );

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

  // Parcel card
  function renderParcel({ item }: { item: Parcel }) {
    const statusColor = STATUS_COLORS[item.status as keyof typeof STATUS_COLORS] || COLORS.textSecondary;
    const statusLabel = STATUS_LABELS_MM[item.status as keyof typeof STATUS_LABELS_MM] || item.status;
    const assignedStaff = item.active_assignment?.staff;

    return (
      <TouchableOpacity
        style={styles.parcelCard}
        activeOpacity={0.85}
        onPress={() => openReassignModal(item)}
      >
        <View style={styles.cardTopRow}>
          <Text style={styles.trackingNum} numberOfLines={1}>{item.tracking_number}</Text>
          <View style={[styles.statusPill, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusPillText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        <Text style={styles.recipientName} numberOfLines={1}>{item.recipient_name}</Text>
        <Text style={styles.addressText} numberOfLines={1}>{item.delivery_address}</Text>

        <View style={styles.cardFooter}>
          {assignedStaff && (
            <View style={styles.assignedBadge}>
              <Ionicons name="person-circle" size={13} color={COLORS.primary} />
              <Text style={styles.assignedName} numberOfLines={1}>{assignedStaff.name}</Text>
            </View>
          )}
          <View style={styles.reassignBtn}>
            <Ionicons name="swap-horizontal-outline" size={12} color={COLORS.white} />
            <Text style={styles.reassignBtnText}>ပြောင်းမည်</Text>
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
          <Text style={styles.headerSub}>
            {parcelsLoading ? '...' : `ပါဆယ် ${filteredParcels.length} ခု`}
          </Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Staff filter tabs */}
      {staffWithParcels.length > 0 && (
        <View style={styles.staffTabBar}>
          <FlatList
            data={[{ staff: { id: -1, name: 'အားလုံး' }, count: allParcels.length }, ...staffWithParcels]}
            keyExtractor={(item) => String(item.staff.id)}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.staffTabList}
            renderItem={({ item }) => {
              const isActive = item.staff.id === -1
                ? selectedStaffId === null
                : selectedStaffId === item.staff.id;
              return (
                <TouchableOpacity
                  style={[styles.staffTab, isActive && styles.staffTabActive]}
                  onPress={() => setSelectedStaffId(item.staff.id === -1 ? null : item.staff.id)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.staffTabName, isActive && styles.staffTabNameActive]}>
                    {item.staff.name}
                  </Text>
                  <View style={[styles.staffTabBadge, isActive && styles.staffTabBadgeActive]}>
                    <Text style={[styles.staffTabBadgeText, isActive && styles.staffTabBadgeTextActive]}>
                      {item.count}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

      {/* Parcel list */}
      {parcelsLoading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : filteredParcels.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="cube-outline" size={44} color={COLORS.textLight} />
          <Text style={styles.emptyText}>ချိတ်ဆက်ထားသော ပါဆယ် မတွေ့ပါ</Text>
          <Text style={styles.emptySubText}>သင်က assign လုပ်ထားသော ပါဆယ်တွေသာ ဤနေရာတွင် ပြမည်</Text>
        </View>
      ) : (
        <FlatList
          data={filteredParcels}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderParcel}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetchParcels}
              tintColor={COLORS.primary}
            />
          }
        />
      )}

      {/* Reassign Modal */}
      <Modal
        visible={reassignModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setReassignModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>ဝန်ထမ်း ပြောင်းချိတ်မည်</Text>
                {selectedParcel && (
                  <Text style={styles.modalSub} numberOfLines={1}>
                    {selectedParcel.tracking_number} · {selectedParcel.recipient_name}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => setReassignModalVisible(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedParcel?.active_assignment?.staff && (
              <View style={styles.currentAssignRow}>
                <Ionicons name="person-circle" size={16} color={COLORS.primary} />
                <Text style={styles.currentAssignText}>
                  လက်ရှိ: {selectedParcel.active_assignment.staff.name}
                </Text>
              </View>
            )}

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

            {filteredModalStaff.length === 0 ? (
              <View style={styles.staffEmpty}>
                <Text style={styles.staffEmptyText}>ဝန်ထမ်း မတွေ့ပါ</Text>
              </View>
            ) : (
              <FlatList
                data={filteredModalStaff}
                keyExtractor={(s) => String(s.id)}
                style={styles.staffFlatList}
                showsVerticalScrollIndicator={false}
                renderItem={({ item: s }) => {
                  const isCurrentStaff = selectedParcel?.active_assignment?.staff?.id === s.id;
                  const isSelected = assignTarget?.id === s.id;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.staffItem,
                        (isCurrentStaff || isSelected) && styles.staffItemActive,
                      ]}
                      onPress={() => setAssignTarget({ id: s.id, name: s.name })}
                      activeOpacity={0.7}
                    >
                      {s.profile_image_url ? (
                        <Image source={{ uri: s.profile_image_url }} style={styles.staffAvatar} />
                      ) : (
                        <View
                          style={[
                            styles.staffAvatarPlaceholder,
                            (isSelected || isCurrentStaff) && { backgroundColor: COLORS.primary },
                          ]}
                        >
                          <Text
                            style={[
                              styles.staffAvatarLetter,
                              (isSelected || isCurrentStaff) && { color: COLORS.white },
                            ]}
                          >
                            {s.name[0].toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.staffName,
                            (isSelected || isCurrentStaff) && { color: COLORS.primary },
                          ]}
                        >
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
                  <Ionicons name="swap-horizontal-outline" size={16} color={COLORS.white} />
                  <Text style={styles.confirmBtnText}>
                    {assignTarget ? `${assignTarget.name} သို့ ပြောင်းမည်` : 'ဝန်ထမ်းရွေးချယ်ပါ'}
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

  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingBottom: 14, paddingTop: 8, gap: 8,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: COLORS.white, fontFamily: FONTS.bold },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 1, fontFamily: FONTS.regular },

  // Staff tabs
  staffTabBar: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  staffTabList: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  staffTab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  staffTabActive: { backgroundColor: COLORS.primaryBg, borderColor: COLORS.primary },
  staffTabName: { fontSize: 12, color: COLORS.textSecondary, fontFamily: FONTS.medium },
  staffTabNameActive: { color: COLORS.primary, fontFamily: FONTS.semiBold },
  staffTabBadge: {
    backgroundColor: COLORS.border, borderRadius: 10,
    paddingHorizontal: 6, paddingVertical: 1,
  },
  staffTabBadgeActive: { backgroundColor: COLORS.primary },
  staffTabBadgeText: { fontSize: 10, color: COLORS.textSecondary, fontFamily: FONTS.semiBold },
  staffTabBadgeTextActive: { color: COLORS.white },

  // List
  listContent: { padding: 12, gap: 10 },
  parcelCard: {
    backgroundColor: COLORS.white, borderRadius: 12,
    padding: 14, borderWidth: 1, borderColor: COLORS.border,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 4,
  },
  trackingNum: {
    fontSize: 13, fontWeight: '700', color: COLORS.primary,
    fontFamily: FONTS.bold, flex: 1, marginRight: 8,
  },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusPillText: { fontSize: 11, fontWeight: '600', fontFamily: FONTS.semiBold },
  recipientName: {
    fontSize: 14, fontWeight: '700', color: COLORS.text,
    fontFamily: FONTS.bold, marginBottom: 2,
  },
  addressText: {
    fontSize: 12, color: COLORS.textSecondary,
    fontFamily: FONTS.regular, marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border, paddingTop: 8,
  },
  assignedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primaryBg, paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 20, flex: 1, marginRight: 8,
  },
  assignedName: { fontSize: 12, color: COLORS.primary, fontFamily: FONTS.semiBold, flex: 1 },
  reassignBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primary, paddingHorizontal: 12,
    paddingVertical: 5, borderRadius: 20,
  },
  reassignBtnText: { fontSize: 12, color: COLORS.white, fontFamily: FONTS.semiBold },

  // Empty / permission
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  emptyText: { fontSize: 15, color: COLORS.textSecondary, fontFamily: FONTS.semiBold, textAlign: 'center' },
  emptySubText: { fontSize: 12, color: COLORS.textLight, fontFamily: FONTS.regular, textAlign: 'center' },
  permissionBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  permissionText: { fontSize: 15, color: COLORS.textSecondary, fontFamily: FONTS.regular },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
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
  staffItemActive: { backgroundColor: COLORS.primaryBg },
  staffAvatar: { width: 36, height: 36, borderRadius: 18 },
  staffAvatarPlaceholder: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  staffAvatarLetter: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary, fontFamily: FONTS.bold },
  staffName: { fontSize: 14, fontWeight: '600', color: COLORS.text, fontFamily: FONTS.semiBold },
  staffCurrentBadge: { fontSize: 11, color: COLORS.primary, fontFamily: FONTS.regular, marginTop: 1 },
  staffEmpty: { padding: 24, alignItems: 'center' },
  staffEmptyText: { fontSize: 13, color: COLORS.textSecondary, fontFamily: FONTS.regular },

  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.primary, marginHorizontal: 16, marginTop: 12,
    paddingVertical: 14, borderRadius: 12,
  },
  confirmBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.white, fontFamily: FONTS.bold },
});
