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
import { COLORS, FONTS, ROLE_LABELS_MM } from '../../src/constants';

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


  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        stickyHeaderIndices={[0]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => { refetch(); }}
            tintColor={COLORS.white}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerLeft}>
            <Text style={styles.username} numberOfLines={1}>
              {user?.name ?? 'အသုံးပြုသူ'}
            </Text>
            <View style={styles.rolePill}>
              <Text style={styles.roleText}>{roleLabel}</Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.navigate('/(tabs)/profile')}
          >
            {user?.profile_image_url ? (
              <Image source={{ uri: user.profile_image_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Image
                  source={require('../../assets/icon.png')}
                  style={styles.avatarIcon}
                  resizeMode="contain"
                />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* White content area */}
        <View style={styles.contentArea}>
          {isLoading ? (
            <View style={styles.skeletonWrap}>
              {[1, 2, 3].map(i => <View key={i} style={styles.skeleton} />)}
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
        </View>
      </ScrollView>
    </View>
  );
}

/* ─── Staff Dashboard ─────────────────────────────────────────── */
function StaffDashboard({ data }: { data: any }) {
  return (
    <View style={styles.section}>
      {/* 3-column stat grid */}
      <View style={styles.statRow}>
        <StatBox
          label="ဆောင်ရွက်နေဆဲ"
          value={data?.assignments?.active ?? 0}
          color={COLORS.primary}
          icon="bicycle-outline"
        />
        <StatBox
          label="ယနေ့ပြီးစီး"
          value={data?.assignments?.completed_today ?? 0}
          color={COLORS.success}
          icon="checkmark-circle-outline"
        />
        <StatBox
          label="ကြိုးပမ်းမှု"
          value={data?.attempts_today ?? 0}
          color={COLORS.info}
          icon="flash-outline"
        />
      </View>
      <View style={styles.statRow}>
        <StatBox
          label="မအောင်မြင်"
          value={data?.failed_today ?? 0}
          color={COLORS.error}
          icon="close-circle-outline"
        />
      </View>

      {/* Total completed banner */}
      <View style={styles.bannerCard}>
        <View>
          <Text style={styles.bannerLabel}>စုစုပေါင်း ပြီးစီးသောလုပ်ငန်းများ</Text>
          <Text style={styles.bannerValue}>{data?.assignments?.total_completed ?? 0}</Text>
        </View>
        <Ionicons name="trophy-outline" size={36} color={COLORS.primary} style={{ opacity: 0.3 }} />
      </View>

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => router.navigate('/(tabs)/my-assignments')}
        activeOpacity={0.85}
      >
        <Ionicons name="bicycle" size={18} color={COLORS.white} />
        <Text style={styles.primaryBtnText}>ကျွန်ုပ်၏ လုပ်ငန်းများ</Text>
        <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
}

/* ─── Admin / Manager Dashboard ─────────────────────────────────── */
function AdminManagerDashboard({
  data,
  isAdmin,
  canCreateParcel,
}: {
  data: any;
  isAdmin: boolean;
  canCreateParcel: boolean;
}) {
  const stats = data?.parcel_stats;
  const todayCount = stats?.today ?? data?.today_received ?? 0;
  const inTransitCount = stats?.in_transit ?? stats?.out_for_delivery ?? stats?.in_progress ?? 0;

  const statItems = [
    { label: 'စုစုပေါင်း', value: stats?.total ?? 0, color: COLORS.primary, icon: 'cube-outline' },
    { label: 'ယနေ့ရောက်', value: todayCount, color: COLORS.info, icon: 'today-outline' },
    { label: 'လက်ခံ', value: stats?.received ?? 0, color: COLORS.info, icon: 'download-outline' },
    { label: 'စစ်ဆေးပြီး', value: stats?.verified ?? 0, color: '#8B5CF6', icon: 'shield-checkmark-outline' },
    { label: 'ဆောင်ရွက်နေဆဲ', value: inTransitCount, color: COLORS.warning, icon: 'car-outline' },
    { label: 'ပို့ပြီး', value: stats?.delivered ?? 0, color: COLORS.success, icon: 'checkmark-circle-outline' },
    { label: 'မအောင်', value: stats?.failed ?? 0, color: COLORS.error, icon: 'close-circle-outline' },
    { label: 'ပျက်ဆီး', value: stats?.damaged ?? 0, color: COLORS.error, icon: 'warning-outline' },
  ];

  // Split into triples for 3-col rows
  const pairs: (typeof statItems)[] = [];
  for (let i = 0; i < statItems.length; i += 3) {
    pairs.push(statItems.slice(i, i + 3));
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>ပါဆယ် အခြေအနေ</Text>
      {pairs.map((pair, ri) => (
        <View key={ri} style={styles.statRow}>
          {pair.map((item, ci) => (
            <StatBox
              key={ci}
              label={item.label}
              value={item.value}
              color={item.color}
              icon={item.icon as any}
            />
          ))}
        </View>
      ))}

      {/* Quick actions — all roles */}
      <Text style={[styles.sectionTitle, { marginTop: 8 }]}>အမြန်သွားရောက်မည်</Text>
      <View style={styles.quickRow}>
        <QuickBtn icon="cube-outline" label="ပါဆယ်" color={COLORS.primary} onPress={() => router.navigate('/(tabs)/parcels')} />
        <QuickBtn icon="car-outline" label="ပို့ဆောင်" color={COLORS.success} onPress={() => router.navigate('/(tabs)/deliveries')} />
        <QuickBtn icon="bar-chart-outline" label="မှတ်တမ်း" color={COLORS.info} onPress={() => router.navigate('/(tabs)/daily-summary')} />
      </View>
      <View style={styles.quickRow}>
        <QuickBtn icon="people-outline" label="သုံးစွဲသူများ" color="#8B5CF6" onPress={() => router.navigate('/(tabs)/users')} />
        <QuickBtn icon="person-outline" label="ဖောက်သည်" color={COLORS.warning} onPress={() => router.navigate('/(tabs)/customers')} />
        <QuickBtn icon="calendar-outline" label="လစဉ်" color="#0EA5E9" onPress={() => router.navigate('/(tabs)/monthly-summary')} />
      </View>
    </View>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────── */
function StatBox({ label, value, color, icon }: { label: string; value: any; color: string; icon: any }) {
  return (
    <View style={styles.statBox}>
      <Ionicons name={icon} size={20} color={color} style={styles.statIcon} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function QuickBtn({
  icon, label, color, onPress,
}: { icon: any; label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickBtn} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.quickBtnIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.quickBtnLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ─── Styles ──────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  scrollContent: { flexGrow: 1 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  headerLeft: { flex: 1, paddingRight: 12 },
  username: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
    fontFamily: FONTS.bold,
    marginBottom: 10,
  },
  rolePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleText: { fontSize: 12, color: COLORS.white, fontFamily: FONTS.semiBold },
  avatar: {
    width: 52, height: 52, borderRadius: 6,
    borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.85)',
  },
  avatarFallback: {
    width: 52, height: 52, borderRadius: 6,
    backgroundColor: COLORS.white,
    borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarIcon: { width: 36, height: 36, borderRadius: 6 },

  // White content
  contentArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    minHeight: 500,
  },
  section: { minHeight: 48, padding: 16, paddingBottom: 32 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
    fontFamily: FONTS.semiBold,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // 3-col stat boxes
  statRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 6,
    padding: 12,
    paddingBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: { marginBottom: 8 },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: FONTS.bold,
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    lineHeight: 14,
  },

  // Banner (staff total)
  bannerCard: { minHeight: 80, minWidth: 120,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 6,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  bannerLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    marginBottom: 4,
  },
  bannerValue: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.primary,
    fontFamily: FONTS.bold,
  },

  // Primary button
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    paddingVertical: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
    fontFamily: FONTS.bold,
  },

  // Revenue card
  revenueCard: { minHeight: 80, minWidth: 120,
    backgroundColor: COLORS.white,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  revenueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  revenueDot: { width: 8, height: 8, borderRadius: 4 },
  revenueLabel: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
  },
  revenueValue: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: COLORS.border },

  // Quick buttons
  quickRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 6,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  quickBtnIcon: {
    width: 48, height: 48, borderRadius: 6,
    alignItems: 'center', justifyContent: 'center',
  },
  quickBtnLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: FONTS.semiBold,
  },

  // Skeleton
  skeletonWrap: { padding: 16 },
  skeleton: {
    height: 90,
    backgroundColor: COLORS.border,
    borderRadius: 6,
    marginBottom: 10,
    opacity: 0.4,
  },
});
