import React, { useState } from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { deliveryService, Assignment } from '../services/deliveryService';
import { STATUS_LABELS_MM, STATUS_COLORS } from '../constants';
import { toMMDate, formatPeriodLabel } from '../lib/utils';

const STATUS_FILTERS = [
  { label: 'အားလုံး', value: '' },
  { label: 'ပြီးစီး', value: 'COMPLETED' },
  { label: 'မအောင်မြင်', value: 'FAILED' },
];

export default function Deliveries() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const isStaff = user?.role === 'delivery_staff';
  const staffId = isStaff ? user?.id : undefined;

  const [groupBy, setGroupBy] = useState<'day' | 'month'>('day');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [view, setView] = useState<'summary' | 'list'>('summary');
  const [selected, setSelected] = useState<{ from: string; to: string; label: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const hasDateFilter = !!(dateFrom || dateTo);

  const { data: summaryData, isLoading: summaryLoading, isFetching: summaryFetching, refetch: refetchSummary } = useQuery({
    queryKey: ['delivery-summary', groupBy, dateFrom, dateTo, staffId],
    queryFn: () => deliveryService.summary({ group_by: groupBy, date_from: dateFrom || undefined, date_to: dateTo || undefined, staff_id: staffId }),
    enabled: view === 'summary',
  });

  const summaries = summaryData ?? [];
  const todayStr = toMMDate(new Date().toISOString());
  const displaySummaries = groupBy === 'day'
    ? (summaries.some((s: any) => s.period === todayStr)
        ? summaries
        : [{ period: todayStr, date_from: todayStr, date_to: todayStr, total_count: 0, completed_count: 0, failed_count: 0, in_transit_count: 0 }, ...summaries])
    : summaries;

  const { data: listData, isLoading: listLoading, isFetching: listFetching, refetch: refetchList } = useQuery({
    queryKey: ['delivery-list', selected?.from, selected?.to, statusFilter, page, staffId],
    queryFn: () => deliveryService.allAssignments({
      staff_id: staffId,
      status: statusFilter || undefined,
      date_from: selected?.from,
      date_to: selected?.to,
      page,
      per_page: 20,
      finished_only: true,
    }),
    enabled: view === 'list' && !!selected,
  });

  const assignments = (listData?.data ?? []) as Assignment[];
  const meta = listData?.meta;

  const openPeriod = (s: any) => {
    setSelected({ from: s.date_from, to: s.date_to, label: formatPeriodLabel(s.period, groupBy) });
    setStatusFilter('');
    setPage(1);
    setView('list');
  };
  const backToSummary = () => { setView('summary'); setSelected(null); };

  if (view === 'list' && selected) {
    return (
      <div className="p-4 md:p-6 space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <h1 className="text-lg font-bold text-ink">{selected.label}</h1>
            <p className="text-xs text-ink-2">စုစုပေါင်း {meta?.total ?? 0} ခု</p>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUS_FILTERS.map((f) => (
            <button key={f.value} onClick={() => { setStatusFilter(f.value); setPage(1); }} className={`px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap border ${statusFilter === f.value ? 'bg-brand text-white border-brand' : 'bg-surface text-ink-2 border-line'}`}>
              {f.label}
            </button>
          ))}
        </div>

        {meta && ((meta.fee_mmk ?? 0) > 0 || (meta.cod_mmk ?? 0) > 0 || (meta.fee_thb ?? 0) > 0 || (meta.cod_thb ?? 0) > 0) && (
          <div className="card p-2 flex flex-wrap gap-3 justify-around text-center text-sm">
            {(meta.fee_mmk ?? 0) > 0 && <div><div className="font-bold text-ok">{meta.fee_mmk.toLocaleString()}</div><div className="text-xs text-ink-2">ပို့ဆောင်ခ (K)</div></div>}
            {(meta.cod_mmk ?? 0) > 0 && <div><div className="font-bold text-warn">{meta.cod_mmk.toLocaleString()}</div><div className="text-xs text-ink-2">COD (K)</div></div>}
            {(meta.fee_thb ?? 0) > 0 && <div><div className="font-bold text-ok">{meta.fee_thb.toLocaleString()}</div><div className="text-xs text-ink-2">ပို့ဆောင်ခ (฿)</div></div>}
            {(meta.cod_thb ?? 0) > 0 && <div><div className="font-bold text-warn">{meta.cod_thb.toLocaleString()}</div><div className="text-xs text-ink-2">COD (฿)</div></div>}
          </div>
        )}

        {listLoading ? (
          <div className="text-center py-10 text-ink-2">Loading...</div>
        ) : (
          <div className="space-y-2">
            {assignments.map((a) => <AssignmentCard key={a.id} assignment={a} />)}
            {assignments.length === 0 && <div className="text-center py-10 text-ink-3">ပို့ဆောင်မှု မတွေ့ပါ</div>}
          </div>
        )}

        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1.5 rounded border border-line disabled:opacity-40">နှုတ်</button>
            <span className="text-sm">{page} / {meta.last_page}</span>
            <button disabled={page >= meta.last_page} onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))} className="px-3 py-1.5 rounded border border-line disabled:opacity-40">နောက်</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">ပို့ဆောင်မှုများ</h1>
          <p className="text-sm text-ink-2">စုစုပေါင်း {summaries.reduce((s: number, x: any) => s + x.total_count, 0)} ခု</p>
        </div>
        <div className="flex rounded border border-line overflow-hidden">
          <button onClick={() => setGroupBy('day')} className={`px-3 py-1.5 text-xs font-semibold ${groupBy === 'day' ? 'bg-brand text-white' : 'bg-surface text-ink-2'}`}>နေ့စဉ်</button>
          <button onClick={() => setGroupBy('month')} className={`px-3 py-1.5 text-xs font-semibold ${groupBy === 'month' ? 'bg-brand text-white' : 'bg-surface text-ink-2'}`}>လစဉ်</button>
        </div>
      </div>

      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="label">မှ ရက်စွဲ</label>
          <input type="date" className="field" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="flex-1">
          <label className="label">ထိ ရက်စွဲ</label>
          <input type="date" className="field" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      {summaryLoading ? (
        <div className="text-center py-10 text-ink-2">Loading...</div>
      ) : (
        <div className="space-y-2">
          {displaySummaries.map((item: any) => {
            const isToday = item.period === todayStr && groupBy === 'day';
            const allDone = item.total_count > 0 && item.completed_count === item.total_count;
            const completionPct = item.total_count > 0 ? Math.round((item.completed_count / item.total_count) * 100) : 0;
            const feeStats: { value: number; label: string; color: string }[] = [];
            if ((item.fee_mmk ?? 0) > 0) feeStats.push({ value: item.fee_mmk, label: 'ပို့ဆောင်ခ (K)', color: '#16A34A' });
            if ((item.cod_mmk ?? 0) > 0) feeStats.push({ value: item.cod_mmk, label: 'COD (K)', color: '#D97706' });
            if ((item.fee_thb ?? 0) > 0) feeStats.push({ value: item.fee_thb, label: 'ပို့ဆောင်ခ (฿)', color: '#16A34A' });
            if ((item.cod_thb ?? 0) > 0) feeStats.push({ value: item.cod_thb, label: 'COD (฿)', color: '#D97706' });
            return (
              <button key={item.period} onClick={() => openPeriod(item)} className={`card w-full p-3 text-left hover:bg-muted ${allDone ? 'border-ok' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-8 h-8 rounded flex items-center justify-center text-xs ${isToday ? 'bg-brand text-white' : 'bg-brand-bg text-brand'}`}><CalendarIcon className="w-4 h-4" /></span>
                    <span className="font-bold text-ink">{isToday ? 'ဒီနေ့' : formatPeriodLabel(item.period, groupBy)}</span>
                  </div>
                  {isToday && <span className="text-xs bg-brand text-white px-2 py-0.5 rounded">Today</span>}
                  <span className="text-ink-3">›</span>
                </div>
                <div className="flex justify-around text-center border-t border-line pt-2">
                  <div><div className="font-bold text-ink">{item.total_count}</div><div className="text-xs text-ink-2">စုစုပေါင်း</div></div>
                  <div><div className="font-bold text-ok">{item.completed_count}</div><div className="text-xs text-ink-2">ပို့ဆောင်ပြီး</div></div>
                  <div><div className="font-bold text-bad">{item.failed_count}</div><div className="text-xs text-ink-2">မအောင်မြင်</div></div>
                </div>
                {item.total_count > 0 && (
                  <div className="mt-2">
                    <div className="h-1.5 bg-muted rounded overflow-hidden">
                      <div className="h-full bg-brand" style={{ width: `${completionPct}%` }} />
                    </div>
                    <div className="text-xs text-ink-3 text-right mt-0.5">{completionPct}%</div>
                  </div>
                )}
                {feeStats.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-line text-xs">
                    {feeStats.map((st) => (
                      <div key={st.label}><span className="font-bold" style={{ color: st.color }}>{st.value.toLocaleString()}</span> <span className="text-ink-3">{st.label}</span></div>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
          {displaySummaries.length === 0 && <div className="text-center py-10 text-ink-3">ပို့ဆောင်မှု မတွေ့ပါ</div>}
        </div>
      )}
    </div>
  );
}

function AssignmentCard({ assignment }: { assignment: Assignment }) {
  const navigate = useNavigate();
  const parcel = assignment.parcel;
  const parcelStatus = parcel?.status ?? '';
  const statusColor = STATUS_COLORS[parcelStatus] || '#6B7280';
  const statusLabel = STATUS_LABELS_MM[parcelStatus] || parcelStatus;
  const assignStatus = assignment.status ?? '';
  const isActive = !['COMPLETED', 'FAILED', 'REASSIGNED'].includes(assignStatus);
  const assignLabel = assignStatus === 'COMPLETED' ? 'ပြီးစီး' : assignStatus === 'FAILED' ? 'မအောင်မြင်' : assignStatus === 'REASSIGNED' ? 'ပြောင်းလဲ' : 'ဆောင်ရွက်ဆဲ';
  const assignColor = isActive ? '#F97316' : '#16A34A';

  return (
    <button onClick={() => navigate(`/deliveries/${assignment.id}`)} className="card w-full p-3 text-left hover:bg-muted">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-bold text-brand">{parcel?.tracking_number}</span>
        <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ color: statusColor, backgroundColor: statusColor + '18' }}>{statusLabel}</span>
      </div>
      <div className="text-sm text-ink truncate">{parcel?.recipient_name}</div>
      <div className="text-xs text-ink-3 flex items-center gap-1 truncate">
        <span>📍</span>{parcel?.delivery_address}
      </div>
      {assignment.staff && <div className="text-xs text-ink-3 mt-1">👤 {assignment.staff.name}</div>}
      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs px-2 py-0.5 rounded font-semibold" style={{ color: assignColor, backgroundColor: isActive ? '#FFF3DC' : '#E8F8EF' }}>{assignLabel}</span>
        {parcel && Number(parcel.delivery_fee) > 0 && (
          <span className="text-xs font-bold text-ink">{parcel.currency === 'THB' ? `${Number(parcel.delivery_fee).toLocaleString()} ฿` : `${Number(parcel.delivery_fee).toLocaleString()} K`}</span>
        )}
        {parcel?.is_cod && (
          <span className="text-xs bg-info-bg text-info px-2 py-0.5 rounded font-bold">COD {parcel.currency === 'THB' ? `${Number(parcel.cod_amount).toLocaleString()} ฿` : `${Number(parcel.cod_amount).toLocaleString()} K`}</span>
        )}
      </div>
      <div className="text-xs text-ink-3 mt-1 space-y-0.5">
        <div>ချိတ်ဆက်ရက်: {new Date(assignment.assigned_at).toLocaleString()}</div>
        {parcel?.status === 'DELIVERED' && (parcel?.delivered_at || parcel?.updated_at) && <div>ပို့ဆောင်ပြီးရက်: {new Date((parcel.delivered_at || parcel.updated_at)!).toLocaleString()}</div>}
        {parcel?.status === 'FAILED' && (parcel?.failed_at || parcel?.updated_at) && <div>မအောင်မြင်ရက်: {new Date((parcel.failed_at || parcel.updated_at)!).toLocaleString()}</div>}
      </div>
      {!isActive && null}
      {isActive && (
        <button onClick={(e) => { e.stopPropagation(); navigate(`/deliveries/${assignment.id}/attempt`); }} className="mt-2 w-full bg-brand text-white py-1.5 rounded text-xs font-bold">
          ရလဒ် မှတ်တမ်းတင်
        </button>
      )}
    </button>
  );
}