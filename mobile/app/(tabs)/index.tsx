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
      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
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
        <HeroBanner />
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
    <View>
      <HeroCard
        label="စုစုပေါင်း ပြီးစီးသောလုပ်ငန်းများ"
        value={data?.assignments?.total_completed ?? 0}
        caption="ယနေ့ သင့်လုပ်ငန်းများကို ဆက်လက်ဆောင်ရွက်ပါ"
        icon="trophy-outline"
      />

      <View style={styles.section}>
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
    { label: 'စုစုပေါင်း', value: stats?.total ?? 0, color: colors.primary, bg: colors.primaryBg, icon: 'cube-outline' },
    { label: 'ယနေ့ရောက်', value: todayCount, color: colors.info, bg: colors.infoBg, icon: 'today-outline' },
    { label: 'လက်ခံ', value: stats?.received ?? 0, color: colors.primary, bg: colors.primaryBg, icon: 'download-outline' },
    { label: 'စစ်ဆေးပြီး', value: stats?.verified ?? 0, color: '#7C3AED', bg: '#F5F3FF', icon: 'shield-checkmark-outline' },
    { label: 'ဆောင်ရွက်နေဆဲ', value: inTransitCount, color: colors.warning, bg: colors.warningBg, icon: 'car-outline' },
    { label: 'ပို့ပြီး', value: stats?.delivered ?? 0, color: colors.success, bg: colors.successBg, icon: 'checkmark-circle-outline' },
    { label: 'မအောင်မြင်', value: stats?.failed ?? 0, color: colors.error, bg: colors.errorBg, icon: 'close-circle-outline' },
    { label: 'ပျက်ဆီး', value: stats?.damaged ?? 0, color: '#B91C1C', bg: '#FEF2F2', icon: 'warning-outline' },
  ];

  return (
    <View>
      <View style={styles.section}>
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
    </View>
  );
}

/* ─── Hero Banner ─────────────────────────────────────────────────── */
function HeroBanner() {
  const { colors } = useTheme();

  return (
    <View style={[styles.heroBanner, { backgroundColor: colors.primary }]}> 
      <View style={styles.heroBannerText}>
        <View style={styles.heroBadge}>
          <Ionicons name="shield-checkmark" size={10} color="rgba(255,255,255,0.95)" />
          <Text style={styles.heroBadgeText}>Royal Myawaddy</Text>
        </View>

        <Text style={styles.heroBannerTitle}>ပို့ဆောင်ရေး</Text>
        <Text style={styles.heroBannerTitle2}>စနစ်</Text>
        <Text style={styles.heroBannerSubtitle}>Delivery Management System</Text>
      </View>

      <Image
        source={require('../../assets/hero.png')}
        style={styles.heroImage}
        resizeMode="contain"
      />
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

  /* ══════════════════════════════
     HERO BANNER – Warm Delivery Scene
  ══════════════════════════════ */
  heroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 54,
    paddingBottom: 28,
    marginBottom: 4,
    minHeight: 230,
    overflow: 'hidden',
    backgroundColor: '#EA580C',
  },

  heroBgBase: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#C2410C',
  },
  heroBgAccent: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '55%',
    height: '100%',
    backgroundColor: 'rgba(251,146,60,0.35)',
    borderBottomLeftRadius: 100,
  },

  heroOrb1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -60,
    right: -50,
  },
  heroOrb2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -30,
    left: -20,
  },

  /* ── Left text ── */
  heroBannerText: { flex: 1, paddingRight: 10 },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  heroBadgeText: {
    fontSize: 10,
    color: '#FFF7ED',
    fontFamily: FONTS.semiBold,
    letterSpacing: 0.5,
  },
  heroBannerTitle: {
    fontSize: 27,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
    letterSpacing: -0.5,
    lineHeight: 48,
  },
  heroBannerTitle2: {
    fontSize: 27,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.72)',
    fontFamily: FONTS.bold,
    letterSpacing: -0.5,
    lineHeight: 48,
    marginBottom: 6,
  },
  heroBannerSubtitle: {
    fontSize: 10.5,
    color: 'rgba(255,255,255,0.68)',
    fontFamily: FONTS.regular,
    lineHeight: 16,
    marginBottom: 10,
  },

  /* Motion dots */
  motionDots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    alignItems: 'center',
  },
  motionDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },

  /* ── 3D Scene ── */
  sceneWrap: {
    width: 128,
    height: 158,
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },

  /* Pulse rings */
  ringsCenter: {
    position: 'absolute',
    top: 18,
    alignSelf: 'center',
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
  },

  /* 3D Parcel */
  parcelWrap: {
    width: 72,
    height: 68,
    marginBottom: 4,
    position: 'relative',
  },

  /* Top face */
  parcelTop: {
    position: 'absolute',
    top: -8,
    left: 6,
    width: 62,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    transform: [{ scaleY: 0.5 }],
    overflow: 'hidden',
  },
  parcelTopRib: {
    position: 'absolute',
    height: 3,
    width: '100%',
    backgroundColor: 'rgba(234,88,12,0.6)',
    top: '45%',
  },
  parcelTopRibH: {
    position: 'absolute',
    height: 3,
    width: '100%',
    backgroundColor: 'rgba(234,88,12,0.6)',
    top: '45%',
  },
  parcelTopRibV: {
    position: 'absolute',
    width: 3,
    height: '100%',
    backgroundColor: 'rgba(234,88,12,0.6)',
    left: '45%',
  },

  /* Front face */
  parcelFront: {
    position: 'absolute',
    bottom: 0,
    left: 6,
    width: 62,
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderBottomLeftRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  parcelFrontRib: {
    position: 'absolute',
    height: 3,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.3)',
    top: '40%',
  },
  parcelIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  /* Side face */
  parcelSide: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 56,
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderBottomRightRadius: 6,
    borderTopRightRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  /* Delivered checkmark */
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 4,
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 1,
    elevation: 3,
  },

  /* Ground shadow */
  parcelShadow: {
    width: 60,
    height: 10,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.25)',
    marginTop: 2,
  },

  /* Road */
  road: {
    width: '100%',
    height: 16,
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    gap: 7,
    overflow: 'hidden',
  },
  roadLine: {
    width: 12,
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },

  /* Truck */
  truckWrap: {
    position: 'absolute',
    bottom: 1,
    left: 0,
  },
  truckVehicle: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  truckCargo: {
    width: 18,
    height: 11,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  truckCab: {
    width: 14,
    height: 13,
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderRadius: 2,
    marginLeft: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.4)',
    overflow: 'hidden',
  },
  truckWindow: {
    width: 7,
    height: 5,
    backgroundColor: 'rgba(135,206,250,0.6)',
    borderRadius: 1,
  },
  truckWheelRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: 34,
    marginTop: 1,
  },
  truckWheel: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1C1917',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },

  /* Location ping */
  locationPin: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pingRipple: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  pinDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: 'rgba(234,88,12,0.8)',
  },

  // ── Unused legacy kept for other refs ──
  heroOrbTopRight: {
    position: 'absolute',
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -60, right: -50,
  },
  heroOrbBottomLeft: {
    position: 'absolute',
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.07)',
    bottom: -30, left: -20,
  },
  heroOrbMid: {
    position: 'absolute',
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: 20, left: '40%',
  },
  cloudChip: { position: 'absolute' },
  cloud1: { top: 18, right: 90 },
  cloud2: { top: 36, right: 50 },
  cloud3: { top: 50, right: 118 },
  speedLines: { marginTop: 6, gap: 0 },
  speedLine: { height: 2.5, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.38)' },
  sparkle: { position: 'absolute', zIndex: 10 },
  sparkleEmoji: { fontSize: 11, color: '#FFE066' },
  parcelLid: {
    position: 'absolute', top: -6, left: 8,
    width: 60, height: 20,
    backgroundColor: 'rgba(255,255,255,0.42)',
    borderTopLeftRadius: 5, borderTopRightRadius: 5,
    overflow: 'hidden', transform: [{ scaleY: 0.55 }], zIndex: 5,
  },
  parcelRibbonHTop: {
    position: 'absolute', height: 3.5, width: '100%',
    backgroundColor: 'rgba(255,180,30,0.85)', top: '40%',
  },
  parcelRibbonVTop: {
    position: 'absolute', width: 3.5, height: '100%',
    backgroundColor: 'rgba(255,180,30,0.85)', left: '45%',
  },
  parcelLidShine: {
    position: 'absolute', top: 0, left: 0,
    width: '45%', height: '60%',
    backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2,
  },
  parcelTapeH: {
    position: 'absolute', height: 3.5, width: '100%',
    backgroundColor: 'rgba(255,180,30,0.6)', top: '40%',
  },
  parcelLabel: {
    width: 28, height: 28, borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  parcelFrontShine: {
    position: 'absolute', top: 4, left: 4,
    width: 18, height: 14,
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 3,
  },
  parcelRight: {
    position: 'absolute', bottom: 0, right: 0,
    width: 16, height: 54,
    backgroundColor: 'rgba(0,0,0,0.26)',
    borderBottomRightRadius: 5, borderTopRightRadius: 2,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', overflow: 'hidden',
  },
  parcelRightShine: {
    position: 'absolute', top: 4, left: 2,
    width: 4, height: 20,
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2,
  },
  parcelBottom: {
    position: 'absolute', bottom: -3, left: 8,
    width: 60, height: 4,
    backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: 2,
  },
  parcel3DShadow: {
    width: 58, height: 10, borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.30)', marginTop: 2,
  },
  routePath: {
    flexDirection: 'row', gap: 5, marginBottom: 4,
    alignSelf: 'flex-start', paddingLeft: 8, marginTop: 2,
  },
  routeDot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  pinWrap: {
    position: 'absolute', top: 6, right: 6,
    alignItems: 'center', justifyContent: 'center',
    width: 30, height: 30,
  },
  pinRing: {
    position: 'absolute', width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,107,107,0.22)',
    borderWidth: 1.5, borderColor: 'rgba(255,107,107,0.4)',
  },
  pinContainer: { zIndex: 5 },
  roadStrip: {
    width: '100%', height: 16,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 5, flexDirection: 'row',
    alignItems: 'center', paddingHorizontal: 6, gap: 7, overflow: 'hidden',
  },
  roadDash: {
    width: 11, height: 2.5, borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.32)',
  },
  dustPuff: {
    position: 'absolute', left: -10, bottom: 2,
    width: 14, height: 10, borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  parcelRibbonH: {
    position: 'absolute', height: 3, width: '100%',
    backgroundColor: 'rgba(255,180,0,0.7)', top: '50%',
  },
  parcelRibbonV: {
    position: 'absolute', width: 3, height: '100%',
    backgroundColor: 'rgba(255,180,0,0.7)', left: '50%',
  },
  parcelStripH: {
    position: 'absolute', height: 3, width: '100%',
    backgroundColor: 'rgba(255,180,0,0.5)', top: '42%',
  },
  arrowTrail: {
    flexDirection: 'row', gap: 2, marginBottom: 10,
    alignSelf: 'flex-end', marginRight: 4,
  },
  parcel3DWrap: { width: 76, height: 76, alignItems: 'center', justifyContent: 'center' },
  parcel3D: {
    width: 64, height: 64, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 6, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
  },
  truckBody: { flexDirection: 'row', alignItems: 'flex-end' },
  truckWheels: { flexDirection: 'row', justifyContent: 'space-around', width: 36, marginTop: 1 },
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
    borderRadius: 4,
  },
  roleDot: { width: 6, height: 6, borderRadius: 4},
  roleText: { fontSize: 11, fontFamily: FONTS.semiBold },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 999,
  },
  appIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  avatarFallback: {
    width: 50,
    height: 50,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
  },

  section: { padding: 20 },
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
    borderRadius: 4,
    padding: 18,
    overflow: 'hidden',
    shadowColor: '#C2410C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 5,
  },
  heroOrbLarge: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.10)',
    top: -75,
    right: -35,
  },
  heroOrbSmall: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.08)',
    bottom: -28,
    right: 62,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  heroLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.92)',
    fontFamily: FONTS.semiBold,
  },
  heroIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroValue: {
    fontSize: 42,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
    letterSpacing: -1,
    marginBottom: 8,
  },
  heroCaption: {
    alignSelf: 'flex-start',
    fontSize: 11,
    color: '#FFFFFF',
    fontFamily: FONTS.regular,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    overflow: 'hidden',
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
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  statIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 4,
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
    borderRadius: 4,
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
    borderRadius: 4,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 8,
  },
  quickBtnIcon: {
    width: 42,
    height: 42,
    borderRadius: 4,
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
    borderRadius: 4,
    opacity: 0.7,
  },

  // Hero image layout
  heroImage: {
    width: 170,
    height: 118,
    marginRight: -14,
  },
});
