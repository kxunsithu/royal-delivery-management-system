import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { COLORS, FONTS } from '../constants';
import { useTheme } from '../context/ThemeContext';

// ---------- Screen ----------
export function Screen({ children, scroll = true, style }: { children: React.ReactNode; scroll?: boolean; style?: any }) {
  const { colors } = useTheme();
  const content = scroll ? <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>{children}</ScrollView> : children;
  return <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }, style]}>{content}</SafeAreaView>;
}

// ---------- Header ----------
export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.header, { backgroundColor: colors.white, borderBottomColor: colors.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

// ---------- Card ----------
export function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  const { colors } = useTheme();
  return <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}>{children}</View>;
}

// ---------- Section title ----------
export function SectionTitle({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return <Text style={[styles.sectionTitle, { color: colors.text }]}>{children}</Text>;
}

// ---------- Button ----------
export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
}: {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: any;
  textStyle?: any;
}) {
  const { colors } = useTheme();
  const v = variant === 'primary'
    ? { container: { backgroundColor: colors.primary }, text: { color: colors.white }, loaderColor: colors.white }
    : variant === 'secondary'
    ? { container: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border }, text: { color: colors.text }, loaderColor: colors.text }
    : variant === 'ghost'
    ? { container: { backgroundColor: 'transparent' }, text: { color: colors.primary }, loaderColor: colors.primary }
    : { container: { backgroundColor: colors.error }, text: { color: colors.white }, loaderColor: colors.white };
  return (
    <TouchableOpacity
      style={[styles.btn, v.container, (disabled || loading) && styles.btnDisabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.loaderColor} />
      ) : (
        <Text style={[styles.btnText, v.text, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

// ---------- Input ----------
export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry,
  keyboardType,
  editable = true,
  right,
}: {
  label?: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: any;
  editable?: boolean;
  right?: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.fieldGroup}>
      {label ? <Text style={[styles.label, { color: colors.text }]}>{label}</Text> : null}
      <View style={[styles.inputWrapper, { backgroundColor: colors.white, borderColor: error ? colors.error : colors.border }, error ? styles.inputError : null]}>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder={placeholder}
          placeholderTextColor={colors.textLight}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          editable={editable}
        />
        {right}
      </View>
      {error ? <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text> : null}
    </View>
  );
}

// ---------- Badge ----------
export function Badge({ label, color, bg }: { label: string; color?: string; bg?: string }) {
  const { colors } = useTheme();
  const c = color || colors.primary;
  return (
    <View style={[styles.badge, { backgroundColor: bg || c + '18' }]}>
      <Text style={[styles.badgeText, { color: c }]}>{label}</Text>
    </View>
  );
}

// ---------- StatCard ----------
export function StatCard({ label, value, color }: { label: string; value: any; color?: string }) {
  const { colors } = useTheme();
  const c = color || colors.primary;
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.statValue, { color: c }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

// ---------- EmptyState ----------
export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.empty}>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text>
      {subtitle ? <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
    </View>
  );
}

// ---------- Loading ----------
export function Loading() {
  const { colors } = useTheme();
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { flexGrow: 1, paddingBottom: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.bold },
  headerSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2, fontFamily: FONTS.regular },
  card: { minHeight: 80, minWidth: 120,
    backgroundColor: COLORS.white,
    borderRadius: 6,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
    marginTop: 4,
    fontFamily: FONTS.bold,
  },
  btn: {
    height: 46,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontSize: 15, fontWeight: '600', fontFamily: FONTS.semiBold },
  fieldGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6, fontFamily: FONTS.semiBold },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    height: 44,
  },
  inputError: { borderColor: COLORS.error },
  input: { flex: 1, fontSize: 14, color: COLORS.text, fontFamily: FONTS.regular },
  errorText: { fontSize: 12, color: COLORS.error, marginTop: 4, marginLeft: 2, fontFamily: FONTS.regular },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '600', fontFamily: FONTS.semiBold },
  statCard: { minHeight: 80, minWidth: 100,
    backgroundColor: COLORS.white,
    borderRadius: 6,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    flex: 1,
  },
  statValue: { fontSize: 20, fontWeight: '700', fontFamily: FONTS.bold, marginBottom: 2 },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, fontFamily: FONTS.regular, lineHeight: 16 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text, fontFamily: FONTS.semiBold },
  emptySubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, fontFamily: FONTS.regular },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
});
