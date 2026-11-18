import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS, FONTS, ROLE_LABELS_MM } from '../../src/constants';

export default function MoreScreen() {
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

  type MenuItem = { label: string; icon: any; onPress: () => void; danger?: boolean };
  const items: MenuItem[] = [];

  items.push({
    label: 'ပရိုဖိုင်',
    icon: 'person-circle-outline',
    onPress: () => router.navigate('/(tabs)/profile'),
  });

  if (canSeeParcels) {
    items.push({
      label: 'ပါဆယ်များ',
      icon: 'cube-outline',
      onPress: () => router.navigate('/(tabs)/parcels'),
    });
    items.push({
      label: 'ပို့ဆောင်မှု အားလုံး',
      icon: 'list-outline',
      onPress: () => router.navigate('/(tabs)/deliveries'),
    });
    items.push({
      label: 'ဖောက်သည်များ',
      icon: 'people-outline',
      onPress: () => router.navigate('/(tabs)/customers'),
    });
    items.push({
      label: 'မှတ်တမ်း',
      icon: 'document-text-outline',
      onPress: () => router.navigate('/(tabs)/daily-summary'),
    });
  }

  if (canAssign) {
    items.push({
      label: 'ဝန်ထမ်း ချိတ်ဆက်မည်',
      icon: 'person-add-outline',
      onPress: () => router.navigate('/(tabs)/assign-staff'),
    });
  }

  if (isStaff) {
    items.push({
      label: 'ကျွန်ုပ်၏ လုပ်ငန်းများ',
      icon: 'bicycle',
      onPress: () => router.navigate('/(tabs)/my-assignments'),
    });
  }

  if (isAdmin) {
    items.push({
      label: 'အသုံးပြုသူ စီမံခန့်ခွဲမှု',
      icon: 'people',
      onPress: () => router.navigate('/(tabs)/users'),
    });
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.headerTitle}>မီနူး</Text>
          <Text style={styles.headerSub}>{user?.name ?? ''} • {roleLabel}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {items.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuRow, i === items.length - 1 && styles.menuRowLast]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconWrap}>
                <Ionicons name={item.icon} size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.logoutBtn, isLoggingOut && { opacity: 0.6 }]}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color="#EF4444" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={18} color="#EF4444" />
              <Text style={styles.logoutText}>အကောင့်မှ ထွက်ရန်</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white, fontFamily: FONTS.bold },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2, fontFamily: FONTS.regular },
  content: { padding: 16 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: 16,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  menuRowLast: { borderBottomWidth: 0 },
  menuIconWrap: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: COLORS.primaryBg, alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.text, fontFamily: FONTS.semiBold },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#FEF2F2', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#FECACA',
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#EF4444', fontFamily: FONTS.semiBold },
});
