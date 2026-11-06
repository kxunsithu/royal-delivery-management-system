import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/context/AuthContext';
import { COLORS} from '../src/constants';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ phone?: string; password?: string }>({});

  function validate() {
    const newErrors: { phone?: string; password?: string } = {};
    if (!phone.trim()) newErrors.phone = 'ဖုန်းနံပါတ် ထည့်ပါ';
    if (!password.trim()) newErrors.password = 'စကားဝှက် ထည့်ပါ';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    setIsLoading(true);
    try {
      await login(phone.trim(), password);
    } catch (error: any) {
      const errors = error?.response?.data?.errors;
      const firstError = errors ? Object.values(errors).flat()[0] : null;
      const msg =
        firstError ||
        error?.response?.data?.message ||
        (error?.message?.includes('Network Error')
          ? 'ဆာဗာသို့ ချိတ်ဆက်၍မရပါ (Network Error)'
          : 'အကောင့်ဝင်ရောက်မှု မအောင်မြင်ပါ');
      Alert.alert('အမှားဖြစ်ပွားသည်', String(msg));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Ionicons name="cube" size={48} color={COLORS.white} />
              </View>
            </View>
            <Text style={styles.appName}>Royal Myawaddy</Text>
            <Text style={styles.appSubtitle}>ပို့ဆောင်ရေး စီမံခန့်ခွဲမှုစနစ်</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.title}>အကောင့်ဝင်ရောက်ရန်</Text>
            <Text style={styles.subtitle}>သင်၏ အကောင့်အချက်အလက် ထည့်သွင်းပါ</Text>

            {/* Phone Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>ဖုန်းနံပါတ်</Text>
              <View style={[styles.inputWrapper, errors.phone ? styles.inputError : null]}>
                <Ionicons name="call-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="၀၉၉၄၄၀၇၄၉၈၁ (09...)"
                  placeholderTextColor={COLORS.textLight}
                  value={phone}
                  onChangeText={(t) => { setPhone(t); setErrors(e => ({ ...e, phone: undefined })); }}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            {/* Password Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>စကားဝှက်</Text>
              <View style={[styles.inputWrapper, errors.password ? styles.inputError : null]}>
                <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.textLight}
                  value={password}
                  onChangeText={(t) => { setPassword(t); setErrors(e => ({ ...e, password: undefined })); }}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Text style={styles.loginBtnText}>ဝင်ရောက်မည်</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>Royal Myawaddy Delivery © 2024</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primary },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'center',
  },
  header: { alignItems: 'center', marginBottom: 32 },
  logoContainer: { marginBottom: 16 },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.5,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  appSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
    fontFamily: 'NotoSansMyanmar_400Regular',
  },
  card: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'NotoSansMyanmar_400Regular',
  },
  fieldGroup: { marginBottom: 16 },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 8,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 14,
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    height: 52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  inputError: { borderColor: COLORS.error, borderWidth: 2 },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    fontFamily: 'NotoSansMyanmar_400Regular',
  },
  eyeButton: { padding: 4 },
  errorText: {
    fontSize: 12,
    color: '#FFECEC',
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 4,
    fontFamily: 'NotoSansMyanmar_600SemiBold',
  },
  loginBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.white,
    borderRadius: 14,
    height: 54,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  footer: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 24,
    fontFamily: 'NotoSansMyanmar_400Regular',
  },
});
