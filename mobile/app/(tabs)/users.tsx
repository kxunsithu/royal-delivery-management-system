import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { userService, User } from '../../src/services/userService';
import { COLORS, ROLE_LABELS_MM, FONTS } from '../../src/constants';

export default function UsersScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const debounceRef = React.useRef<any>(null);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['users', searchDebounced, roleFilter, page],
    queryFn: () => userService.list({ search: searchDebounced || undefined, role: roleFilter || undefined, page, per_page: 20 }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      userService.updateStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  function handleSearch(text: string) {
    setSearch(text);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setSearchDebounced(text); setPage(1); }, 500);
  }

  function handleToggleStatus(user: User) {
    const action = user.is_active ? 'ပိတ်' : 'ဖွင့်';
    Alert.alert('အကောင့် ' + action + 'မည်', `${user.name} ၏ အကောင့်ကို ${action}မည်လား?`, [
      { text: 'မလုပ်တော့', style: 'cancel' },
      { text: action + 'မည်', onPress: () => statusMutation.mutate({ id: user.id, isActive: !user.is_active }) },
    ]);
  }

  const users = data?.data ?? [];
  const meta = data?.meta;

  const roleFilters = [
    { label: 'အားလုံး', value: '' },
    { label: 'အက်ဒ်မင်', value: 'admin' },
    { label: 'မန်နေဂျာ', value: 'manager' },
    { label: 'စာရင်းကိုင်', value: 'accountant' },
    { label: 'ပို့ဆောင်', value: 'delivery_staff' },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.navigate('/(tabs)/more')}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>အသုံးပြုသူများ</Text>
            <Text style={styles.headerSub}>စုစုပေါင်း {meta?.total ?? 0} ဦး</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/users/create')}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contentArea}>
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={18} color={COLORS.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="ဝန်ထမ်း ရှာဖွေမည်..."
            placeholderTextColor={COLORS.textLight}
            value={search}
            onChangeText={handleSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); setSearchDebounced(''); }}>
              <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterList}
          >
            {roleFilters.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[styles.filterChip, roleFilter === item.value && styles.filterChipActive]}
                onPress={() => { setRoleFilter(item.value); setPage(1); }}
              >
                <Text style={[styles.filterChipText, roleFilter === item.value && styles.filterChipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.listArea}>
          {isLoading ? (
            <ActivityIndicator style={styles.loader} size="large" color={COLORS.primary} />
          ) : (
            <FlatList
              data={users}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={() => { setPage(1); refetch(); }} tintColor={COLORS.primary} />}
              renderItem={({ item }) => (
                <UserCard user={item} onToggleStatus={() => handleToggleStatus(item)} />
              )}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <View style={styles.emptyIconWrap}>
                    <Ionicons name="people-outline" size={36} color={COLORS.primary} />
                  </View>
                  <Text style={styles.emptyTitle}>အသုံးပြုသူ မတွေ့ပါ</Text>
                  <Text style={styles.emptySub}>
                    {search ? `"${search}" နှင့် မကိုက်ညီပါ` : 'အသုံးပြုသူ မရှိသေးပါ'}
                  </Text>
                </View>
              }
              ListFooterComponent={
                meta && meta.last_page > 1 ? (
                  <View style={styles.pagination}>
                    <TouchableOpacity
                      style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
                      onPress={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      <Text style={[styles.pageBtnText, page <= 1 && { color: COLORS.textLight }]}>နှုတ်</Text>
                    </TouchableOpacity>
                    <View style={styles.pageInfoBox}>
                      <Text style={styles.pageInfo}>{page} / {meta.last_page}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.pageBtn, page >= meta.last_page && styles.pageBtnDisabled]}
                      onPress={() => setPage(p => Math.min(meta.last_page, p + 1))}
                      disabled={page >= meta.last_page}
                    >
                      <Text style={[styles.pageBtnText, page >= meta.last_page && { color: COLORS.textLight }]}>နောက်</Text>
                    </TouchableOpacity>
                  </View>
                ) : undefined
              }
            />
          )}
        </View>
      </View>
    </View>
  );
}

function UserCard({ user, onToggleStatus }: { user: User; onToggleStatus: () => void }) {
  const roleLabel = ROLE_LABELS_MM[user.role as keyof typeof ROLE_LABELS_MM] || user.role;
  const roleColor =
    user.role === 'admin'
      ? '#8B5CF6'
      : user.role === 'manager'
      ? COLORS.info
      : user.role === 'accountant'
      ? '#F59E0B'
      : COLORS.success;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/users/${user.id}`)}
      activeOpacity={0.85}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardLeft}>
          {user.profile_image_url ? (
            <Image source={{ uri: user.profile_image_url }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: roleColor + '18' }]}>
              <Text style={[styles.avatarText, { color: roleColor }]}>{user.name[0]?.toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>{user.name}</Text>
            <Text style={styles.userContact} numberOfLines={1}>{user.phone || user.email}</Text>
            <View style={styles.roleBadge}>
              <View style={[styles.roleDot, { backgroundColor: roleColor }]} />
              <Text style={[styles.roleText, { color: roleColor }]}>{roleLabel}</Text>
            </View>
          </View>
        </View>
        <View style={[styles.statusPill, user.is_active ? styles.statusPillActive : styles.statusPillInactive]}>
          <Text style={[styles.statusPillText, { color: user.is_active ? '#15803D' : '#B91C1C' }]}>
            {user.is_active ? 'ဖွင့်' : 'ပိတ်'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  contentArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white, fontFamily: FONTS.bold },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2, fontFamily: FONTS.regular },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { fontSize: 22, fontWeight: '700', color: COLORS.white, lineHeight: 24 },

  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text, fontFamily: FONTS.regular },
  filterRow: { height: 56 },
  filterList: { paddingHorizontal: 16, paddingVertical: 8, gap: 8, alignItems: 'center' },
  listArea: { flex: 1 },
  loader: { marginTop: 60 },
  list: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, gap: 10 },

  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignSelf: 'center',
    height: 36,
    justifyContent: 'center',
  },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600', fontFamily: FONTS.semiBold },
  filterChipTextActive: { color: COLORS.white },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarImage: { width: 50, height: 50, borderRadius: 25, flexShrink: 0 },
  avatarText: { fontSize: 18, fontWeight: '700', fontFamily: FONTS.bold },
  userInfo: { flex: 1, gap: 2 },
  userName: { fontSize: 15, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.bold },
  userContact: { fontSize: 13, color: COLORS.textSecondary, fontFamily: FONTS.regular },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  roleDot: { width: 6, height: 6, borderRadius: 3 },
  roleText: { fontSize: 12, fontWeight: '600', fontFamily: FONTS.semiBold },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusPillActive: { backgroundColor: '#DCFCE7' },
  statusPillInactive: { backgroundColor: '#FEE2E2' },
  statusPillText: { fontSize: 11, fontWeight: '700', fontFamily: FONTS.bold },

  empty: { alignItems: 'center', paddingVertical: 60, gap: 6 },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.bold },
  emptySub: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', fontFamily: FONTS.regular },

  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  pageBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 8 },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.primary, fontFamily: FONTS.semiBold },
  pageInfoBox: { backgroundColor: COLORS.white, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  pageInfo: { fontSize: 13, color: COLORS.text, fontWeight: '600', fontFamily: FONTS.semiBold },
});
