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
import { COLORS, ROLE_LABELS_MM} from '../../src/constants';

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
        <View>
          <Text style={styles.headerTitle}>အသုံးပြုသူများ</Text>
          <Text style={styles.headerSubtitle}>စုစုပေါင်း {meta?.total ?? 0} ဦး</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/users/create')}>
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.contentArea}>
        <View style={styles.searchWrapper}>
        <Ionicons name="search" size={18} color={COLORS.textLight} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="ဝန်ထမ်း ရှာဖွေမည်..."
          placeholderTextColor={COLORS.textLight}
          value={search}
          onChangeText={handleSearch}
        />
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
              style={[styles.filterTab, roleFilter === item.value && styles.filterTabActive]}
              onPress={() => { setRoleFilter(item.value); setPage(1); }}
            >
              <Text style={[styles.filterTabText, roleFilter === item.value && styles.filterTabTextActive]}>
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
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="people-outline" size={48} color="#F59E0B" />
                </View>
                <Text style={styles.emptyTitle}>အသုံးပြုသူ မတွေ့ပါ</Text>
                <Text style={styles.emptySubtitle}>ရှာဖွေမှုနှင့် ကိုက်ညီသော အသုံးပြုသူ မရှိပါ</Text>
              </View>
            }
            ListFooterComponent={
              meta && meta.last_page > 1 ? (
                <View style={styles.pagination}>
                  <TouchableOpacity style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]} onPress={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                    <Ionicons name="chevron-back" size={18} color={page <= 1 ? COLORS.textLight : COLORS.primary} />
                  </TouchableOpacity>
                  <Text style={styles.pageInfo}>{page} / {meta.last_page}</Text>
                  <TouchableOpacity style={[styles.pageBtn, page >= meta.last_page && styles.pageBtnDisabled]} onPress={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={page >= meta.last_page}>
                    <Ionicons name="chevron-forward" size={18} color={page >= meta.last_page ? COLORS.textLight : COLORS.primary} />
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
      {/* Status pill — top-right */}
      <View style={[styles.statusPill, user.is_active ? styles.statusPillActive : styles.statusPillInactive]}>
        <Text style={[styles.statusPillText, { color: user.is_active ? '#15803D' : '#B91C1C' }]}>
          {user.is_active ? 'ဖွင့်' : 'ပိတ်'}
        </Text>
      </View>

      <View style={styles.cardLeft}>
        {user.profile_image_url ? (
          <Image source={{ uri: user.profile_image_url }} style={styles.avatarImage} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: roleColor + '30' }]}>
            <Text style={[styles.avatarText, { color: roleColor }]}>{user.name[0]?.toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail} numberOfLines={1}>{user.phone || user.email}</Text>
          <View style={styles.roleBadge}>
            <View style={[styles.roleIndicator, { backgroundColor: roleColor }]} />
            <Text style={[styles.roleText, { color: roleColor }]}>{roleLabel}</Text>
          </View>
        </View>
      </View>
      <View style={styles.cardRight}>
        <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  contentArea: { flex: 1, backgroundColor: COLORS.background, marginTop: -1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2, fontWeight: '500',
    fontFamily: 'NotoSansMyanmar_500Medium',
  },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: 16, borderRadius: 14, paddingHorizontal: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text,
    fontFamily: 'NotoSansMyanmar_400Regular',
  },
  filterRow: { height: 64 },
  filterList: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, alignItems: 'center' },
  listArea: { flex: 1 },
  filterTab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border, height: 40, justifyContent: 'center', alignSelf: 'center' },
  filterTabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterTabText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600',
    fontFamily: 'NotoSansMyanmar_600SemiBold',
  },
  filterTabTextActive: { color: COLORS.white },
  loader: { marginTop: 60 },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.white, borderRadius: 16, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 48, height: 48, borderRadius: 24 },
  avatarText: { fontSize: 20, fontWeight: '700',
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '700', color: COLORS.text,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  userEmail: { fontSize: 13, color: COLORS.textSecondary, marginVertical: 2,
    fontFamily: 'NotoSansMyanmar_400Regular',
  },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  roleIndicator: { width: 6, height: 6, borderRadius: 3 },
  roleText: { fontSize: 12, fontWeight: '600',
    fontFamily: 'NotoSansMyanmar_600SemiBold',
  },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusPill: { position: 'absolute', top: 8, right: 36, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  statusPillActive: { backgroundColor: '#DCFCE7' },
  statusPillInactive: { backgroundColor: '#FEE2E2' },
  statusPillText: { fontSize: 11, fontWeight: '700',
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIconContainer: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginTop: 4,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  emptySubtitle: { fontSize: 14, color: COLORS.textLight, marginTop: 6,
    fontFamily: 'NotoSansMyanmar_400Regular',
  },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 16 },
  pageBtn: { padding: 8 },
  pageBtnDisabled: { opacity: 0.4 },
  pageInfo: { fontSize: 14, color: COLORS.textSecondary,
    fontFamily: 'NotoSansMyanmar_400Regular',
  },
});
