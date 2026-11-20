import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import { COLORS, FONTS } from '../src/constants';

export default function LoginScreen() {
  const { colors } = useTheme();
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ phone?: string; password?: string }>({});
  const [focused, setFocused] = useState<'phone' | 'password' | null>(null);

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
      {/* Decorative circles */}
      <View style={styles.decorTR} />
      <View style={styles.decorBL} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand */}
          <View style={styles.brand}>
            <View style={styles.logoWrap}>
              <Image
                source={require('../assets/icon.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.appName}>Royal Myawaddy</Text>
            <Text style={styles.appSubtitle}>ပို့ဆောင်ရေး စီမံခန့်ခွဲမှုစနစ်</Text>
          </View>

          {/* Form — no card, directly on orange */}
          <View style={styles.form}>
            <Text style={styles.title}>အကောင့်ဝင်ရောက်ရန်</Text>

            {/* Phone Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>ဖုန်းနံပါတ်</Text>
              <View
                style={[
                  styles.inputWrapper,
                  focused === 'phone' && styles.inputFocused,
                  errors.phone ? styles.inputError : null,
                ]}
              >
                <MaterialCommunityIcons
                  name="phone-outline"
                  size={20}
                  color={
                    errors.phone
                      ? COLORS.error
                      : focused === 'phone'
                      ? COLORS.primary
                      : '#AAAAAA'
                  }
                />
                <TextInput
                  style={styles.input}
                  placeholder="09..."
                  placeholderTextColor="#AAAAAA"
                  value={phone}
                  onChangeText={(t) => {
                    setPhone(t);
                    setErrors((e) => ({ ...e, phone: undefined }));
                  }}
                  onFocus={() => setFocused('phone')}
                  onBlur={() => setFocused(null)}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  returnKeyType="next"
                />
              </View>
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            {/* Password Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>စကားဝှက်</Text>
              <View
                style={[
                  styles.inputWrapper,
                  focused === 'password' && styles.inputFocused,
                  errors.password ? styles.inputError : null,
                ]}
              >
                <MaterialCommunityIcons
                  name="lock-outline"
                  size={20}
                  color={
                    errors.password
                      ? COLORS.error
                      : focused === 'password'
                      ? COLORS.primary
                      : '#AAAAAA'
                  }
                />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#AAAAAA"
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    setErrors((e) => ({ ...e, password: undefined }));
                  }}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                >
                  <MaterialCommunityIcons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#AAAAAA"
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
                <ActivityIndicator color={COLORS.primary} size="small" />
              ) : (
                <Text style={styles.loginBtnText}>ဝင်ရောက်မည်</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>Royal Myawaddy Delivery © 2026</Text>
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
    paddingHorizontal: 28,
    paddingBottom: 32,
  },

  // Decorative background blobs
  decorTR: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 280,
    height: 280,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.09)',
  },
  decorBL: {
    position: 'absolute',
    bottom: 40,
    left: -120,
    width: 260,
    height: 260,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },

  // Brand
  brand: {
    alignItems: 'center',
    marginTop: 48,
    marginBottom: 44,
  },
  logoWrap: {
    width: 96,
    height: 96,
    borderRadius: 6,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  logoImage: { width: 72, height: 72, borderRadius: 6 },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.white,
    fontFamily: FONTS.bold,
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  appSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.78)',
    fontFamily: FONTS.regular,
  },

  // Form (no card — directly on orange)
  form: {
    gap: 0,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
    fontFamily: FONTS.bold,
    marginBottom: 24,
  },

  // Field
  fieldGroup: { marginBottom: 18 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
    fontFamily: FONTS.semiBold,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 6,
    paddingHorizontal: 16,
    height: 54,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  inputFocused: {
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  inputError: {
    borderWidth: 2,
    borderColor: COLORS.error,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    fontFamily: FONTS.regular,
    paddingVertical: 0,
  },
  errorText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '600',
    marginTop: 6,
    marginLeft: 4,
    fontFamily: FONTS.semiBold,
  },

  // Login button — white on orange bg
  loginBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 6,
    height: 54,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  loginBtnDisabled: { opacity: 0.6, shadowOpacity: 0 },
  loginBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
    fontFamily: FONTS.bold,
    letterSpacing: 0.3,
  },

  // Footer
  footer: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginTop: 36,
  },
});
