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
import { COLORS, ROLE_LABELS_MM } from '../../src/constants';

// ── Shared with create page ───────────────────────────────────────────────────
const ROLES = [
  { value: 'admin',          label: 'အက်ဒ်မင်',             icon: 'shield',     color: '#8B5CF6' },
  { value: 'manager',        label: 'မန်နေဂျာ',              icon: 'briefcase',  color: '#3B82F6' },
  { value: 'accountant',     label: 'စာရင်းကိုင်',           icon: 'calculator', color: '#F59E0B' },
  { value: 'delivery_staff', label: 'ပို့ဆောင်ရေးဝန်ထမ်း', icon: 'bicycle',    color: '#10B981' },
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
      Alert.alert('✅ အောင်မြင်ပါသည်', 'အသုံးပြုသူ အချက်အလက်များ ပြင်ဆင်ပြီးပါပြီ');
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
  const roleIcon = ROLES.find(r => r.value === user.role)?.icon ?? 'person';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {isEditing ? 'ပြင်ဆင်နေဆဲ' : 'အသုံးပြုသူ အချက်အလက်'}
        </Text>
        <TouchableOpacity
          style={[styles.iconBtn, isEditing && { backgroundColor: 'rgba(255,255,255,0.35)' }]}
          onPress={() => { setIsEditing(v => !v); setErrors({}); }}
        >
          <Ionicons name={isEditing ? 'close' : 'create-outline'} size={22} color={COLORS.white} />
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
            <View style={[styles.avatar, { backgroundColor: rColor + '25' }]}>
              <Text style={[styles.avatarText, { color: rColor }]}>
                {user.name[0]?.toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userContact}>{user.phone || user.email}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.roleBadge, { backgroundColor: rColor + '18' }]}>
              <Ionicons name={roleIcon as any} size={13} color={rColor} />
              <Text style={[styles.roleBadgeText, { color: rColor }]}>{roleLabel}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: user.is_active ? '#E8F8EF' : '#FDE8E8' }]}>
              <View style={[styles.statusDot, { backgroundColor: user.is_active ? COLORS.success : COLORS.error }]} />
              <Text style={[styles.statusBadgeText, { color: user.is_active ? COLORS.success : COLORS.error }]}>
                {user.is_active ? 'အသက်ဝင်' : 'ပိတ်ထား'}
              </Text>
            </View>
          </View>

          {/* Quick call */}
          {user.phone && (
            <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${user.phone}`)}>
              <Ionicons name="call" size={16} color={COLORS.white} />
              <Text style={styles.callBtnText}>{user.phone}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── VIEW MODE ── */}
        {!isEditing && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>အကောင့် အချက်အလက်</Text>
              <DetailRow icon="person-outline"      label="နာမည်"       value={user.name} />
              <DetailRow icon="call-outline"        label="ဖုန်းနံပါတ်" value={user.phone || '—'} />
              <DetailRow icon="mail-outline"        label="အီးမေးလ်"    value={user.email || '—'} />
              <DetailRow icon="shield-checkmark-outline" label="အခန်းကဏ္ဍ" value={roleLabel} valueColor={rColor} />
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
                <>
                  <Ionicons
                    name={user.is_active ? 'lock-closed-outline' : 'lock-open-outline'}
                    size={20} color={COLORS.white}
                  />
                  <Text style={styles.toggleBtnText}>
                    {user.is_active ? 'အကောင့် ပိတ်မည်' : 'အကောင့် ဖွင့်မည်'}
                  </Text>
                </>
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

              {/* Password field with eye toggle */}
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
                  <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(v => !v)}>
                    <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textLight} />
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              </View>
            </View>

            {/* Role picker — same design as create page */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>အခန်းကဏ္ဍ ရွေးချယ်ရန်</Text>
              <View style={styles.roleList}>
                {ROLES.map(r => (
                  <TouchableOpacity
                    key={r.value}
                    style={[styles.roleItem, role === r.value && { borderColor: r.color, backgroundColor: r.color + '12' }]}
                    onPress={() => setRole(r.value)}
                  >
                    <View style={[styles.roleIconWrap, { backgroundColor: r.color + '20' }]}>
                      <Ionicons name={r.icon as any} size={18} color={r.color} />
                    </View>
                    <Text style={[styles.roleItemText, role === r.value && { color: r.color, fontWeight: '700' }]}>
                      {r.label}
                    </Text>
                    <Ionicons
                      name={role === r.value ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={role === r.value ? r.color : COLORS.textLight}
                      style={{ marginLeft: 'auto' }}
                    />
                  </TouchableOpacity>
                ))}
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
                <>
                  <Ionicons name="checkmark-circle" size={22} color={COLORS.white} />
                  <Text style={styles.submitBtnText}>ပြင်ဆင်မှု သိမ်းမည်</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function DetailRow({ icon, label, value, valueColor }: {
  icon: string; label: string; value: string; valueColor?: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIconBox}>
        <Ionicons name={icon as any} size={18} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={[styles.detailValue, valueColor ? { color: valueColor } : {}]}>{value}</Text>
      </View>
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
  container: { flex: 1, backgroundColor: COLORS.primary },
  scrollArea: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingBottom: 20,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28, gap: 12,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: COLORS.white, textAlign: 'center' },
  content: { padding: 16, paddingBottom: 40, gap: 14 },

  // Profile card
  profileCard: {
    alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 20,
    padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 3,
  },
  avatar: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarImage: { width: 88, height: 88, borderRadius: 44, marginBottom: 12, borderWidth: 3, borderColor: COLORS.border },
  avatarText: { fontSize: 34, fontWeight: '800' },
  userName: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  userContact: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 12 },
  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 14 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  roleBadgeText: { fontSize: 13, fontWeight: '700' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusBadgeText: { fontSize: 13, fontWeight: '700' },
  callBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: COLORS.success,
    paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20,
  },
  callBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '700' },

  // Generic card
  card: {
    backgroundColor: COLORS.white, borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 16 },

  // Detail view rows
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  detailIconBox: { width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.primaryLight + '30', alignItems: 'center', justifyContent: 'center' },
  detailLabel: { fontSize: 11, color: COLORS.textLight, marginBottom: 1 },
  detailValue: { fontSize: 15, fontWeight: '600', color: COLORS.text },

  // Status toggle
  toggleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 16, padding: 16 },
  activateBtn: { backgroundColor: COLORS.success },
  deactivateBtn: { backgroundColor: COLORS.error },
  toggleBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },

  // Form fields — same as create page
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
  textInput: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10, padding: 12, fontSize: 15, color: COLORS.text, backgroundColor: COLORS.background },
  inputError: { borderColor: COLORS.error },
  errorText: { fontSize: 12, color: COLORS.error, marginTop: 4 },
  passRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: { padding: 10 },

  // Role picker — identical to create page
  roleList: { gap: 8 },
  roleItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.border },
  roleIconWrap: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  roleItemText: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '500' },

  // Submit
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: COLORS.primary, borderRadius: 16, padding: 18 },
  submitBtnText: { fontSize: 17, fontWeight: '700', color: COLORS.white },
});
