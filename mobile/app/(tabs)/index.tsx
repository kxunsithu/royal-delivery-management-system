import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { dashboardService } from '../../src/services/dashboardService';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { COLORS, FONTS, RADIUS, ROLE_LABELS_MM } from '../../src/constants';

type IconName = keyof typeof Ionicons.glyphMap;

export default function DashboardScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardService.getDashboard(),
  });

  const isStaff = user?.role === 'delivery_staff';
  const isAdmin = user?.role === 'admin';
  const canCreateParcel = user?.role === 'admin' || user?.role === 'manager';

  const roleLabel =
    (user?.role && ROLE_LABELS_MM[user.role as keyof typeof ROLE_LABELS_MM]) ||
    user?.role ||
    'ဝန်ထမ်း';

  const firstName = user?.name?.split(' ')[0] ?? 'အသုံးပြုသူ';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Sticky header */}
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.background}]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.appName, { color: colors.text }]} numberOfLines={1}>
            Royal Myawaddy
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.navigate('/(tabs)/profile')}
        >
          {user?.profile_image_url ? (
            <Image source={{ uri: user.profile_image_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarInitial}>
                {(user?.name?.[0] ?? 'R').toUpperCase()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => { refetch(); }}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.scrollContent}
        style={{ flex: 1 }}
      >
        {isLoading ? (
          <View style={styles.skeletonWrap}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={[styles.skeleton, { backgroundColor: colors.muted }]} />
            ))}
          </View>
        ) : isStaff ? (
          <StaffDashboard data={data} />
        ) : (
          <AdminManagerDashboard
            data={data}
            isAdmin={isAdmin}
            canCreateParcel={canCreateParcel}
          />
        )}
      </ScrollView>
    </View>
  );
}

/* ─── Staff Dashboard ─────────────────────────────────────────── */
function StaffDashboard({ data }: { data: any }) {
  const { colors } = useTheme();

  const stats: { label: string; value: number; color: string; bg: string; icon: IconName }[] = [
    {
      label: 'ဆောင်ရွက်နေဆဲ',
      value: data?.assignments?.active ?? 0,
      color: colors.primary,
      bg: colors.primaryBg,
      icon: 'bicycle-outline',
    },
    {
      label: 'ယနေ့ပြီးစီး',
      value: data?.assignments?.completed_today ?? 0,
      color: colors.success,
      bg: colors.successBg,
      icon: 'checkmark-circle-outline',
    },
    {
      label: 'ကြိုးပမ်းမှု',
      value: data?.attempts_today ?? 0,
      color: colors.info,
      bg: colors.infoBg,
      icon: 'flash-outline',
    },
    {
      label: 'မအောင်မြင်',
      value: data?.failed_today ?? 0,
      color: colors.error,
      bg: colors.errorBg,
      icon: 'close-circle-outline',
    },
  ];

  return (
    <View style={styles.section}>
      <HeroCard
        label="စုစုပေါင်း ပြီးစီးသောလုပ်ငန်းများ"
        value={data?.assignments?.total_completed ?? 0}
        caption="ယနေ့ သင့်လုပ်ငန်းများကို ဆက်လက်ဆောင်ရွက်ပါ"
        icon="trophy-outline"
      />

      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ယနေ့ အနှစ်ချုပ်</Text>
      <View style={styles.statGrid}>
        {stats.map((s) => (
          <StatTile key={s.label} {...s} />
        ))}
      </View>

      <TouchableOpacity
        style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
        onPress={() => router.navigate('/(tabs)/my-assignments')}
        activeOpacity={0.85}
      >
        <Ionicons name="bicycle" size={18} color="#FFFFFF" />
        <Text style={styles.primaryBtnText}>ကျွန်ုပ်၏ လုပ်ငန်းများ</Text>
        <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

/* ─── Admin / Manager Dashboard ─────────────────────────────────── */
function AdminManagerDashboard({
  data,
}: {
  data: any;
  isAdmin: boolean;
  canCreateParcel: boolean;
}) {
  const { colors } = useTheme();
  const stats = data?.parcel_stats;
  const todayCount = stats?.today ?? data?.today_received ?? 0;
  const inTransitCount = stats?.in_transit ?? stats?.out_for_delivery ?? stats?.in_progress ?? 0;

  const statItems: { label: string; value: number; color: string; bg: string; icon: IconName }[] = [
    { label: 'ယနေ့ရောက်', value: todayCount, color: colors.info, bg: colors.infoBg, icon: 'today-outline' },
    { label: 'လက်ခံ', value: stats?.received ?? 0, color: colors.primary, bg: colors.primaryBg, icon: 'download-outline' },
    { label: 'စစ်ဆေးပြီး', value: stats?.verified ?? 0, color: '#7C3AED', bg: '#F5F3FF', icon: 'shield-checkmark-outline' },
    { label: 'ဆောင်ရွက်နေဆဲ', value: inTransitCount, color: colors.warning, bg: colors.warningBg, icon: 'car-outline' },
    { label: 'ပို့ပြီး', value: stats?.delivered ?? 0, color: colors.success, bg: colors.successBg, icon: 'checkmark-circle-outline' },
    { label: 'မအောင်', value: stats?.failed ?? 0, color: colors.error, bg: colors.errorBg, icon: 'close-circle-outline' },
    { label: 'ပျက်ဆီး', value: stats?.damaged ?? 0, color: '#B91C1C', bg: '#FEF2F2', icon: 'warning-outline' },
  ];

  return (
    <View style={styles.section}>
      <HeroCard
        label="စုစုပေါင်း ပါဆယ်"
        value={stats?.total ?? 0}
        caption="ယနေ့ လုပ်ငန်းအခြေအနေ အကျဉ်းချုပ်"
        icon="cube-outline"
      />

      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ပါဆယ် အခြေအနေ</Text>
      <View style={styles.statGrid}>
        {statItems.map((item) => (
          <StatTile key={item.label} {...item} />
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 20 }]}>
        အမြန်သွားရောက်မည်
      </Text>
      <View style={styles.quickRow}>
        <QuickBtn icon="cube-outline" label="ပါဆယ်" tint={colors.primary} bg={colors.primaryBg} onPress={() => router.navigate('/(tabs)/parcels')} />
        <QuickBtn icon="car-outline" label="ပို့ဆောင်" tint={colors.success} bg={colors.successBg} onPress={() => router.navigate('/(tabs)/deliveries')} />
        <QuickBtn icon="bar-chart-outline" label="မှတ်တမ်း" tint={colors.info} bg={colors.infoBg} onPress={() => router.navigate('/(tabs)/daily-summary')} />
      </View>
      <View style={styles.quickRow}>
        <QuickBtn icon="people-outline" label="သုံးစွဲသူ" tint="#7C3AED" bg="#F5F3FF" onPress={() => router.navigate('/(tabs)/users')} />
        <QuickBtn icon="person-outline" label="ဖောက်သည်" tint={colors.warning} bg={colors.warningBg} onPress={() => router.navigate('/(tabs)/customers')} />
        <QuickBtn icon="calendar-outline" label="လစဉ်" tint="#0EA5E9" bg="#E0F2FE" onPress={() => router.navigate('/(tabs)/monthly-summary')} />
      </View>
    </View>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────── */
function HeroCard({
  label,
  value,
  caption,
  icon,
}: {
  label: string;
  value: number;
  caption: string;
  icon: IconName;
}) {
  return (
    <View style={styles.heroCard}>
      <View style={styles.heroOrbLarge} />
      <View style={styles.heroOrbSmall} />
      <View style={styles.heroTop}>
        <Text style={styles.heroLabel}>{label}</Text>
        <View style={styles.heroIconWrap}>
          <Ionicons name={icon} size={20} color="#FFFFFF" />
        </View>
      </View>
      <Text style={styles.heroValue}>{Number(value).toLocaleString()}</Text>
      <Text style={styles.heroCaption}>{caption}</Text>
    </View>
  );
}

function StatTile({
  label,
  value,
  color,
  bg,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  bg: string;
  icon: IconName;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.statTile, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.statIconWrap, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={styles.statTextWrap}>
        <Text style={[styles.statValue, { color: colors.text }]}>{Number(value).toLocaleString()}</Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </View>
  );
}

function QuickBtn({
  icon,
  label,
  tint,
  bg,
  onPress,
}: {
  icon: IconName;
  label: string;
  tint: string;
  bg: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.quickBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.quickBtnIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={21} color={tint} />
      </View>
      <Text style={[styles.quickBtnLabel, { color: colors.text }]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/* ─── Styles ──────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 32 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerLeft: { flex: 1, paddingRight: 12 },
  appName: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: FONTS.bold,
    letterSpacing: -0.3,
  },
  greeting: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginBottom: 2,
  },
  username: {
    fontSize: 25,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  rolePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  roleDot: { width: 6, height: 6, borderRadius: 3 },
  roleText: { fontSize: 11, fontFamily: FONTS.semiBold },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarFallback: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
  },

  section: { paddingHorizontal: 20 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 12,
    marginTop: 22,
  },

  // Hero
  heroCard: {
    backgroundColor: '#F97316',
    borderRadius: RADIUS.xl,
    padding: 20,
    overflow: 'hidden',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  heroOrbLarge: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.10)',
    top: -70,
    right: -50,
  },
  heroOrbSmall: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.08)',
    bottom: -30,
    right: 40,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  heroLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.88)',
    fontFamily: FONTS.regular,
  },
  heroIconWrap: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroValue: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  heroCaption: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.78)',
    fontFamily: FONTS.regular,
  },

  // Stats
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statTile: {
    width: '48%',
    flexGrow: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  statIconWrap: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTextWrap: { flex: 1 },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    marginBottom: 1,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: FONTS.regular,
    lineHeight: 14,
  },

  // Primary button
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: RADIUS.md,
    paddingVertical: 15,
    marginTop: 20,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
  },

  // Quick actions
  quickRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  quickBtn: {
    flex: 1,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 8,
  },
  quickBtnIcon: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBtnLabel: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },

  // Skeleton
  skeletonWrap: { paddingHorizontal: 20, gap: 10 },
  skeleton: {
    height: 84,
    borderRadius: RADIUS.lg,
    opacity: 0.7,
  },
});
