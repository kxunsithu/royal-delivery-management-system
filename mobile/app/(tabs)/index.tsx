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
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { dashboardService } from '../../src/services/dashboardService';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS, FONTS, ROLE_LABELS_MM, STATUS_COLORS, STATUS_LABELS_MM } from '../../src/constants';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardService.getDashboard(),
  });

  const isStaff = user?.role === 'delivery_staff';
  const isAdmin = user?.role === 'admin';
  const canCreateParcel = user?.role === 'admin' || user?.role === 'manager';

  const roleLabel = (user?.role && ROLE_LABELS_MM[user.role as keyof typeof ROLE_LABELS_MM]) || user?.role || 'ဝန်ထမ်း';
  const roleIcon = user?.role === 'admin'
    ? 'shield-checkmark'
    : user?.role === 'manager'
      ? 'briefcase'
      : user?.role === 'accountant'
        ? 'calculator'
        : 'bicycle';

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { refetch(); }} tintColor={COLORS.primary} />}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerLeft}>
            <View style={styles.greetingRow}>
              <Text style={styles.greeting}>မင်္ဂလာပါ 👋</Text>
            </View>
            <Text style={styles.username} numberOfLines={1}>
              {user?.name ?? 'အသုံးပြုသူ'}
            </Text>
            <View style={styles.metaRow}>
              <View style={styles.roleBadge}>
                <Ionicons name={roleIcon as any} size={13} color={COLORS.white} />
                <Text style={styles.roleText}>{roleLabel}</Text>
              </View>
              {user?.phone ? (
                <View style={styles.phoneChip}>
                  <Ionicons name="call-outline" size={11} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.phoneText}>{user.phone}</Text>
                </View>
              ) : null}
            </View>
          </View>

          <TouchableOpacity
            style={styles.avatarButton}
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <View style={styles.avatarWrapper}>
              {user?.profile_image_url ? (
                <Image source={{ uri: user.profile_image_url }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitial}>
                    {user?.name ? user.name[0]?.toUpperCase() : 'U'}
                  </Text>
                </View>
              )}
              <View style={styles.onlineIndicator} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.contentArea}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
            </View>
          ) : isStaff ? (
            <StaffDashboard data={data} />
          ) : (
            <AdminManagerDashboard data={data} isAdmin={isAdmin} canCreateParcel={canCreateParcel} />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function StaffDashboard({ data }: { data: any }) {
  return (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>ကျွန်ုပ်၏ အခြေအနေ</Text>

      <View style={styles.statsGrid}>
        <StatCard
          icon="bicycle"
          label="ဆောင်ရွက်နေသောလုပ်ငန်းများ"
          value={data?.assignments?.active ?? 0}
          color={COLORS.primary}
          bg="#FFF3DC"
        />
        <StatCard
          icon="checkmark-circle"
          label="ယနေ့ပြီးစီးသော"
          value={data?.assignments?.completed_today ?? 0}
          color={COLORS.success}
          bg="#E8F8EF"
        />
        <StatCard
          icon="swap-vertical"
          label="ယနေ့ကြိုးပမ်းမှုများ"
          value={data?.attempts_today ?? 0}
          color={COLORS.info}
          bg="#E8F4FB"
        />
        <StatCard
          icon="close-circle"
          label="ယနေ့မအောင်မြင်"
          value={data?.failed_today ?? 0}
          color={COLORS.error}
          bg="#FDE8E8"
        />
      </View>

      <View style={styles.totalCard}>
        <Ionicons name="trophy" size={32} color={COLORS.primary} />
        <View style={styles.totalInfo}>
          <Text style={styles.totalLabel}>စုစုပေါင်း ပြီးစီးသောလုပ်ငန်းများ</Text>
          <Text style={styles.totalValue}>{data?.assignments?.total_completed ?? 0}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.actionBtn}
        onPress={() => router.push('/(tabs)/my-assignments')}
      >
        <Ionicons name="list" size={20} color={COLORS.white} />
        <Text style={styles.actionBtnText}>ကျွန်ုပ်၏ လုပ်ငန်းများ ကြည့်ရှုမည်</Text>
        <Ionicons name="chevron-forward" size={18} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
}

function AdminManagerDashboard({ data, isAdmin, canCreateParcel }: { data: any; isAdmin: boolean; canCreateParcel: boolean }) {
  const stats = data?.parcel_stats;

  const statItems = isAdmin ? [
    { label: 'စုစုပေါင်း ပါဆယ်', value: stats?.total ?? 0, icon: 'cube', color: COLORS.primary, bg: '#FFF3DC' },
    { label: 'ယနေ့ရောက်ရှိ', value: stats?.today ?? 0, icon: 'today', color: COLORS.info, bg: '#E8F4FB' },
    { label: 'ဆောင်ရွက်နေဆဲ', value: stats?.in_progress ?? 0, icon: 'time', color: COLORS.warning, bg: '#FEF3E2' },
    { label: 'ပို့ဆောင်ပြီး', value: stats?.delivered ?? 0, icon: 'checkmark-circle', color: COLORS.success, bg: '#E8F8EF' },
    { label: 'မအောင်မြင်', value: stats?.failed ?? 0, icon: 'close-circle', color: COLORS.error, bg: '#FDE8E8' },
    { label: 'အောင်မြင်မှုနှုန်း', value: `${stats?.delivery_success_rate ?? 0}%`, icon: 'trending-up', color: '#8B5CF6', bg: '#F3F0FF' },
  ] : [
    { label: 'လက်ခံပြီး', value: stats?.received ?? 0, icon: 'download', color: COLORS.statusReceived, bg: '#E8F4FB' },
    { label: 'စစ်ဆေးပြီး', value: stats?.verified ?? 0, icon: 'shield-checkmark', color: COLORS.statusVerified, bg: '#F3E8FB' },
    { label: 'ပို့ဆောင်နေဆဲ', value: stats?.out_for_delivery ?? 0, icon: 'car', color: COLORS.statusInTransit, bg: '#FEF3E2' },
    { label: 'ပို့ဆောင်ပြီး', value: stats?.delivered ?? 0, icon: 'checkmark-circle', color: COLORS.success, bg: '#E8F8EF' },
    { label: 'မအောင်မြင်', value: stats?.failed ?? 0, icon: 'close-circle', color: COLORS.error, bg: '#FDE8E8' },
    { label: 'ပျက်စီး/ဆုံးရှုံး', value: stats?.damaged ?? 0, icon: 'warning', color: COLORS.statusDamaged, bg: '#FDE8E8' },
  ];

  return (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>ပါဆယ် အခြေအနေ</Text>
      <View style={styles.statsGrid}>
        {statItems.map((item, i) => (
          <StatCard
            key={i}
            icon={item.icon as any}
            label={item.label}
            value={item.value}
            color={item.color}
            bg={item.bg}
          />
        ))}
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>အမြန်လုပ်ဆောင်မှုများ</Text>
      <View style={styles.quickActions}>
        {canCreateParcel && (
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/parcels/create')}>
            <View style={[styles.quickIcon, { backgroundColor: '#FFF3DC' }]}>
              <Ionicons name="add-circle" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.quickLabel}>ပါဆယ်အသစ်</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(tabs)/parcels')}>
          <View style={[styles.quickIcon, { backgroundColor: '#E8F4FB' }]}>
            <Ionicons name="search" size={24} color={COLORS.info} />
          </View>
          <Text style={styles.quickLabel}>ပါဆယ်ရှာ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(tabs)/deliveries')}>
          <View style={[styles.quickIcon, { backgroundColor: '#E8F8EF' }]}>
            <Ionicons name="car" size={24} color={COLORS.success} />
          </View>
          <Text style={styles.quickLabel}>ပို့ဆောင်မှု</Text>
        </TouchableOpacity>
        {isAdmin && (
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(tabs)/users')}>
            <View style={[styles.quickIcon, { backgroundColor: '#F3E8FB' }]}>
              <Ionicons name="people" size={24} color={COLORS.statusVerified} />
            </View>
            <Text style={styles.quickLabel}>ဝန်ထမ်းများ</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function StatCard({ icon, label, value, color, bg }: {
  icon: string; label: string; value: any; color: string; bg: string;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: bg }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SkeletonCard() {
  return (
    <View style={styles.skeleton} />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  scrollView: { backgroundColor: COLORS.primary },
  scrollContent: { flexGrow: 1 },
  contentArea: { flex: 1, backgroundColor: COLORS.background, marginTop: -1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 12,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greeting: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontFamily: FONTS.medium,
  },
  waveEmoji: {
    fontSize: 14,
  },
  username: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
    marginTop: 2,
    marginBottom: 6,
    fontFamily: FONTS.bold,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
  },
  roleText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  phoneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  phoneText: {
    fontSize: 11,
    color: COLORS.white,
    fontFamily: FONTS.regular,
  },
  avatarButton: {
    padding: 2,
  },
  avatarWrapper: {
    position: 'relative',
    width: 54,
    height: 54,
  },
  avatarImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  avatarFallback: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
    fontFamily: FONTS.bold,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  content: { padding: 16 },
  loadingContainer: { padding: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    marginTop: 8,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    width: '30.5%',
    borderRadius: 14,
    padding: 12,
    paddingBottom: 16,
    alignItems: 'flex-start',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22, fontWeight: '800', marginBottom: 2,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  statLabel: {
    fontSize: 10, color: COLORS.textSecondary, lineHeight: 19,
    fontFamily: 'NotoSansMyanmar_400Regular',
  },
  totalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  totalInfo: { flex: 1 },
  totalLabel: {
    fontSize: 13, color: COLORS.textSecondary,
    fontFamily: 'NotoSansMyanmar_400Regular',
  },
  totalValue: {
    fontSize: 32, fontWeight: '800', color: COLORS.primary, marginTop: 2,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 16,
    gap: 10,
    justifyContent: 'center',
  },
  actionBtnText: {
    flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.white,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 24,
  },
  quickBtn: { flex: 1, alignItems: 'center', gap: 8 },
  quickIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontSize: 11, color: COLORS.textSecondary, fontWeight: '600', textAlign: 'center',
    fontFamily: 'NotoSansMyanmar_600SemiBold',
  },
  skeleton: {
    height: 100,
    backgroundColor: COLORS.border,
    borderRadius: 16,
    marginBottom: 12,
    opacity: 0.5,
  },
});
