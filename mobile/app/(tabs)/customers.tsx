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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { parcelService, Customer } from '../../src/services/parcelService';
import { COLORS, STATUS_COLORS } from '../../src/constants';

type CustomerType = 'recipient' | 'sender';

export default function CustomersScreen() {
  const insets = useSafeAreaInsets();
  const [type, setType] = useState<CustomerType>('recipient');
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [page, setPage] = useState(1);
  const debounceRef = React.useRef<any>(null);

  const handleSearch = (text: string) => {
    setSearch(text);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchDebounced(text);
      setPage(1);
    }, 500);
  };

  const handleTypeChange = (t: CustomerType) => {
    setType(t);
    setPage(1);
  };

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['customers', type, searchDebounced, page],
    queryFn: () =>
      parcelService.customers({ type, search: searchDebounced || undefined, page, per_page: 20 }),
  });

  const customers = data?.data ?? [];
  const meta = data?.meta;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.headerTitle}>ဖောက်သည်များ</Text>
          {meta && <Text style={styles.headerSub}>စုစုပေါင်း {meta.total} ဦး</Text>}
        </View>
      </View>

      <View style={styles.contentArea}>
        {/* Sender / Recipient Toggle */}
        <View style={styles.typeTabRow}>
          <TouchableOpacity
            style={[styles.typeTab, type === 'recipient' && styles.typeTabActive]}
            onPress={() => handleTypeChange('recipient')}
          >
            <Text style={[styles.typeTabText, type === 'recipient' && styles.typeTabTextActive]}>
              လက်ခံသူ
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeTab, type === 'sender' && styles.typeTabActive]}
            onPress={() => handleTypeChange('sender')}
          >
            <Text style={[styles.typeTabText, type === 'sender' && styles.typeTabTextActive]}>
              ပို့သူ
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={18} color={COLORS.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="နာမည် သို့ ဖုန်းနံပါတ် ရှာဖွေမည်..."
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

        {/* List */}
        <View style={styles.listArea}>
          {isLoading ? (
            <ActivityIndicator style={styles.loader} size="large" color={COLORS.primary} />
          ) : (
            <FlatList
              data={customers}
              keyExtractor={(item, i) => `${item.phone}-${i}`}
              renderItem={({ item }) => <CustomerCard customer={item} type={type} />}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={isFetching && !isLoading}
                  onRefresh={() => { setPage(1); refetch(); }}
                  tintColor={COLORS.primary}
                />
              }
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyTitle}>ဖောက်သည် မတွေ့ပါ</Text>
                  <Text style={styles.emptySub}>
                    {search ? `"${search}" နှင့် မကိုက်ညီပါ` : 'ဖောက်သည် မရှိသေးပါ'}
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
                      <Ionicons name="chevron-back" size={16} color={page <= 1 ? COLORS.textLight : COLORS.primary} />
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
                      <Ionicons name="chevron-forward" size={16} color={page >= meta.last_page ? COLORS.textLight : COLORS.primary} />
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

function CustomerCard({ customer, type }: { customer: Customer; type: CustomerType }) {
  return (
    <TouchableOpacity
      style={[styles.card, (customer.parcel_count > 0 && customer.delivered_count === customer.parcel_count) && styles.cardHighlighted]}
      onPress={() =>
        router.push({
          pathname: '/customers/[phone]',
          params: {
            phone: customer.phone,
            type,
            name: customer.name,
            rc: String(customer.received_count ?? 0),
            vc: String(customer.verified_count ?? 0),
            ic: String(customer.in_transit_count ?? 0),
            dc: String(customer.delivered_count ?? 0),
            fc: String(customer.failed_count ?? 0),
            dam: String(customer.damaged_count ?? 0),
          },
        })
      }
      activeOpacity={0.85}
    >
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarText}>{customer.name?.[0]?.toUpperCase() || '?'}</Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={1}>{customer.name}</Text>
        <Text style={styles.cardPhone}>{customer.phone}</Text>
        <View style={styles.statusGrid}>
          <Text style={styles.statusGridItem}>လက်ခံ {customer.received_count ?? 0}</Text>
          <Text style={styles.statusGridItem}>စစ်ဆေး {customer.verified_count ?? 0}</Text>
          <Text style={styles.statusGridItem}>ဆောင်ရွက် {customer.in_transit_count ?? 0}</Text>
          <Text style={styles.statusGridItem}>ပို့ပြီး {customer.delivered_count ?? 0}</Text>
          <Text style={styles.statusGridItem}>မအောင် {customer.failed_count ?? 0}</Text>
          <Text style={styles.statusGridItem}>ပျက် {customer.damaged_count ?? 0}</Text>
        </View>
        {customer.last_parcel_at && (
          <Text style={styles.lastDate}>
            နောက်ဆုံး:{' '}
            {new Date(customer.last_parcel_at).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
        )}
      </View>
      <View style={styles.cardRight}>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{customer.parcel_count} ခု</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  contentArea: { flex: 1, backgroundColor: COLORS.background, marginTop: -1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
    fontFamily: 'NotoSansMyanmar_400Regular',
  },

  // Type toggle
  typeTabRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  typeTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  typeTabActive: { backgroundColor: COLORS.primary },
  typeTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    fontFamily: 'NotoSansMyanmar_600SemiBold',
  },
  typeTabTextActive: { color: COLORS.white },

  // Search
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 14,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    paddingVertical: 12,
    fontFamily: 'NotoSansMyanmar_400Regular',
  },

  listArea: { flex: 1 },
  loader: { marginTop: 60 },
  list: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, gap: 10 },

  // Card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHighlighted: {
    borderWidth: 1.5,
    borderColor: COLORS.success,
    backgroundColor: '#E8F8EF',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  cardInfo: { flex: 1, gap: 2 },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  cardPhone: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: 'NotoSansMyanmar_400Regular',
  },
  lastDate: {
    fontSize: 11,
    color: COLORS.textLight,
    fontFamily: 'NotoSansMyanmar_400Regular',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  statusGridItem: {
    fontSize: 10,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    fontFamily: 'NotoSansMyanmar_400Regular',
  },
  cardRight: { alignItems: 'flex-end' },
  countBadge: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  countText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },

  // Empty
  empty: { alignItems: 'center', paddingTop: 80, gap: 6 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  emptySub: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontFamily: 'NotoSansMyanmar_400Regular',
  },

  // Pagination
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: 'NotoSansMyanmar_600SemiBold',
  },
  pageInfoBox: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
  },
  pageInfo: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
});
