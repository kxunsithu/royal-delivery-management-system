import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Linking,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, User } from '../../src/services/userService';
import { COLORS, ROLE_LABELS_MM, FONTS } from '../../src/constants';

// ── Shared with create page ───────────────────────────────────────────────────
const ROLES = [
  { value: 'admin',          label: 'အက်ဒ်မင်',             color: '#8B5CF6' },
  { value: 'manager',        label: 'မန်နေဂျာ',              color: '#3B82F6' },
  { value: 'accountant',     label: 'စာရင်းကိုင်',           color: '#F59E0B' },
  { value: 'delivery_staff', label: 'ပို့ဆောင်ရေးဝန်ထမ်း', color: '#10B981' },
];

function roleColor(role: string) {
  return ROLES.find(r => r.value === role)?.color ?? COLORS.textSecondary;
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function UserDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = Number(id);
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [phone, setPhone]     = useState('');
  const [role, setRole]       = useState('delivery_staff');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors]   = useState<Record<string, string>>({});

  const { data: user, isLoading, refetch } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const data = await userService.get(userId);
      setName(data.name);
      setEmail(data.email || '');
      setPhone(data.phone || '');
      setRole(data.role);
      return data;
    },
    enabled: !!userId,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<User> & { password?: string }) =>
      userService.update(userId, payload),
    onSuccess: () => {
      Alert.alert('အောင်မြင်ပါသည်', 'အသုံးပြုသူ အချက်အလက်များ ပြင်ဆင်ပြီးပါပြီ');
      setIsEditing(false);
      setPassword('');
      setErrors({});
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      refetch();
    },
    onError: (err: any) => {
      Alert.alert('မှားယွင်းမှု', err.response?.data?.message || 'ပြင်ဆင်မှု မအောင်မြင်ပါ');
    },
  });

  const statusMutation = useMutation({
    mutationFn: (isActive: boolean) => userService.updateStatus(userId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      refetch();
    },
  });

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'လိုအပ်သည်';
    if (!phone.trim()) e.phone = 'လိုအပ်သည်';
    if (password && password.length < 8) e.password = 'စကားဝှက် အနည်းဆုံး ၈ လုံး';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const payload: any = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || null,
      role,
    };
    if (password.trim()) payload.password = password.trim();
    updateMutation.mutate(payload);
  }

  function handleToggleStatus() {
    if (!user) return;
    const action = user.is_active ? 'ပိတ်' : 'ဖွင့်';
    Alert.alert(`အကောင့် ${action}မည်`, `${user.name} ၏ အကောင့်ကို ${action}မည်လား?`, [
      { text: 'မလုပ်တော့', style: 'cancel' },
      { text: `${action}မည်`, onPress: () => statusMutation.mutate(!user.is_active) },
    ]);
  }

  function update(field: string, value: string) {
    if (field === 'name') setName(value);
    else if (field === 'email') setEmail(value);
    else if (field === 'phone') setPhone(value);
    else if (field === 'password') setPassword(value);
    setErrors(e => ({ ...e, [field]: undefined as any }));
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading || !user) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const rColor = roleColor(user.role);
  const roleLabel = ROLE_LABELS_MM[user.role as keyof typeof ROLE_LABELS_MM] || user.role;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {isEditing ? 'ပြင်ဆင်နေဆဲ' : 'အသုံးပြုသူ အချက်အလက်'}
        </Text>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => { setIsEditing(v => !v); setErrors({}); }}
        >
          <Text style={styles.editBtnText}>{isEditing ? 'ပိတ်' : 'ပြင်ဆင်'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Profile card (always visible) ── */}
        <View style={styles.profileCard}>
          {user.profile_image_url ? (
            <Image source={{ uri: user.profile_image_url }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: rColor }]}>
              <Text style={styles.avatarText}>{user.name[0]?.toUpperCase()}</Text>
            </View>
          )}
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userContact}>{user.phone || user.email}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: rColor + '18' }]}>
              <Text style={[styles.badgeText, { color: rColor }]}>{roleLabel}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: user.is_active ? '#E8F8EF' : '#FDE8E8' }]}>
              <Text style={[styles.badgeText, { color: user.is_active ? COLORS.success : COLORS.error }]}>
                {user.is_active ? 'အသက်ဝင်' : 'ပိတ်ထား'}
              </Text>
            </View>
          </View>

          {/* Quick call */}
          {user.phone && (
            <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${user.phone}`)}>
              <Text style={styles.callBtnText}>ဖုန်းခေါ်ရန် · {user.phone}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── VIEW MODE ── */}
        {!isEditing && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>အကောင့် အချက်အလက်</Text>
              <DetailRow label="နာမည်" value={user.name} />
              <DetailRow label="ဖုန်းနံပါတ်" value={user.phone || '—'} />
              <DetailRow label="အီးမေးလ်" value={user.email || '—'} />
              <DetailRow label="အခန်းကဏ္ဍ" value={roleLabel} valueColor={rColor} />
            </View>

            {/* Status toggle */}
            <TouchableOpacity
              style={[styles.toggleBtn, user.is_active ? styles.deactivateBtn : styles.activateBtn,
                statusMutation.isPending && { opacity: 0.6 }]}
              onPress={handleToggleStatus}
              disabled={statusMutation.isPending}
            >
              {statusMutation.isPending ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.toggleBtnText}>
                  {user.is_active ? 'အကောင့် ပိတ်မည်' : 'အကောင့် ဖွင့်မည်'}
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* ── EDIT MODE ── */}
        {isEditing && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>အချက်အလက် ပြင်ဆင်ရန်</Text>

              <FormField
                label="နာမည် *"
                value={name}
                onChangeText={v => update('name', v)}
                error={errors.name}
                placeholder="အမည်"
              />
              <FormField
                label="ဖုန်းနံပါတ် *"
                value={phone}
                onChangeText={v => update('phone', v)}
                error={errors.phone}
                placeholder="၀၉... (09...)"
                keyboardType="phone-pad"
              />
              <FormField
                label="အီးမေးလ် (ရွေးချယ်ရန်)"
                value={email}
                onChangeText={v => update('email', v)}
                placeholder="name@example.com"
                keyboardType="email-address"
              />

              {/* Password field with show/hide */}
              <View style={styles.field}>
                <Text style={styles.label}>စကားဝှက်အသစ် (မပြောင်းလျှင် ကွက်ချန်)</Text>
                <View style={styles.passRow}>
                  <TextInput
                    style={[styles.textInput, { flex: 1 }, !!errors.password && styles.inputError]}
                    value={password}
                    onChangeText={v => update('password', v)}
                    placeholder="အနည်းဆုံး ၈ လုံး"
                    placeholderTextColor={COLORS.textLight}
                    secureTextEntry={!showPass}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity style={styles.toggleTextBtn} onPress={() => setShowPass(v => !v)}>
                    <Text style={styles.toggleTextBtnText}>{showPass ? 'ဖျောက်' : 'ပြ'}</Text>
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              </View>
            </View>

            {/* Role picker */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>အခန်းကဏ္ဍ ရွေးချယ်ရန်</Text>
              <View style={styles.roleList}>
                {ROLES.map(r => {
                  const selected = role === r.value;
                  return (
                    <TouchableOpacity
                      key={r.value}
                      style={[styles.roleItem, selected && { borderColor: r.color, backgroundColor: r.color + '12' }]}
                      onPress={() => setRole(r.value)}
                    >
                      <View style={[styles.roleDot, { borderColor: r.color }]}>
                        {selected && <View style={[styles.roleDotInner, { backgroundColor: r.color }]} />}
                      </View>
                      <Text style={[styles.roleItemText, selected && { color: r.color, fontWeight: '700' }]}>
                        {r.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Save button */}
            <TouchableOpacity
              style={[styles.submitBtn, updateMutation.isPending && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.submitBtnText}>ပြင်ဆင်မှု သိမ်းမည်</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function DetailRow({ label, value, valueColor }: {
  label: string; value: string; valueColor?: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, valueColor ? { color: valueColor } : {}]}>{value}</Text>
    </View>
  );
}

function FormField({
  label, value, onChangeText, placeholder, keyboardType, error, secureTextEntry,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; keyboardType?: any; error?: string; secureTextEntry?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.textInput, !!error && styles.inputError]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textLight}
        keyboardType={keyboardType || 'default'}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollArea: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingBottom: 16,
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20, gap: 12,
  },
  backBtn: {
    paddingHorizontal: 4, paddingVertical: 4,
  },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: COLORS.white, textAlign: 'center',
    fontFamily: FONTS.bold,
  },
  editBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)' },
  editBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '700', fontFamily: FONTS.bold },

  content: { padding: 16, paddingBottom: 40, gap: 14 },

  // Profile card
  profileCard: {
    alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 16,
    padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  avatarImage: { width: 72, height: 72, borderRadius: 36, marginBottom: 10 },
  avatarText: { fontSize: 28, fontWeight: '800', color: COLORS.white, fontFamily: FONTS.bold },
  userName: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 2, fontFamily: FONTS.bold },
  userContact: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 10, fontFamily: FONTS.regular },
  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 12 },
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16 },
  badgeText: { fontSize: 12, fontWeight: '700', fontFamily: FONTS.bold },
  callBtn: {
    backgroundColor: COLORS.success, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16,
  },
  callBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '700', fontFamily: FONTS.bold },

  // Generic card
  card: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 12, fontFamily: FONTS.bold },

  // Detail view rows
  detailRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  detailLabel: { fontSize: 11, color: COLORS.textLight, marginBottom: 2, fontFamily: FONTS.regular },
  detailValue: { fontSize: 15, fontWeight: '600', color: COLORS.text, fontFamily: FONTS.semiBold },

  // Status toggle
  toggleBtn: { borderRadius: 12, padding: 14, alignItems: 'center' },
  activateBtn: { backgroundColor: COLORS.success },
  deactivateBtn: { backgroundColor: COLORS.error },
  toggleBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700', fontFamily: FONTS.bold },

  // Form fields
  field: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6, fontFamily: FONTS.semiBold },
  textInput: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10, padding: 12, fontSize: 15, color: COLORS.text, backgroundColor: COLORS.background, fontFamily: FONTS.regular },
  inputError: { borderColor: COLORS.error },
  errorText: { fontSize: 12, color: COLORS.error, marginTop: 4, fontFamily: FONTS.regular },
  passRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleTextBtn: { paddingHorizontal: 10, paddingVertical: 10 },
  toggleTextBtnText: { color: COLORS.primary, fontSize: 13, fontWeight: '700', fontFamily: FONTS.bold },

  // Role picker
  roleList: { gap: 8 },
  roleItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.border },
  roleDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  roleDotInner: { width: 8, height: 8, borderRadius: 4 },
  roleItemText: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '500', fontFamily: FONTS.medium },

  // Submit
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center' },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.white, fontFamily: FONTS.bold },
});