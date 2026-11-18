import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
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

  // Selected staff to view
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);

  // Reassign modal state
  const [reassignModalVisible, setReassignModalVisible] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [staffSearch, setStaffSearch] = useState('');
  const [assignTarget, setAssignTarget] = useState<{ id: number; name: string } | null>(null);

  // --- Fetch delivery staff ---
  const { data: staffList, isLoading: staffLoading, refetch: refetchStaff } = useQuery({
    queryKey: ['delivery-staff'],
    queryFn: () => userService.getDeliveryStaff(),
    enabled: canAssign,
  });

  // --- Fetch parcels assigned to selected staff ---
  const {
    data: parcelsData,
    isLoading: parcelsLoading,
    refetch: refetchParcels,
    isRefetching,
  } = useQuery({
    queryKey: ['assigned-parcels', selectedStaffId],
    queryFn: () =>
      parcelService.list({
        per_page: 100,
        sort_by: 'updated_at',
        sort_dir: 'desc',
      }),
    enabled: canAssign && selectedStaffId !== null,
    select: (data) => ({
      ...data,
      data: data.data.filter(
        (p) =>
          ASSIGNABLE_STATUSES.includes(p.status) &&
          p.active_assignment?.staff?.id === selectedStaffId
      ),
    }),
  });

  // --- Assign / Reassign Mutation ---
  const assignMutation = useMutation({
    mutationFn: ({ parcelId, staffId }: { parcelId: number; staffId: number }) =>
      parcelService.assign(parcelId, staffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assigned-parcels'] });
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

  const activeStaff = (staffList ?? []).filter((s) => s.is_active);
  const filteredModalStaff = (staffList ?? []).filter(
    (s) => s.is_active && s.name.toLowerCase().includes(staffSearch.toLowerCase())
  );

  const selectedStaff = activeStaff.find((s) => s.id === selectedStaffId);
  const assignedParcels = parcelsData?.data ?? [];

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

  // --- Staff card ---
  function renderStaffCard({ item: s }: { item: User }) {
    const isSelected = s.id === selectedStaffId;
    return (
      <TouchableOpacity
        style={[styles.staffCard, isSelected && styles.staffCardActive]}
        onPress={() => setSelectedStaffId(isSelected ? null : s.id)}
        activeOpacity={0.8}
      >
        {s.profile_image_url ? (
          <Image
            source={{ uri: s.profile_image_url }}
            style={[styles.staffAvatar, isSelected && { borderColor: COLORS.primary, borderWidth: 2 }]}
          />
        ) : (
          <View style={[styles.staffAvatarPlaceholder, isSelected && { backgroundColor: COLORS.primary }]}>
            <Text style={[styles.staffAvatarLetter, isSelected && { color: COLORS.white }]}>
              {s.name[0].toUpperCase()}
            </Text>
          </View>
        )}
        <Text
          style={[styles.staffCardName, isSelected && { color: COLORS.primary }]}
          numberOfLines={1}
        >
          {s.name}
        </Text>
        {isSelected && (
          <View style={styles.selectedDot} />
        )}
      </TouchableOpacity>
    );
  }

  // --- Parcel row ---
  function renderParcel({ item }: { item: Parcel }) {
    const statusColor = STATUS_COLORS[item.status as keyof typeof STATUS_COLORS] || COLORS.textSecondary;
    const statusLabel = STATUS_LABELS_MM[item.status as keyof typeof STATUS_LABELS_MM] || item.status;

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
          {selectedStaff && (
            <Text style={styles.headerSub}>{selectedStaff.name} · {assignedParcels.length} ခု</Text>
          )}
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Staff horizontal list */}
      <View style={styles.staffSection}>
        {staffLoading ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ margin: 16 }} />
        ) : activeStaff.length === 0 ? (
          <Text style={styles.noStaffText}>ဝန်ထမ်း မတွေ့ပါ</Text>
        ) : (
          <FlatList
            data={activeStaff}
            keyExtractor={(s) => String(s.id)}
            renderItem={renderStaffCard}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.staffList}
          />
        )}
      </View>

      {/* Parcel list for selected staff */}
      {selectedStaffId === null ? (
        <View style={styles.emptyBox}>
          <Ionicons name="person-outline" size={40} color={COLORS.textLight} />
          <Text style={styles.emptyText}>ဝန်ထမ်းတစ်ဦး ရွေးချယ်ပါ</Text>
        </View>
      ) : parcelsLoading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : assignedParcels.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="cube-outline" size={40} color={COLORS.textLight} />
          <Text style={styles.emptyText}>ချိတ်ဆက်ထားသော ပါဆယ် မတွေ့ပါ</Text>
        </View>
      ) : (
        <FlatList
          data={assignedParcels}
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
            {/* Modal header */}
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

            {/* Current assignment */}
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
                        <Image source={{ uri: s.profile_image_url }} style={styles.staffAvatarSm} />
                      ) : (
                        <View
                          style={[
                            styles.staffAvatarSmPlaceholder,
                            (isSelected || isCurrentStaff) && { backgroundColor: COLORS.primary },
                          ]}
                        >
                          <Text
                            style={[
                              styles.staffAvatarSmLetter,
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
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 1, fontFamily: FONTS.regular },

  // Staff horizontal section
  staffSection: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 12,
  },
  staffList: { paddingHorizontal: 12, gap: 10 },
  staffCard: {
    alignItems: 'center', width: 72,
    paddingVertical: 8, paddingHorizontal: 4,
    borderRadius: 12, backgroundColor: COLORS.background,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  staffCardActive: {
    backgroundColor: COLORS.primaryBg,
    borderColor: COLORS.primary,
  },
  staffAvatar: { width: 44, height: 44, borderRadius: 22, marginBottom: 6 },
  staffAvatarPlaceholder: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 6,
  },
  staffAvatarLetter: { fontSize: 18, fontWeight: '700', color: COLORS.textSecondary, fontFamily: FONTS.bold },
  staffCardName: {
    fontSize: 11, color: COLORS.text, fontFamily: FONTS.medium,
    textAlign: 'center', lineHeight: 14,
  },
  selectedDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: COLORS.primary, marginTop: 4,
  },
  noStaffText: {
    fontSize: 13, color: COLORS.textSecondary,
    fontFamily: FONTS.regular, padding: 16,
  },

  // Parcel list
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
    flexDirection: 'row', justifyContent: 'flex-end',
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border, paddingTop: 8,
  },
  reassignBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primary, paddingHorizontal: 12,
    paddingVertical: 5, borderRadius: 20,
  },
  reassignBtnText: { fontSize: 12, color: COLORS.white, fontFamily: FONTS.semiBold },

  // Empty / permission
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, fontFamily: FONTS.regular },
  permissionBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  permissionText: { fontSize: 15, color: COLORS.textSecondary, fontFamily: FONTS.regular },

  // Reassign modal
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
  staffItemActive: { backgroundColor: COLORS.primaryBg },
  staffAvatarSm: { width: 36, height: 36, borderRadius: 18 },
  staffAvatarSmPlaceholder: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  staffAvatarSmLetter: {
    fontSize: 14, fontWeight: '700', color: COLORS.textSecondary, fontFamily: FONTS.bold,
  },
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
