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
import { userService } from '../../src/services/userService';
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

  // View state: null = staff list, number = selected staff id (parcel list)
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [selectedStaffName, setSelectedStaffName] = useState<string>('');

  // Reassign modal
  const [reassignModalVisible, setReassignModalVisible] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [staffSearch, setStaffSearch] = useState('');
  const [assignTarget, setAssignTarget] = useState<{ id: number; name: string } | null>(null);

  // Fetch delivery staff list (for reassign modal)
  const { data: staffList } = useQuery({
    queryKey: ['delivery-staff'],
    queryFn: () => userService.getDeliveryStaff(),
    enabled: canAssign,
  });

  // Fetch parcels assigned BY current user
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
      data: data.data.filter((p) => ASSIGNABLE_STATUSES.includes(p.status)),
    }),
  });

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

  const allParcels = myParcels?.data ?? [];

  // Build staff summary list from parcel data
  const staffGroups = React.useMemo(() => {
    const map = new Map<number, {
      id: number;
      name: string;
      parcels: Parcel[];
      inTransit: number;
      verified: number;
      failed: number;
    }>();
    allParcels.forEach((p) => {
      const s = p.active_assignment?.staff;
      if (!s) return;
      if (!map.has(s.id)) {
        map.set(s.id, { id: s.id, name: s.name, parcels: [], inTransit: 0, verified: 0, failed: 0 });
      }
      const entry = map.get(s.id)!;
      entry.parcels.push(p);
      if (p.status === 'IN_TRANSIT') entry.inTransit++;
      else if (p.status === 'VERIFIED') entry.verified++;
      else if (p.status === 'FAILED') entry.failed++;
    });
    return Array.from(map.values()).sort((a, b) => b.parcels.length - a.parcels.length);
  }, [allParcels]);

  // Parcels for selected staff
  const staffParcels = selectedStaffId !== null
    ? allParcels.filter((p) => p.active_assignment?.staff?.id === selectedStaffId)
    : [];

  const filteredModalStaff = (staffList ?? []).filter(
    (s) => s.is_active && s.name.toLowerCase().includes(staffSearch.toLowerCase())
  );

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

  // ── Parcel card (inside staff parcel view) ──────────────────
  function renderParcel({ item }: { item: Parcel }) {
    const statusColor = STATUS_COLORS[item.status as keyof typeof STATUS_COLORS] || COLORS.textSecondary;
    const statusLabel = STATUS_LABELS_MM[item.status as keyof typeof STATUS_LABELS_MM] || item.status;
    return (
      <View style={styles.parcelCard}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push(`/parcels/${item.id}` as any)}
        >
          <View style={styles.cardTopRow}>
            <Text style={styles.trackingNum} numberOfLines={1}>{item.tracking_number}</Text>
            <View style={[styles.statusPill, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.statusPillText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>
          <Text style={styles.recipientName} numberOfLines={1}>{item.recipient_name}</Text>
          <Text style={styles.addressText} numberOfLines={1}>{item.delivery_address}</Text>
        </TouchableOpacity>
        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.detailBtn}
            onPress={() => router.push(`/parcels/${item.id}` as any)}
            activeOpacity={0.7}
          >
            <Ionicons name="document-text-outline" size={12} color={COLORS.primary} />
            <Text style={styles.detailBtnText}>အသေးစိတ်</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.reassignBtn}
            onPress={() => openReassignModal(item)}
            activeOpacity={0.8}
          >
            <Ionicons name="swap-horizontal-outline" size={12} color={COLORS.white} />
            <Text style={styles.reassignBtnText}>ဝန်ထမ်းပြောင်းမည်</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Staff row ───────────────────────────────────────────────
  function renderStaffRow({ item }: { item: typeof staffGroups[0] }) {
    return (
      <TouchableOpacity
        style={styles.staffRow}
        activeOpacity={0.8}
        onPress={() => { setSelectedStaffId(item.id); setSelectedStaffName(item.name); }}
      >
        <View style={styles.staffAvatarPlaceholder}>
          <Text style={styles.staffAvatarLetter}>{item.name[0].toUpperCase()}</Text>
        </View>

        <View style={styles.staffRowInfo}>
          <Text style={styles.staffRowName}>{item.name}</Text>
          <View style={styles.staffRowStats}>
            {item.inTransit > 0 && (
              <View style={[styles.statBadge, { backgroundColor: COLORS.warning + '20' }]}>
                <Text style={[styles.statBadgeText, { color: COLORS.warning }]}>
                  ဆောင်ရွက်နေဆဲ {item.inTransit}
                </Text>
              </View>
            )}
            {item.verified > 0 && (
              <View style={[styles.statBadge, { backgroundColor: '#7C3AED20' }]}>
                <Text style={[styles.statBadgeText, { color: '#7C3AED' }]}>
                  စစ်ဆေးပြီး {item.verified}
                </Text>
              </View>
            )}
            {item.failed > 0 && (
              <View style={[styles.statBadge, { backgroundColor: COLORS.error + '20' }]}>
                <Text style={[styles.statBadgeText, { color: COLORS.error }]}>
                  မအောင်မြင် {item.failed}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.staffRowCount}>
          <Text style={styles.staffRowCountNum}>{item.parcels.length}</Text>
          <Text style={styles.staffRowCountLabel}>ပါဆယ်</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
      </TouchableOpacity>
    );
  }

  // ── PARCEL LIST VIEW (staff selected) ───────────────────────
  if (selectedStaffId !== null) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => { setSelectedStaffId(null); setSelectedStaffName(''); }}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{selectedStaffName}</Text>
            <Text style={styles.headerSub}>ပါဆယ် {staffParcels.length} ခု</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        <FlatList
          data={staffParcels}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderParcel}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetchParcels} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="cube-outline" size={40} color={COLORS.textLight} />
              <Text style={styles.emptyText}>ပါဆယ် မတွေ့ပါ</Text>
            </View>
          }
        />

        {/* Reassign Modal */}
        <ReassignModal
          visible={reassignModalVisible}
          parcel={selectedParcel}
          staffList={filteredModalStaff}
          staffSearch={staffSearch}
          onSearchChange={setStaffSearch}
          assignTarget={assignTarget}
          onSelectStaff={(s) => setAssignTarget({ id: s.id, name: s.name })}
          onClose={() => setReassignModalVisible(false)}
          onConfirm={handleConfirmAssign}
          isPending={assignMutation.isPending}
        />
      </View>
    );
  }

  // ── STAFF LIST VIEW (default) ────────────────────────────────
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
            {parcelsLoading ? '...' : `ဝန်ထမ်း ${staffGroups.length} ဦး · ပါဆယ် ${allParcels.length} ခု`}
          </Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {parcelsLoading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : staffGroups.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="people-outline" size={44} color={COLORS.textLight} />
          <Text style={styles.emptyText}>ချိတ်ဆက်ထားသော ဝန်ထမ်း မတွေ့ပါ</Text>
          <Text style={styles.emptySubText}>သင်က assign လုပ်ထားသော ပါဆယ်တွေ ရှိမှ ဤနေရာတွင် ပြမည်</Text>
        </View>
      ) : (
        <FlatList
          data={staffGroups}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderStaffRow}
          contentContainerStyle={styles.staffListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetchParcels} tintColor={COLORS.primary} />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

// ── Reassign Modal Component ─────────────────────────────────
function ReassignModal({
  visible, parcel, staffList, staffSearch, onSearchChange,
  assignTarget, onSelectStaff, onClose, onConfirm, isPending,
}: any) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>ဝန်ထမ်း ပြောင်းချိတ်မည်</Text>
              {parcel && (
                <Text style={styles.modalSub} numberOfLines={1}>
                  {parcel.tracking_number} · {parcel.recipient_name}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {parcel?.active_assignment?.staff && (
            <View style={styles.currentAssignRow}>
              <Ionicons name="person-circle" size={16} color={COLORS.primary} />
              <Text style={styles.currentAssignText}>
                လက်ရှိ: {parcel.active_assignment.staff.name}
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
              onChangeText={onSearchChange}
            />
            {staffSearch.length > 0 && (
              <TouchableOpacity onPress={() => onSearchChange('')}>
                <Ionicons name="close-circle" size={14} color={COLORS.textLight} />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={staffList}
            keyExtractor={(s: any) => String(s.id)}
            style={styles.staffFlatList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.staffEmpty}>
                <Text style={styles.staffEmptyText}>ဝန်ထမ်း မတွေ့ပါ</Text>
              </View>
            }
            renderItem={({ item: s }: any) => {
              const isCurrentStaff = parcel?.active_assignment?.staff?.id === s.id;
              const isSelected = assignTarget?.id === s.id;
              return (
                <TouchableOpacity
                  style={[styles.staffItem, (isCurrentStaff || isSelected) && styles.staffItemActive]}
                  onPress={() => onSelectStaff(s)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.staffAvatarSm,
                    (isSelected || isCurrentStaff) && { backgroundColor: COLORS.primary },
                  ]}>
                    <Text style={[
                      styles.staffAvatarSmLetter,
                      (isSelected || isCurrentStaff) && { color: COLORS.white },
                    ]}>
                      {s.name[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.staffName, (isSelected || isCurrentStaff) && { color: COLORS.primary }]}>
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

          <TouchableOpacity
            style={[styles.confirmBtn, (!assignTarget || isPending) && { opacity: 0.5 }]}
            onPress={onConfirm}
            disabled={!assignTarget || isPending}
          >
            {isPending ? (
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

  // Staff list
  staffListContent: { paddingVertical: 8 },
  staffRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 14,
  },
  staffAvatarPlaceholder: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: COLORS.primaryBg,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: COLORS.primary + '40',
  },
  staffAvatarLetter: { fontSize: 18, fontWeight: '700', color: COLORS.primary, fontFamily: FONTS.bold },
  staffRowInfo: { flex: 1, gap: 5 },
  staffRowName: { fontSize: 15, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.bold },
  staffRowStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  statBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  statBadgeText: { fontSize: 10, fontWeight: '600', fontFamily: FONTS.semiBold },
  staffRowCount: { alignItems: 'center', marginRight: 4 },
  staffRowCountNum: { fontSize: 20, fontWeight: '800', color: COLORS.primary, fontFamily: FONTS.bold },
  staffRowCountLabel: { fontSize: 10, color: COLORS.textSecondary, fontFamily: FONTS.regular },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: COLORS.border, marginLeft: 74 },

  // Parcel list
  listContent: { padding: 12, gap: 10 },
  parcelCard: {
    backgroundColor: COLORS.white, borderRadius: 12,
    padding: 14, borderWidth: 1, borderColor: COLORS.border,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  trackingNum: { fontSize: 13, fontWeight: '700', color: COLORS.primary, fontFamily: FONTS.bold, flex: 1, marginRight: 8 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusPillText: { fontSize: 11, fontWeight: '600', fontFamily: FONTS.semiBold },
  recipientName: { fontSize: 14, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.bold, marginBottom: 2 },
  addressText: { fontSize: 12, color: COLORS.textSecondary, fontFamily: FONTS.regular, marginBottom: 10 },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border, paddingTop: 8,
    gap: 8,
  },
  detailBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primaryBg, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.primary + '40',
  },
  detailBtnText: { fontSize: 12, color: COLORS.primary, fontFamily: FONTS.semiBold },
  reassignBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
  },
  reassignBtnText: { fontSize: 12, color: COLORS.white, fontFamily: FONTS.semiBold },

  // Empty / permission
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24, marginTop: 60 },
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
  staffSearchInput: { flex: 1, fontSize: 13, color: COLORS.text, fontFamily: FONTS.regular, paddingVertical: 0 },
  staffFlatList: { maxHeight: 300 },
  staffItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border,
  },
  staffItemActive: { backgroundColor: COLORS.primaryBg },
  staffAvatarSm: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  staffAvatarSmLetter: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary, fontFamily: FONTS.bold },
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
