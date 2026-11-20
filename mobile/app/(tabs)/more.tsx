import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { COLORS, FONTS, ROLE_LABELS_MM } from '../../src/constants';

export default function MoreScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const canSeeParcels = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'accountant';
  const canAssign = user?.role === 'admin' || user?.role === 'accountant';
  const isStaff = user?.role === 'delivery_staff';
  const isAdmin = user?.role === 'admin';

  const roleLabel = (user?.role && ROLE_LABELS_MM[user.role as keyof typeof ROLE_LABELS_MM]) || user?.role || 'ဝန်ထမ်း';

  async function handleLogout() {
    Alert.alert('ထွက်မည်', 'အကောင့်မှ ထွက်မည်လား?', [
      { text: 'မထွက်ပါ', style: 'cancel' },
      {
        text: 'ထွက်မည်', style: 'destructive', onPress: async () => {
          setIsLoggingOut(true);
          try { await logout(); router.replace('/login'); }
          catch { setIsLoggingOut(false); }
        },
      },
    ]);
  }

  type MenuItem = { label: string; icon: any; onPress: () => void; iconBg: string; iconColor: string; danger?: boolean };
  const items: MenuItem[] = [];

  items.push({
    label: 'ပရိုဖိုင်',
    icon: 'person-circle-outline',
    iconBg: '#EEF2FF',
    iconColor: '#4F46E5',
    onPress: () => router.navigate('/(tabs)/profile'),
  });

  if (canSeeParcels) {
    items.push({
      label: 'ပါဆယ်များ',
      icon: 'cube-outline',
      iconBg: '#FFFBEB',
      iconColor: COLORS.primary,
      onPress: () => router.navigate('/(tabs)/parcels'),
    });
    items.push({
      label: 'ပို့ဆောင်မှု အားလုံး',
      icon: 'car-outline',
      iconBg: '#E8F8EF',
      iconColor: COLORS.success,
      onPress: () => router.navigate('/(tabs)/deliveries'),
    });
    items.push({
      label: 'ဖောက်သည်များ',
      icon: 'people-outline',
      iconBg: '#EFF6FF',
      iconColor: COLORS.info,
      onPress: () => router.navigate('/(tabs)/customers'),
    });
    items.push({
      label: 'မှတ်တမ်း',
      icon: 'bar-chart-outline',
      iconBg: '#F5F3FF',
      iconColor: '#7C3AED',
      onPress: () => router.navigate('/(tabs)/daily-summary'),
    });
  }

  if (canAssign) {
    items.push({
      label: 'ချိတ်ဆက်ထားသောဝန်ထမ်း',
      icon: 'person-add-outline',
      iconBg: '#FFF7ED',
      iconColor: COLORS.warning,
      onPress: () => router.navigate('/(tabs)/assign-staff'),
    });
  }

  if (isStaff) {
    items.push({
      label: 'ကျွန်ုပ်၏ လုပ်ငန်းများ',
      icon: 'bicycle',
      iconBg: '#E8F8EF',
      iconColor: COLORS.success,
      onPress: () => router.navigate('/(tabs)/my-assignments'),
    });
  }

  if (isAdmin) {
    items.push({
      label: 'အသုံးပြုသူ စီမံခန့်ခွဲမှု',
      icon: 'people',
      iconBg: '#FEE2E2',
      iconColor: '#DC2626',
      onPress: () => router.navigate('/(tabs)/users'),
    });
  }

  const initials = user?.name ? user.name.charAt(0).toUpperCase() : '?';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.profileRow}>
          {user?.profile_image_url ? (
            <Image source={{ uri: user.profile_image_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.headerName} numberOfLines={1}>{user?.name ?? 'အသုံးပြုသူ'}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{roleLabel}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => router.navigate('/(tabs)/profile')}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Menu Items */}
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionLabelText}>မီနူး</Text>
        </View>

        <View style={styles.card}>
          {items.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuRow, i === items.length - 1 && styles.menuRowLast]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: item.iconBg }]}>
                <Ionicons name={item.icon} size={20} color={item.iconColor} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutBtn, isLoggingOut && { opacity: 0.6 }]}
          onPress={handleLogout}
          disabled={isLoggingOut}
          activeOpacity={0.8}
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color="#EF4444" />
          ) : (
            <>
              <View style={styles.logoutIconWrap}>
                <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              </View>
              <Text style={styles.logoutText}>အကောင့်မှ ထွက်ရန်</Text>
              <Ionicons name="chevron-forward" size={16} color="#EF4444" />
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.versionText}>Royal Myawaddy Delivery © 2026</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 6,
    borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.8)',
  },
  avatarFallback: {
    width: 56, height: 56, borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarInitials: {
    fontSize: 22, fontWeight: '800', color: COLORS.white, fontFamily: FONTS.bold,
  },
  profileInfo: { flex: 1 },
  headerName: {
    fontSize: 18, fontWeight: '800', color: COLORS.white,
    fontFamily: FONTS.bold, marginBottom: 5,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  roleBadgeText: {
    fontSize: 11, fontWeight: '600', color: COLORS.white, fontFamily: FONTS.semiBold,
  },
  editProfileBtn: {
    width: 38, height: 38, borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  content: { padding: 16, paddingBottom: 32 },
  sectionLabel: { marginBottom: 8, marginTop: 4 },
  sectionLabelText: {
    fontSize: 12, fontWeight: '700', color: COLORS.textLight,
    textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: FONTS.bold,
  },
  card: { minHeight: 80, minWidth: 120,
    backgroundColor: COLORS.white,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    gap: 14,
  },
  menuRowLast: { borderBottomWidth: 0 },
  menuIconWrap: {
    width: 40, height: 40, borderRadius: 6,
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: {
    flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.text, fontFamily: FONTS.semiBold,
  },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: COLORS.white, borderRadius: 6, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
    marginBottom: 24,
  },
  logoutIconWrap: {
    width: 40, height: 40, borderRadius: 6,
    backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center',
  },
  logoutText: { flex: 1, fontSize: 14, fontWeight: '700', color: '#EF4444', fontFamily: FONTS.semiBold },
  versionText: {
    textAlign: 'center', fontSize: 11, color: COLORS.textLight,
    fontFamily: FONTS.regular,
  },
});
