import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { dashboardService } from '../../src/services/dashboardService';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS, STATUS_COLORS, STATUS_LABELS_MM } from '../../src/constants';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardService.getDashboard(),
  });

  const isStaff = user?.role === 'delivery_staff';
  const isAdmin = user?.role === 'admin';

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { refetch(); }} tintColor={COLORS.primary} />}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View>
            <Text style={styles.greeting}>မင်္ဂလာပါ 👋</Text>
            <Text style={styles.username}>{user?.name}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                {user?.role === 'admin' ? 'အက်ဒ်မင်' :
                  user?.role === 'manager' ? 'မန်နေဂျာ' :
                  user?.role === 'delivery_staff' ? 'ပို့ဆောင်ရေးဝန်ထမ်း' : user?.role}
              </Text>
            </View>
          </View>
          <View style={styles.logoMini}>
            <Ionicons name="cube" size={32} color={COLORS.white} />
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
          </View>
        ) : isStaff ? (
          <StaffDashboard data={data} />
        ) : (
          <AdminManagerDashboard data={data} isAdmin={isAdmin} />
        )}
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
          label="တက်ကြွသောလုပ်ငန်းများ"
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

function AdminManagerDashboard({ data, isAdmin }: { data: any; isAdmin: boolean }) {
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
    { label: 'မအောင်မြင်', value: stats?.failed ?? 0, icon: 'close-circle', color: COLORS.error, bg: '#FDE8E8' },
  ];

  return (
    <View style={styles.content}>
      {/* Success rate banner for admin */}
      {isAdmin && (
        <View style={styles.successBanner}>
          <View>
            <Text style={styles.successRate}>{stats?.delivery_success_rate ?? 0}%</Text>
            <Text style={styles.successLabel}>ပို့ဆောင်မှု အောင်မြင်နှုန်း</Text>
          </View>
          <View style={styles.successRight}>
            <Text style={styles.staffCount}>{data?.active_staff_count ?? 0}</Text>
            <Text style={styles.staffLabel}>တက်ကြွသောဝန်ထမ်း</Text>
          </View>
        </View>
      )}

      {!isAdmin && (
        <View style={styles.todayBanner}>
          <Ionicons name="calendar" size={22} color={COLORS.primary} />
          <Text style={styles.todayText}>ယနေ့ ရောက်ရှိသောပါဆယ်: </Text>
          <Text style={styles.todayCount}>{data?.today_received ?? 0}</Text>
        </View>
      )}

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

      {/* Staff workload (admin/manager) */}
      {data?.staff_workload && data.staff_workload.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>ဝန်ထမ်း အလုပ်ချိန်</Text>
          <View style={styles.workloadCard}>
            {data.staff_workload.map((item: any, i: number) => (
              <View key={i} style={[styles.workloadRow, i < data.staff_workload.length - 1 && styles.workloadBorder]}>
                <View style={styles.workloadLeft}>
                  <View style={styles.workloadAvatar}>
                    <Text style={styles.workloadAvatarText}>{item.staff_name?.[0] ?? '?'}</Text>
                  </View>
                  <Text style={styles.workloadName}>{item.staff_name}</Text>
                </View>
                <View style={styles.workloadBadge}>
                  <Text style={styles.workloadCount}>{item.active_count}</Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>အမြန်လုပ်ဆောင်မှုများ</Text>
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/parcels/create')}>
          <View style={[styles.quickIcon, { backgroundColor: '#FFF3DC' }]}>
            <Ionicons name="add-circle" size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.quickLabel}>ပါဆယ်အသစ်</Text>
        </TouchableOpacity>
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
        <Ionicons name={icon as any} size={22} color={color} />
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
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  greeting: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  username: { fontSize: 22, fontWeight: '800', color: COLORS.white, marginVertical: 2 },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  roleText: { fontSize: 12, color: COLORS.white, fontWeight: '600' },
  logoMini: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: 16 },
  loadingContainer: { padding: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: '47%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'flex-start',
  },
  statIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: { fontSize: 26, fontWeight: '800', marginBottom: 4 },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 16 },
  successBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  successRate: { fontSize: 36, fontWeight: '800', color: COLORS.white },
  successLabel: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  successRight: { alignItems: 'flex-end' },
  staffCount: { fontSize: 30, fontWeight: '800', color: COLORS.white },
  staffLabel: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  todayBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    gap: 8,
  },
  todayText: { fontSize: 14, color: COLORS.text, flex: 1 },
  todayCount: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
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
  totalLabel: { fontSize: 13, color: COLORS.textSecondary },
  totalValue: { fontSize: 32, fontWeight: '800', color: COLORS.primary, marginTop: 2 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 16,
    gap: 10,
    justifyContent: 'center',
  },
  actionBtnText: { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.white },
  workloadCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  workloadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  workloadBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  workloadLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  workloadAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workloadAvatarText: { fontSize: 16, fontWeight: '700', color: COLORS.primaryDark },
  workloadName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  workloadBadge: {
    backgroundColor: COLORS.primaryBg,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  workloadCount: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
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
  quickLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600', textAlign: 'center' },
  skeleton: {
    height: 100,
    backgroundColor: COLORS.border,
    borderRadius: 16,
    marginBottom: 12,
    opacity: 0.5,
  },
});
