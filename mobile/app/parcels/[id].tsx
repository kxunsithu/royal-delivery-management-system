import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Linking,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { parcelService } from '../../src/services/parcelService';
import { userService } from '../../src/services/userService';
import { useAuth } from '../../src/context/AuthContext';
import {
  COLORS,
  STATUS_COLORS,
  STATUS_LABELS_MM,
  PRIORITY_LABELS_MM,
  PRIORITY_COLORS,
} from '../../src/constants';
import ImagePreviewModal from '../../src/components/ImagePreviewModal';

const STATUS_TRANSITIONS: Record<string, string[]> = {
  RECEIVED: ['VERIFIED', 'DAMAGED'],
  VERIFIED: ['DELIVERED', 'FAILED', 'DAMAGED'],
  IN_TRANSIT: ['DELIVERED', 'FAILED'],
  FAILED: ['DELIVERED'],
  DELIVERED: [],
  DAMAGED: [],
};

export default function ParcelDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: parcel, isLoading, refetch } = useQuery({
    queryKey: ['parcel', id],
    queryFn: () => parcelService.get(Number(id)),
  });

  // Permission flags
  // canChangeStatus: admin, manager, accountant
  // canAssign: admin, accountant (manager CANNOT assign)
  // canEditParcel: admin, manager (accountant CANNOT add/edit/delete)
  const canChangeStatus = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'accountant';
  const canAssign = user?.role === 'admin' || user?.role === 'accountant';
  const canEditParcel = user?.role === 'admin' || user?.role === 'manager';

  const { data: staffList } = useQuery({
    queryKey: ['delivery-staff'],
    queryFn: () => userService.getDeliveryStaff(),
    enabled: canAssign,
  });

  const deleteMutation = useMutation({
    mutationFn: () => parcelService.delete(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parcels'] });
      router.back();
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ status, reason }: { status: string; reason?: string }) =>
      parcelService.statusTransition(Number(id), status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parcel', id] });
      queryClient.invalidateQueries({ queryKey: ['parcels'] });
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ staffId }: { staffId: number }) =>
      parcelService.assign(Number(id), staffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parcel', id] });
      queryClient.invalidateQueries({ queryKey: ['parcels'] });
    },
  });

  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [staffSearch, setStaffSearch] = useState('');

  const isTerminal = parcel?.status === 'DELIVERED' || parcel?.status === 'DAMAGED';

  function handleDelete() {
    Alert.alert(
      'ပါဆယ် ဖျက်မည်',
      'ဤပါဆယ်ကို အတည်ပြု ဖျက်မည်လား?',
      [
        { text: 'မလုပ်တော့', style: 'cancel' },
        { text: 'ဖျက်မည်', style: 'destructive', onPress: () => deleteMutation.mutate() },
      ]
    );
  }

  function handleStatusChange(toStatus: string) {
    Alert.alert(
      'အခြေအနေ ပြောင်းမည်',
      `"${STATUS_LABELS_MM[toStatus as keyof typeof STATUS_LABELS_MM]}" သို့ ပြောင်းမည်လား?`,
      [
        { text: 'မလုပ်တော့', style: 'cancel' },
        { text: 'ပြောင်းမည်', onPress: () => statusMutation.mutate({ status: toStatus }) },
      ]
    );
  }

  function handleAssign(staffId: number, staffName: string) {
    const hasExisting = !!parcel?.active_assignment;
    const currentName = parcel?.active_assignment?.staff?.name;
    const title = hasExisting ? 'ဝန်ထမ်း ပြောင်းချိတ်မည်' : 'ဝန်ထမ်း ချိတ်ဆက်မည်';
    const msg = hasExisting
      ? `${currentName} မှ ${staffName} သို့ ပြောင်းချိတ်မည်လား?`
      : `${staffName} ကို ချိတ်ဆက်မည်လား?`;
    Alert.alert(title, msg, [
      { text: 'မလုပ်တော့', style: 'cancel' },
      { text: hasExisting ? 'ပြောင်းချိတ်မည်' : 'ချိတ်ဆက်မည်', onPress: () => assignMutation.mutate({ staffId }) },
    ]);
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  if (!parcel) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>ပါဆယ် မတွေ့ပါ</Text>
        </View>
      </View>
    );
  }

  const statusColor = STATUS_COLORS[parcel.status as keyof typeof STATUS_COLORS] || COLORS.textSecondary;
  const statusLabel = STATUS_LABELS_MM[parcel.status as keyof typeof STATUS_LABELS_MM] || parcel.status;
  const availableTransitions = STATUS_TRANSITIONS[parcel.status] || [];

  return (
    <View style={[styles.container, { backgroundColor: statusColor }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: statusColor, paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{parcel.tracking_number}</Text>
          <View style={styles.headerStatusBadge}>
            <Text style={styles.headerStatusText}>{statusLabel}</Text>
          </View>
        </View>
        {canEditParcel && !isTerminal && (
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerActionBtn}
              onPress={() => router.push(`/parcels/edit/${id}`)}
            >
              <Ionicons name="create-outline" size={22} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionBtn} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={22} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} style={styles.scrollArea}>
        {/* Images */}
        {parcel.images && parcel.images.length > 0 && (
          <>
            <View style={styles.imageSectionHeader}>
              <Ionicons name="images-outline" size={15} color={COLORS.textSecondary} />
              <Text style={styles.imageSectionLabel}>ဓာတ်ပုံများ ({parcel.images.length})</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
              {parcel.images.map((img, index) => (
                <TouchableOpacity
                  key={img.id}
                  onPress={() => { setPreviewIndex(index); setPreviewVisible(true); }}
                  activeOpacity={0.85}
                >
                  <View style={styles.imageThumbWrap}>
                    <Image source={{ uri: img.url }} style={styles.parcelImage} />
                    <View style={styles.imageTapHint}>
                      <Ionicons name="expand-outline" size={14} color="#fff" />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <ImagePreviewModal
              visible={previewVisible}
              images={parcel.images}
              initialIndex={previewIndex}
              onClose={() => setPreviewVisible(false)}
            />
          </>
        )}

        {/* Info Cards */}
        <InfoSection title="ပါဆယ် အချက်အလက်">
          <InfoRow icon="barcode-outline" label="ခြေရာခံနံပါတ်" value={parcel.tracking_number} />
          <InfoRow
            icon="flag"
            label="ဦးစားပေးအဆင့်"
            value={PRIORITY_LABELS_MM[parcel.priority as keyof typeof PRIORITY_LABELS_MM] || parcel.priority}
            valueColor={PRIORITY_COLORS[parcel.priority as keyof typeof PRIORITY_COLORS]}
          />
          {parcel.description && <InfoRow icon="document-text-outline" label="ဖော်ပြချက်" value={parcel.description} />}
          <InfoRow icon="layers-outline" label="အရေအတွက်" value={`${parcel.quantity} ခု`} />
          {parcel.weight && <InfoRow icon="scale-outline" label="အလေးချိန်" value={`${parcel.weight} kg`} />}
        </InfoSection>

        <InfoSection title="ပေးပို့သူ">
          {parcel.sender_name && <InfoRow icon="person-outline" label="နာမည်" value={parcel.sender_name} />}
          {parcel.sender_phone && <InfoRow icon="call-outline" label="ဖုန်းနံပါတ်" value={parcel.sender_phone} />}
        </InfoSection>

        <InfoSection title="လက်ခံသူ">
          <InfoRow icon="person" label="နာမည်" value={parcel.recipient_name} />
          <InfoRow icon="call" label="ဖုန်းနံပါတ်" value={parcel.recipient_phone} onPress={() => Linking.openURL(`tel:${parcel.recipient_phone}`)} />
          <InfoRow icon="location" label="လိပ်စာ" value={parcel.delivery_address} />
          {parcel.delivery_area && <InfoRow icon="map-outline" label="ဒေသ" value={parcel.delivery_area.name_mm || parcel.delivery_area.name} />}
        </InfoSection>

        <InfoSection title="ငွေကြေး">
          <InfoRow icon="cash-outline" label="ပို့ဆောင်ခ" value={`${Number(parcel.delivery_fee).toLocaleString()} ကျပ်`} />
          {parcel.is_cod && <InfoRow icon="wallet-outline" label="COD ပမာဏ" value={`${Number(parcel.cod_amount).toLocaleString()} ကျပ်`} />}
        </InfoSection>

        {parcel.active_assignment && (
          <InfoSection title="ချိတ်ဆက်ထားသောဝန်ထမ်း">
            <InfoRow icon="bicycle" label="ဝန်ထမ်း" value={parcel.active_assignment.staff?.name || '-'} />
          </InfoSection>
        )}

        {/* Status Transitions */}
        {canChangeStatus && availableTransitions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.transitionHeader}>
              <Text style={styles.sectionTitle}>အခြေအနေ ပြောင်းမည်</Text>
              {statusMutation.isPending && (
                <View style={styles.transitionLoading}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.transitionLoadingText}>ပြောင်းနေဆဲ...</Text>
                </View>
              )}
            </View>
            <View style={styles.transitionGrid}>
              {availableTransitions.map((toStatus) => {
                const color = STATUS_COLORS[toStatus as keyof typeof STATUS_COLORS] || COLORS.textSecondary;
                const label = STATUS_LABELS_MM[toStatus as keyof typeof STATUS_LABELS_MM] || toStatus;
                const isPendingThis = statusMutation.isPending && statusMutation.variables?.status === toStatus;
                return (
                  <TouchableOpacity
                    key={toStatus}
                    style={[
                      styles.transitionBtn,
                      { borderColor: color, backgroundColor: color + '15' },
                      statusMutation.isPending && { opacity: 0.55 },
                    ]}
                    onPress={() => handleStatusChange(toStatus)}
                    disabled={statusMutation.isPending}
                  >
                    {isPendingThis ? (
                      <ActivityIndicator size="small" color={color} />
                    ) : (
                      <Ionicons name="swap-horizontal" size={14} color={color} />
                    )}
                    <Text style={[styles.transitionBtnText, { color }]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Assign Delivery Staff */}
        {canAssign && staffList && staffList.length > 0 && ['VERIFIED', 'IN_TRANSIT', 'FAILED'].includes(parcel.status) && (() => {
          const filtered = staffList.filter(s =>
            s.is_active && s.name.toLowerCase().includes(staffSearch.toLowerCase())
          );
          return (
            <View style={styles.section}>
              <View style={styles.assignHeader}>
              <Text style={styles.sectionTitle}>
                {parcel.active_assignment ? 'ဝန်ထမ်း ပြောင်းချိတ်မည်' : 'ဝန်ထမ်းကို ချိတ်ဆက်မည်'}
              </Text>
              {parcel.active_assignment && (
                <View style={styles.currentStaffPill}>
                  <Ionicons name="bicycle" size={12} color={COLORS.primary} />
                  <Text style={styles.currentStaffPillText} numberOfLines={1}>
                    {parcel.active_assignment.staff?.name}
                  </Text>
                </View>
              )}
            </View>
              {/* Search box */}
              <View style={styles.staffSearchBox}>
                <Ionicons name="search-outline" size={16} color={COLORS.textLight} />
                <TextInput
                  style={styles.staffSearchInput}
                  placeholder="အမည်ဖြင့် ရှာရန်..."
                  placeholderTextColor={COLORS.textLight}
                  value={staffSearch}
                  onChangeText={setStaffSearch}
                  returnKeyType="search"
                />
                {staffSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setStaffSearch('')}>
                    <Ionicons name="close-circle" size={16} color={COLORS.textLight} />
                  </TouchableOpacity>
                )}
              </View>
              {/* Staff list */}
              {filtered.length === 0 ? (
                <View style={styles.staffEmpty}>
                  <Ionicons name="person-outline" size={28} color={COLORS.textLight} />
                  <Text style={styles.staffEmptyText}>ဝန်ထမ်း မတွေ့ပါ</Text>
                </View>
              ) : (
                <View style={styles.staffList}>
                  {filtered.map((s) => {
                    const isCurrentStaff = parcel?.active_assignment?.staff?.id === s.id;
                    return (
                      <TouchableOpacity
                        key={s.id}
                        style={[styles.staffListItem, isCurrentStaff && styles.staffListItemActive]}
                        onPress={() => handleAssign(s.id, s.name)}
                        disabled={assignMutation.isPending}
                        activeOpacity={0.7}
                      >
                        {s.profile_image_url ? (
                          <Image source={{ uri: s.profile_image_url }} style={[styles.staffAvatarImg, isCurrentStaff && { borderColor: COLORS.primary }]} />
                        ) : (
                          <View style={[styles.staffAvatar, isCurrentStaff && styles.staffAvatarActive]}>
                            <Text style={[styles.staffAvatarText, isCurrentStaff && { color: COLORS.white }]}>
                              {s.name[0].toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <View style={styles.staffListInfo}>
                          <Text style={[styles.staffListName, isCurrentStaff && { color: COLORS.primary }]}>
                            {s.name}
                          </Text>
                          {isCurrentStaff && (
                            <Text style={styles.staffCurrentBadge}>လက်ရှိ ချိတ်ဆက်ထားသည်</Text>
                          )}
                        </View>
                        {isCurrentStaff
                          ? <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                          : <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
                        }
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })()}

        {/* Status History */}
        {parcel.status_histories && parcel.status_histories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>အခြေအနေ မှတ်တမ်း</Text>
            <View style={styles.timeline}>
              {[...parcel.status_histories].reverse().map((h, i) => {
                const color = STATUS_COLORS[h.to_status as keyof typeof STATUS_COLORS] || COLORS.textSecondary;
                const label = STATUS_LABELS_MM[h.to_status as keyof typeof STATUS_LABELS_MM] || h.to_status;
                return (
                  <View key={h.id} style={styles.timelineItem}>
                    <View style={styles.timelineDot}>
                      <View style={[styles.timelineDotInner, { backgroundColor: color }]} />
                      {i < parcel.status_histories!.length - 1 && <View style={styles.timelineLine} />}
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={[styles.timelineStatus, { color }]}>{label}</Text>
                      {h.reason && <Text style={styles.timelineReason}>{h.reason}</Text>}
                      <Text style={styles.timelineTime}>{new Date(h.created_at).toLocaleString('my-MM')}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.infoCard}>{children}</View>
    </View>
  );
}

function InfoRow({ icon, label, value, valueColor, onPress }: {
  icon: string; label: string; value: string; valueColor?: string; onPress?: () => void;
}) {
  const content = (
    <View style={styles.infoRow}>
      <Ionicons name={icon as any} size={16} color={COLORS.primary} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor ? { color: valueColor, fontWeight: '700' } : {}]} numberOfLines={2}>{value}</Text>
    </View>
  );
  return onPress ? <TouchableOpacity onPress={onPress}>{content}</TouchableOpacity> : content;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollArea: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  headerStatusBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 3,
  },
  headerStatusText: { fontSize: 11, color: COLORS.white, fontWeight: '600' },
  headerActions: { flexDirection: 'row', gap: 4 },
  headerActionBtn: { padding: 6 },
  content: { padding: 16, paddingBottom: 32 },
  imageScroll: { marginBottom: 16 },
  parcelImage: {
    width: 160,
    height: 120,
    borderRadius: 12,
    marginRight: 10,
    backgroundColor: COLORS.border,
  },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: { fontSize: 13, color: COLORS.textSecondary, width: 96 },
  infoValue: { flex: 1, fontSize: 14, color: COLORS.text, fontWeight: '500' },
  transitionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  transitionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  transitionBtnText: { fontSize: 14, fontWeight: '600' },
  transitionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  transitionLoading: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primaryLight + '30', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  transitionLoadingText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  assignHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  currentStaffPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primaryLight + '30', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  currentStaffPillText: { fontSize: 11, color: COLORS.primary, fontWeight: '600', maxWidth: 100 },
  staffRow: { flexDirection: 'row', gap: 10 },
  staffChip: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 12,
    width: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  staffAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  staffAvatarText: { fontSize: 18, fontWeight: '700', color: COLORS.primaryDark },
  staffChipName: { fontSize: 11, color: COLORS.text, textAlign: 'center', fontWeight: '600' },
  timeline: { paddingLeft: 4 },
  timelineItem: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  timelineDot: { alignItems: 'center', width: 16 },
  timelineDotInner: { width: 14, height: 14, borderRadius: 7 },
  timelineLine: { width: 2, flex: 1, backgroundColor: COLORS.border, marginTop: 2 },
  timelineContent: { flex: 1, paddingBottom: 16 },
  timelineStatus: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  timelineReason: { fontSize: 13, color: COLORS.textSecondary },
  timelineTime: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  staffSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  staffSearchInput: { flex: 1, fontSize: 14, color: COLORS.text },
  staffList: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  staffListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  staffListItemActive: { backgroundColor: COLORS.primaryLight + '30' },
  staffListInfo: { flex: 1 },
  staffListName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  staffCurrentBadge: { fontSize: 11, color: COLORS.primary, marginTop: 2 },
  staffAvatarActive: { backgroundColor: COLORS.primary },
  staffAvatarImg: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: COLORS.border },
  staffEmpty: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  staffEmptyText: { fontSize: 13, color: COLORS.textLight },
  imageSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  imageSectionLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
  imageThumbWrap: { position: 'relative', marginRight: 10 },
  imageTapHint: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 8,
    padding: 3,
  },
});
