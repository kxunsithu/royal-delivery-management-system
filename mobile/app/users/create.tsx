import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { userService } from '../../src/services/userService';
import { COLORS } from '../../src/constants';

const ROLES = [
  { value: 'admin', label: 'အက်ဒ်မင်' },
  { value: 'manager', label: 'မန်နေဂျာ' },
  { value: 'delivery_staff', label: 'ပို့ဆောင်ရေးဝန်ထမ်း' },
];

export default function CreateUserScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', role: 'delivery_staff',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useMutation({
    mutationFn: (data: any) => userService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      Alert.alert('အောင်မြင်သည်', 'အသုံးပြုသူ ဖန်တီးပြီးပါပြီ', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'ဖန်တီးမှု မအောင်မြင်ပါ';
      Alert.alert('အမှားဖြစ်ပွားသည်', msg);
    },
  });

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: undefined as any }));
  }

  function validate() {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'လိုအပ်သည်';
    if (!form.phone.trim()) newErrors.phone = 'လိုအပ်သည်';
    if (!form.password.trim()) newErrors.password = 'လိုအပ်သည်';
    if (form.password.length < 8) newErrors.password = 'စကားဝှက် အနည်းဆုံး ၈ လုံး';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    createMutation.mutate({
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      password: form.password,
      role: form.role,
    });
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>အသုံးပြုသူ အသစ်ဖန်တီးမည်</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <FormField label="နာမည် *" value={form.name} onChangeText={v => update('name', v)} error={errors.name} placeholder="အမည်" />
          <FormField label="ဖုန်းနံပါတ် *" value={form.phone} onChangeText={v => update('phone', v)} error={errors.phone} placeholder="၀၉... (09...)" keyboardType="phone-pad" />
          <FormField label="စကားဝှက် *" value={form.password} onChangeText={v => update('password', v)} error={errors.password} placeholder="••••••••" secureTextEntry />
          <FormField label="အီးမေးလ် (ရွေးချယ်ရန်)" value={form.email} onChangeText={v => update('email', v)} error={errors.email} placeholder="name@example.com" keyboardType="email-address" />

          <Text style={styles.label}>အခန်းကဏ္ဍ</Text>
          <View style={styles.roleList}>
            {ROLES.map(r => (
              <TouchableOpacity
                key={r.value}
                style={[styles.roleItem, form.role === r.value && styles.roleItemActive]}
                onPress={() => update('role', r.value)}
              >
                <Ionicons
                  name={form.role === r.value ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={form.role === r.value ? COLORS.primary : COLORS.textLight}
                />
                <Text style={[styles.roleItemText, form.role === r.value && styles.roleItemTextActive]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, createMutation.isPending && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? <ActivityIndicator color={COLORS.white} /> : (
            <><Ionicons name="person-add" size={22} color={COLORS.white} /><Text style={styles.submitBtnText}>ဖန်တီးမည်</Text></>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  error,
  secureTextEntry,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  error?: string;
  secureTextEntry?: boolean;
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingBottom: 14, gap: 12 },
  closeBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: COLORS.white },
  content: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, gap: 12, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  field: {},
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
  textInput: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10, padding: 12, fontSize: 15, color: COLORS.text, backgroundColor: COLORS.background },
  inputError: { borderColor: COLORS.error },
  errorText: { fontSize: 12, color: COLORS.error, marginTop: 4 },
  roleList: { gap: 8 },
  roleItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.border },
  roleItemActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryBg },
  roleItemText: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '500' },
  roleItemTextActive: { color: COLORS.primary, fontWeight: '700' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: COLORS.primary, borderRadius: 16, padding: 18 },
  submitBtnText: { fontSize: 17, fontWeight: '700', color: COLORS.white },
});
