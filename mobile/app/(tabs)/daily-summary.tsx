import { useTheme } from '../../src/context/ThemeContext';
import React, { useState, useMemo } from 'react';
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
import { router, useLocalSearchParams } from 'expo-router';
import { parcelService, DailySummary, MonthlySummary } from '../../src/services/parcelService';
import { COLORS, FONTS, STATUS_COLORS } from '../../src/constants';

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

const MONTHS_MM = [
  'ဇန်နဝါရီ', 'ဖေဖော်ဝါရီ', 'မတ်', 'ဧပြီ', 'မေ', 'ဇွန်',
  'ဇူလိုင်', 'သြဂုတ်', 'စက်တင်ဘာ', 'အောက်တိုဘာ', 'နိုဝင်ဘာ', 'ဒီဇင်ဘာ',
];

export default function DailySummaryScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');

  const [showDateFilter, setShowDateFilter] = useState(false);
  const params = useLocalSearchParams<{ date_from?: string; date_to?: string }>();
  const [dateFromInput, setDateFromInput] = useState(params.date_from ?? '');
  const [dateToInput, setDateToInput] = useState(params.date_to ?? '');
  const [dateFrom, setDateFrom] = useState(params.date_from ?? '');
  const [dateTo, setDateTo] = useState(params.date_to ?? '');
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

  const handleSwitchMode = (mode: 'day' | 'month') => {
    setViewMode(mode);
    // Reset date filter when switching modes
    handleClearDateFilter();
    setShowDateFilter(false);
  };

  // Daily summary query
  const dailyQuery = useQuery({
    queryKey: ['daily-summary', dateFrom, dateTo],
    queryFn: () => parcelService.dailySummary(dateFrom || undefined, dateTo || undefined),
    enabled: viewMode === 'day',
  });

  // Monthly summary query
  const monthlyQuery = useQuery({
    queryKey: ['monthly-summary', dateFrom, dateTo],
    queryFn: () => parcelService.monthlySummary(dateFrom || undefined, dateTo || undefined),
    enabled: viewMode === 'month',
  });

  const dailySummaries = dailyQuery.data ?? [];

  const monthlyGroups = useMemo(() => {
    return ((monthlyQuery.data ?? []) as MonthlySummary[]).map((s) => {
      const [y, m] = s.month.split('-');
      return {
        key: s.month,
        year: Number(y),
        month: Number(m) - 1,
        parcel_count: s.parcel_count,
        sender_count: s.sender_count,
        recipient_count: s.recipient_count,
        received_count: s.received_count ?? 0,
        verified_count: s.verified_count ?? 0,
        in_transit_count: s.in_transit_count ?? 0,
        delivered_count: s.delivered_count ?? 0,
        failed_count: s.failed_count ?? 0,
        damaged_count: s.damaged_count ?? 0,
        fee_mmk: s.fee_mmk,
        fee_thb: s.fee_thb,
        cod_mmk: s.cod_mmk,
        cod_thb: s.cod_thb,
        day_count: s.day_count,
      };
    }).sort((a, b) => (a.key < b.key ? 1 : -1));
  }, [monthlyQuery.data]);

  const isLoading = viewMode === 'day' ? dailyQuery.isLoading : monthlyQuery.isLoading;
  const isFetching = viewMode === 'day' ? dailyQuery.isFetching : monthlyQuery.isFetching;
  const refetch = viewMode === 'day' ? dailyQuery.refetch : monthlyQuery.refetch;

  const itemCount = viewMode === 'day' ? dailySummaries.length : monthlyGroups.length;
  const countLabel = viewMode === 'day'
    ? `${itemCount} ရက် မှတ်တမ်း`
    : `${itemCount} လ မှတ်တမ်း`;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.navigate('/(tabs)/more')}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>မှတ်တမ်း</Text>
            {itemCount > 0 && (
              <Text style={styles.headerSub}>{countLabel}</Text>
            )}
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {/* Day/Month toggle pills */}
          <View style={styles.togglePill}>
            <TouchableOpacity
              style={[styles.togglePillBtn, viewMode === 'day' && styles.togglePillBtnActive]}
              onPress={() => handleSwitchMode('day')}
              activeOpacity={0.8}
            >
              <Text style={[styles.togglePillText, viewMode === 'day' && styles.togglePillTextActive]}>နေ့စဉ်</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.togglePillBtn, viewMode === 'month' && styles.togglePillBtnActive]}
              onPress={() => handleSwitchMode('month')}
              activeOpacity={0.8}
            >
              <Text style={[styles.togglePillText, viewMode === 'month' && styles.togglePillTextActive]}>လစဉ်</Text>
            </TouchableOpacity>
          </View>

          {hasActiveDateFilter && (
            <TouchableOpacity
              style={styles.clearFilterBtn}
              onPress={() => {
                handleClearDateFilter();
                setShowDateFilter(false);
              }}
            >
              <Ionicons name="close-circle" size={20} color={COLORS.error} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.calendarBtn, hasActiveDateFilter && styles.calendarBtnActive]}
            onPress={() => setShowDateFilter((v) => !v)}
          >
            <Ionicons
              name="calendar-outline"
              size={20}
              color={hasActiveDateFilter ? COLORS.white : COLORS.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.contentArea}>
        {/* Date Range Filter (collapsible) */}
        {showDateFilter && (
          <View style={styles.dateFilterBox}>
            <View style={styles.dateFilterRow}>
              {/* From date */}
              <View style={styles.dateInputWrap}>
                <Text style={styles.dateLabel}>မှ ရက်စွဲ</Text>
                <TouchableOpacity
                  style={styles.datePressable}
                  onPress={() => setShowFromPicker(true)}
                >
                  <Text
                    style={[
                      styles.datePressableText,
                      !dateFromInput && styles.datePressablePlaceholder,
                    ]}
                  >
                    {dateFromInput || 'ရက်စွဲ ရွေးမည်'}
                  </Text>
                </TouchableOpacity>
                {dateFromInput ? (
                  <TouchableOpacity
                    style={styles.dateClearX}
                    onPress={() => setDateFromInput('')}
                  >
                    <Ionicons name="close-circle" size={16} color={COLORS.textLight} />
                  </TouchableOpacity>
                ) : null}
              </View>

              <Text style={styles.dateArrow}>→</Text>

              {/* To date */}
              <View style={styles.dateInputWrap}>
                <Text style={styles.dateLabel}>ထိ ရက်စွဲ</Text>
                <TouchableOpacity
                  style={styles.datePressable}
                  onPress={() => setShowToPicker(true)}
                >
                  <Text
                    style={[
                      styles.datePressableText,
                      !dateToInput && styles.datePressablePlaceholder,
                    ]}
                  >
                    {dateToInput || 'ရက်စွဲ ရွေးမည်'}
                  </Text>
                </TouchableOpacity>
                {dateToInput ? (
                  <TouchableOpacity
                    style={styles.dateClearX}
                    onPress={() => setDateToInput('')}
                  >
                    <Ionicons name="close-circle" size={16} color={COLORS.textLight} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            <View style={styles.dateFilterActions}>
              <TouchableOpacity style={styles.dateApplyBtn} onPress={handleApplyDateFilter}>
                <Text style={styles.dateApplyBtnText}>ရှာဖွေမည်</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dateClearBtn} onPress={handleClearDateFilter}>
                <Text style={styles.dateClearBtnText}>ဖျက်မည်</Text>
              </TouchableOpacity>
            </View>

            {hasActiveDateFilter && (
              <View style={styles.dateActiveIndicator}>
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
          onConfirm={(d) => {
            setDateFromInput(d);
            setShowFromPicker(false);
          }}
          onCancel={() => setShowFromPicker(false)}
        />
        <CalendarPicker
          visible={showToPicker}
          value={dateToInput}
          title="ထိ ရက်စွဲ ရွေးချယ်ပါ"
          minDate={dateFromInput || undefined}
          onConfirm={(d) => {
            setDateToInput(d);
            setShowToPicker(false);
          }}
          onCancel={() => setShowToPicker(false)}
        />

        {/* List */}
        {isLoading ? (
          <ActivityIndicator style={styles.loader} size="large" color={COLORS.primary} />
        ) : viewMode === 'day' ? (
          <FlatList
            data={dailySummaries}
            keyExtractor={(item) => item.date}
            renderItem={({ item }) => <DaySummaryCard summary={item} />}
            contentContainerStyle={[styles.list, dailySummaries.length === 0 && styles.listEmpty]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isFetching && !isLoading}
                onRefresh={() => { refetch(); }}
                tintColor={COLORS.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>မှတ်တမ်း မတွေ့ပါ</Text>
                <Text style={styles.emptySub}>
                  {hasActiveDateFilter
                    ? 'ရွေးချယ်ထားသော ကာလအတွင်း မှတ်တမ်း မရှိပါ'
                    : 'ပါဆယ် မှတ်တမ်းများ မရှိသေးပါ'}
                </Text>
              </View>
            }
          />
        ) : (
          <FlatList
            data={monthlyGroups}
            keyExtractor={(item) => item.key}
            renderItem={({ item }) => (
              <MonthSummaryCard
                group={item}
                onPress={() => router.push(`/monthly-summary/${item.key}`)}
              />
            )}
            contentContainerStyle={[styles.list, monthlyGroups.length === 0 && styles.listEmpty]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isFetching && !isLoading}
                onRefresh={() => { refetch(); }}
                tintColor={COLORS.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
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
  const feeStats: { value: number; label: string; color: string }[] = [];
  if (summary.fee_mmk > 0) {
    feeStats.push({ value: summary.fee_mmk, label: 'ပို့ဆောင်ခ (K)', color: COLORS.success });
  }
  if (summary.cod_mmk > 0) {
    feeStats.push({ value: summary.cod_mmk, label: 'COD (K)', color: COLORS.warning });
  }
  if (summary.fee_thb > 0) {
    feeStats.push({ value: summary.fee_thb, label: 'ပို့ဆောင်ခ (฿)', color: COLORS.success });
  }
  if (summary.cod_thb > 0) {
    feeStats.push({ value: summary.cod_thb, label: 'COD (฿)', color: COLORS.warning });
  }

  return (
    <TouchableOpacity
      style={[styles.card, (summary.parcel_count > 0 && summary.delivered_count === summary.parcel_count) && styles.cardHighlighted]}
      onPress={() => router.push(`/daily-summary/${summary.date}`)}
      activeOpacity={0.85}
    >
      {/* Date header */}
      <View style={styles.cardHeader}>
        <View style={styles.dateIconWrap}>
          <Ionicons name="calendar" size={16} color={COLORS.primary} />
        </View>
        <Text style={styles.dateText}>{formatDate(summary.date)}</Text>
        <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
      </View>

      <View style={styles.divider} />

      {/* Primary stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{summary.parcel_count.toLocaleString()}</Text>
          <Text style={styles.statLabel}>ပါဆယ် ခု</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{summary.sender_count.toLocaleString()}</Text>
          <Text style={styles.statLabel}>ပို့သူ ဦး</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: COLORS.info }]}>{summary.recipient_count.toLocaleString()}</Text>
          <Text style={styles.statLabel}>လက်ခံသူ ဦး</Text>
        </View>
      </View>

      {/* Status counts */}
      <View style={styles.rowDivider} />
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: STATUS_COLORS.RECEIVED || COLORS.text }]}>{(summary.received_count ?? 0).toLocaleString()}</Text>
          <Text style={styles.statLabel}>လက်ခံ</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: STATUS_COLORS.VERIFIED || COLORS.text }]}>{(summary.verified_count ?? 0).toLocaleString()}</Text>
          <Text style={styles.statLabel}>စစ်ဆေးပြီး</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: STATUS_COLORS.IN_TRANSIT || COLORS.text }]}>{(summary.in_transit_count ?? 0).toLocaleString()}</Text>
          <Text style={styles.statLabel}>ဆောင်ရွက်နေဆဲ</Text>
        </View>
      </View>
      <View style={styles.rowDivider} />
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: STATUS_COLORS.DELIVERED || COLORS.text }]}>{(summary.delivered_count ?? 0).toLocaleString()}</Text>
          <Text style={styles.statLabel}>ပို့ဆောင်ပြီး</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: STATUS_COLORS.FAILED || COLORS.text }]}>{(summary.failed_count ?? 0).toLocaleString()}</Text>
          <Text style={styles.statLabel}>မအောင်မြင်</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: STATUS_COLORS.DAMAGED || COLORS.text }]}>{(summary.damaged_count ?? 0).toLocaleString()}</Text>
          <Text style={styles.statLabel}>ပျက်ဆီး</Text>
        </View>
      </View>

      {/* Fee / COD stats */}
      {feeStats.length > 0 && (
        <>
          <View style={styles.rowDivider} />
          <View style={styles.statsRow}>
            {feeStats.map((stat, index) => (
              <React.Fragment key={stat.label}>
                {index > 0 && <View style={styles.statDivider} />}
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: stat.color }]}>
                    {stat.value.toLocaleString()}
                  </Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </>
      )}
    </TouchableOpacity>
  );
}

function MonthSummaryCard({ group, onPress }: { group: {
  key: string; year: number; month: number; parcel_count: number; sender_count: number;
  recipient_count: number; received_count: number; verified_count: number; in_transit_count: number;
  delivered_count: number; failed_count: number; damaged_count: number;
  fee_mmk: number; fee_thb: number; cod_mmk: number; cod_thb: number; day_count: number;
}; onPress: () => void }) {
  const feeStats: { value: number; label: string; color: string }[] = [];
  if (group.fee_mmk > 0) feeStats.push({ value: group.fee_mmk, label: 'ပို့ဆောင်ခ (K)', color: COLORS.success });
  if (group.cod_mmk > 0) feeStats.push({ value: group.cod_mmk, label: 'COD (K)', color: COLORS.warning });
  if (group.fee_thb > 0) feeStats.push({ value: group.fee_thb, label: 'ပို့ဆောင်ခ (฿)', color: COLORS.success });
  if (group.cod_thb > 0) feeStats.push({ value: group.cod_thb, label: 'COD (฿)', color: COLORS.warning });

  return (
    <TouchableOpacity
      style={[styles.card, (group.parcel_count > 0 && group.delivered_count === group.parcel_count) && styles.cardHighlighted]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.cardHeader}>
        <View style={styles.dateIconWrap}>
          <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
        </View>
        <Text style={styles.dateText}>{MONTHS_MM[group.month]} {group.year}</Text>
        <View style={styles.monthBadge}>
          <Text style={styles.monthDayCount}>{group.day_count} ရက်</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
      </View>
      <View style={styles.divider} />
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{group.parcel_count.toLocaleString()}</Text>
          <Text style={styles.statLabel}>ပါဆယ် ခု</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{group.sender_count.toLocaleString()}</Text>
          <Text style={styles.statLabel}>ပို့သူ ဦး</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: COLORS.info }]}>{group.recipient_count.toLocaleString()}</Text>
          <Text style={styles.statLabel}>လက်ခံသူ ဦး</Text>
        </View>
      </View>

      {/* Status counts */}
      <View style={styles.rowDivider} />
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: STATUS_COLORS.RECEIVED || COLORS.text }]}>{(group.received_count ?? 0).toLocaleString()}</Text>
          <Text style={styles.statLabel}>လက်ခံ</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: STATUS_COLORS.VERIFIED || COLORS.text }]}>{(group.verified_count ?? 0).toLocaleString()}</Text>
          <Text style={styles.statLabel}>စစ်ဆေးပြီး</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: STATUS_COLORS.IN_TRANSIT || COLORS.text }]}>{(group.in_transit_count ?? 0).toLocaleString()}</Text>
          <Text style={styles.statLabel}>ဆောင်ရွက်နေဆဲ</Text>
        </View>
      </View>
      <View style={styles.rowDivider} />
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: STATUS_COLORS.DELIVERED || COLORS.text }]}>{(group.delivered_count ?? 0).toLocaleString()}</Text>
          <Text style={styles.statLabel}>ပို့ဆောင်ပြီး</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: STATUS_COLORS.FAILED || COLORS.text }]}>{(group.failed_count ?? 0).toLocaleString()}</Text>
          <Text style={styles.statLabel}>မအောင်မြင်</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: STATUS_COLORS.DAMAGED || COLORS.text }]}>{(group.damaged_count ?? 0).toLocaleString()}</Text>
          <Text style={styles.statLabel}>ပျက်ဆီး</Text>
        </View>
      </View>

      {feeStats.length > 0 && (
        <>
          <View style={styles.rowDivider} />
          <View style={styles.statsRow}>
            {feeStats.map((stat, index) => (
              <React.Fragment key={stat.label}>
                {index > 0 && <View style={styles.statDivider} />}
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: stat.color }]}>{stat.value.toLocaleString()}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  contentArea: { flex: 1, backgroundColor: COLORS.background, },

  // Header
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
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.white,
    fontFamily: FONTS.bold,
  },
  headerSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
    fontFamily: FONTS.regular,
  },

  // Toggle pill
  togglePill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 6,
    padding: 3,
    gap: 2,
  },
  togglePillBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  togglePillBtnActive: {
    backgroundColor: COLORS.white,
  },
  togglePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    fontFamily: FONTS.semiBold,
  },
  togglePillTextActive: {
    color: COLORS.primary,
  },

  calendarBtn: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarBtnActive: {
    backgroundColor: COLORS.white,
  },
  clearFilterBtn: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Date filter
  dateFilterBox: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: COLORS.white,
    borderRadius: 6,
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
  dateInputWrap: {
    flex: 1,
  },
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
    borderRadius: 6,
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
  datePressablePlaceholder: {
    color: COLORS.textLight,
  },
  dateClearX: {
    position: 'absolute',
    right: 8,
    top: '50%' as any,
  },
  dateArrow: {
    marginBottom: 10,
    fontSize: 16,
    color: COLORS.textLight,
    fontWeight: '600',
  },
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
    borderRadius: 6,
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
    borderRadius: 6,
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
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  dateActiveText: {
    fontSize: 12,
    color: COLORS.primary,
    fontFamily: FONTS.regular,
  },

  loader: { marginTop: 60 },
  list: { minHeight: 180, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, gap: 10 },
  listEmpty: { flex: 1, justifyContent: 'center' },

  // Card
  card: { minHeight: 80, minWidth: 120,
    backgroundColor: COLORS.white,
    borderRadius: 6,
    padding: 14,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: COLORS.primaryBg,
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
  monthBadge: {
    marginLeft: 'auto' as any,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: COLORS.background,
  },
  monthDayCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
  },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 10 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
    fontFamily: FONTS.bold,
    marginTop: 2,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: COLORS.border,
  },
  rowDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 10,
  },

  // Empty
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
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
