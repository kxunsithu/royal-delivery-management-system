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
import { COLORS, FONTS } from '../src/constants';

export default function LoginScreen() {
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
            <View style={styles.brandMark}>
              <Image source={require('../assets/icon.png')} style={styles.brandMarkImage} resizeMode="contain" />
            </View>
            <Text style={styles.appName}>Royal Myawaddy</Text>
            <Text style={styles.appSubtitle}>ပို့ဆောင်ရေး စီမံခန့်ခွဲမှုစနစ်</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.title}>အကောင့်ဝင်ရောက်ရန်</Text>
            <Text style={styles.subtitle}>သင်၏ အကောင့်အချက်အလက် ထည့်သွင်းပါ</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>ဖုန်းနံပါတ်</Text>
              <View
                style={[
                  styles.inputWrapper,
                  focused === 'phone' && styles.inputFocused,
                  errors.phone ? styles.inputError : null,
                ]}
              >
                <View style={styles.iconWrap}>
                  <MaterialCommunityIcons
                    name="phone-outline"
                    size={20}
                    color={errors.phone ? COLORS.error : focused === 'phone' ? COLORS.primary : COLORS.primaryDark}
                  />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="09..."
                  placeholderTextColor={COLORS.textLight}
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

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>စကားဝှက်</Text>
              <View
                style={[
                  styles.inputWrapper,
                  focused === 'password' && styles.inputFocused,
                  errors.password ? styles.inputError : null,
                ]}
              >
                <View style={styles.iconWrap}>
                  <MaterialCommunityIcons
                    name="lock-outline"
                    size={20}
                    color={errors.password ? COLORS.error : focused === 'password' ? COLORS.primary : COLORS.primaryDark}
                  />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.textLight}
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
                  style={styles.toggleButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'စကားဝှက် ဖျောက်ရန်' : 'စကားဝှက် ဖော်ပြရန်'}
                >
                  <MaterialCommunityIcons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={COLORS.primaryDark}
                  />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

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
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  brand: {
    alignItems: 'center',
    marginBottom: 36,
  },
  brandMark: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  brandMarkImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
  },
  appName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
    fontFamily: FONTS.bold,
    letterSpacing: 0.3,
  },
  appSubtitle: {
    fontSize: 13,
    color: COLORS.white,
    marginTop: 4,
    fontFamily: FONTS.regular,
  },
  form: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
    fontFamily: FONTS.bold,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.white,
    marginBottom: 22,
    fontFamily: FONTS.regular,
  },
  fieldGroup: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 6,
    fontFamily: FONTS.semiBold,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    height: 50,
    gap: 10,
  },
  inputFocused: {
    borderColor: COLORS.primary,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.primaryDark,
    fontFamily: FONTS.regular,
    paddingVertical: 0,
    textAlignVertical: 'center',
  },
  iconWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButton: { padding: 4 },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 4,
    fontFamily: FONTS.semiBold,
  },
  loginBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    height: 50,
    marginTop: 8,
  },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primaryDark,
    fontFamily: FONTS.bold,
  },
  footer: {
    textAlign: 'center',
    color: COLORS.white,
    fontSize: 12,
    marginTop: 40,
    fontFamily: FONTS.regular,
  },
});