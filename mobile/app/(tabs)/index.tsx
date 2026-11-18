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
import { COLORS, FONTS, ROLE_LABELS_MM } from '../../src/constants';

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
            <Text style={styles.username} numberOfLines={1}>
              {user?.name ?? 'အသုံးပြုသူ'}
            </Text>
            <View style={styles.metaRow}>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{roleLabel}</Text>
              </View>
              {user?.phone ? (
                <View style={styles.phoneChip}>
                  <Text style={styles.phoneText}>{user.phone}</Text>
                </View>
              ) : null}
            </View>
          </View>

          <TouchableOpacity
            style={styles.avatarButton}
            activeOpacity={0.8}
            onPress={() => router.navigate('/(tabs)/profile')}
          >
            <View style={styles.avatarWrapper}>
              {user?.profile_image_url ? (
                <Image source={{ uri: user.profile_image_url }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Image source={require('../../assets/icon.png')} style={styles.avatarFallbackImage} resizeMode="contain" />
                </View>
              )}
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
          label="ဆောင်ရွက်နေသောလုပ်ငန်းများ"
          value={data?.assignments?.active ?? 0}
          color={COLORS.primary}
        />
        <StatCard
          label="ယနေ့ပြီးစီးသော"
          value={data?.assignments?.completed_today ?? 0}
          color={COLORS.success}
        />
        <StatCard
          label="ယနေ့ကြိုးပမ်းမှုများ"
          value={data?.attempts_today ?? 0}
          color={COLORS.info}
        />
        <StatCard
          label="ယနေ့မအောင်မြင်"
          value={data?.failed_today ?? 0}
          color={COLORS.error}
        />
      </View>

      <View style={styles.totalCard}>
        <View style={styles.totalInfo}>
          <Text style={styles.totalLabel}>စုစုပေါင်း ပြီးစီးသောလုပ်ငန်းများ</Text>
          <Text style={styles.totalValue}>{data?.assignments?.total_completed ?? 0}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.actionBtn}
        onPress={() => router.navigate('/(tabs)/my-assignments')}
      >
        <Text style={styles.actionBtnText}>ကျွန်ုပ်၏ လုပ်ငန်းများ ကြည့်ရှုမည်</Text>
      </TouchableOpacity>
    </View>
  );
}

function AdminManagerDashboard({ data, isAdmin, canCreateParcel }: { data: any; isAdmin: boolean; canCreateParcel: boolean }) {
  const stats = data?.parcel_stats;
  const isAccountant = !isAdmin && !canCreateParcel;

  const statItems = isAdmin ? [
    { label: 'စုစုပေါင်း ပါဆယ်', value: stats?.total ?? 0, color: COLORS.primary },
    { label: 'ယနေ့ရောက်ရှိ', value: stats?.today ?? 0, color: COLORS.info },
    { label: 'ဆောင်ရွက်နေဆဲ', value: stats?.in_progress ?? 0, color: COLORS.warning },
    { label: 'ပို့ဆောင်ပြီး', value: stats?.delivered ?? 0, color: COLORS.success },
    { label: 'မအောင်မြင်', value: stats?.failed ?? 0, color: COLORS.error },
    { label: 'အောင်မြင်မှုနှုန်း', value: `${stats?.delivery_success_rate ?? 0}%`, color: '#8B5CF6' },
  ] : [
    { label: 'လက်ခံ', value: stats?.received ?? 0, color: COLORS.statusReceived },
    { label: 'စစ်ဆေးပြီး', value: stats?.verified ?? 0, color: COLORS.statusVerified },
    { label: 'ဆောင်ရွက်နေဆဲ', value: stats?.out_for_delivery ?? 0, color: COLORS.statusInTransit },
    { label: 'ပို့ဆောင်ပြီး', value: stats?.delivered ?? 0, color: COLORS.success },
    { label: 'မအောင်မြင်', value: stats?.failed ?? 0, color: COLORS.error },
    { label: 'ပျက်ဆီး', value: stats?.damaged ?? 0, color: COLORS.statusDamaged },
  ];

  return (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>ပါဆယ် အခြေအနေ</Text>
      <View style={styles.statsGrid}>
        {statItems.map((item, i) => (
          <StatCard
            key={i}
            label={item.label}
            value={item.value}
            color={item.color}
          />
        ))}
      </View>

      {isAdmin && (
        <>
          {/* Totals */}
          <Text style={styles.sectionTitle}>ငွေကြေးစုစုပေါင်း</Text>
          <View style={styles.totalsCard}>
            <View style={styles.totalsRow}>
              <View style={styles.totalItem}>
                <Text style={styles.totalItemLabel}>ပို့ဆောင်ခ (MMK)</Text>
                <Text style={styles.totalItemValue}>{(data?.totals?.fee_mmk ?? 0).toLocaleString()}</Text>
              </View>
              <View style={styles.totalItem}>
                <Text style={styles.totalItemLabel}>ပို့ဆောင်ခ (THB)</Text>
                <Text style={styles.totalItemValue}>{(data?.totals?.fee_thb ?? 0).toLocaleString()}</Text>
              </View>
            </View>
            <View style={styles.totalsRow}>
              <View style={styles.totalItem}>
                <Text style={styles.totalItemLabel}>COD (MMK)</Text>
                <Text style={styles.totalItemValue}>{(data?.totals?.cod_mmk ?? 0).toLocaleString()}</Text>
              </View>
              <View style={styles.totalItem}>
                <Text style={styles.totalItemLabel}>COD (THB)</Text>
                <Text style={styles.totalItemValue}>{(data?.totals?.cod_thb ?? 0).toLocaleString()}</Text>
              </View>
            </View>
          </View>
        </>
      )}

      {/* Quick Actions for manager/accountant */}
      {!isAdmin && (
        <>
          <Text style={styles.sectionTitle}>အမြန်ဆောင်ရွက်မည်</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickAction} onPress={() => router.navigate('/(tabs)/parcels')} activeOpacity={0.8}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="cube-outline" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.quickActionLabel}>ပါဆယ်များ</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => router.navigate('/(tabs)/deliveries')} activeOpacity={0.8}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#E8F8EF' }]}>
                <Ionicons name="car-outline" size={24} color={COLORS.success} />
              </View>
              <Text style={styles.quickActionLabel}>ပို့ဆောင်မှုများ</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => router.navigate('/(tabs)/customers')} activeOpacity={0.8}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="people-outline" size={24} color={COLORS.warning} />
              </View>
              <Text style={styles.quickActionLabel}>ဖောက်သည်များ</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => router.navigate('/(tabs)/daily-summary')} activeOpacity={0.8}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="bar-chart-outline" size={24} color={COLORS.info} />
              </View>
              <Text style={styles.quickActionLabel}>မှတ်တမ်း</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

    </View>
  );
}

function StatCard({ label, value, color }: { label: string; value: any; color: string }) {
  return (
    <View style={styles.statCard}>
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
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 12,
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
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  roleText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  phoneChip: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
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
    width: 54,
    height: 54,
  },
  avatarImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  avatarFallback: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
    fontFamily: FONTS.bold,
  },
  avatarFallbackImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  content: { padding: 16 },
  loadingContainer: { padding: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    marginTop: 8,
    fontFamily: FONTS.bold,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    width: '30.5%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: {
    fontSize: 22, fontWeight: '800', marginBottom: 2,
    fontFamily: FONTS.bold,
  },
  statLabel: {
    fontSize: 10, color: COLORS.textSecondary, lineHeight: 14,
    fontFamily: FONTS.regular,
  },
  totalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  totalInfo: { flex: 1 },
  totalLabel: {
    fontSize: 13, color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
  },
  totalValue: {
    fontSize: 28, fontWeight: '800', color: COLORS.primary, marginTop: 2,
    fontFamily: FONTS.bold,
  },
  totalsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  totalsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  totalItem: {
    flex: 1,
  },
  totalItemLabel: {
    fontSize: 12, color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    marginBottom: 2,
  },
  totalItemValue: {
    fontSize: 16, fontWeight: '700', color: COLORS.text,
    fontFamily: FONTS.bold,
  },
  actionBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primaryDark,
  },
  actionBtnText: {
    fontSize: 15, fontWeight: '700', color: COLORS.white,
    fontFamily: FONTS.bold,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 24,
  },
  quickBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickLabel: {
    fontSize: 11, color: COLORS.text, fontWeight: '600', textAlign: 'center',
    fontFamily: FONTS.semiBold,
  },
  skeleton: {
    height: 100,
    backgroundColor: COLORS.border,
    borderRadius: 12,
    marginBottom: 12,
    opacity: 0.5,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  quickAction: {
    width: '47%',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: FONTS.semiBold,
    textAlign: 'center',
  },
});