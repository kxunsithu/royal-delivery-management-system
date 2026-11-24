import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { parcelService } from '../services/parcelService';
import {
  PARCEL_STATUSES,
  STATUS_LABELS_MM,
  STATUS_COLORS,
  STATUS_BG,
  PRIORITY_LABELS_MM,
  PRIORITY_COLORS,
} from '../constants';
import ConfirmModal from '../components/ConfirmModal';
import {
  Search,
  Calendar,
  Plus,
  Phone,
  MapPin,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  Package,
  Clock,
  Banknote,
} from 'lucide-react';

const STATUS_FILTERS = [
  { label: 'အားလုံး', value: '' },
  ...Object.keys(PARCEL_STATUSES).map((s) => ({ label: STATUS_LABELS_MM[s], value: s })),
];

export default function Parcels() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const canChangeStatus = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'accountant';
  const canCreate = user?.role === 'admin' || user?.role === 'manager';

  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFromInput, setDateFromInput] = useState('');
  const [dateToInput, setDateToInput] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchDebounced(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['parcels', searchDebounced, statusFilter, dateFrom, dateTo, page],
    queryFn: () =>
      parcelService.list({
        search: searchDebounced || undefined,
        status: statusFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        page,
        per_page: 20,
      }),
  });

  const parcels = data?.data ?? [];
  const meta = data?.meta;

  function applyDate() {
    setDateFrom(dateFromInput);
    setDateTo(dateToInput);
    setShowDateFilter(false);
    setPage(1);
  }

  function clearDate() {
    setDateFromInput('');
    setDateToInput('');
    setDateFrom('');
    setDateTo('');
    setShowDateFilter(false);
    setPage(1);
  }

  const hasDateFilter = Boolean(dateFrom || dateTo);

  return (
    <div className="p-3.5 sm:p-6 space-y-3 max-w-5xl mx-auto">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-ink">ပါဆယ်များ</h1>
          <p className="text-xs text-ink-2">စုစုပေါင်း {meta?.total ?? 0} ခု</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Date Filter Button */}
          <button
            onClick={() => setShowDateFilter((v) => !v)}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 ${
              hasDateFilter
                ? 'bg-brand text-white border-brand shadow-sm'
                : 'border-line bg-surface text-ink hover:bg-muted'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">ရက်စွဲ</span>
            {hasDateFilter && <span className="w-2 h-2 rounded-full bg-white ml-0.5" />}
          </button>

          {/* New Parcel Button */}
          {canCreate && (
            <button
              onClick={() => navigate('/parcels/create')}
              className="px-3.5 py-2 rounded-xl bg-brand text-white text-xs sm:text-sm font-bold shadow-sm shadow-brand/25 flex items-center gap-1.5 active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
              <span>အသစ်</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-ink-3 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          className="field pl-9 pr-9 text-sm"
          placeholder="ခြေရာခံနံပါတ်၊ ဖုန်း၊ အမည် ရှာဖွေမည်..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink p-1"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Horizontal Status Chips Bar */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
        {STATUS_FILTERS.map((f) => {
          const isActive = statusFilter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => {
                setStatusFilter(f.value);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition active:scale-95 ${
                isActive
                  ? 'bg-brand text-white border-brand shadow-sm'
                  : 'bg-surface text-ink-2 border-line hover:bg-muted'
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Collapsible Date Filter Card */}
      {showDateFilter && (
        <div className="card p-3.5 space-y-3 bg-muted/40 animate-fade-in">
          <div className="text-xs font-bold text-ink flex items-center justify-between">
            <span>ရက်စွဲဖြင့် စစ်ထုတ်ရန်</span>
            <button onClick={() => setShowDateFilter(false)} className="text-ink-3 hover:text-ink">
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
          <div className="flex gap-2 pt-1">
            <button
              onClick={applyDate}
              className="flex-1 bg-brand text-white py-2 rounded-xl font-bold text-xs shadow-sm active:scale-95 transition"
            >
              ရှာဖွေမည်
            </button>
            <button
              onClick={clearDate}
              className="px-4 border border-line rounded-xl text-xs font-semibold hover:bg-muted active:scale-95 transition"
            >
              ဖျက်မည်
            </button>
          </div>
        </div>
      )}

      {/* Parcels List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card p-4 h-36 bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2.5">
          {parcels.map((p) => (
            <ParcelCard key={p.id} parcel={p} canChangeStatus={canChangeStatus} />
          ))}

          {parcels.length === 0 && (
            <div className="card p-10 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-muted text-ink-3 flex items-center justify-center mx-auto">
                <Package className="w-6 h-6" />
              </div>
              <div className="text-sm font-bold text-ink">ပါဆယ် မတွေ့ပါ</div>
              <p className="text-xs text-ink-3">ရှာဖွေမှု သို့မဟုတ် ရက်စွဲ ပြောင်းလဲကြည့်ပါ</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-center gap-2 pt-3">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="p-2 rounded-xl border border-line bg-surface disabled:opacity-30 active:scale-95 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-ink px-3 py-1.5 rounded-xl bg-surface border border-line">
            {page} / {meta.last_page}
          </span>
          <button
            disabled={page >= meta.last_page}
            onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
            className="p-2 rounded-xl border border-line bg-surface disabled:opacity-30 active:scale-95 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function ParcelCard({ parcel, canChangeStatus }: { parcel: any; canChangeStatus: boolean }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const statusColor = STATUS_COLORS[parcel.status] || '#6B7280';
  const statusLabel = STATUS_LABELS_MM[parcel.status] || parcel.status;
  const priorityColor = PRIORITY_COLORS[parcel.priority] || '#6B7280';
  const priorityLabel = PRIORITY_LABELS_MM[parcel.priority] || parcel.priority;
  const firstImage = parcel.images && parcel.images.length > 0 ? parcel.images[0] : null;

  const [verifyOpen, setVerifyOpen] = useState(false);
  const verifyMutation = useMutation({
    mutationFn: () => parcelService.statusTransition(parcel.id, 'VERIFIED'),
    onSuccess: () => {
      setVerifyOpen(false);
      queryClient.invalidateQueries({ queryKey: ['parcels'] });
    },
    onError: (err: any) => {
      window.alert(err?.response?.data?.message || 'Status ပြောင်း၍ မရပါ');
    },
  });

  const isReceived = parcel.status === 'RECEIVED';
  const canVerify = canChangeStatus && isReceived;

  function copyTracking(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard?.writeText(parcel.tracking_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const currencyUnit = parcel.currency === 'THB' ? '฿' : 'K';
  const codCurrencyUnit = (parcel.cod_currency ?? parcel.currency) === 'THB' ? '฿' : 'K';

  return (
    <div
      onClick={() => navigate(`/parcels/${parcel.id}`)}
      className="card p-3.5 space-y-2.5 cursor-pointer hover:border-brand/40 active:scale-[0.99] transition"
    >
      {/* Top Header: Tracking Code & Status Pill */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm font-bold tracking-tight text-brand font-mono truncate">
            {parcel.tracking_number}
          </span>
          <button
            onClick={copyTracking}
            className="p-1 rounded-md text-ink-3 hover:text-ink active:scale-95 transition"
            title="Copy tracking number"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-ok" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        <span
          className="text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 whitespace-nowrap"
          style={{ color: statusColor, backgroundColor: statusColor + '18' }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
          {statusLabel}
        </span>
      </div>

      {/* Middle Body: Image & Customer Info */}
      <div className="flex gap-3 items-start border-t border-line/60 pt-2.5">
        {firstImage ? (
          <img
            src={firstImage.url}
            alt=""
            className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-line"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-muted/80 text-ink-3 flex items-center justify-center flex-shrink-0 border border-line">
            <Package className="w-6 h-6" />
          </div>
        )}

        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="text-sm font-bold text-ink truncate">{parcel.recipient_name}</div>

          {/* Tap-to-call phone number */}
          <div className="flex items-center gap-1">
            <a
              href={`tel:${parcel.recipient_phone}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
            >
              <Phone className="w-3 h-3" />
              <span>{parcel.recipient_phone}</span>
            </a>
          </div>

          <div className="flex items-center gap-1 text-xs text-ink-2 truncate">
            <MapPin className="w-3 h-3 flex-shrink-0 text-ink-3" />
            <span className="truncate">{parcel.delivery_address}</span>
          </div>

          {parcel.sender_name && (
            <div className="text-[11px] text-ink-3 truncate">
              ပို့သူ: {parcel.sender_name} {parcel.sender_phone ? `(${parcel.sender_phone})` : ''}
            </div>
          )}
        </div>
      </div>

      {/* Badges & Financial Info */}
      <div className="flex items-center justify-between pt-1 border-t border-line/40 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-md"
            style={{ color: priorityColor, backgroundColor: priorityColor + '18' }}
          >
            {priorityLabel}
          </span>

          {parcel.is_cod && (
            <span className="text-[10px] font-black bg-amber-500/15 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Banknote className="w-3 h-3" />
              COD {Number(parcel.cod_amount).toLocaleString()} {codCurrencyUnit}
            </span>
          )}

          {parcel.images && parcel.images.length > 1 && (
            <span className="text-[10px] text-ink-3 bg-muted px-1.5 py-0.5 rounded">
              +{parcel.images.length - 1} ပုံ
            </span>
          )}
        </div>

        <div className="text-right">
          <span className="text-xs text-ink-3 font-normal">ပို့ဆောင်ခ: </span>
          <span className="text-sm font-black text-ink">
            {Number(parcel.delivery_fee).toLocaleString()} {currencyUnit}
          </span>
        </div>
      </div>

      {/* Quick Verification Button for Managers */}
      {canVerify && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setVerifyOpen(true);
          }}
          disabled={verifyMutation.isPending}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl text-xs font-bold shadow-sm active:scale-98 transition flex items-center justify-center gap-1.5"
        >
          <Check className="w-4 h-4" />
          <span>{verifyMutation.isPending ? 'ဆောင်ရွက်နေဆဲ...' : 'စစ်ဆေးပြီး အတည်ပြုမည်'}</span>
        </button>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        visible={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        onConfirm={() => verifyMutation.mutate()}
        title="စစ်ဆေးပြီး အတည်ပြုမည်"
        message={`${parcel.tracking_number} ကို စစ်ဆေးပြီး (VERIFIED) သို့ ပြောင်းမည်လား?`}
        confirmText="အတည်ပြုမည်"
        isLoading={verifyMutation.isPending}
      />
    </div>
  );
}
