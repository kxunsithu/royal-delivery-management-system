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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';

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
      const responseErrors = error?.response?.data?.errors;
      const firstError = responseErrors ? Object.values(responseErrors).flat()[0] : null;
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
    <View style={[styles.root, { backgroundColor: colors.primary }]}>
      <StatusBar style="light" />
      <View style={[styles.headerBackground, { backgroundColor: colors.primary }]}>
        <View style={styles.decorCircleOne} />
        <View style={styles.decorCircleTwo} />
      </View>

      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.hero}>
              <Text style={styles.appName}>Royal Myawaddy</Text>
              <Text style={styles.appSubtitle}>Delivery Management System</Text>
            </View>

            <View style={styles.sheet}>
              <Text style={[styles.title, { color: '#FFFFFF' }]}>အကောင့်ဝင်ရောက်ရန်</Text>
              <Text style={[styles.subtitle, { color: 'rgba(255,255,255,0.82)' }]}>သင့်အကောင့်သို့ ဝင်ရောက်ပါ</Text>

              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: '#FFFFFF' }]}>ဖုန်းနံပါတ်</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: isDark ? colors.background : '#F8F9FB',
                      borderColor: errors.phone
                        ? colors.error
                        : focused === 'phone'
                        ? colors.primary
                        : colors.border,
                    },
                  ]}
                >
                  <View style={[styles.fieldIcon, { backgroundColor: isDark ? colors.muted : '#FFFFFF' }]}>
                    <MaterialCommunityIcons name="phone-outline" size={20} color={inputIconColor('phone')} />
                  </View>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="09xxxxxxxxx"
                    placeholderTextColor={colors.textLight}
                    value={phone}
                    onChangeText={(text) => {
                      setPhone(text);
                      setErrors((previous) => ({ ...previous, phone: undefined }));
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
                {errors.phone && <Text style={[styles.errorText, { color: colors.error }]}>{errors.phone}</Text>}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: '#FFFFFF' }]}>စကားဝှက်</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: isDark ? colors.background : '#F8F9FB',
                      borderColor: errors.password
                        ? colors.error
                        : focused === 'password'
                        ? colors.primary
                        : colors.border,
                    },
                  ]}
                >
                  <View style={[styles.fieldIcon, { backgroundColor: isDark ? colors.muted : '#FFFFFF' }]}>
                    <MaterialCommunityIcons name="lock-outline" size={20} color={inputIconColor('password')} />
                  </View>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textLight}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setErrors((previous) => ({ ...previous, password: undefined }));
                    }}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    secureTextEntry={!showPassword}
                    editable={!isLoading}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword((visible) => !visible)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'စကားဝှက် ဖျောက်မည်' : 'စကားဝှက် ပြမည်'}
                  >
                    <MaterialCommunityIcons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={21}
                      color={colors.textLight}
                    />
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={[styles.errorText, { color: colors.error }]}>{errors.password}</Text>}
              </View>

              <TouchableOpacity
                style={[
                  styles.loginBtn,
                  { backgroundColor: '#FFFFFF' },
                  isLoading && styles.loginBtnDisabled,
                ]}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.primary} size="small" />
                ) : (
                  <>
                    <Text style={[styles.loginBtnText, { color: colors.primary }]}>ဝင်ရောက်မည်</Text>
                    <View style={[styles.loginArrow, { backgroundColor: colors.primary }]}>
                      <MaterialCommunityIcons name="arrow-right" size={17} color="#FFFFFF" />
                    </View>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <Text style={[styles.footer, { color: 'rgba(255,255,255,0.82)' }]}>© 2026 Royal Myawaddy</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 310,
  },
  decorCircleOne: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 32,
    borderColor: 'rgba(255,255,255,0.08)',
    right: -100,
    top: -80,
  },
  decorCircleTwo: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 24,
    borderColor: 'rgba(255,255,255,0.06)',
    left: -90,
    top: 150,
  },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  hero: {
    height: 210,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 18,
  },
  brandRow: { marginBottom: 10 },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.28)',
    shadowColor: '#7C2D12',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 8,
  },
  logoImage: { width: 54, height: 54, borderRadius: 27 },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  appSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: 'rgba(255,255,255,0.82)',
    fontFamily: 'NotoSansMyanmar_400Regular',
  },
  sheet: {
    paddingHorizontal: 2,
    paddingTop: 22,
    paddingBottom: 24,
  },
  titleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 21,
    fontWeight: '700',
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'NotoSansMyanmar_400Regular',
    marginTop: 3,
    marginBottom: 20,
  },
  fieldGroup: { marginBottom: 14 },
  label: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'NotoSansMyanmar_600SemiBold',
    marginBottom: 7,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 1.5,
    paddingHorizontal: 8,
    height: 56,
  },
  fieldIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 10,
    fontSize: 15,
    fontFamily: 'NotoSansMyanmar_400Regular',
  },
  errorText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 5,
    marginLeft: 3,
    fontFamily: 'NotoSansMyanmar_600SemiBold',
  },
  loginBtn: {
    height: 56,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  loginBtnDisabled: { opacity: 0.65 },
  loginBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  loginArrow: {
    position: 'absolute',
    right: 8,
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    textAlign: 'center',
    fontSize: 11,
    fontFamily: 'NotoSansMyanmar_400Regular',
    marginVertical: 18,
  },
});
