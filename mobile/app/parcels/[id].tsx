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

const STATUS_TRANSITIONS: Record<string, string[]> = {
  RECEIVED: ['VERIFIED', 'DAMAGED'],
  VERIFIED: ['IN_TRANSIT', 'DELIVERED', 'FAILED', 'DAMAGED'],
  IN_TRANSIT: ['DELIVERED', 'FAILED'],
  FAILED: ['IN_TRANSIT', 'DELIVERED'],
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

  const { data: staffList } = useQuery({
    queryKey: ['delivery-staff'],
    queryFn: () => userService.getDeliveryStaff(),
    enabled: user?.role === 'admin' || user?.role === 'manager',
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

  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';
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
    Alert.alert('ချိတ်ဆက်မည်', `${staffName} ကို ချိတ်ဆက်မည်လား?`, [
      { text: 'မလုပ်တော့', style: 'cancel' },
      { text: 'ချိတ်ဆက်မည်', onPress: () => assignMutation.mutate({ staffId }) },
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
    <View style={styles.container}>
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
        {isAdminOrManager && !isTerminal && (
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

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Images */}
        {parcel.images && parcel.images.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
            {parcel.images.map((img) => (
              <Image key={img.id} source={{ uri: img.url }} style={styles.parcelImage} />
            ))}
          </ScrollView>
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
        {isAdminOrManager && availableTransitions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>အခြေအနေ ပြောင်းမည်</Text>
            <View style={styles.transitionGrid}>
              {availableTransitions.map((toStatus) => {
                const color = STATUS_COLORS[toStatus as keyof typeof STATUS_COLORS] || COLORS.textSecondary;
                const label = STATUS_LABELS_MM[toStatus as keyof typeof STATUS_LABELS_MM] || toStatus;
                return (
                  <TouchableOpacity
                    key={toStatus}
                    style={[styles.transitionBtn, { borderColor: color, backgroundColor: color + '15' }]}
                    onPress={() => handleStatusChange(toStatus)}
                    disabled={statusMutation.isPending}
                  >
                    <Text style={[styles.transitionBtnText, { color }]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Assign Delivery Staff */}
        {isAdminOrManager && staffList && staffList.length > 0 && !isTerminal && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ဝန်ထမ်းကို ချိတ်ဆက်မည်</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.staffRow}>
                {staffList.filter(s => s.is_active).map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={styles.staffChip}
                    onPress={() => handleAssign(s.id, s.name)}
                    disabled={assignMutation.isPending}
                  >
                    <View style={styles.staffAvatar}>
                      <Text style={styles.staffAvatarText}>{s.name[0]}</Text>
                    </View>
                    <Text style={styles.staffChipName} numberOfLines={1}>{s.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

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
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  transitionBtnText: { fontSize: 14, fontWeight: '600' },
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
});
