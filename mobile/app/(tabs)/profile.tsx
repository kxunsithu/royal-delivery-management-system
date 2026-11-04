import React, { useState } from 'react';
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
import { COLORS, ROLE_LABELS_MM } from '../../src/constants';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    Alert.alert(
      'ထွက်မည်',
      'အကောင့်မှ ထွက်မည်လား?',
      [
        { text: 'မထွက်ပါ', style: 'cancel' },
        {
          text: 'ထွက်မည်',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await logout();
              router.replace('/login');
            } catch (error) {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  }

  if (!user) return null;

  const roleLabel = ROLE_LABELS_MM[user.role as keyof typeof ROLE_LABELS_MM] || user.role;
  const roleColor = user.role === 'admin' ? '#8B5CF6' : user.role === 'manager' ? COLORS.info : COLORS.success;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>ပရိုဖိုင်</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Avatar */}
        <View style={styles.profileCard}>
          <View style={[styles.avatar, { backgroundColor: roleColor + '30' }]}>
            <Text style={[styles.avatarText, { color: roleColor }]}>
              {user.name[0]?.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{user.name}</Text>
          <View style={[styles.roleBadge, { backgroundColor: roleColor + '20' }]}>
            <Text style={[styles.roleText, { color: roleColor }]}>{roleLabel}</Text>
          </View>
          <View style={[styles.statusBadge, user.is_active ? styles.activeBadge : styles.inactiveBadge]}>
            <View style={[styles.statusDot, { backgroundColor: user.is_active ? COLORS.success : COLORS.error }]} />
            <Text style={[styles.statusText, { color: user.is_active ? COLORS.success : COLORS.error }]}>
              {user.is_active ? 'တက်ကြွ' : 'ပိတ်ထား'}
            </Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>အကောင့် အချက်အလက်</Text>
          <View style={styles.infoCard}>
            <InfoRow icon="person" label="နာမည်" value={user.name} />
            {user.phone ? <InfoRow icon="call" label="ဖုန်းနံပါတ်" value={user.phone} /> : null}
            {user.email ? <InfoRow icon="mail" label="အီးမေးလ်" value={user.email} /> : null}
            <InfoRow icon="shield-checkmark" label="အခန်းကဏ္ဍ" value={roleLabel} valueColor={roleColor} />
          </View>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>အပလီကေးရှင်း သတင်းအချက်</Text>
          <View style={styles.infoCard}>
            <InfoRow icon="cube" label="ပရိုဂျက်" value="Royal Myawaddy Delivery" />
            <InfoRow icon="code-slash" label="ဗားရှင်း" value="1.0.0" />
            <InfoRow icon="globe" label="ဘာသာစကား" value="မြန်မာဘာသာ" />
          </View>
        </View>

        {/* Help section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>လမ်းညွှန်</Text>
          <View style={styles.infoCard}>
            <TouchableOpacity style={styles.menuRow}>
              <Ionicons name="help-circle-outline" size={20} color={COLORS.primary} />
              <Text style={styles.menuText}>အကူအညီ</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuRow}>
              <Ionicons name="document-text-outline" size={20} color={COLORS.primary} />
              <Text style={styles.menuText}>ကိုယ်ရေးကိုယ်တာ မူဝါဒ</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutBtn, isLoggingOut && { opacity: 0.6 }]}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator color={COLORS.error} />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
              <Text style={styles.logoutText}>ထွက်မည်</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.version}>Royal Myawaddy Delivery v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

function InfoRow({ icon, label, value, valueColor }: {
  icon: string; label: string; value: string; valueColor?: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon as any} size={18} color={COLORS.primary} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor ? { color: valueColor, fontWeight: '700' } : {}]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  content: { padding: 16, paddingBottom: 40 },
  profileCard: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 28,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: { fontSize: 36, fontWeight: '800' },
  name: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  roleBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginBottom: 8 },
  roleText: { fontSize: 14, fontWeight: '700' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  activeBadge: { backgroundColor: '#E8F8EF' },
  inactiveBadge: { backgroundColor: '#FDE8E8' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: '600' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: { fontSize: 13, color: COLORS.textSecondary, width: 100 },
  infoValue: { flex: 1, fontSize: 14, color: COLORS.text, fontWeight: '500' },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuText: { flex: 1, fontSize: 15, color: COLORS.text, fontWeight: '500' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 18,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: COLORS.error + '40',
  },
  logoutText: { fontSize: 17, fontWeight: '700', color: COLORS.error },
  version: { textAlign: 'center', fontSize: 12, color: COLORS.textLight },
});
