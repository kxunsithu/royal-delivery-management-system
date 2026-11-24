import React, { useState } from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { deliveryService, Assignment } from '../services/deliveryService';
import { STATUS_LABELS_MM, STATUS_COLORS } from '../constants';
import { toMMDate } from '../lib/utils';

type GroupBy = 'day' | 'month';

interface PeriodSummary {
  period: string;
  total_count: number;
  completed_count: number;
  failed_count: number;
  active_count: number;
  assignments: Assignment[];
}

function buildSummaries(assignments: Assignment[], groupBy: GroupBy): PeriodSummary[] {
  const map = new Map<string, Assignment[]>();
  assignments.forEach((a) => {
    const key = groupBy === 'day' ? toMMDate(a.assigned_at) : toMMDate(a.assigned_at).slice(0, 7);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(a);
  });
  return Array.from(map.entries()).map(([period, list]) => ({
    period,
    total_count: list.length,
    completed_count: list.filter((a) => a.status === 'COMPLETED').length,
    failed_count: list.filter((a) => a.status === 'FAILED').length,
    active_count: list.filter((a) => !['COMPLETED', 'FAILED', 'REASSIGNED'].includes(a.status)).length,
    assignments: list,
  })).sort((a, b) => (a.period < b.period ? 1 : -1));
}

const STATUS_FILTERS = [
  { label: 'အားလုံး', value: '' },
  { label: 'ပြီးစီး', value: 'COMPLETED' },
  { label: 'မအောင်မြင်', value: 'FAILED' },
];

export default function MyAssignments() {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [groupBy, setGroupBy] = useState<GroupBy>('day');
  const [view, setView] = useState<'summary' | 'list'>('summary');
  const [selected, setSelected] = useState<PeriodSummary | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['my-assignments-all'],
    queryFn: () => deliveryService.myAssignments({ per_page: 500 }),
  });

  const allAssignments = (data?.data ?? []).filter((a: any) => a.status !== 'REASSIGNED');
  const totalCount = allAssignments.length;
  const summaries = buildSummaries(allAssignments, groupBy);
  const todayStr = toMMDate(new Date().toISOString());
  const displaySummaries = summaries;

  function openPeriod(s: PeriodSummary) {
    setSelected(s);
    setStatusFilter('');
    setView('list');
  }
  function backToSummary() {
    setView('summary');
    setSelected(null);
  }

  if (view === 'list' && selected) {
    const listAssignments = statusFilter === 'COMPLETED'
      ? selected.assignments.filter((a) => a.status === 'COMPLETED')
      : statusFilter === 'FAILED'
      ? selected.assignments.filter((a) => a.status === 'FAILED')
      : selected.assignments;

    return (
      <div className="p-4 md:p-6 space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <h1 className="text-lg font-bold text-ink">{selected.period === todayStr ? 'ဒီနေ့' : selected.period}</h1>
            <p className="text-xs text-ink-2">စုစုပေါင်း {selected.total_count} ခု</p>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUS_FILTERS.map((f) => (
            <button key={f.value} onClick={() => setStatusFilter(f.value)} className={`px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap border ${statusFilter === f.value ? 'bg-brand text-white border-brand' : 'bg-surface text-ink-2 border-line'}`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {listAssignments.map((a) => <AssignmentCard key={a.id} assignment={a} />)}
          {listAssignments.length === 0 && <div className="text-center py-10 text-ink-3">ပို့ဆောင်မှု မတွေ့ပါ</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">ကျွန်ုပ်၏ လုပ်ငန်းများ</h1>
          <p className="text-sm text-ink-2">စုစုပေါင်း {totalCount} ခု</p>
        </div>
        <div className="flex rounded border border-line overflow-hidden">
          <button onClick={() => setGroupBy('day')} className={`px-3 py-1.5 text-xs font-semibold ${groupBy === 'day' ? 'bg-brand text-white' : 'bg-surface text-ink-2'}`}>နေ့</button>
          <button onClick={() => setGroupBy('month')} className={`px-3 py-1.5 text-xs font-semibold ${groupBy === 'month' ? 'bg-brand text-white' : 'bg-surface text-ink-2'}`}>လ</button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-ink-2">Loading...</div>
      ) : (
        <div className="space-y-2">
          {displaySummaries.map((item) => {
            const isToday = item.period === todayStr && groupBy === 'day';
            const allDone = item.total_count > 0 && item.completed_count === item.total_count;
            const completionPct = item.total_count > 0 ? Math.round((item.completed_count / item.total_count) * 100) : 0;
            return (
              <button
                key={item.period}
                onClick={() => item.total_count > 0 && openPeriod(item)}
                className={`card w-full p-3 text-left hover:bg-muted ${allDone ? 'border-ok' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-8 h-8 rounded flex items-center justify-center text-xs ${isToday ? 'bg-brand text-white' : 'bg-brand-bg text-brand'}`}><CalendarIcon className="w-4 h-4" /></span>
                    <span className="font-bold text-ink">{isToday ? 'ဒီနေ့' : item.period}</span>
                  </div>
                  {isToday && <span className="text-xs bg-brand text-white px-2 py-0.5 rounded">Today</span>}
                  {item.total_count > 0 && <span className="text-ink-3">›</span>}
                </div>
                <div className="flex justify-around text-center border-t border-line pt-2">
                  <div><div className="font-bold text-ink">{item.total_count}</div><div className="text-xs text-ink-2">စုစုပေါင်း</div></div>
                  <div><div className="font-bold text-ok">{item.completed_count}</div><div className="text-xs text-ink-2">ပြီးစီး</div></div>
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
              </button>
            );
          })}
          {displaySummaries.length === 0 && <div className="text-center py-10 text-ink-3">လုပ်ငန်းများ မတွေ့ပါ</div>}
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
      <div className="text-xs text-ink-3 flex items-center gap-1 truncate"><span>📍</span>{parcel?.delivery_address}</div>
      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs px-2 py-0.5 rounded font-semibold" style={{ color: assignColor, backgroundColor: isActive ? '#FFF3DC' : '#E8F8EF' }}>{assignLabel}</span>
        {parcel && Number(parcel.delivery_fee) > 0 && <span className="text-xs font-bold text-ink">{parcel.currency === 'THB' ? `${Number(parcel.delivery_fee).toLocaleString()} ฿` : `${Number(parcel.delivery_fee).toLocaleString()} K`}</span>}
        {parcel?.is_cod && <span className="text-xs bg-info-bg text-info px-2 py-0.5 rounded font-bold">COD {parcel.currency === 'THB' ? `${Number(parcel.cod_amount).toLocaleString()} ฿` : `${Number(parcel.cod_amount).toLocaleString()} K`}</span>}
      </div>
      <div className="text-xs text-ink-3 mt-1 space-y-0.5">
        <div>ချိတ်ဆက်ရက်: {new Date(assignment.assigned_at).toLocaleString()}</div>
        {parcel?.status === 'DELIVERED' && (parcel?.delivered_at || parcel?.updated_at) && <div>ပို့ဆောင်ပြီးရက်: {new Date((parcel.delivered_at || parcel.updated_at)!).toLocaleString()}</div>}
        {parcel?.status === 'FAILED' && (parcel?.failed_at || parcel?.updated_at) && <div>မအောင်မြင်ရက်: {new Date((parcel.failed_at || parcel.updated_at)!).toLocaleString()}</div>}
      </div>
      {!isActive ? null : (
        <button onClick={(e) => { e.stopPropagation(); navigate(`/deliveries/${assignment.id}/attempt`); }} className="mt-2 w-full bg-brand text-white py-1.5 rounded text-xs font-bold">
          ရလဒ် မှတ်တမ်းတင်
        </button>
      )}
    </button>
  );
}