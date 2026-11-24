import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { parcelService } from '../services/parcelService';
import type { DailySummary as DailySummaryType, MonthlySummary } from '../services/parcelService';
import { STATUS_COLORS, formatMMDate } from '../constants';
import {
  Calendar,
  CalendarDays,
  X,
  ChevronRight,
  Package,
  FileText,
} from 'lucide-react';

const MM_MONTHS = [
  'ဇန်နဝါရီ', 'ဖေဖော်ဝါရီ', 'မတ်', 'ဧပြီ', 'မေ', 'ဇွန်',
  'ဇူလိုင်', 'သြဂုတ်', 'စက်တင်ဘာ', 'အောက်တိုဘာ', 'နိုဝင်ဘာ', 'ဒီဇင်ဘာ',
];

export default function DailySummary() {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialView = searchParams.get('view') === 'month' ? 'month' : 'day';
  const [viewMode, setViewMode] = useState<'day' | 'month'>(initialView);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFromInput, setDateFromInput] = useState(searchParams.get('date_from') ?? '');
  const [dateToInput, setDateToInput] = useState(searchParams.get('date_to') ?? '');
  const [dateFrom, setDateFrom] = useState(searchParams.get('date_from') ?? '');
  const [dateTo, setDateTo] = useState(searchParams.get('date_to') ?? '');

  const hasActiveDateFilter = Boolean(dateFrom || dateTo);

  const dailyQuery = useQuery({
    queryKey: ['daily-summary', dateFrom, dateTo],
    queryFn: () => parcelService.dailySummary(dateFrom || undefined, dateTo || undefined),
    enabled: viewMode === 'day',
  });

  const monthlyQuery = useQuery({
    queryKey: ['monthly-summary', dateFrom, dateTo],
    queryFn: () => parcelService.monthlySummary(dateFrom || undefined, dateTo || undefined),
    enabled: viewMode === 'month',
  });

  const dailySummaries = (dailyQuery.data ?? []) as DailySummaryType[];
  const monthlyGroups = useMemo(() => {
    return ((monthlyQuery.data ?? []) as MonthlySummary[])
      .map((s) => {
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
      })
      .sort((a, b) => (a.key < b.key ? 1 : -1));
  }, [monthlyQuery.data]);

  const isLoading = viewMode === 'day' ? dailyQuery.isLoading : monthlyQuery.isLoading;
  const itemCount = viewMode === 'day' ? dailySummaries.length : monthlyGroups.length;

  function applyFilter() {
    setDateFrom(dateFromInput);
    setDateTo(dateToInput);
    setShowDateFilter(false);
  }

  function clearFilter() {
    setDateFromInput('');
    setDateToInput('');
    setDateFrom('');
    setDateTo('');
    setShowDateFilter(false);
  }

  return (
    <div className="p-3.5 sm:p-6 space-y-3.5 max-w-4xl mx-auto pb-28 md:pb-8">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-ink">မှတ်တမ်း</h1>
          <p className="text-xs text-ink-2">
            {itemCount} {viewMode === 'day' ? 'ရက်' : 'လ'} မှတ်တမ်း
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Day / Month Segmented control */}
          <div className="flex rounded-xl border border-line bg-muted/40 p-0.5">
            <button
              onClick={() => {
                setViewMode('day');
                clearFilter();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'day'
                  ? 'bg-surface text-brand shadow-sm'
                  : 'text-ink-2 hover:text-ink'
              }`}
            >
              နေ့စဉ်
            </button>
            <button
              onClick={() => {
                setViewMode('month');
                clearFilter();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'month'
                  ? 'bg-surface text-brand shadow-sm'
                  : 'text-ink-2 hover:text-ink'
              }`}
            >
              လစဉ်
            </button>
          </div>

          <button
            onClick={() => setShowDateFilter((v) => !v)}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center transition active:scale-95 ${
              hasActiveDateFilter
                ? 'bg-brand text-white border-brand shadow-sm'
                : 'border-line bg-surface text-ink hover:bg-muted'
            }`}
          >
            <Calendar className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Date Filter Sheet */}
      {showDateFilter && (
        <div className="card p-3.5 space-y-3 bg-muted/40 animate-fade-in">
          <div className="flex items-center justify-between text-xs font-bold text-ink">
            <span>ရက်စွဲ စစ်ထုတ်ရန်</span>
            <button onClick={() => setShowDateFilter(false)} className="text-ink-3">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">မှ ရက်စွဲ</label>
              <input
                type="date"
                className="field text-xs"
                value={dateFromInput}
                onChange={(e) => setDateFromInput(e.target.value)}
              />
            </div>
            <div>
              <label className="label">ထိ ရက်စွဲ</label>
              <input
                type="date"
                className="field text-xs"
                value={dateToInput}
                onChange={(e) => setDateToInput(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={applyFilter}
              className="flex-1 bg-brand text-white py-2 rounded-xl font-bold text-xs shadow-sm active:scale-95 transition"
            >
              ရှာဖွေမည်
            </button>
            <button
              onClick={clearFilter}
              className="px-4 border border-line rounded-xl text-xs font-semibold hover:bg-muted active:scale-95 transition"
            >
              ဖျက်မည်
            </button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-4 h-28 bg-muted animate-pulse" />
          ))}
        </div>
      ) : viewMode === 'day' ? (
        <div className="space-y-2.5">
          {dailySummaries.map((s) => (
            <button
              key={s.date}
              onClick={() => navigate(`/daily-summary/${s.date}`)}
              className="card w-full p-3.5 text-left hover:border-brand/40 active:scale-[0.99] transition space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-brand-bg text-brand flex items-center justify-center font-bold">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm text-ink">{formatMMDate(s.date)}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-3" />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center border-t border-line/60 pt-2 text-xs">
                <div>
                  <div className="text-base font-black text-ink">{s.parcel_count}</div>
                  <div className="text-[10px] text-ink-3">ပါဆယ် ခု</div>
                </div>
                <div>
                  <div className="text-base font-black text-ink">{s.sender_count}</div>
                  <div className="text-[10px] text-ink-3">ပို့သူ ဦး</div>
                </div>
                <div>
                  <div className="text-base font-black text-blue-600 dark:text-blue-400">
                    {s.recipient_count}
                  </div>
                  <div className="text-[10px] text-ink-3">လက်ခံသူ ဦး</div>
                </div>
              </div>

              {/* Status details strip */}
              <div className="grid grid-cols-4 gap-1 text-center border-t border-line/40 pt-1.5 text-[10px]">
                <div>
                  <span className="font-bold text-ink">{s.received_count ?? 0}</span> လက်ခံ
                </div>
                <div>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {s.in_transit_count ?? 0}
                  </span>{' '}
                  ဆောင်ရွက်ဆဲ
                </div>
                <div>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {s.delivered_count ?? 0}
                  </span>{' '}
                  ပို့ပြီး
                </div>
                <div>
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    {s.failed_count ?? 0}
                  </span>{' '}
                  မအောင်မြင်
                </div>
              </div>
            </button>
          ))}

          {dailySummaries.length === 0 && (
            <div className="card p-8 text-center text-ink-3 text-xs">မှတ်တမ်း မတွေ့ပါ</div>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {monthlyGroups.map((g: any) => (
            <button
              key={g.key}
              onClick={() => navigate(`/monthly-summary/${g.key}`)}
              className="card w-full p-3.5 text-left hover:border-brand/40 active:scale-[0.99] transition space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-brand-bg text-brand flex items-center justify-center font-bold">
                    <CalendarDays className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-ink">
                      {MM_MONTHS[g.month]} {g.year}
                    </span>
                    <span className="text-[10px] text-ink-3 ml-2">({g.day_count} ရက်)</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-3" />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center border-t border-line/60 pt-2 text-xs">
                <div>
                  <div className="text-base font-black text-ink">{g.parcel_count}</div>
                  <div className="text-[10px] text-ink-3">ပါဆယ် ခု</div>
                </div>
                <div>
                  <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
                    {g.delivered_count}
                  </div>
                  <div className="text-[10px] text-ink-3">ပို့ပြီး</div>
                </div>
                <div>
                  <div className="text-base font-black text-rose-600 dark:text-rose-400">
                    {g.failed_count}
                  </div>
                  <div className="text-[10px] text-ink-3">မအောင်မြင်</div>
                </div>
              </div>
            </button>
          ))}

          {monthlyGroups.length === 0 && (
            <div className="card p-8 text-center text-ink-3 text-xs">မှတ်တမ်း မတွေ့ပါ</div>
          )}
        </div>
      )}
    </div>
  );
}
