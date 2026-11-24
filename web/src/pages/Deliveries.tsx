import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { deliveryService, Assignment } from '../services/deliveryService';
import { STATUS_LABELS_MM, STATUS_COLORS } from '../constants';
import { toMMDate, formatPeriodLabel } from '../lib/utils';
import {
  Calendar,
  Truck,
  Phone,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  Banknote,
  ArrowLeft,
  ChevronRight,
  Filter,
  Check,
  RotateCcw,
} from 'lucide-react';

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

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['delivery-summary', groupBy, dateFrom, dateTo, staffId],
    queryFn: () =>
      deliveryService.summary({
        group_by: groupBy,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        staff_id: staffId,
      }),
    enabled: view === 'summary',
  });

  const summaries = summaryData ?? [];
  const todayStr = toMMDate(new Date().toISOString());
  const displaySummaries =
    groupBy === 'day'
      ? summaries.some((s: any) => s.period === todayStr)
        ? summaries
        : [
            {
              period: todayStr,
              date_from: todayStr,
              date_to: todayStr,
              total_count: 0,
              completed_count: 0,
              failed_count: 0,
              in_transit_count: 0,
            },
            ...summaries,
          ]
      : summaries;

  const { data: listData, isLoading: listLoading } = useQuery({
    queryKey: ['delivery-list', selected?.from, selected?.to, statusFilter, page, staffId],
    queryFn: () =>
      deliveryService.allAssignments({
        staff_id: staffId,
        status: statusFilter || undefined,
        date_from: selected?.from,
        date_to: selected?.to,
        page,
        per_page: 20,
        finished_only: true,
      }),
    enabled: view === 'list' && Boolean(selected),
  });

  const assignments = (listData?.data ?? []) as Assignment[];
  const meta = listData?.meta;

  const openPeriod = (s: any) => {
    setSelected({ from: s.date_from, to: s.date_to, label: formatPeriodLabel(s.period, groupBy) });
    setStatusFilter('');
    setPage(1);
    setView('list');
  };

  const backToSummary = () => {
    setView('summary');
    setSelected(null);
  };

  /* ================= LIST VIEW ================= */
  if (view === 'list' && selected) {
    return (
      <div className="p-3.5 sm:p-6 space-y-3 max-w-4xl mx-auto">
        <div className="flex items-center gap-2">
          <button
            onClick={backToSummary}
            className="p-2 rounded-xl border border-line bg-surface hover:bg-muted active:scale-95 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-ink truncate">{selected.label}</h1>
            <p className="text-xs text-ink-2">စုစုပေါင်း {meta?.total ?? 0} ခု</p>
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setStatusFilter(f.value);
                setPage(1);
              }}
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

        {/* Financial Summary Card */}
        {meta && ((meta.fee_mmk ?? 0) > 0 || (meta.cod_mmk ?? 0) > 0 || (meta.fee_thb ?? 0) > 0 || (meta.cod_thb ?? 0) > 0) && (
          <div className="card p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center bg-muted/40">
            {(meta.fee_mmk ?? 0) > 0 && (
              <div>
                <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                  {meta.fee_mmk.toLocaleString()} K
                </div>
                <div className="text-[10px] text-ink-3">ပို့ဆောင်ခ</div>
              </div>
            )}
            {(meta.cod_mmk ?? 0) > 0 && (
              <div>
                <div className="text-sm font-black text-amber-600 dark:text-amber-400">
                  {meta.cod_mmk.toLocaleString()} K
                </div>
                <div className="text-[10px] text-ink-3">COD</div>
              </div>
            )}
            {(meta.fee_thb ?? 0) > 0 && (
              <div>
                <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                  {meta.fee_thb.toLocaleString()} ฿
                </div>
                <div className="text-[10px] text-ink-3">ပို့ဆောင်ခ</div>
              </div>
            )}
            {(meta.cod_thb ?? 0) > 0 && (
              <div>
                <div className="text-sm font-black text-amber-600 dark:text-amber-400">
                  {meta.cod_thb.toLocaleString()} ฿
                </div>
                <div className="text-[10px] text-ink-3">COD</div>
              </div>
            )}
          </div>
        )}

        {/* List of assignments */}
        {listLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card p-4 h-32 bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2.5">
            {assignments.map((a) => (
              <AssignmentCard key={a.id} assignment={a} />
            ))}
            {assignments.length === 0 && (
              <div className="card p-8 text-center space-y-1">
                <Truck className="w-8 h-8 text-ink-3 mx-auto" />
                <div className="text-sm font-bold text-ink">ပို့ဆောင်မှု မတွေ့ပါ</div>
              </div>
            )}
          </div>
        )}

        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-xl border border-line text-xs font-semibold disabled:opacity-40"
            >
              နောက်သို့
            </button>
            <span className="text-xs font-bold text-ink">
              {page} / {meta.last_page}
            </span>
            <button
              disabled={page >= meta.last_page}
              onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
              className="px-3 py-1.5 rounded-xl border border-line text-xs font-semibold disabled:opacity-40"
            >
              ရှေ့သို့
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ================= SUMMARY VIEW ================= */
  return (
    <div className="p-3.5 sm:p-6 space-y-3 max-w-4xl mx-auto">
      {/* Header with Segmented Control */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-ink">ပို့ဆောင်မှုများ</h1>
          <p className="text-xs text-ink-2">
            စုစုပေါင်း {summaries.reduce((s: number, x: any) => s + x.total_count, 0)} ခု
          </p>
        </div>

        {/* Day / Month Segmented Control */}
        <div className="flex rounded-xl border border-line bg-muted/40 p-0.5">
          <button
            onClick={() => setGroupBy('day')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              groupBy === 'day' ? 'bg-surface text-brand shadow-sm' : 'text-ink-2 hover:text-ink'
            }`}
          >
            နေ့စဉ်
          </button>
          <button
            onClick={() => setGroupBy('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              groupBy === 'month' ? 'bg-surface text-brand shadow-sm' : 'text-ink-2 hover:text-ink'
            }`}
          >
            လစဉ်
          </button>
        </div>
      </div>

      {/* Date Pickers */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label">မှ ရက်စွဲ</label>
          <input
            type="date"
            className="field text-xs"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="label">ထိ ရက်စွဲ</label>
          <input
            type="date"
            className="field text-xs"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>

      {/* Summaries list */}
      {summaryLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-4 h-28 bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2.5">
          {displaySummaries.map((item: any) => {
            const isToday = item.period === todayStr && groupBy === 'day';
            const allDone = item.total_count > 0 && item.completed_count === item.total_count;
            const completionPct =
              item.total_count > 0
                ? Math.round((item.completed_count / item.total_count) * 100)
                : 0;

            return (
              <button
                key={item.period}
                onClick={() => openPeriod(item)}
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
                    <div>
                      <div className="font-bold text-sm text-ink flex items-center gap-1.5">
                        <span>{isToday ? 'ဒီနေ့' : formatPeriodLabel(item.period, groupBy)}</span>
                        {isToday && (
                          <span className="text-[10px] font-bold bg-brand text-white px-2 py-0.2 rounded-full">
                            Today
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-3" />
                </div>

                {/* Status counts */}
                <div className="grid grid-cols-3 gap-2 text-center border-t border-line/60 pt-2 text-xs">
                  <div>
                    <div className="text-base font-black text-ink">{item.total_count}</div>
                    <div className="text-[10px] text-ink-3">စုစုပေါင်း</div>
                  </div>
                  <div>
                    <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
                      {item.completed_count}
                    </div>
                    <div className="text-[10px] text-ink-3">ပို့ဆောင်ပြီး</div>
                  </div>
                  <div>
                    <div className="text-base font-black text-rose-600 dark:text-rose-400">
                      {item.failed_count}
                    </div>
                    <div className="text-[10px] text-ink-3">မအောင်မြင်</div>
                  </div>
                </div>

                {/* Progress Bar */}
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

          {displaySummaries.length === 0 && (
            <div className="card p-8 text-center text-ink-3 text-sm">ပို့ဆောင်မှု မတွေ့ပါ</div>
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

      {assignment.staff && (
        <div className="text-xs text-ink-3">👤 ဝန်ထမ်း: {assignment.staff.name}</div>
      )}

      {/* Badges */}
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

      {/* Record Attempt Button */}
      {isActive && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/deliveries/${assignment.id}/attempt`);
          }}
          className="mt-2 w-full bg-brand hover:bg-brand-dark text-white py-2 rounded-xl text-xs font-bold shadow-sm active:scale-98 transition flex items-center justify-center gap-1.5"
        >
          <RotateCcw className="w-4 h-4" />
          <span>ရလဒ် မှတ်တမ်းတင်မည်</span>
        </button>
      )}
    </div>
  );
}
