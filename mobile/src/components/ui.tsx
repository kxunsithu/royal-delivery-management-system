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

// ---------- Screen ----------
export function Screen({ children, scroll = true, style }: { children: React.ReactNode; scroll?: boolean; style?: any }) {
  const content = scroll ? <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>{children}</ScrollView> : children;
  return <SafeAreaView style={[styles.screen, style]}>{content}</SafeAreaView>;
}

// ---------- Header ----------
export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

// ---------- Card ----------
export function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

// ---------- Section title ----------
export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
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
  const v = variantStyles[variant];
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

const variantStyles: any = {
  primary: { container: { backgroundColor: COLORS.primary }, text: { color: COLORS.white }, loaderColor: COLORS.white },
  secondary: { container: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border }, text: { color: COLORS.text }, loaderColor: COLORS.text },
  ghost: { container: { backgroundColor: 'transparent' }, text: { color: COLORS.primary }, loaderColor: COLORS.primary },
  danger: { container: { backgroundColor: COLORS.error }, text: { color: COLORS.white }, loaderColor: COLORS.white },
};

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
  return (
    <View style={styles.fieldGroup}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textLight}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          editable={editable}
        />
        {right}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

// ---------- Badge ----------
export function Badge({ label, color = COLORS.primary, bg }: { label: string; color?: string; bg?: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: bg || color + '18' }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

// ---------- StatCard ----------
export function StatCard({ label, value, color = COLORS.primary }: { label: string; value: any; color?: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ---------- EmptyState ----------
export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

// ---------- Loading ----------
export function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={COLORS.primary} />
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.bold },
  headerSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2, fontFamily: FONTS.regular },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
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
    borderRadius: 10,
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
    borderRadius: 10,
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    height: 44,
  },
  inputError: { borderColor: COLORS.error },
  input: { flex: 1, fontSize: 14, color: COLORS.text, fontFamily: FONTS.regular },
  errorText: { fontSize: 12, color: COLORS.error, marginTop: 4, marginLeft: 2, fontFamily: FONTS.regular },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '600', fontFamily: FONTS.semiBold },
  statCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    flex: 1,
    minWidth: 100,
  },
  statValue: { fontSize: 20, fontWeight: '700', fontFamily: FONTS.bold, marginBottom: 2 },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, fontFamily: FONTS.regular, lineHeight: 16 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text, fontFamily: FONTS.semiBold },
  emptySubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, fontFamily: FONTS.regular },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
});
