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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, User } from '../../src/services/userService';
import { COLORS, ROLE_LABELS_MM } from '../../src/constants';

const ROLES = [
  { value: 'admin', label: 'အက်ဒ်မင် (Admin)' },
  { value: 'manager', label: 'မန်နေဂျာ (Manager)' },
  { value: 'delivery_staff', label: 'ပို့ဆောင်ရေးဝန်ထမ်း (Delivery Staff)' },
  { value: 'accountant', label: 'စာရင်းကိုင် (Accountant)' },
];

export default function UserDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = Number(id);
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('delivery_staff');
  const [password, setPassword] = useState('');

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
    mutationFn: (updateData: Partial<User> & { password?: string }) =>
      userService.update(userId, updateData),
    onSuccess: () => {
      Alert.alert('အောင်မြင်ပါသည်', 'အသုံးပြုသူ အချက်အလက်များကို ပြင်ဆင်ပြီးပါပြီ');
      setIsEditing(false);
      setPassword('');
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      refetch();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'ပြင်ဆင်မှု မအောင်မြင်ပါ';
      Alert.alert('မှားယွင်းမှု', msg);
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

  function handleSave() {
    if (!name.trim()) {
      Alert.alert('အချက်အလက် လိုအပ်ပါသည်', 'အမည် ထည့်သွင်းပါ');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('အချက်အလက် လိုအပ်ပါသည်', 'ဖုန်းနံပါတ် ထည့်သွင်းပါ');
      return;
    }

    const payload: any = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || null,
      role,
    };
    if (password.trim()) {
      payload.password = password.trim();
    }

    updateMutation.mutate(payload);
  }

  function handleToggleStatus() {
    if (!user) return;
    const action = user.is_active ? 'ပိတ်' : 'ဖွင့်';
    Alert.alert('အကောင့် ' + action + 'မည်', `${user.name} ၏ အကောင့်ကို ${action}မည်လား?`, [
      { text: 'မလုပ်တော့', style: 'cancel' },
      { text: action + 'မည်', onPress: () => statusMutation.mutate(!user.is_active) },
    ]);
  }

  if (isLoading || !user) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const roleLabel = ROLE_LABELS_MM[user.role as keyof typeof ROLE_LABELS_MM] || user.role;
  const roleColor = user.role === 'admin' ? '#8B5CF6' : user.role === 'manager' ? COLORS.info : COLORS.success;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>အသုံးပြုသူ အချက်အလက်</Text>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => {
            if (isEditing) {
              setName(user.name);
              setEmail(user.email || '');
              setPhone(user.phone || '');
              setRole(user.role);
              setPassword('');
              setIsEditing(false);
            } else {
              setIsEditing(true);
            }
          }}
        >
          <Ionicons name={isEditing ? 'close' : 'create-outline'} size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header Card */}
        <View style={styles.profileCard}>
          <View style={[styles.avatar, { backgroundColor: roleColor + '25' }]}>
            <Text style={[styles.avatarText, { color: roleColor }]}>
              {user.name[0]?.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.phone || user.email}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.roleBadge, { backgroundColor: roleColor + '20' }]}>
              <View style={[styles.roleDot, { backgroundColor: roleColor }]} />
              <Text style={[styles.roleText, { color: roleColor }]}>{roleLabel}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: user.is_active ? '#E8F5E9' : '#FFEBEE' }]}>
              <View style={[styles.roleDot, { backgroundColor: user.is_active ? COLORS.success : COLORS.error }]} />
              <Text style={{ fontSize: 13, fontWeight: '700', color: user.is_active ? COLORS.success : COLORS.error }}>
                {user.is_active ? 'အကောင့်ဖွင့်ထားသည်' : 'အကောင့်ပိတ်ထားသည်'}
              </Text>
            </View>
          </View>
        </View>

        {isEditing ? (
          /* Edit Form */
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>အချက်အလက် ပြင်ဆင်ရန်</Text>

            <View style={styles.field}>
              <Text style={styles.label}>အမည် *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="အမည် ထည့်ပါ"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>ဖုန်းနံပါတ် *</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="၀၉... (09...)"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>အီးမေးလ် (ရွေးချယ်ရန်)</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="name@example.com"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>စကားဝှက်အသစ် (မပြောင်းလိုပါက ချန်ထားခဲ့ပါ)</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="စကားဝှက်အသစ်..."
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>ရာထူး / အခန်းကဏ္ဍ</Text>
              <View style={styles.roleGrid}>
                {ROLES.map((r) => (
                  <TouchableOpacity
                    key={r.value}
                    style={[styles.roleOption, role === r.value && styles.roleOptionActive]}
                    onPress={() => setRole(r.value)}
                  >
                    <Ionicons
                      name={role === r.value ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={role === r.value ? COLORS.primary : COLORS.textLight}
                    />
                    <Text style={[styles.roleOptionText, role === r.value && styles.roleOptionTextActive]}>
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, updateMutation.isPending && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.saveBtnText}>အချက်အလက် သိမ်းဆည်းမည်</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          /* View Details */
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>အသေးစိတ် အချက်အလက်များ</Text>

            <View style={styles.detailRow}>
              <View style={styles.detailIconBox}>
                <Ionicons name="call-outline" size={20} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>ဖုန်းနံပါတ်</Text>
                <Text style={styles.detailValue}>{user.phone || 'ဖုန်းနံပါတ် မရှိပါ'}</Text>
              </View>
              {user.phone ? (
                <TouchableOpacity
                  style={styles.callActionBtn}
                  onPress={() => Linking.openURL(`tel:${user.phone}`)}
                >
                  <Ionicons name="call" size={16} color={COLORS.white} />
                  <Text style={styles.callActionText}>ဖုန်းခေါ်မည်</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <View style={styles.detailIconBox}>
                <Ionicons name="mail-outline" size={20} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>အီးမေးလ်</Text>
                <Text style={styles.detailValue}>{user.email}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <View style={styles.detailIconBox}>
                <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>ရာထူး</Text>
                <Text style={styles.detailValue}>{roleLabel}</Text>
              </View>
            </View>

            {user.created_at && (
              <>
                <View style={styles.divider} />
                <View style={styles.detailRow}>
                  <View style={styles.detailIconBox}>
                    <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>အကောင့် စတင်ဖွင့်သည့်ရက်</Text>
                    <Text style={styles.detailValue}>
                      {new Date(user.created_at).toLocaleDateString('my-MM', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                </View>
              </>
            )}

            <View style={styles.actionSection}>
              <TouchableOpacity
                style={[styles.toggleBtn, user.is_active ? styles.toggleBtnDeactivate : styles.toggleBtnActivate]}
                onPress={handleToggleStatus}
                disabled={statusMutation.isPending}
              >
                <Ionicons
                  name={user.is_active ? 'close-circle-outline' : 'checkmark-circle-outline'}
                  size={20}
                  color={COLORS.white}
                />
                <Text style={styles.toggleBtnText}>
                  {user.is_active ? 'အကောင့်ကို ယာယီပိတ်ထားမည်' : 'အကောင့်ကို ပြန်ဖွင့်မည်'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  content: { padding: 16, gap: 14 },
  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 32, fontWeight: '800' },
  userName: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  userEmail: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 12 },
  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleDot: { width: 8, height: 8, borderRadius: 4 },
  roleText: { fontSize: 13, fontWeight: '700' },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 16 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  detailIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabel: { fontSize: 12, color: COLORS.textLight, marginBottom: 2 },
  detailValue: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 4 },
  callActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.success,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  callActionText: { color: COLORS.white, fontSize: 13, fontWeight: '600' },
  actionSection: { marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
  },
  toggleBtnActivate: { backgroundColor: COLORS.success },
  toggleBtnDeactivate: { backgroundColor: COLORS.error },
  toggleBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  field: { marginBottom: 14 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },
  roleGrid: { gap: 8, marginTop: 4 },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.background,
  },
  roleOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryBg,
  },
  roleOptionText: { fontSize: 14, color: COLORS.textSecondary },
  roleOptionTextActive: { color: COLORS.text, fontWeight: '700' },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  saveBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});

