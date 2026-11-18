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
  Share,
  Platform,
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
  FONTS,
  STATUS_COLORS,
  STATUS_LABELS_MM,
  PRIORITY_LABELS_MM,
  PRIORITY_COLORS,
} from '../../src/constants';
import ImagePreviewModal from '../../src/components/ImagePreviewModal';
import ConfirmModal from '../../src/components/ConfirmModal';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

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
  const [proofPreviewVisible, setProofPreviewVisible] = useState(false);
  const [proofPreviewIndex, setProofPreviewIndex] = useState(0);
  const [staffSearch, setStaffSearch] = useState('');
  const [targetStatus, setTargetStatus] = useState<string | null>(null);
  const [transitionReason, setTransitionReason] = useState('');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [assignTarget, setAssignTarget] = useState<{ id: number; name: string } | null>(null);

  // Delivery proof photos (when parcel is delivered or has attempt proofs)
  const deliveryProofs = React.useMemo(() => {
    if (!parcel) return [];
    if (parcel.proof_photos && parcel.proof_photos.length > 0) {
      return parcel.proof_photos.map((p, idx) => ({
        id: p.id || `proof-${idx}`,
        url: p.file_url,
        notes: p.notes,
        recipient_name: p.recipient_name,
        attempted_at: p.attempted_at,
      }));
    }
    const list: { id: number | string; url: string; notes?: string; recipient_name?: string; attempted_at?: string }[] = [];
    parcel.delivery_attempts?.forEach(da => {
      da.proof_photos?.forEach((p, idx) => {
        if (p.file_url) {
          list.push({
            id: p.id || `attempt-${da.id}-${idx}`,
            url: p.file_url,
            notes: p.notes || da.notes,
            recipient_name: da.recipient_name,
            attempted_at: da.attempted_at,
          });
        }
      });
    });
    return list;
  }, [parcel]);

  const isTerminal = parcel?.status === 'DELIVERED' || parcel?.status === 'DAMAGED';

  function handleDelete() {
    setDeleteModalVisible(true);
  }

  function handleStatusChange(toStatus: string) {
    setTargetStatus(toStatus);
    setTransitionReason('');
  }

  function handleAssign(staffId: number, staffName: string) {
    setAssignTarget({ id: staffId, name: staffName });
  }

  function buildReceiptHtml(): string {
    if (!parcel) return '';
    return `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: 'Noto Sans Myanmar', sans-serif; padding: 24px; color: #111827; }
            h1 { text-align: center; margin-bottom: 4px; }
            h2 { text-align: center; color: #6B7280; font-size: 14px; margin-top: 0; }
            .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #E5E7EB; }
            .label { color: #6B7280; font-weight: 600; }
            .value { font-weight: 700; text-align: right; max-width: 60%; }
            .section { margin-top: 16px; font-size: 16px; font-weight: 800; color: #1F2937; }
            .footer { text-align: center; margin-top: 24px; color: #6B7280; }
          </style>
        </head>
        <body>
          <h1>Royal Myawaddy Delivery</h1>
          <h2>ပါဆယ် ဘောင်ချာ / Parcel Receipt</h2>
          <div class="section">ပါဆယ် အချက်အလက်</div>
          <div class="row"><span class="label">ခြေရာခံနံပါတ်</span><span class="value">${parcel.tracking_number}</span></div>
          <div class="row"><span class="label">အခြေအနေ</span><span class="value">${statusLabel}</span></div>
          <div class="row"><span class="label">ရက်စွဲ</span><span class="value">${new Date(parcel.created_at).toLocaleString('my-MM')}</span></div>
          ${parcel.sender_name ? `<div class="row"><span class="label">ပေးပို့သူ</span><span class="value">${parcel.sender_name}</span></div>` : ''}
          ${parcel.sender_phone ? `<div class="row"><span class="label">ပေးပို့သူ ဖုန်း</span><span class="value">${parcel.sender_phone}</span></div>` : ''}
          <div class="row"><span class="label">လက်ခံသူ</span><span class="value">${parcel.recipient_name}</span></div>
          <div class="row"><span class="label">လက်ခံသူ ဖုန်း</span><span class="value">${parcel.recipient_phone}</span></div>
          <div class="row"><span class="label">လိပ်စာ</span><span class="value">${parcel.delivery_address}</span></div>
          <div class="row"><span class="label">ဦးစားပေးအဆင့်</span><span class="value">${PRIORITY_LABELS_MM[parcel.priority as keyof typeof PRIORITY_LABELS_MM] || parcel.priority}</span></div>
          <div class="row"><span class="label">အမျိုးအစား</span><span class="value">${parcel.category || '-'}</span></div>
          ${parcel.weight ? `<div class="row"><span class="label">အလေးချိန်</span><span class="value">${parcel.weight} kg</span></div>` : ''}
          ${parcel.description ? `<div class="row"><span class="label">ဖော်ပြချက်</span><span class="value">${parcel.description}</span></div>` : ''}
          <div class="row"><span class="label">ပို့ဆောင်ခ</span><span class="value">${Number(parcel.delivery_fee).toLocaleString()} ${parcel.currency === 'THB' ? 'ဘတ်' : 'ကျပ်'}</span></div>
          ${parcel.is_cod ? `<div class="row"><span class="label">COD ပမာဏ</span><span class="value">${Number(parcel.cod_amount).toLocaleString()} ${parcel.currency === 'THB' ? 'ဘတ်' : 'ကျပ်'}</span></div>` : ''}
          ${parcel.active_assignment?.staff?.name ? `<div class="row"><span class="label">ချိတ်ဆက်ထားသောဝန်ထမ်း</span><span class="value">${parcel.active_assignment.staff.name}</span></div>` : ''}
          ${deliveryProofs.length > 0 ? `<div class="row"><span class="label">ပို့ဆောင်မှုသက်သေ</span><span class="value">${deliveryProofs.length} ပုံ</span></div>` : ''}
          <div class="footer">ကျေးဇူးတင်ပါသည်။</div>
        </body>
      </html>
    `;
  }

  async function handleDownloadReceipt() {
    if (!parcel) return;
    try {
      const html = buildReceiptHtml();
      const result = await Print.printToFileAsync({ html, base64: true });
      if (!result.base64) {
        Alert.alert('အမှား', 'PDF ဖန်တီး၍ မရပါ');
        return;
      }
      const fileName = `parcel_receipt_${parcel.tracking_number}.pdf`;
      // Let the user choose where to save (e.g. Downloads).
      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!permissions.granted) {
        Alert.alert('ပယ်ဖျက်ခဲ့သည်', 'ဖိုင်သိမ်းဆည်းရန် ဖိုင်တွဲ ရွေးချယ်မှု ပယ်ဖျက်ခဲ့ပါသည်');
        return;
      }
      const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
        permissions.directoryUri,
        fileName,
        'application/pdf'
      );
      await FileSystem.writeAsStringAsync(fileUri, result.base64, { encoding: FileSystem.EncodingType.Base64 });
      Alert.alert('အောင်မြင်ပါသည်', `PDF ဖိုင် သိမ်းဆည်းပြီးပါပြီ:\n${fileName}`);
    } catch (e: any) {
      console.error('PDF download failed:', e);
      Alert.alert('အမှား', `PDF ဒေါင်းလုပ် မအောင်မြင်ပါ:\n${e?.message || e}`);
    }
  }

  async function handleExportReceipt() {
    if (!parcel) return;
    const html = buildReceiptHtml();

    try {
      const result = await Print.printToFileAsync({ html, base64: true });
      console.log('PDF generated:', result.uri);

      const dest = FileSystem.cacheDirectory + 'parcel_receipt.pdf';
      try { await FileSystem.deleteAsync(dest, { idempotent: true }); } catch (_) {}

      if (result.base64) {
        await FileSystem.writeAsStringAsync(dest, result.base64, { encoding: FileSystem.EncodingType.Base64 });
      } else {
        await FileSystem.copyAsync({ from: result.uri, to: dest });
      }
      console.log('written to:', dest);

      if (await Sharing.isAvailableAsync()) {
        try {
          await Sharing.shareAsync(dest, { mimeType: 'application/pdf', dialogTitle: 'Parcel Receipt' });
        } catch (e) {
          console.log('shareAsync failed:', e);
          // Fallback: open native print dialog so user can save/print the PDF.
          await Print.printAsync({ html });
        }
      } else {
        await Print.printAsync({ html });
      }
    } catch (e: any) {
      console.error('PDF export failed:', e);
      // Fallback: share a text receipt
      try {
        const text = `Royal Myawaddy Delivery - Parcel Receipt\nTracking: ${parcel.tracking_number}\nStatus: ${statusLabel}\nRecipient: ${parcel.recipient_name} (${parcel.recipient_phone})\nAddress: ${parcel.delivery_address}\nFee: ${Number(parcel.delivery_fee).toLocaleString()} ကျပ်`;
        await Share.share({ message: text, title: 'Parcel Receipt' });
      } catch (_) {
        Alert.alert('အမှား', `PDF ဘောင်ချာ ထုတ်ယူခြင်း မအောင်မြင်ပါ:\n${e?.message || e}`);
      }
    }
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
  const availableTransitions = (STATUS_TRANSITIONS[parcel.status] || []).filter(
    (s) => s !== 'IN_TRANSIT'
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{parcel.tracking_number}</Text>
          <View style={[styles.headerStatusBadge, { backgroundColor: statusColor + '18' }]}>
            <Text style={[styles.headerStatusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>
        {canEditParcel && !isTerminal && (
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerActionBtn} onPress={() => router.push(`/parcels/edit/${id}`)} activeOpacity={0.7}>
              <Ionicons name="create-outline" size={22} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionBtn} onPress={handleDelete} activeOpacity={0.7}>
              <Ionicons name="trash-outline" size={22} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} style={styles.scrollArea}>
        {/* Images */}
        {parcel.images && parcel.images.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ဓာတ်ပုံများ ({parcel.images.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
              {parcel.images.map((img, index) => (
                <TouchableOpacity
                  key={img.id}
                  onPress={() => { setPreviewIndex(index); setPreviewVisible(true); }}
                  activeOpacity={0.85}
                  style={styles.imageThumbWrap}
                >
                  <Image source={{ uri: img.url }} style={styles.parcelImage} />
                </TouchableOpacity>
              ))}
            </ScrollView>
            <ImagePreviewModal
              visible={previewVisible}
              images={parcel.images}
              initialIndex={previewIndex}
              onClose={() => setPreviewVisible(false)}
            />
          </View>
        )}

        {/* Info Cards */}
        <InfoSection title="ပါဆယ် အချက်အလက်">
          <InfoRow label="ခြေရာခံနံပါတ်" value={parcel.tracking_number} />
          <InfoRow
            label="ဦးစားပေးအဆင့်"
            value={PRIORITY_LABELS_MM[parcel.priority as keyof typeof PRIORITY_LABELS_MM] || parcel.priority}
            valueColor={PRIORITY_COLORS[parcel.priority as keyof typeof PRIORITY_COLORS]}
          />
          {parcel.description && <InfoRow label="ဖော်ပြချက်" value={parcel.description} />}
          {parcel.category && <InfoRow label="အမျိုးအစား" value={parcel.category} />}
          {parcel.weight && <InfoRow label="အလေးချိန်" value={`${parcel.weight} kg`} />}
          {canEditParcel && !isTerminal && (
            <TouchableOpacity
              style={styles.addItemsBtn}
              onPress={() => router.push(`/parcels/edit/${id}`)}
              activeOpacity={0.8}
            >
              <Text style={styles.addItemsBtnText}>ပစ္စည်း ထပ်ပေါင်းထည့်မည် / ပြင်ဆင်မည်</Text>
            </TouchableOpacity>
          )}
        </InfoSection>

        <InfoSection title="ရက်စွဲများ">
          <InfoRow label="လက်ခံရက်စွဲ" value={new Date(parcel.received_at || parcel.created_at).toLocaleString()} />
          {parcel.status === 'DELIVERED' && (parcel.delivered_at || parcel.updated_at) ? (
            <InfoRow label="ပို့ဆောင်ပြီးရက်စွဲ" value={new Date((parcel.delivered_at || parcel.updated_at)!).toLocaleString()} />
          ) : null}
          {parcel.status === 'FAILED' && (parcel.failed_at || parcel.updated_at) ? (
            <InfoRow label="မအောင်မြင်ရက်စွဲ" value={new Date((parcel.failed_at || parcel.updated_at)!).toLocaleString()} />
          ) : null}
        </InfoSection>

        {(parcel.sender_name || parcel.sender_phone) && (
          <InfoSection title="ပေးပို့သူ">
            {parcel.sender_name && <InfoRow label="နာမည်" value={parcel.sender_name} />}
            {parcel.sender_phone && <InfoRow label="ဖုန်းနံပါတ်" value={parcel.sender_phone} />}
          </InfoSection>
        )}

        <InfoSection title="လက်ခံသူ">
          <InfoRow label="နာမည်" value={parcel.recipient_name} />
          <InfoRow label="ဖုန်းနံပါတ်" value={parcel.recipient_phone} onPress={() => Linking.openURL(`tel:${parcel.recipient_phone}`)} />
          <InfoRow label="လိပ်စာ" value={parcel.delivery_address} />
        </InfoSection>

        <InfoSection title="ငွေကြေး">
          <InfoRow label="ငွေကြေးအမျိုး" value={parcel.currency === 'THB' ? 'Thai Baht (THB)' : 'ကျပ် (MMK)'} />
          <InfoRow label="ပို့ဆောင်ခ" value={`${Number(parcel.delivery_fee).toLocaleString()} ${parcel.currency === 'THB' ? 'THB' : 'MMK'}`} />
          {parcel.is_cod && <InfoRow label="COD ပမာဏ" value={`${Number(parcel.cod_amount).toLocaleString()} ${parcel.currency === 'THB' ? 'THB' : 'MMK'}`} />}
        </InfoSection>

        {parcel.active_assignment && (
          <InfoSection title="ချိတ်ဆက်ထားသောဝန်ထမ်း">
            <InfoRow label="ဝန်ထမ်း" value={parcel.active_assignment.staff?.name || '-'} />
          </InfoSection>
        )}

        {/* Delivery Proof Photos */}
        {deliveryProofs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.proofHeaderRow}>
              <Text style={styles.sectionTitle}>ပို့ဆောင်ပြီးစီးမှု သက်သေ</Text>
              <View style={styles.proofBadge}>
                <Text style={styles.proofBadgeText}>{deliveryProofs.length} ပုံ</Text>
              </View>
            </View>

            <View style={styles.proofCard}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.proofScroll}>
                {deliveryProofs.map((proof, index) => (
                  <TouchableOpacity
                    key={proof.id || index}
                    onPress={() => {
                      setProofPreviewIndex(index);
                      setProofPreviewVisible(true);
                    }}
                    activeOpacity={0.85}
                    style={styles.proofThumbWrap}
                  >
                    <Image source={{ uri: proof.url }} style={styles.proofThumbImage} />
                    {proof.notes ? (
                      <Text style={styles.proofThumbNote} numberOfLines={1}>{proof.notes}</Text>
                    ) : null}
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {deliveryProofs.some(p => p.recipient_name || p.notes || p.attempted_at) && (
                <View style={styles.proofInfoBox}>
                  {deliveryProofs.find(p => p.recipient_name)?.recipient_name ? (
                    <View style={styles.proofDetailRow}>
                      <Text style={styles.proofDetailLabel}>လက်ခံသူ:</Text>
                      <Text style={styles.proofDetailValue}>
                        {deliveryProofs.find(p => p.recipient_name)?.recipient_name}
                      </Text>
                    </View>
                  ) : null}
                  {deliveryProofs.find(p => p.attempted_at)?.attempted_at ? (
                    <View style={styles.proofDetailRow}>
                      <Text style={styles.proofDetailLabel}>အချိန်:</Text>
                      <Text style={styles.proofDetailValue}>
                        {new Date(deliveryProofs.find(p => p.attempted_at)!.attempted_at!).toLocaleString('my-MM')}
                      </Text>
                    </View>
                  ) : null}
                  {deliveryProofs.find(p => p.notes)?.notes ? (
                    <View style={styles.proofDetailRow}>
                      <Text style={styles.proofDetailLabel}>မှတ်ချက်:</Text>
                      <Text style={[styles.proofDetailValue, { fontStyle: 'italic' }]}>
                        {deliveryProofs.find(p => p.notes)?.notes}
                      </Text>
                    </View>
                  ) : null}
                </View>
              )}
            </View>

            <ImagePreviewModal
              visible={proofPreviewVisible}
              images={deliveryProofs}
              initialIndex={proofPreviewIndex}
              onClose={() => setProofPreviewVisible(false)}
            />
          </View>
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
                      { borderColor: color },
                      statusMutation.isPending && { opacity: 0.55 },
                    ]}
                    onPress={() => handleStatusChange(toStatus)}
                    disabled={statusMutation.isPending}
                  >
                    {isPendingThis ? (
                      <ActivityIndicator size="small" color={color} />
                    ) : null}
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
                    <Text style={styles.currentStaffPillText} numberOfLines={1}>
                      {parcel.active_assignment.staff?.name}
                    </Text>
                  </View>
                )}
              </View>
              {/* Search box */}
              <View style={styles.staffSearchBox}>
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
                    <Text style={styles.clearText}>ရှင်း</Text>
                  </TouchableOpacity>
                )}
              </View>
              {/* Staff list */}
              {filtered.length === 0 ? (
                <View style={styles.staffEmpty}>
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
                        <Text style={styles.chevronText}>{isCurrentStaff ? '✓' : '>'}</Text>
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

        {/* Export Receipt */}
        <View style={styles.exportWrap}>
          <TouchableOpacity style={styles.exportBtn} onPress={handleExportReceipt} activeOpacity={0.85}>
            <Text style={styles.exportBtnText}>ပါဆယ် ဘောင်ချာ ထုတ်ယူမည်</Text>
          </TouchableOpacity>
        </View>

        {/* Download PDF */}
        <View style={styles.exportWrap}>
          <TouchableOpacity style={[styles.exportBtn, { backgroundColor: COLORS.success }]} onPress={handleDownloadReceipt} activeOpacity={0.85}>
            <Text style={styles.exportBtnText}>PDF ဒေါင်းလုပ်မည်</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Status Change Modal */}
      <ConfirmModal
        visible={!!targetStatus}
        onClose={() => {
          setTargetStatus(null);
          setTransitionReason('');
        }}
        onConfirm={() => {
          if (!targetStatus) return;
          statusMutation.mutate(
            { status: targetStatus, reason: transitionReason.trim() || undefined },
            {
              onSuccess: () => {
                setTargetStatus(null);
                setTransitionReason('');
              },
              onError: (err: any) => {
                const msg = err?.response?.data?.message || 'အခြေအနေ ပြောင်း၍ မရပါ';
                if (Platform.OS === 'web') {
                  window.alert(`အမှား: ${msg}`);
                } else {
                  Alert.alert('အမှား', msg);
                }
              },
            }
          );
        }}
        title="အခြေအနေ ပြောင်းမည်"
        message={
          targetStatus
            ? `ပါဆယ်အခြေအနေကို "${STATUS_LABELS_MM[targetStatus as keyof typeof STATUS_LABELS_MM] || targetStatus}" သို့ ပြောင်းလဲရန် သေချာပါသလား?`
            : ''
        }
        confirmText="ပြောင်းမည်"
        confirmColor={
          targetStatus
            ? STATUS_COLORS[targetStatus as keyof typeof STATUS_COLORS] || COLORS.primary
            : COLORS.primary
        }
        isLoading={statusMutation.isPending}
      >
        {targetStatus && (
          <View style={styles.statusModalDetail}>
            <View style={styles.statusBadgeRow}>
              <View
                style={[
                  styles.statusBadgePill,
                  { backgroundColor: statusColor + '18', borderColor: statusColor },
                ]}
              >
                <Text style={[styles.statusBadgeText, { color: statusColor }]}>{statusLabel}</Text>
              </View>
              <Text style={styles.arrowText}>→</Text>
              <View
                style={[
                  styles.statusBadgePill,
                  {
                    backgroundColor:
                      (STATUS_COLORS[targetStatus as keyof typeof STATUS_COLORS] || COLORS.primary) +
                      '18',
                    borderColor:
                      STATUS_COLORS[targetStatus as keyof typeof STATUS_COLORS] || COLORS.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    {
                      color:
                        STATUS_COLORS[targetStatus as keyof typeof STATUS_COLORS] ||
                        COLORS.primary,
                    },
                  ]}
                >
                  {STATUS_LABELS_MM[targetStatus as keyof typeof STATUS_LABELS_MM] || targetStatus}
                </Text>
              </View>
            </View>

            {['FAILED', 'DAMAGED'].includes(targetStatus) && (
              <View style={styles.reasonInputWrap}>
                <Text style={styles.reasonInputLabel}>အကြောင်းအရင်း / မှတ်ချက် (မဖြစ်မနေ မလိုအပ်)</Text>
                <TextInput
                  style={styles.reasonInput}
                  placeholder="အကြောင်းအရင်း ရိုက်ထည့်ပါ..."
                  placeholderTextColor={COLORS.textLight}
                  value={transitionReason}
                  onChangeText={setTransitionReason}
                />
              </View>
            )}
          </View>
        )}
      </ConfirmModal>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={() => {
          deleteMutation.mutate(undefined, {
            onSuccess: () => setDeleteModalVisible(false),
            onError: (err: any) => {
              const msg = err?.response?.data?.message || 'ပါဆယ် ဖျက်၍ မရပါ';
              if (Platform.OS === 'web') window.alert(`အမှား: ${msg}`);
              else Alert.alert('အမှား', msg);
            },
          });
        }}
        title="ပါဆယ် ဖျက်မည်"
        message="ဤပါဆယ်ကို အတည်ပြု ဖျက်မည်လား? ဤလုပ်ဆောင်ချက်ကို ပြန်လည်ပြင်ဆင်၍ မရနိုင်ပါ။"
        confirmText="ဖျက်မည်"
        isDestructive
        isLoading={deleteMutation.isPending}
      />

      {/* Assign Confirm Modal */}
      <ConfirmModal
        visible={!!assignTarget}
        onClose={() => setAssignTarget(null)}
        onConfirm={() => {
          if (!assignTarget) return;
          assignMutation.mutate(
            { staffId: assignTarget.id },
            {
              onSuccess: () => setAssignTarget(null),
              onError: (err: any) => {
                const msg = err?.response?.data?.message || 'ဝန်ထမ်း ချိတ်ဆက်၍ မရပါ';
                if (Platform.OS === 'web') window.alert(`အမှား: ${msg}`);
                else Alert.alert('အမှား', msg);
              },
            }
          );
        }}
        title={parcel?.active_assignment ? 'ဝန်ထမ်း ပြောင်းချိတ်မည်' : 'ဝန်ထမ်း ချိတ်ဆက်မည်'}
        message={
          assignTarget
            ? parcel?.active_assignment
              ? `${parcel.active_assignment.staff?.name} မှ ${assignTarget.name} သို့ ပြောင်းချိတ်မည်လား?`
              : `${assignTarget.name} ကို ဤပါဆယ်နှင့် ချိတ်ဆက်မည်လား?`
            : ''
        }
        confirmText={parcel?.active_assignment ? 'ပြောင်းချိတ်မည်' : 'ချိတ်ဆက်မည်'}
        confirmColor={COLORS.primary}
        isLoading={assignMutation.isPending}
      />
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

function InfoRow({ label, value, valueColor, onPress }: {
  label: string; value: string; valueColor?: string; onPress?: () => void;
}) {
  const content = (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor ? { color: valueColor, fontWeight: '700' } : {}]} numberOfLines={2}>{value}</Text>
    </View>
  );
  return onPress ? <TouchableOpacity onPress={onPress}>{content}</TouchableOpacity> : content;
}

const styles = StyleSheet.create({
  addItemsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: COLORS.primaryBg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  addItemsBtnText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: FONTS.bold,
  },
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollArea: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.bold },
  headerStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 3,
  },
  headerStatusText: { fontSize: 11, fontWeight: '600', fontFamily: FONTS.semiBold },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerActionBtn: { paddingVertical: 6, paddingHorizontal: 8 },
  headerActionText: { fontSize: 13, fontWeight: '600', color: COLORS.primary, fontFamily: FONTS.semiBold },
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
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 8, fontFamily: FONTS.bold },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
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
  infoLabel: { fontSize: 13, color: COLORS.textSecondary, width: 96, fontFamily: FONTS.regular },
  infoValue: { flex: 1, fontSize: 14, color: COLORS.text, fontWeight: '500', fontFamily: FONTS.medium },
  transitionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  transitionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    backgroundColor: COLORS.white,
  },
  transitionBtnText: { fontSize: 14, fontWeight: '600', fontFamily: FONTS.semiBold },
  transitionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  transitionLoading: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  transitionLoadingText: { fontSize: 12, color: COLORS.primary, fontWeight: '600', fontFamily: FONTS.semiBold },
  assignHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  currentStaffPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  currentStaffPillText: { fontSize: 11, color: COLORS.primary, fontWeight: '600', maxWidth: 100, fontFamily: FONTS.semiBold },
  staffRow: { flexDirection: 'row', gap: 10 },
  staffChip: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 12,
    width: 80,
    borderWidth: 1,
    borderColor: COLORS.border,
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
  staffAvatarText: { fontSize: 18, fontWeight: '700', color: COLORS.primaryDark, fontFamily: FONTS.bold },
  staffChipName: { fontSize: 11, color: COLORS.text, textAlign: 'center', fontWeight: '600', fontFamily: FONTS.semiBold },
  timeline: { paddingLeft: 4 },
  timelineItem: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  timelineDot: { alignItems: 'center', width: 16 },
  timelineDotInner: { width: 12, height: 12, borderRadius: 6 },
  timelineLine: { width: 2, flex: 1, backgroundColor: COLORS.border, marginTop: 2 },
  timelineContent: { flex: 1, paddingBottom: 16 },
  timelineStatus: { fontSize: 14, fontWeight: '700', marginBottom: 2, fontFamily: FONTS.bold },
  timelineReason: { fontSize: 13, color: COLORS.textSecondary, fontFamily: FONTS.regular },
  timelineTime: { fontSize: 12, color: COLORS.textLight, marginTop: 2, fontFamily: FONTS.regular },
  staffSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  staffSearchInput: { flex: 1, fontSize: 14, color: COLORS.text, fontFamily: FONTS.regular },
  staffList: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
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
  staffListItemActive: { backgroundColor: COLORS.primaryBg },
  staffListInfo: { flex: 1 },
  staffListName: { fontSize: 14, fontWeight: '600', color: COLORS.text, fontFamily: FONTS.semiBold },
  staffCurrentBadge: { fontSize: 11, color: COLORS.primary, marginTop: 2, fontFamily: FONTS.regular },
  staffAvatarActive: { backgroundColor: COLORS.primary },
  staffAvatarImg: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: COLORS.border },
  staffEmpty: { alignItems: 'center', paddingVertical: 24 },
  staffEmptyText: { fontSize: 13, color: COLORS.textLight, fontFamily: FONTS.regular },
  imageThumbWrap: { marginRight: 10 },
  exportWrap: { marginTop: 8, marginBottom: 16 },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 14,
  },
  exportBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700', fontFamily: FONTS.bold },
  statusModalDetail: { width: '100%', alignItems: 'center', marginBottom: 8 },
  statusBadgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 },
  statusBadgePill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5 },
  statusBadgeText: { fontSize: 13, fontWeight: '700', fontFamily: FONTS.bold },
  reasonInputWrap: { width: '100%', marginTop: 8 },
  reasonInputLabel: { fontSize: 12, color: COLORS.textSecondary, fontFamily: FONTS.regular, marginBottom: 6 },
  reasonInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: '#F9FAFB',
    fontFamily: FONTS.regular,
  },
  proofHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  proofBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  proofBadgeText: { fontSize: 12, fontWeight: '700', color: COLORS.success, fontFamily: FONTS.bold },
  proofCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: COLORS.border },
  proofScroll: { marginBottom: 8 },
  proofThumbWrap: { marginRight: 10 },
  proofThumbImage: { width: 140, height: 110, borderRadius: 10, backgroundColor: COLORS.border },
  proofThumbNote: { fontSize: 11, color: COLORS.textSecondary, maxWidth: 140, marginTop: 4, fontFamily: FONTS.regular },
  proofInfoBox: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 8, marginTop: 4, gap: 6 },
  proofDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  proofDetailLabel: { fontSize: 12, color: COLORS.textSecondary, fontFamily: FONTS.semiBold },
  proofDetailValue: { fontSize: 13, color: COLORS.text, fontFamily: FONTS.medium, flex: 1 },
  clearText: { fontSize: 12, color: COLORS.textLight, fontFamily: FONTS.regular },
  chevronText: { fontSize: 16, color: COLORS.textLight, fontFamily: FONTS.regular },
  arrowText: { fontSize: 16, color: COLORS.textLight },
});