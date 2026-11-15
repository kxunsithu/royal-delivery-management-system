import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import CalendarPicker from '../../src/components/CalendarPicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { parcelService, DailySummary } from '../../src/services/parcelService';
import { COLORS, FONTS } from '../../src/constants';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['တနင်္ဂနွေ', 'တနင်္လာ', 'အင်္ဂါ', 'ဗုဒ္ဓဟူး', 'ကြာသပတေး', 'သောကြာ', 'စနေ'];
  const months = [
    'ဇန်နဝါရီ', 'ဖေဖော်ဝါရီ', 'မတ်', 'ဧပြီ', 'မေ', 'ဇွန်',
    'ဇူလိုင်', 'သြဂုတ်', 'စက်တင်ဘာ', 'အောက်တိုဘာ', 'နိုဝင်ဘာ', 'ဒီဇင်ဘာ',
  ];
  const dayName = days[d.getDay()];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}၊ ${dayName}`;
}

export default function DailySummaryScreen() {
  const insets = useSafeAreaInsets();

  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFromInput, setDateFromInput] = useState('');
  const [dateToInput, setDateToInput] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const hasActiveDateFilter = !!(dateFrom || dateTo);

  const handleApplyDateFilter = () => {
    setDateFrom(dateFromInput);
    setDateTo(dateToInput);
    setShowDateFilter(false);
  };

  const handleClearDateFilter = () => {
    setDateFromInput('');
    setDateToInput('');
    setDateFrom('');
    setDateTo('');
  };

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['daily-summary', dateFrom, dateTo],
    queryFn: () => parcelService.dailySummary(dateFrom || undefined, dateTo || undefined),
  });

  const summaries = data ?? [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.headerTitle}>နေ့စဉ် မှတ်တမ်း</Text>
          {summaries.length > 0 && (
            <Text style={styles.headerSub}>{summaries.length} ရက် မှတ်တမ်း</Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.calendarBtn, hasActiveDateFilter && styles.calendarBtnActive]}
          onPress={() => setShowDateFilter(v => !v)}
        >
          <Ionicons
            name="calendar-outline"
            size={20}
            color={hasActiveDateFilter ? COLORS.white : COLORS.primary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.contentArea}>
        {/* Date Range Filter (collapsible) */}
        {showDateFilter && (
          <View style={styles.dateFilterBox}>
            <View style={styles.dateFilterRow}>
              {/* From date button */}
              <View style={styles.dateInputWrap}>
                <Text style={styles.dateLabel}>မှ ရက်စွဲ</Text>
                <TouchableOpacity
                  style={styles.datePressable}
                  onPress={() => setShowFromPicker(true)}
                >
                  <Ionicons name="calendar-outline" size={15} color={COLORS.primary} />
                  <Text style={[styles.datePressableText, !dateFromInput && styles.datePressablePlaceholder]}>
                    {dateFromInput || 'ရက်စွဲ ရွေးမည်'}
                  </Text>
                </TouchableOpacity>
                {dateFromInput ? (
                  <TouchableOpacity style={styles.dateClearX} onPress={() => setDateFromInput('')}>
                    <Ionicons name="close-circle" size={16} color={COLORS.textLight} />
                  </TouchableOpacity>
                ) : null}
              </View>
              <Ionicons name="arrow-forward" size={16} color={COLORS.textLight} style={styles.dateArrow} />
              {/* To date button */}
              <View style={styles.dateInputWrap}>
                <Text style={styles.dateLabel}>ထိ ရက်စွဲ</Text>
                <TouchableOpacity
                  style={styles.datePressable}
                  onPress={() => setShowToPicker(true)}
                >
                  <Ionicons name="calendar-outline" size={15} color={COLORS.primary} />
                  <Text style={[styles.datePressableText, !dateToInput && styles.datePressablePlaceholder]}>
                    {dateToInput || 'ရက်စွဲ ရွေးမည်'}
                  </Text>
                </TouchableOpacity>
                {dateToInput ? (
                  <TouchableOpacity style={styles.dateClearX} onPress={() => setDateToInput('')}>
                    <Ionicons name="close-circle" size={16} color={COLORS.textLight} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
            <View style={styles.dateFilterActions}>
              <TouchableOpacity style={styles.dateApplyBtn} onPress={handleApplyDateFilter}>
                <Ionicons name="search" size={14} color={COLORS.white} />
                <Text style={styles.dateApplyBtnText}>ရှာဖွေမည်</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dateClearBtn} onPress={handleClearDateFilter}>
                <Ionicons name="close" size={14} color={COLORS.textSecondary} />
                <Text style={styles.dateClearBtnText}>ဖျက်မည်</Text>
              </TouchableOpacity>
            </View>
            {hasActiveDateFilter && (
              <View style={styles.dateActiveIndicator}>
                <Ionicons name="checkmark-circle" size={13} color={COLORS.primary} />
                <Text style={styles.dateActiveText}>
                  {dateFrom && dateTo
                    ? `${dateFrom} မှ ${dateTo} ထိ`
                    : dateFrom
                    ? `${dateFrom} မှ`
                    : `${dateTo} ထိ`}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Calendar Pickers */}
        <CalendarPicker
          visible={showFromPicker}
          value={dateFromInput}
          title="မှ ရက်စွဲ ရွေးချယ်ပါ"
          maxDate={dateToInput || undefined}
          onConfirm={(d) => { setDateFromInput(d); setShowFromPicker(false); }}
          onCancel={() => setShowFromPicker(false)}
        />
        <CalendarPicker
          visible={showToPicker}
          value={dateToInput}
          title="ထိ ရက်စွဲ ရွေးချယ်ပါ"
          minDate={dateFromInput || undefined}
          onConfirm={(d) => { setDateToInput(d); setShowToPicker(false); }}
          onCancel={() => setShowToPicker(false)}
        />

        {/* List */}
        {isLoading ? (
          <ActivityIndicator style={styles.loader} size="large" color={COLORS.primary} />
        ) : (
          <FlatList
            data={summaries}
            keyExtractor={(item) => item.date}
            renderItem={({ item }) => <DaySummaryCard summary={item} />}
            contentContainerStyle={[styles.list, summaries.length === 0 && styles.listEmpty]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isFetching && !isLoading}
                onRefresh={() => refetch()}
                tintColor={COLORS.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="calendar-outline" size={48} color={COLORS.primary} />
                </View>
                <Text style={styles.emptyTitle}>မှတ်တမ်း မတွေ့ပါ</Text>
                <Text style={styles.emptySub}>
                  {hasActiveDateFilter
                    ? 'ရွေးချယ်ထားသော ကာလအတွင်း မှတ်တမ်း မရှိပါ'
                    : 'ပါဆယ် မှတ်တမ်းများ မရှိသေးပါ'}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

function DaySummaryCard({ summary }: { summary: DailySummary }) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/daily-summary/${summary.date}`)}
      activeOpacity={0.85}
    >
      {/* Date Header */}
      <View style={styles.cardHeader}>
        <View style={styles.dateRow}>
          <View style={styles.dateIcon}>
            <Ionicons name="calendar" size={16} color={COLORS.primary} />
          </View>
          <Text style={styles.dateText}>{formatDate(summary.date)}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
      </View>

      <View style={styles.divider} />

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Ionicons name="cube-outline" size={16} color={COLORS.primary} />
          <Text style={styles.statValue}>{summary.parcel_count.toLocaleString()}</Text>
          <Text style={styles.statLabel}>ပါဆယ် ခု</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="people-outline" size={16} color={COLORS.info} />
          <Text style={[styles.statValue, { color: COLORS.info }]}>{summary.customer_count.toLocaleString()}</Text>
          <Text style={styles.statLabel}>ဖောက်သည် ဦး</Text>
        </View>
        {summary.income_mmk > 0 && (
          <>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="cash-outline" size={16} color={COLORS.success} />
              <Text style={[styles.statValue, { color: COLORS.success }]}>
                {summary.income_mmk.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>MMK</Text>
            </View>
          </>
        )}
        {summary.income_thb > 0 && (
          <>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="cash-outline" size={16} color={COLORS.warning} />
              <Text style={[styles.statValue, { color: COLORS.warning }]}>
                {summary.income_thb.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>THB</Text>
            </View>
          </>
        )}
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
    fontFamily: FONTS.bold,
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
    fontFamily: FONTS.regular,
  },
  calendarBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  calendarBtnActive: {
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.white,
  },

  // Date Filter
  dateFilterBox: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  dateFilterRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  dateInputWrap: { flex: 1 },
  dateLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
    fontFamily: FONTS.semiBold,
  },
  datePressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  datePressableText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text,
    flex: 1,
    fontFamily: FONTS.regular,
  },
  datePressablePlaceholder: { color: COLORS.textLight },
  dateClearX: {
    position: 'absolute',
    right: 8,
    top: '50%' as any,
    marginTop: -8,
  },
  dateArrow: { marginBottom: 10 },
  dateFilterActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  dateApplyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 9,
  },
  dateApplyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
    fontFamily: FONTS.bold,
  },
  dateClearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  dateClearBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    fontFamily: FONTS.semiBold,
  },
  dateActiveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    backgroundColor: COLORS.primary + '12',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  dateActiveText: {
    fontSize: 12,
    color: COLORS.primary,
    fontFamily: FONTS.regular,
  },

  loader: { marginTop: 60 },
  list: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 24, gap: 10 },
  listEmpty: { flex: 1, justifyContent: 'center' },

  // Card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  dateIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFF3DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    fontFamily: FONTS.bold,
  },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 10 },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: COLORS.border,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
    fontFamily: FONTS.bold,
    marginTop: 2,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
  },

  // Empty state
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF3DC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: FONTS.bold,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
