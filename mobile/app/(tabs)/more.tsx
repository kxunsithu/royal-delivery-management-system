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
import { COLORS, FONTS, RADIUS, ROLE_LABELS_MM } from '../../src/constants';

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

  type MenuItem = { label: string; icon: any; onPress: () => void; tint: string; bg: string };
  const items: MenuItem[] = [];

  items.push({
    label: 'ပရိုဖိုင်',
    icon: 'person-circle-outline',
    tint: '#4F46E5',
    bg: '#EEF2FF',
    onPress: () => router.navigate('/(tabs)/profile'),
  });

  if (canSeeParcels) {
    items.push({
      label: 'ပါဆယ်များ',
      icon: 'cube-outline',
      tint: colors.primary,
      bg: colors.primaryBg,
      onPress: () => router.navigate('/(tabs)/parcels'),
    });
    items.push({
      label: 'ပို့ဆောင်မှု အားလုံး',
      icon: 'car-outline',
      tint: colors.success,
      bg: colors.successBg,
      onPress: () => router.navigate('/(tabs)/deliveries'),
    });
    items.push({
      label: 'ဖောက်သည်များ',
      icon: 'people-outline',
      tint: colors.info,
      bg: colors.infoBg,
      onPress: () => router.navigate('/(tabs)/customers'),
    });
    items.push({
      label: 'မှတ်တမ်း',
      icon: 'bar-chart-outline',
      tint: '#7C3AED',
      bg: '#F5F3FF',
      onPress: () => router.navigate('/(tabs)/daily-summary'),
    });
  }

  if (canAssign) {
    items.push({
      label: 'ချိတ်ဆက်ထားသောဝန်ထမ်း',
      icon: 'person-add-outline',
      tint: colors.warning,
      bg: colors.warningBg,
      onPress: () => router.navigate('/(tabs)/assign-staff'),
    });
  }

  if (isStaff) {
    items.push({
      label: 'ကျွန်ုပ်၏ လုပ်ငန်းများ',
      icon: 'bicycle',
      tint: colors.success,
      bg: colors.successBg,
      onPress: () => router.navigate('/(tabs)/my-assignments'),
    });
  }

  if (isAdmin) {
    items.push({
      label: 'အသုံးပြုသူ စီမံခန့်ခွဲမှု',
      icon: 'people',
      tint: colors.error,
      bg: colors.errorBg,
      onPress: () => router.navigate('/(tabs)/users'),
    });
  }

  const initials = user?.name ? user.name.charAt(0).toUpperCase() : '?';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Page title */}
        <Text style={[styles.pageTitle, { color: colors.text }]}>မီနူး</Text>
        <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>
          သင့်အကောင့်နှင့် ဝန်ဆောင်မှုများ
        </Text>

        {/* Profile card */}
        <TouchableOpacity
          style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          activeOpacity={0.85}
          onPress={() => router.navigate('/(tabs)/profile')}
        >
          {user?.profile_image_url ? (
            <Image source={{ uri: user.profile_image_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: colors.primaryBg }]}>
              <Text style={[styles.avatarInitials, { color: colors.primary }]}>{initials}</Text>
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={[styles.headerName, { color: colors.text }]} numberOfLines={1}>
              {user?.name ?? 'အသုံးပြုသူ'}
            </Text>
            <View style={[styles.roleBadge, { backgroundColor: colors.primaryBg }]}>
              <Text style={[styles.roleBadgeText, { color: colors.primaryDark }]}>{roleLabel}</Text>
            </View>
          </View>
          <View style={[styles.editProfileBtn, { backgroundColor: colors.muted }]}>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>

        {/* Menu */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>မီနူး</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {items.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.menuRow,
                i !== items.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon} size={19} color={item.tint} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={17} color={colors.textLight} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: colors.errorBg }, isLoggingOut && { opacity: 0.6 }]}
          onPress={handleLogout}
          disabled={isLoggingOut}
          activeOpacity={0.8}
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color={colors.error} />
          ) : (
            <>
              <View style={[styles.logoutIconWrap, { backgroundColor: colors.card }]}>
                <Ionicons name="log-out-outline" size={19} color={colors.error} />
              </View>
              <Text style={[styles.logoutText, { color: colors.error }]}>အကောင့်မှ ထွက်ရန်</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={[styles.versionText, { color: colors.textLight }]}>
          Royal Myawaddy Delivery © 2026
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 32 },

  pageTitle: {
    fontSize: 27,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginTop: 2,
    marginBottom: 18,
  },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 4,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 4,
  },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  profileInfo: { flex: 1 },
  headerName: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    marginBottom: 5,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 4,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  editProfileBtn: {
    width: 36,
    height: 36,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 10,
    marginLeft: 2,
  },
  card: {
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  menuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 4,
    paddingVertical: 14,
    marginBottom: 24,
  },
  logoutIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: FONTS.semiBold,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    fontFamily: FONTS.regular,
  },
});
