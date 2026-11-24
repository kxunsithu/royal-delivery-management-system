import React, { useState, useMemo } from 'react';
import { CalendarIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { parcelService } from '../services/parcelService';
import type { DailySummary, MonthlySummary } from '../services/parcelService';
import { STATUS_COLORS } from '../constants';
import { formatMMDate } from '../constants';

const MM_MONTHS = ['ဇန်နဝါရီ', 'ဖေဖော်ဝါရီ', 'မတ်', 'ဧပြီ', 'မေ', 'ဇွန်', 'ဇူလိုင်', 'သြဂုတ်', 'စက်တင်ဘာ', 'အောက်တိုဘာ', 'နိုဝင်ဘာ', 'ဒီဇင်ဘာ'];

export default function DailySummary() {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFromInput, setDateFromInput] = useState(searchParams.get('date_from') ?? '');
  const [dateToInput, setDateToInput] = useState(searchParams.get('date_to') ?? '');
  const [dateFrom, setDateFrom] = useState(searchParams.get('date_from') ?? '');
  const [dateTo, setDateTo] = useState(searchParams.get('date_to') ?? '');

  const hasActiveDateFilter = !!(dateFrom || dateTo);

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

  const dailySummaries = (dailyQuery.data ?? []) as DailySummary[];
  const monthlyGroups = useMemo(() => {
    return ((monthlyQuery.data ?? []) as MonthlySummary[]).map((s) => {
      const [y, m] = s.month.split('-');
      return { key: s.month, year: Number(y), month: Number(m) - 1, parcel_count: s.parcel_count, sender_count: s.sender_count, recipient_count: s.recipient_count, received_count: s.received_count ?? 0, verified_count: s.verified_count ?? 0, in_transit_count: s.in_transit_count ?? 0, delivered_count: s.delivered_count ?? 0, failed_count: s.failed_count ?? 0, damaged_count: s.damaged_count ?? 0, fee_mmk: s.fee_mmk, fee_thb: s.fee_thb, cod_mmk: s.cod_mmk, cod_thb: s.cod_thb, day_count: s.day_count };
    }).sort((a, b) => (a.key < b.key ? 1 : -1));
  }, [monthlyQuery.data]);

  const isLoading = viewMode === 'day' ? dailyQuery.isLoading : monthlyQuery.isLoading;
  const isFetching = viewMode === 'day' ? dailyQuery.isFetching : monthlyQuery.isFetching;
  const refetch = viewMode === 'day' ? dailyQuery.refetch : monthlyQuery.refetch;
  const itemCount = viewMode === 'day' ? dailySummaries.length : monthlyGroups.length;

  function applyFilter() { setDateFrom(dateFromInput); setDateTo(dateToInput); setShowDateFilter(false); }
  function clearFilter() { setDateFromInput(''); setDateToInput(''); setDateFrom(''); setDateTo(''); }

  return (
    <div className="p-4 md:p-6 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div>
            <h1 className="text-xl font-bold text-ink">မှတ်တမ်း</h1>
            {itemCount > 0 && <p className="text-sm text-ink-2">{itemCount} {viewMode === 'day' ? 'ရက်' : 'လ'} မှတ်တမ်း</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded border border-line overflow-hidden">
            <button onClick={() => { setViewMode('day'); clearFilter(); }} className={`px-3 py-1.5 text-xs font-semibold ${viewMode === 'day' ? 'bg-brand text-white' : 'bg-surface text-ink-2'}`}>နေ့စဉ်</button>
            <button onClick={() => { setViewMode('month'); clearFilter(); }} className={`px-3 py-1.5 text-xs font-semibold ${viewMode === 'month' ? 'bg-brand text-white' : 'bg-surface text-ink-2'}`}>လစဉ်</button>
          </div>
          {hasActiveDateFilter && <button onClick={clearFilter} className="text-bad"><XMarkIcon className="w-5 h-5" /></button>}
          <button onClick={() => setShowDateFilter((v) => !v)} className={`px-3 py-1.5 rounded border ${hasActiveDateFilter ? 'bg-brand text-white border-brand' : 'border-line bg-surface text-ink'}`}><CalendarIcon className="w-5 h-5" /></button>
        </div>
      </div>

      {showDateFilter && (
        <div className="card p-3 space-y-2">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="label">မှ ရက်စွဲ</label>
              <input type="date" className="field" value={dateFromInput} onChange={(e) => setDateFromInput(e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="label">ထိ ရက်စွဲ</label>
              <input type="date" className="field" value={dateToInput} onChange={(e) => setDateToInput(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={applyFilter} className="flex-1 bg-brand text-white py-2 rounded font-bold text-sm">ရှာဖွေမည်</button>
            <button onClick={clearFilter} className="px-4 border border-line rounded text-sm">ဖျက်မည်</button>
          </div>
          {hasActiveDateFilter && <div className="text-xs text-brand text-center">{dateFrom && dateTo ? `${dateFrom} မှ ${dateTo} ထိ` : dateFrom ? `${dateFrom} မှ` : `${dateTo} ထိ`}</div>}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-10 text-ink-2">Loading...</div>
      ) : viewMode === 'day' ? (
        <div className="space-y-2">
          {dailySummaries.map((s) => {
            const feeStats: { value: number; label: string; color: string }[] = [];
            if (s.fee_mmk > 0) feeStats.push({ value: s.fee_mmk, label: 'ပို့ဆောင်ခ (K)', color: '#16A34A' });
            if (s.cod_mmk > 0) feeStats.push({ value: s.cod_mmk, label: 'COD (K)', color: '#D97706' });
            if (s.fee_thb > 0) feeStats.push({ value: s.fee_thb, label: 'ပို့ဆောင်ခ (฿)', color: '#16A34A' });
            if (s.cod_thb > 0) feeStats.push({ value: s.cod_thb, label: 'COD (฿)', color: '#D97706' });
            return (
              <button key={s.date} onClick={() => navigate(`/daily-summary/${s.date}`)} className="card w-full p-3 text-left hover:bg-muted">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded bg-brand-bg text-brand flex items-center justify-center text-xs"><CalendarIcon className="w-4 h-4" /></span>
                    <span className="font-bold text-ink">{formatMMDate(s.date)}</span>
                  </div>
                  <span className="text-ink-3">›</span>
                </div>
                <div className="flex justify-around text-center border-t border-line pt-2">
                  <div><div className="font-bold text-ink">{s.parcel_count}</div><div className="text-xs text-ink-2">ပါဆယ် ခု</div></div>
                  <div><div className="font-bold text-ink">{s.sender_count}</div><div className="text-xs text-ink-2">ပို့သူ ဦး</div></div>
                  <div><div className="font-bold text-info">{s.recipient_count}</div><div className="text-xs text-ink-2">လက်ခံသူ ဦး</div></div>
                </div>
                <div className="flex justify-around text-center border-t border-line pt-2 mt-2">
                  <div><div className="font-bold" style={{ color: STATUS_COLORS.RECEIVED }}>{s.received_count ?? 0}</div><div className="text-xs text-ink-2">လက်ခံ</div></div>
                  <div><div className="font-bold" style={{ color: STATUS_COLORS.VERIFIED }}>{s.verified_count ?? 0}</div><div className="text-xs text-ink-2">စစ်ဆေးပြီး</div></div>
                  <div><div className="font-bold" style={{ color: STATUS_COLORS.IN_TRANSIT }}>{s.in_transit_count ?? 0}</div><div className="text-xs text-ink-2">ဆောင်ရွက်နေဆဲ</div></div>
                  <div><div className="font-bold" style={{ color: STATUS_COLORS.DELIVERED }}>{s.delivered_count ?? 0}</div><div className="text-xs text-ink-2">ပို့ဆောင်ပြီး</div></div>
                  <div><div className="font-bold" style={{ color: STATUS_COLORS.FAILED }}>{s.failed_count ?? 0}</div><div className="text-xs text-ink-2">မအောင်မြင်</div></div>
                  <div><div className="font-bold" style={{ color: STATUS_COLORS.DAMAGED }}>{s.damaged_count ?? 0}</div><div className="text-xs text-ink-2">ပျက်ဆီး</div></div>
                </div>
                {feeStats.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-line text-xs">
                    {feeStats.map((st) => <div key={st.label}><span className="font-bold" style={{ color: st.color }}>{st.value.toLocaleString()}</span> <span className="text-ink-3">{st.label}</span></div>)}
                  </div>
                )}
              </button>
            );
          })}
          {dailySummaries.length === 0 && <div className="text-center py-10 text-ink-3">မှတ်တမ်း မတွေ့ပါ</div>}
        </div>
      ) : (
        <div className="space-y-2">
          {monthlyGroups.map((g: any) => {
            const feeStats: { value: number; label: string; color: string }[] = [];
            if (g.fee_mmk > 0) feeStats.push({ value: g.fee_mmk, label: 'ပို့ဆောင်ခ (K)', color: '#16A34A' });
            if (g.cod_mmk > 0) feeStats.push({ value: g.cod_mmk, label: 'COD (K)', color: '#D97706' });
            if (g.fee_thb > 0) feeStats.push({ value: g.fee_thb, label: 'ပို့ဆောင်ခ (฿)', color: '#16A34A' });
            if (g.cod_thb > 0) feeStats.push({ value: g.cod_thb, label: 'COD (฿)', color: '#D97706' });
            return (
              <button key={g.key} onClick={() => navigate(`/monthly-summary/${g.key}`)} className="card w-full p-3 text-left hover:bg-muted">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded bg-brand-bg text-brand flex items-center justify-center text-xs"><CalendarIcon className="w-4 h-4" /></span>
                    <span className="font-bold text-ink">{MM_MONTHS[g.month]} {g.year}</span>
                  </div>
                  <span className="text-xs bg-muted px-2 py-0.5 rounded">{g.day_count} ရက်</span>
                </div>
                <div className="flex justify-around text-center border-t border-line pt-2">
                  <div><div className="font-bold text-ink">{g.parcel_count}</div><div className="text-xs text-ink-2">ပါဆယ် ခု</div></div>
                  <div><div className="font-bold text-ink">{g.sender_count}</div><div className="text-xs text-ink-2">ပို့သူ ဦး</div></div>
                  <div><div className="font-bold text-info">{g.recipient_count}</div><div className="text-xs text-ink-2">လက်ခံသူ ဦး</div></div>
                </div>
                <div className="flex justify-around text-center border-t border-line pt-2 mt-2">
                  <div><div className="font-bold" style={{ color: STATUS_COLORS.RECEIVED }}>{g.received_count ?? 0}</div><div className="text-xs text-ink-2">လက်ခံ</div></div>
                  <div><div className="font-bold" style={{ color: STATUS_COLORS.VERIFIED }}>{g.verified_count ?? 0}</div><div className="text-xs text-ink-2">စစ်ဆေးပြီး</div></div>
                  <div><div className="font-bold" style={{ color: STATUS_COLORS.IN_TRANSIT }}>{g.in_transit_count ?? 0}</div><div className="text-xs text-ink-2">ဆောင်ရွက်နေဆဲ</div></div>
                  <div><div className="font-bold" style={{ color: STATUS_COLORS.DELIVERED }}>{g.delivered_count ?? 0}</div><div className="text-xs text-ink-2">ပို့ဆောင်ပြီး</div></div>
                  <div><div className="font-bold" style={{ color: STATUS_COLORS.FAILED }}>{g.failed_count ?? 0}</div><div className="text-xs text-ink-2">မအောင်မြင်</div></div>
                  <div><div className="font-bold" style={{ color: STATUS_COLORS.DAMAGED }}>{g.damaged_count ?? 0}</div><div className="text-xs text-ink-2">ပျက်ဆီး</div></div>
                </div>
                {feeStats.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-line text-xs">
                    {feeStats.map((st) => <div key={st.label}><span className="font-bold" style={{ color: st.color }}>{st.value.toLocaleString()}</span> <span className="text-ink-3">{st.label}</span></div>)}
                  </div>
                )}
              </button>
            );
          })}
          {monthlyGroups.length === 0 && <div className="text-center py-10 text-ink-3">မှတ်တမ်း မတွေ့ပါ</div>}
        </div>
      )}
    </div>
  );
}