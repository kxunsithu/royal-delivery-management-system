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
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import { RADIUS } from '../src/constants';

export default function LoginScreen() {
  const { colors, isDark } = useTheme();
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

  const inputIconColor = (field: 'phone' | 'password') =>
    errors[field] ? colors.error : focused === field ? colors.primary : colors.textLight;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={['top']}>
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
            <View style={styles.hero}>
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

            {/* White sheet */}
            <View style={[styles.sheet, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
              <View style={styles.sheetHandle} />
              <Text style={[styles.title, { color: colors.text }]}>အကောင့်ဝင်ရောက်ရန်</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                ဖုန်းနံပါတ်နှင့် စကားဝှက် ထည့်သွင်းပါ
              </Text>

              {/* Phone Field */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>ဖုန်းနံပါတ်</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: isDark ? colors.background : '#FFFFFF',
                      borderColor: errors.phone
                        ? colors.error
                        : focused === 'phone'
                        ? colors.primary
                        : colors.border,
                    },
                  ]}
                >
                  <MaterialCommunityIcons name="phone-outline" size={20} color={inputIconColor('phone')} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="09..."
                    placeholderTextColor={colors.textLight}
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
                {errors.phone && (
                  <Text style={[styles.errorText, { color: colors.error }]}>{errors.phone}</Text>
                )}
              </View>

              {/* Password Field */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>စကားဝှက်</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: isDark ? colors.background : '#FFFFFF',
                      borderColor: errors.password
                        ? colors.error
                        : focused === 'password'
                        ? colors.primary
                        : colors.border,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="lock-outline"
                    size={20}
                    color={inputIconColor('password')}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textLight}
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
                      color={colors.textLight}
                    />
                  </TouchableOpacity>
                </View>
                {errors.password && (
                  <Text style={[styles.errorText, { color: colors.error }]}>{errors.password}</Text>
                )}
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={[
                  styles.loginBtn,
                  { backgroundColor: colors.primary },
                  isLoading && styles.loginBtnDisabled,
                ]}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.loginBtnText}>ဝင်ရောက်မည်</Text>
                    <MaterialCommunityIcons name="arrow-right" size={18} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>

              <Text style={[styles.footer, { color: colors.textLight }]}>
                Royal Myawaddy Delivery © 2026
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F97316' },
  safe: { flex: 1, backgroundColor: '#F97316' },
  flex: { flex: 1 },

  // Decorative background shapes
  decorTR: {
    position: 'absolute',
    top: -110,
    right: -90,
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  decorBL: {
    position: 'absolute',
    top: 170,
    left: -120,
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },

  scrollContent: { flexGrow: 1 },

  // Brand
  hero: {
    alignItems: 'center',
    paddingTop: 44,
    paddingBottom: 34,
    paddingHorizontal: 28,
  },
  logoWrap: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#7C2D12',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  logoImage: { width: 62, height: 62, borderRadius: 18 },
  appName: {
    fontSize: 27,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'NotoSansMyanmar_700Bold',
    letterSpacing: 0.2,
    marginBottom: 6,
  },
  appSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.82)',
    fontFamily: 'NotoSansMyanmar_400Regular',
  },

  // Sheet
  sheet: {
    flex: 1,
    minHeight: 430,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 32,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'NotoSansMyanmar_700Bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'NotoSansMyanmar_400Regular',
    marginBottom: 24,
  },

  // Field
  fieldGroup: { marginBottom: 16 },
  label: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'NotoSansMyanmar_600SemiBold',
    marginBottom: 7,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'NotoSansMyanmar_400Regular',
    paddingVertical: 0,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    marginLeft: 3,
    fontFamily: 'NotoSansMyanmar_600SemiBold',
  },

  // Login button
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: RADIUS.md,
    height: 52,
    marginTop: 8,
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'NotoSansMyanmar_700Bold',
  },

  // Footer
  footer: {
    textAlign: 'center',
    fontSize: 11,
    fontFamily: 'NotoSansMyanmar_400Regular',
    marginTop: 28,
  },
});
