import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../constants';
import { useTheme } from '../context/ThemeContext';

type IconName = keyof typeof Ionicons.glyphMap;

// ---------- Screen ----------
export function Screen({
  children,
  scroll = true,
  style,
  padded = false,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  padded?: boolean;
}) {
  const { colors } = useTheme();
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, padded && styles.scrollPadded]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    children
  );
  return (
    <SafeAreaView edges={['bottom']} style={[styles.screen, { backgroundColor: colors.background }, style]}>
      {content}
    </SafeAreaView>
  );
}

// ---------- App Header ----------
export function AppHeader({
  title,
  subtitle,
  onBack,
  right,
  paddingTop = 8,
  centerTitle = false,
  children,
  style,
}: {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  paddingTop?: number;
  centerTitle?: boolean;
  children?: React.ReactNode;
  style?: ViewStyle;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.header,
        { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop },
        style,
      ]}
    >
      <View style={styles.headerRow}>
        {onBack ? (
          <TouchableOpacity
            style={[styles.headerIconBtn, { backgroundColor: colors.muted }]}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={21} color={colors.text} />
          </TouchableOpacity>
        ) : null}

        <View style={[styles.headerTextWrap, centerTitle && styles.headerTextCenter]}>
          {title ? (
            <Text
              style={[styles.headerTitle, { color: colors.text }, centerTitle && { textAlign: 'center' }]}
              numberOfLines={1}
            >
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text
              style={[styles.headerSubtitle, { color: colors.textSecondary }, centerTitle && { textAlign: 'center' }]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        {right ? <View style={styles.headerRight}>{right}</View> : null}
      </View>
      {children}
    </View>
  );
}

export function IconButton({
  icon,
  onPress,
  color,
  backgroundColor,
  size = 20,
  disabled = false,
  style,
}: {
  icon: IconName;
  onPress?: () => void;
  color?: string;
  backgroundColor?: string;
  size?: number;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[
        styles.iconBtn,
        { backgroundColor: backgroundColor ?? colors.muted, opacity: disabled ? 0.5 : 1 },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="button"
    >
      <Ionicons name={icon} size={size} color={color ?? colors.text} />
    </TouchableOpacity>
  );
}

// ---------- PageHeader (legacy alias) ----------
export function PageHeader({
  title,
  subtitle,
  right,
  onBack,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onBack?: () => void;
}) {
  return <AppHeader title={title} subtitle={subtitle} right={right} onBack={onBack} />;
}

// ---------- Card ----------
export function Card({
  children,
  style,
  padded = true,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          padding: padded ? SPACING.lg : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

// ---------- Section title ----------
export function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.sectionRow}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{children}</Text>
      {right}
    </View>
  );
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
  icon,
}: {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: IconName;
}) {
  const { colors } = useTheme();
  const v =
    variant === 'primary'
      ? { container: { backgroundColor: colors.primary }, text: { color: '#FFFFFF' }, loaderColor: '#FFFFFF' }
      : variant === 'secondary'
      ? {
          container: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderStrong },
          text: { color: colors.text },
          loaderColor: colors.text,
        }
      : variant === 'ghost'
      ? { container: { backgroundColor: 'transparent' }, text: { color: colors.primary }, loaderColor: colors.primary }
      : { container: { backgroundColor: colors.error }, text: { color: '#FFFFFF' }, loaderColor: '#FFFFFF' };
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
        <>
          {icon ? <Ionicons name={icon} size={18} color={((v.text as TextStyle).color as string) ?? '#FFFFFF'} /> : null}
          <Text style={[styles.btnText, v.text, textStyle]}>{title}</Text>
        </>
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
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.fieldGroup}>
      {label ? <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text> : null}
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.card,
            borderColor: error ? colors.error : focused ? colors.primary : colors.border,
          },
        ]}
      >
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder={placeholder}
          placeholderTextColor={colors.textLight}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
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
    <View style={[styles.badge, { backgroundColor: bg || colors.primaryBg }]}>
      <Text style={[styles.badgeText, { color: c }]}>{label}</Text>
    </View>
  );
}

// ---------- Chip ----------
export function Chip({
  label,
  active = false,
  onPress,
  icon,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: IconName;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        { backgroundColor: active ? colors.primary : colors.card, borderColor: active ? colors.primary : colors.border },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {icon ? <Ionicons name={icon} size={14} color={active ? '#FFFFFF' : colors.textSecondary} /> : null}
      <Text style={[styles.chipText, { color: active ? '#FFFFFF' : colors.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ---------- StatCard ----------
export function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: any;
  color?: string;
  icon?: IconName;
}) {
  const { colors } = useTheme();
  const c = color || colors.primary;
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {icon ? (
        <View style={[styles.statIcon, { backgroundColor: c + '14' }]}>
          <Ionicons name={icon} size={18} color={c} />
        </View>
      ) : null}
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

// ---------- EmptyState ----------
export function EmptyState({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle?: string;
  icon?: IconName;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.empty}>
      {icon ? (
        <View style={[styles.emptyIcon, { backgroundColor: colors.primaryBg }]}>
          <Ionicons name={icon} size={30} color={colors.primary} />
        </View>
      ) : null}
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

// ---------- Loading ----------
export function Loading({ label }: { label?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={colors.primary} />
      {label ? <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { flexGrow: 1, paddingBottom: 28 },
  scrollPadded: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg },

  // Header
  header: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    backgroundColor: COLORS.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    minHeight: 44,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: { flex: 1 },
  headerTextCenter: { alignItems: 'center' },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },

  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Card
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },

  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    marginTop: SPACING.xs,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    fontFamily: FONTS.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },

  btn: {
    height: 50,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: SPACING.lg,
  },
  btnDisabled: { opacity: 0.55 },
  btnText: { fontSize: 15, fontWeight: '700', fontFamily: FONTS.bold },

  fieldGroup: { marginBottom: SPACING.md },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 7,
    fontFamily: FONTS.semiBold,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 4,
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.md,
    height: 50,
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
    color: COLORS.error,
    marginTop: 5,
    marginLeft: 2,
    fontFamily: FONTS.regular,
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 11, fontWeight: '600', fontFamily: FONTS.semiBold },

  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 4,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  chipText: { fontSize: 13, fontWeight: '600', fontFamily: FONTS.semiBold },

  statCard: {
    backgroundColor: COLORS.card,
    borderRadius: 4,
    padding: SPACING.md + 2,
    borderWidth: 1,
    borderColor: COLORS.border,
    flex: 1,
    minHeight: 92,
  },
  statIcon: {
    width: 30,
    height: 30,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: { fontSize: 21, fontWeight: '700', fontFamily: FONTS.bold, marginBottom: 2 },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, fontFamily: FONTS.regular, lineHeight: 16 },

  empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.bold },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 5,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 19,
  },

  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10 },
  loadingText: { fontSize: 13, fontFamily: FONTS.regular },
});
