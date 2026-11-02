import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

export default function MoreScreen() {
  const { user, logout, hasRole } = useAuth();
  const navigation = useNavigation<any>();
  const { t, i18n } = useTranslation();

  const Item = ({ label, onPress }: { label: string; onPress: () => void }) => (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <Text style={styles.itemText}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.role}>{user?.role_display || user?.role}</Text>
      </View>
      <Item label={t('nav.profile') || 'Profile'} onPress={() => navigation.navigate('Profile')} />
      {hasRole('admin') && <Item label={t('nav.users') || 'Users'} onPress={() => navigation.navigate('Users')} />}
      {hasRole('admin') && <Item label={t('nav.settings') || 'Settings'} onPress={() => navigation.navigate('Settings')} />}
      <Item label={i18n.language === 'my' ? 'English' : 'မြန်မာ'} onPress={() => i18n.changeLanguage(i18n.language === 'my' ? 'en' : 'my')} />
      <TouchableOpacity style={[styles.item, { backgroundColor: '#fee2e2' }]} onPress={logout}>
        <Text style={[styles.itemText, { color: '#dc2626' }]}>{t('auth.logout') || 'Logout'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { padding: 20, backgroundColor: '#fff', marginBottom: 12 },
  name: { fontSize: 18, fontWeight: '700' },
  role: { color: '#6b7280', marginTop: 2 },
  item: { backgroundColor: '#fff', padding: 16, marginBottom: 8, marginHorizontal: 12, borderRadius: 8 },
  itemText: { fontSize: 16 },
});
