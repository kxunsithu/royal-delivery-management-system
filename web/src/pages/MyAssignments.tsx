import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { deliveryService, Assignment } from '../services/deliveryService';
import { STATUS_LABELS_MM, STATUS_COLORS } from '../constants';
import { toMMDate } from '../lib/utils';
import {
  Calendar,
  Truck,
  Phone,
  MapPin,
  Banknote,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';

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
  return Array.from(map.entries())
    .map(([period, list]) => ({
      period,
      total_count: list.length,
      completed_count: list.filter((a) => a.status === 'COMPLETED').length,
      failed_count: list.filter((a) => a.status === 'FAILED').length,
      active_count: list.filter((a) => !['COMPLETED', 'FAILED', 'REASSIGNED'].includes(a.status)).length,
      assignments: list,
    }))
    .sort((a, b) => (a.period < b.period ? 1 : -1));
}

const STATUS_FILTERS = [
  { label: 'အားလုံး', value: '' },
  { label: 'ဆောင်ရွက်ဆဲ', value: 'ACTIVE' },
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

  const { data, isLoading } = useQuery({
    queryKey: ['my-assignments-all'],
    queryFn: () => deliveryService.myAssignments({ per_page: 500 }),
  });

  const allAssignments = (data?.data ?? []).filter((a: any) => a.status !== 'REASSIGNED');
  const totalCount = allAssignments.length;
  const summaries = buildSummaries(allAssignments, groupBy);
  const todayStr = toMMDate(new Date().toISOString());

  function openPeriod(s: PeriodSummary) {
    setSelected(s);
    setStatusFilter('');
    setView('list');
  }

  function backToSummary() {
    setView('summary');
    setSelected(null);
  }

  /* ================= LIST VIEW ================= */
  if (view === 'list' && selected) {
    const listAssignments =
      statusFilter === 'COMPLETED'
        ? selected.assignments.filter((a) => a.status === 'COMPLETED')
        : statusFilter === 'FAILED'
        ? selected.assignments.filter((a) => a.status === 'FAILED')
        : statusFilter === 'ACTIVE'
        ? selected.assignments.filter((a) => !['COMPLETED', 'FAILED', 'REASSIGNED'].includes(a.status))
        : selected.assignments;

    return (
      <div className="p-3.5 sm:p-6 space-y-3 max-w-3xl mx-auto">
        <div className="flex items-center gap-2">
          <button
            onClick={backToSummary}
            className="p-2 rounded-xl border border-line bg-surface hover:bg-muted active:scale-95 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-ink">
              {selected.period === todayStr ? 'ဒီနေ့ လုပ်ငန်းများ' : selected.period}
            </h1>
            <p className="text-xs text-ink-2">စုစုပေါင်း {selected.total_count} ခု</p>
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition active:scale-95 ${
                statusFilter === f.value
                  ? 'bg-brand text-white border-brand shadow-sm'
                  : 'bg-surface text-ink-2 border-line hover:bg-muted'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="space-y-2.5">
          {listAssignments.map((a) => (
            <AssignmentCard key={a.id} assignment={a} />
          ))}
          {listAssignments.length === 0 && (
            <div className="card p-8 text-center space-y-1">
              <ClipboardList className="w-8 h-8 text-ink-3 mx-auto" />
              <div className="text-sm font-bold text-ink">လုပ်ငန်းများ မတွေ့ပါ</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ================= SUMMARY VIEW ================= */
  return (
    <div className="p-3.5 sm:p-6 space-y-3 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-ink">ကျွန်ုပ်၏ လုပ်ငန်းများ</h1>
          <p className="text-xs text-ink-2">စုစုပေါင်း {totalCount} ခု</p>
        </div>

        <div className="flex rounded-xl border border-line bg-muted/40 p-0.5">
          <button
            onClick={() => setGroupBy('day')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              groupBy === 'day' ? 'bg-surface text-brand shadow-sm' : 'text-ink-2 hover:text-ink'
            }`}
          >
            နေ့
          </button>
          <button
            onClick={() => setGroupBy('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              groupBy === 'month' ? 'bg-surface text-brand shadow-sm' : 'text-ink-2 hover:text-ink'
            }`}
          >
            လ
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-4 h-28 bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2.5">
          {summaries.map((item) => {
            const isToday = item.period === todayStr && groupBy === 'day';
            const allDone = item.total_count > 0 && item.completed_count === item.total_count;
            const completionPct =
              item.total_count > 0
                ? Math.round((item.completed_count / item.total_count) * 100)
                : 0;

            return (
              <button
                key={item.period}
                onClick={() => item.total_count > 0 && openPeriod(item)}
                className={`card w-full p-3.5 text-left hover:border-brand/40 active:scale-[0.99] transition ${
                  isToday ? 'border-brand/40 shadow-sm' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                        isToday ? 'bg-brand text-white shadow-sm' : 'bg-brand-bg text-brand'
                      }`}
                    >
                      <Calendar className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm text-ink">
                      {isToday ? 'ဒီနေ့' : item.period}
                    </span>
                    {isToday && (
                      <span className="text-[10px] font-bold bg-brand text-white px-2 py-0.2 rounded-full">
                        Today
                      </span>
                    )}
                  </div>
                  {item.total_count > 0 && <ChevronRight className="w-4 h-4 text-ink-3" />}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center border-t border-line/60 pt-2 text-xs">
                  <div>
                    <div className="text-base font-black text-ink">{item.total_count}</div>
                    <div className="text-[10px] text-ink-3">စုစုပေါင်း</div>
                  </div>
                  <div>
                    <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
                      {item.completed_count}
                    </div>
                    <div className="text-[10px] text-ink-3">ပြီးစီး</div>
                  </div>
                  <div>
                    <div className="text-base font-black text-rose-600 dark:text-rose-400">
                      {item.failed_count}
                    </div>
                    <div className="text-[10px] text-ink-3">မအောင်မြင်</div>
                  </div>
                </div>

                {item.total_count > 0 && (
                  <div className="mt-2.5">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand to-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${completionPct}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-ink-3 text-right mt-1 font-semibold">
                      ပြီးစီးမှု {completionPct}%
                    </div>
                  </div>
                )}
              </button>
            );
          })}

          {summaries.length === 0 && (
            <div className="card p-8 text-center text-ink-3 text-sm">လုပ်ငန်းများ မတွေ့ပါ</div>
          )}
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
  const assignLabel =
    assignStatus === 'COMPLETED'
      ? 'ပြီးစီး'
      : assignStatus === 'FAILED'
      ? 'မအောင်မြင်'
      : assignStatus === 'REASSIGNED'
      ? 'ပြောင်းလဲ'
      : 'ဆောင်ရွက်ဆဲ';
  const assignColor = isActive ? '#F97316' : '#16A34A';

  return (
    <div
      onClick={() => navigate(`/deliveries/${assignment.id}`)}
      className="card p-3.5 space-y-2 cursor-pointer hover:border-brand/40 active:scale-[0.99] transition"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-brand font-mono">{parcel?.tracking_number}</span>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
          style={{ color: statusColor, backgroundColor: statusColor + '18' }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
          {statusLabel}
        </span>
      </div>

      <div className="text-sm font-bold text-ink">{parcel?.recipient_name}</div>

      {parcel?.recipient_phone && (
        <a
          href={`tel:${parcel.recipient_phone}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
        >
          <Phone className="w-3.5 h-3.5" />
          <span>{parcel.recipient_phone}</span>
        </a>
      )}

      <div className="text-xs text-ink-2 flex items-center gap-1 truncate">
        <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-ink-3" />
        <span className="truncate">{parcel?.delivery_address}</span>
      </div>

      <div className="flex items-center gap-2 pt-1 border-t border-line/60 flex-wrap">
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-md"
          style={{
            color: assignColor,
            backgroundColor: isActive ? '#FFF3DC' : '#E8F8EF',
          }}
        >
          {assignLabel}
        </span>

        {parcel?.is_cod && (
          <span className="text-[10px] font-black bg-amber-500/15 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-md flex items-center gap-1">
            <Banknote className="w-3 h-3" />
            COD {Number(parcel.cod_amount).toLocaleString()} {parcel.currency === 'THB' ? '฿' : 'K'}
          </span>
        )}

        {parcel && Number(parcel.delivery_fee) > 0 && (
          <span className="text-xs font-bold text-ink ml-auto">
            {Number(parcel.delivery_fee).toLocaleString()} {parcel.currency === 'THB' ? '฿' : 'K'}
          </span>
        )}
      </div>

      {isActive && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/deliveries/${assignment.id}/attempt`);
          }}
          className="mt-2 w-full bg-brand hover:bg-brand-dark text-white py-2.5 rounded-xl text-xs font-bold shadow-sm active:scale-98 transition flex items-center justify-center gap-1.5"
        >
          <RotateCcw className="w-4 h-4" />
          <span>ရလဒ် မှတ်တမ်းတင်မည်</span>
        </button>
      )}
    </div>
  );
}
