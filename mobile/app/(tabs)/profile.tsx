import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../src/context/AuthContext';
import { userService } from '../../src/services/userService';
import { COLORS, ROLE_LABELS_MM } from '../../src/constants';

const isWeb = Platform.OS === 'web';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [editVisible, setEditVisible] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editPasswordConfirm, setEditPasswordConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Profile image upload state
  const [uploadingImage, setUploadingImage] = useState(false);

  // Web file input ref
  const webFileInputRef = useRef<HTMLInputElement | null>(null);

  // Web image options dialog state
  const [imageOptionsVisible, setImageOptionsVisible] = useState(false);
  // Web confirm delete dialog
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  // Web logout confirm dialog
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);

  // ── Mutations ────────────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: (data: { name?: string; phone?: string; email?: string; password?: string }) =>
      userService.updateProfile(user!.id, data),
    onSuccess: async () => {
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditVisible(false);
      showAlert('✅ အောင်မြင်ပါသည်', 'ပရိုဖိုင် ပြင်ဆင်မှု သိမ်းဆည်းပြီးပါပြီ');
    },
    onError: (err: any) => {
      showAlert('အမှား', err?.response?.data?.message || 'ပြင်ဆင်မှု မအောင်မြင်ပါ');
    },
  });

  // ── Helpers ───────────────────────────────────────────────────────────────────
  /**
   * Cross-platform alert: use browser alert on web, native Alert on mobile.
   */
  function showAlert(title: string, message?: string) {
    if (isWeb) {
      window.alert(message ? `${title}\n${message}` : title);
    } else {
      Alert.alert(title, message);
    }
  }

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function openEdit() {
    setEditName(user?.name ?? '');
    setEditPhone(user?.phone ?? '');
    setEditEmail(user?.email ?? '');
    setEditPassword('');
    setEditPasswordConfirm('');
    setEditVisible(true);
  }

  function handleSave() {
    if (!editName.trim()) return showAlert('အမှား', 'နာမည် ထည့်ပေးပါ');
    if (editPassword && editPassword !== editPasswordConfirm) {
      return showAlert('အမှား', 'စကားဝှက် နှစ်ခု မတူညီပါ');
    }
    if (editPassword && editPassword.length < 8) {
      return showAlert('အမှား', 'စကားဝှက် အနည်းဆုံး 8 လုံး ဖြစ်ရမည်');
    }

    const payload: Record<string, string> = { name: editName.trim() };
    if (editPhone.trim()) payload.phone = editPhone.trim();
    if (editEmail.trim()) payload.email = editEmail.trim();
    if (editPassword) payload.password = editPassword;

    updateMutation.mutate(payload);
  }

  // ── Image picking ─────────────────────────────────────────────────────────────

  async function pickProfileImage() {
    if (isWeb) {
      // On web, trigger the hidden <input type="file">
      webFileInputRef.current?.click();
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return showAlert('ခွင့်မပြု', 'ဓာတ်ပုံ လိုင်ဘရာရီ ခွင့်ပြုချက် မရရှိပါ');
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets.length > 0) {
      await doUpload(result.assets[0].uri);
    }
  }

  async function takeProfilePhoto() {
    if (isWeb) {
      // Camera not supported on desktop web — just open file picker
      webFileInputRef.current?.click();
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      return showAlert('ခွင့်မပြု', 'ကင်မရာ ခွင့်ပြုချက် မရရှိပါ');
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets.length > 0) {
      await doUpload(result.assets[0].uri);
    }
  }

  /**
   * Handle web <input type="file"> change event.
   */
  async function handleWebFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Build a blob URL for preview / upload
    const uri = URL.createObjectURL(file);
    await doUploadWebFile(file, uri);
    // Reset so the same file can be re-selected
    if (webFileInputRef.current) webFileInputRef.current.value = '';
  }

  async function doUploadWebFile(file: File, uri: string) {
    if (!user) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file, file.name);
      // Use axios directly with FormData on web (no special RN blob trick needed)
      const { default: apiClient } = await import('../../src/services/apiClient');
      const response = await apiClient.post(`/users/${user.id}/profile-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (e: any) {
      showAlert('အမှား', e?.response?.data?.message || 'ဓာတ်ပုံ တင်ရန် မအောင်မြင်ပါ');
    } finally {
      setUploadingImage(false);
      URL.revokeObjectURL(uri);
    }
  }

  async function doUpload(uri: string) {
    if (!user) return;
    setUploadingImage(true);
    try {
      await userService.uploadProfileImage(user.id, uri);
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (e: any) {
      showAlert('အမှား', e?.response?.data?.message || 'ဓာတ်ပုံ တင်ရန် မအောင်မြင်ပါ');
    } finally {
      setUploadingImage(false);
    }
  }

  function showImageOptions() {
    if (isWeb) {
      setImageOptionsVisible(true);
    } else {
      Alert.alert('ပရိုဖိုင် ဓာတ်ပုံ', 'ဓာတ်ပုံ ရွေးချယ်ပါ', [
        { text: 'ဓာတ်ပုံ ရွေးရန် (Gallery)', onPress: pickProfileImage },
        { text: 'ဓာတ်ပုံ ရိုက်ရန် (Camera)', onPress: takeProfilePhoto },
        ...(user?.profile_image_url
          ? [{ text: 'ဓာတ်ပုံ ဖျက်ရန်', style: 'destructive' as const, onPress: confirmDeleteImage }]
          : []),
        { text: 'မလုပ်တော့', style: 'cancel' as const },
      ]);
    }
  }

  function confirmDeleteImage() {
    if (isWeb) {
      setImageOptionsVisible(false);
      setDeleteConfirmVisible(true);
    } else {
      Alert.alert('ဓာတ်ပုံ ဖျက်မည်', 'ပရိုဖိုင် ဓာတ်ပုံကို ဖျက်မည်လား?', [
        { text: 'မလုပ်တော့', style: 'cancel' },
        {
          text: 'ဖျက်မည်', style: 'destructive', onPress: doDeleteImage,
        },
      ]);
    }
  }

  async function doDeleteImage() {
    if (!user) return;
    setDeleteConfirmVisible(false);
    setUploadingImage(true);
    try {
      await userService.deleteProfileImage(user.id);
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (e: any) {
      showAlert('အမှား', e?.response?.data?.message || 'ဖျက်ရန် မအောင်မြင်ပါ');
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleLogout() {
    if (isWeb) {
      setLogoutConfirmVisible(true);
    } else {
      Alert.alert('ထွက်မည်', 'အကောင့်မှ ထွက်မည်လား?', [
        { text: 'မထွက်ပါ', style: 'cancel' },
        {
          text: 'ထွက်မည်', style: 'destructive',
          onPress: doLogout,
        },
      ]);
    }
  }

  async function doLogout() {
    setLogoutConfirmVisible(false);
    setIsLoggingOut(true);
    try { await logout(); router.replace('/login'); }
    catch { setIsLoggingOut(false); }
  }

  if (!user) return null;

  const roleLabel = ROLE_LABELS_MM[user.role as keyof typeof ROLE_LABELS_MM] || user.role;
  const roleColor = user.role === 'admin' ? '#8B5CF6' : user.role === 'manager' ? COLORS.info : user.role === 'accountant' ? '#F59E0B' : COLORS.success;
  const roleIcon = user.role === 'admin' ? 'shield' : user.role === 'manager' ? 'briefcase' : user.role === 'accountant' ? 'calculator' : 'bicycle';

  return (
    <View style={styles.container}>
      {/* Hidden web file input */}
      {isWeb && (
        <input
          ref={webFileInputRef as any}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleWebFileChange as any}
        />
      )}

      {/* ── Hero Header ── */}
      <View style={[styles.hero, { paddingTop: insets.top + 16 }]}>
        {/* Top bar */}
        <View style={styles.heroTopBar}>
          <Text style={styles.heroTitle}>ပရိုဖိုင်</Text>
          <TouchableOpacity style={styles.editBtn} onPress={openEdit}>
            <Ionicons name="create-outline" size={18} color={COLORS.white} />
            <Text style={styles.editBtnText}>ပြင်ဆင်ရန်</Text>
          </TouchableOpacity>
        </View>

        {/* Avatar + name inside hero */}
        <View style={styles.heroBody}>
          <TouchableOpacity style={styles.avatarWrap} onPress={showImageOptions} disabled={uploadingImage}>
            {uploadingImage ? (
              <View style={styles.avatarRing}>
                <View style={[styles.avatar, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
                  <ActivityIndicator color={COLORS.white} />
                </View>
              </View>
            ) : user.profile_image_url ? (
              <View style={styles.avatarRing}>
                <Image source={{ uri: user.profile_image_url }} style={styles.avatarImage} />
              </View>
            ) : (
              <View style={styles.avatarRing}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{user.name[0]?.toUpperCase()}</Text>
                </View>
              </View>
            )}
            <View style={styles.cameraOverlay}>
              <Ionicons name="camera" size={12} color={COLORS.white} />
            </View>
          </TouchableOpacity>

          <Text style={styles.heroName}>{user.name}</Text>

          <View style={styles.heroBadgeRow}>
            <View style={styles.heroBadge}>
              <Ionicons name={roleIcon as any} size={13} color={COLORS.primary} />
              <Text style={styles.heroBadgeText}>{roleLabel}</Text>
            </View>
            <View style={[styles.heroBadge, user.is_active ? styles.activeBadge : styles.inactiveBadge]}>
              <View style={[styles.statusDot, { backgroundColor: user.is_active ? '#22C55E' : '#EF4444' }]} />
              <Text style={[styles.heroBadgeText, { color: user.is_active ? '#22C55E' : '#EF4444' }]}>
                {user.is_active ? 'အသက်ဝင်' : 'ပိတ်ထား'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Account Info ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>အကောင့် အချက်အလက်</Text>
          <View style={styles.card}>
            <InfoRow icon="person-outline" label="နာမည်" value={user.name} />
            {user.phone
              ? <InfoRow icon="call-outline" label="ဖုန်းနံပါတ်" value={user.phone} />
              : <InfoRow icon="call-outline" label="ဖုန်းနံပါတ်" value="—" muted />
            }
            {user.email
              ? <InfoRow icon="mail-outline" label="အီးမေးလ်" value={user.email} />
              : <InfoRow icon="mail-outline" label="အီးမေးလ်" value="—" muted />
            }
            <InfoRow icon="shield-checkmark-outline" label="အခန်းကဏ္ဍ" value={roleLabel} valueColor={roleColor} last />
          </View>
        </View>

        {/* ── App Info ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>အပလီကေးရှင်း</Text>
          <View style={styles.card}>
            <InfoRow icon="cube-outline" label="ပရိုဂျက်" value="Royal Myawaddy" />
            <InfoRow icon="code-slash-outline" label="ဗားရှင်း" value="v1.0.0" />
            <InfoRow icon="globe-outline" label="ဘာသာစကား" value="မြန်မာဘာသာ" last />
          </View>
        </View>

        {/* ── Actions ── */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.actionRow} onPress={openEdit}>
            <View style={[styles.actionIcon, { backgroundColor: COLORS.primary + '18' }]}>
              <Ionicons name="create-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={[styles.actionText, { color: COLORS.text }]}>ပရိုဖိုင် ပြင်ဆင်ရန်</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
          </TouchableOpacity>

          <View style={styles.actionDivider} />

          <TouchableOpacity
            style={[styles.actionRow, isLoggingOut && { opacity: 0.6 }]}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FEE2E2' }]}>
              {isLoggingOut
                ? <ActivityIndicator size="small" color="#EF4444" />
                : <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              }
            </View>
            <Text style={[styles.actionText, { color: '#EF4444' }]}>အကောင့်မှ ထွက်ရန်</Text>
            <Ionicons name="chevron-forward" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>Royal Myawaddy Delivery © 2026</Text>
      </ScrollView>

      {/* ── Edit Profile Modal ── */}
      {isWeb ? (
        <WebModal visible={editVisible} onClose={() => setEditVisible(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setEditVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>ပရိုဖိုင် ပြင်ဆင်ရန်</Text>
              <TouchableOpacity
                style={[styles.modalSaveBtn, updateMutation.isPending && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending
                  ? <ActivityIndicator size="small" color={COLORS.white} />
                  : <Text style={styles.modalSaveBtnText}>သိမ်းမည်</Text>
                }
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
              <EditFormContent
                editName={editName} setEditName={setEditName}
                editPhone={editPhone} setEditPhone={setEditPhone}
                editEmail={editEmail} setEditEmail={setEditEmail}
                editPassword={editPassword} setEditPassword={setEditPassword}
                editPasswordConfirm={editPasswordConfirm} setEditPasswordConfirm={setEditPasswordConfirm}
                showPass={showPass} setShowPass={setShowPass}
              />
            </ScrollView>
          </View>
        </WebModal>
      ) : (
        <Modal
          visible={editVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          statusBarTranslucent
          onRequestClose={() => setEditVisible(false)}
        >
          <StatusBar barStyle="dark-content" />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <View style={styles.modalContainer}>
              <View
                style={[
                  styles.modalHeader,
                  {
                    paddingTop:
                      (Platform.OS === 'android'
                        ? Math.max(insets.top, StatusBar.currentHeight ?? 0)
                        : insets.top > 0
                          ? insets.top
                          : 14) + 8,
                  },
                ]}
              >
                <TouchableOpacity onPress={() => setEditVisible(false)} style={styles.modalCloseBtn}>
                  <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>ပရိုဖိုင် ပြင်ဆင်ရန်</Text>
                <TouchableOpacity
                  style={[styles.modalSaveBtn, updateMutation.isPending && { opacity: 0.6 }]}
                  onPress={handleSave}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending
                    ? <ActivityIndicator size="small" color={COLORS.white} />
                    : <Text style={styles.modalSaveBtnText}>သိမ်းမည်</Text>
                  }
                </TouchableOpacity>
              </View>
              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 20) + 30 }]}
                keyboardShouldPersistTaps="handled"
              >
                <EditFormContent
                  editName={editName} setEditName={setEditName}
                  editPhone={editPhone} setEditPhone={setEditPhone}
                  editEmail={editEmail} setEditEmail={setEditEmail}
                  editPassword={editPassword} setEditPassword={setEditPassword}
                  editPasswordConfirm={editPasswordConfirm} setEditPasswordConfirm={setEditPasswordConfirm}
                  showPass={showPass} setShowPass={setShowPass}
                />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}

      {/* ── Web: Image Options Dialog ── */}
      {isWeb && (
        <WebModal visible={imageOptionsVisible} onClose={() => setImageOptionsVisible(false)} compact>
          <View style={styles.dialogContainer}>
            <Text style={styles.dialogTitle}>ပရိုဖိုင် ဓာတ်ပုံ</Text>
            <TouchableOpacity style={styles.dialogBtn} onPress={() => { setImageOptionsVisible(false); pickProfileImage(); }}>
              <Ionicons name="images-outline" size={20} color={COLORS.text} />
              <Text style={styles.dialogBtnText}>ဓာတ်ပုံ ရွေးရန် (Gallery)</Text>
            </TouchableOpacity>
            {user.profile_image_url && (
              <TouchableOpacity style={styles.dialogBtn} onPress={confirmDeleteImage}>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                <Text style={[styles.dialogBtnText, { color: '#EF4444' }]}>ဓာတ်ပုံ ဖျက်ရန်</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.dialogBtn, styles.dialogCancelBtn]} onPress={() => setImageOptionsVisible(false)}>
              <Text style={[styles.dialogBtnText, { color: COLORS.textSecondary }]}>မလုပ်တော့</Text>
            </TouchableOpacity>
          </View>
        </WebModal>
      )}

      {/* ── Web: Delete Confirm Dialog ── */}
      {isWeb && (
        <WebModal visible={deleteConfirmVisible} onClose={() => setDeleteConfirmVisible(false)} compact>
          <View style={styles.dialogContainer}>
            <Text style={styles.dialogTitle}>ဓာတ်ပုံ ဖျက်မည်</Text>
            <Text style={styles.dialogMsg}>ပရိုဖိုင် ဓာတ်ပုံကို ဖျက်မည်လား?</Text>
            <View style={styles.dialogBtnRow}>
              <TouchableOpacity style={[styles.dialogActionBtn, styles.dialogCancelActionBtn]} onPress={() => setDeleteConfirmVisible(false)}>
                <Text style={styles.dialogCancelActionText}>မလုပ်တော့</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.dialogActionBtn, styles.dialogDestructiveBtn]} onPress={doDeleteImage}>
                <Text style={styles.dialogDestructiveText}>ဖျက်မည်</Text>
              </TouchableOpacity>
            </View>
          </View>
        </WebModal>
      )}

      {/* ── Web: Logout Confirm Dialog ── */}
      {isWeb && (
        <WebModal visible={logoutConfirmVisible} onClose={() => setLogoutConfirmVisible(false)} compact>
          <View style={styles.dialogContainer}>
            <Text style={styles.dialogTitle}>ထွက်မည်</Text>
            <Text style={styles.dialogMsg}>အကောင့်မှ ထွက်မည်လား?</Text>
            <View style={styles.dialogBtnRow}>
              <TouchableOpacity style={[styles.dialogActionBtn, styles.dialogCancelActionBtn]} onPress={() => setLogoutConfirmVisible(false)}>
                <Text style={styles.dialogCancelActionText}>မထွက်ပါ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.dialogActionBtn, styles.dialogDestructiveBtn]} onPress={doLogout}>
                <Text style={styles.dialogDestructiveText}>ထွက်မည်</Text>
              </TouchableOpacity>
            </View>
          </View>
        </WebModal>
      )}
    </View>
  );
}

// ── WebModal: cross-platform modal overlay for web ────────────────────────────
function WebModal({
  visible,
  onClose,
  children,
  compact = false,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  compact?: boolean;
}) {
  if (!visible) return null;
  return (
    <View style={webModalStyles.overlay}>
      <Pressable style={webModalStyles.backdrop} onPress={onClose} />
      <View style={[webModalStyles.sheet, compact && webModalStyles.compactSheet]}>
        {children}
      </View>
    </View>
  );
}

const webModalStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    width: '90%',
    maxWidth: 520,
    maxHeight: '90%',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    overflow: 'hidden',
  },
  compactSheet: {
    maxWidth: 360,
  },
});

// ── EditFormContent ───────────────────────────────────────────────────────────
function EditFormContent({
  editName, setEditName,
  editPhone, setEditPhone,
  editEmail, setEditEmail,
  editPassword, setEditPassword,
  editPasswordConfirm, setEditPasswordConfirm,
  showPass, setShowPass,
}: {
  editName: string; setEditName: (v: string) => void;
  editPhone: string; setEditPhone: (v: string) => void;
  editEmail: string; setEditEmail: (v: string) => void;
  editPassword: string; setEditPassword: (v: string) => void;
  editPasswordConfirm: string; setEditPasswordConfirm: (v: string) => void;
  showPass: boolean; setShowPass: (v: boolean | ((prev: boolean) => boolean)) => void;
}) {
  return (
    <>
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>နာမည် *</Text>
        <TextInput
          style={styles.formInput}
          value={editName}
          onChangeText={setEditName}
          placeholder="နာမည် ထည့်ပါ"
          placeholderTextColor={COLORS.textLight}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>ဖုန်းနံပါတ်</Text>
        <TextInput
          style={styles.formInput}
          value={editPhone}
          onChangeText={setEditPhone}
          placeholder="ဖုန်းနံပါတ် ထည့်ပါ"
          placeholderTextColor={COLORS.textLight}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>အီးမေးလ်</Text>
        <TextInput
          style={styles.formInput}
          value={editEmail}
          onChangeText={setEditEmail}
          placeholder="အီးမေးလ် ထည့်ပါ (မဖြစ်မနေ မလိုအပ်)"
          placeholderTextColor={COLORS.textLight}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerLabel}>စကားဝှက် ပြောင်းလဲခြင်း</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>စကားဝှက်အသစ်</Text>
        <View style={styles.passRow}>
          <TextInput
            style={[styles.formInput, { flex: 1, marginBottom: 0 }]}
            value={editPassword}
            onChangeText={setEditPassword}
            placeholder="အနည်းဆုံး 8 လုံး"
            placeholderTextColor={COLORS.textLight}
            secureTextEntry={!showPass}
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(v => !v)}>
            <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>စကားဝှက်အသစ် အတည်ပြုရန်</Text>
        <TextInput
          style={styles.formInput}
          value={editPasswordConfirm}
          onChangeText={setEditPasswordConfirm}
          placeholder="စကားဝှက်ကို ထပ်ရိုက်ပါ"
          placeholderTextColor={COLORS.textLight}
          secureTextEntry={!showPass}
          autoCapitalize="none"
        />
      </View>
    </>
  );
}

function InfoRow({ icon, label, value, valueColor, muted, last }: {
  icon: string; label: string; value: string; valueColor?: string; muted?: boolean; last?: boolean;
}) {
  return (
    <View style={[styles.infoRow, last && { borderBottomWidth: 0 }]}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon as any} size={17} color={COLORS.primary} />
      </View>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor ? { color: valueColor, fontWeight: '700' } : {}, muted ? { color: COLORS.textLight } : {}]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },

  // ── Hero ──
  hero: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  heroTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 22, fontWeight: '800', color: COLORS.white,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20,
  },
  editBtnText: {
    fontSize: 13, fontWeight: '700', color: COLORS.white,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  heroBody: { alignItems: 'center' },
  avatarWrap: { position: 'relative', marginBottom: 14 },
  avatarRing: {
    width: 108, height: 108, borderRadius: 54,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)',
    padding: 3,
  },
  avatar: {
    flex: 1, borderRadius: 54,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: 54 },
  avatarText: {
    fontSize: 40, fontWeight: '800', color: COLORS.white,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  cameraOverlay: {
    position: 'absolute', bottom: 2, right: 2,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.white,
  },
  heroName: {
    fontSize: 22, fontWeight: '800', color: COLORS.white, marginBottom: 10,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  heroBadgeRow: { flexDirection: 'row', gap: 8 },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20,
  },
  activeBadge: { backgroundColor: '#DCFCE7' },
  inactiveBadge: { backgroundColor: '#FEE2E2' },
  heroBadgeText: {
    fontSize: 12, fontWeight: '700', color: COLORS.text,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },

  // ── Content ──
  scrollArea: { flex: 1, marginTop: -16, borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: '#F3F4F6' },
  content: { padding: 16 },

  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },

  // Info card
  card: {
    backgroundColor: COLORS.white, borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  infoIconWrap: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: COLORS.primary + '12',
    alignItems: 'center', justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 13, color: COLORS.textSecondary, width: 90,
    fontFamily: 'NotoSansMyanmar_400Regular',
  },
  infoValue: {
    flex: 1, fontSize: 14, color: COLORS.text, fontWeight: '500', textAlign: 'right',
    fontFamily: 'NotoSansMyanmar_500Medium',
  },

  // Action rows
  actionRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16, paddingVertical: 15,
    gap: 14,
  },
  actionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionText: {
    flex: 1, fontSize: 15, fontWeight: '600',
    fontFamily: 'NotoSansMyanmar_600SemiBold',
  },
  actionDivider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E5E7EB', marginLeft: 66 },

  versionText: {
    textAlign: 'center', fontSize: 12, color: COLORS.textLight, marginTop: 8,
    fontFamily: 'NotoSansMyanmar_400Regular',
  },

  // ── Modal ──
  modalContainer: { flex: 1, backgroundColor: '#F3F4F6' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border,
    gap: 12,
  },
  modalCloseBtn: { padding: 4 },
  modalTitle: {
    flex: 1, fontSize: 17, fontWeight: '700', color: COLORS.text,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  modalSaveBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
  modalSaveBtnText: {
    fontSize: 14, fontWeight: '700', color: COLORS.white,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  modalScroll: { flex: 1 },
  modalContent: { padding: 16, paddingBottom: 40 },

  formGroup: { marginBottom: 14 },
  formLabel: {
    fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 6,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  formInput: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: COLORS.text, backgroundColor: COLORS.white,
    fontFamily: 'NotoSansMyanmar_400Regular',
  },
  passRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: { padding: 10 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerLabel: {
    fontSize: 12, color: COLORS.textLight, fontWeight: '600',
    fontFamily: 'NotoSansMyanmar_600SemiBold',
  },

  // ── Web Dialogs ──
  dialogContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    overflow: 'hidden',
    padding: 20,
    gap: 4,
  },
  dialogTitle: {
    fontSize: 17, fontWeight: '700', color: COLORS.text,
    fontFamily: 'NotoSansMyanmar_700Bold',
    marginBottom: 10,
  },
  dialogMsg: {
    fontSize: 14, color: COLORS.textSecondary,
    fontFamily: 'NotoSansMyanmar_400Regular',
    marginBottom: 16,
  },
  dialogBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: 4,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E7EB',
  },
  dialogBtnText: {
    fontSize: 15, color: COLORS.text, fontWeight: '500',
    fontFamily: 'NotoSansMyanmar_500Medium',
  },
  dialogCancelBtn: { marginTop: 4 },
  dialogBtnRow: {
    flexDirection: 'row', gap: 10, marginTop: 4,
  },
  dialogActionBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
  },
  dialogCancelActionBtn: {
    backgroundColor: '#F3F4F6',
  },
  dialogCancelActionText: {
    fontSize: 14, fontWeight: '600', color: COLORS.textSecondary,
    fontFamily: 'NotoSansMyanmar_600SemiBold',
  },
  dialogDestructiveBtn: {
    backgroundColor: '#FEE2E2',
  },
  dialogDestructiveText: {
    fontSize: 14, fontWeight: '700', color: '#EF4444',
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
});
