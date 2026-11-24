import React, { useState, useEffect } from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { parcelService } from '../services/parcelService';
import { PARCEL_STATUSES, STATUS_LABELS_MM, STATUS_COLORS, PRIORITY_LABELS_MM, PRIORITY_COLORS } from '../constants';
import ConfirmModal from '../components/ConfirmModal';

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
    const t = setTimeout(() => { setSearchDebounced(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isFetching, refetch } = useQuery({
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
    setPage(1);
  }

  return (
    <div className="p-4 md:p-6 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">ပါဆယ်များ</h1>
          <p className="text-sm text-ink-2">စုစုပေါင်း {meta?.total ?? 0} ခု</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDateFilter((v) => !v)}
            className={`px-3 py-2 rounded border ${dateFrom || dateTo ? 'bg-brand text-white border-brand' : 'border-line bg-surface text-ink'}`}
          >
            <CalendarIcon className="w-5 h-5" />
          </button>
          {canCreate && (
            <button onClick={() => navigate('/parcels/create')} className="px-3 py-2 rounded bg-brand text-white font-bold">
              + အသစ်
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 h-10 rounded border border-line bg-surface px-3 text-sm"
          placeholder="ရှာဖွေမည်..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => { setStatusFilter(f.value); setPage(1); }}
            className={`px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap border ${
              statusFilter === f.value ? 'bg-brand text-white border-brand' : 'bg-surface text-ink-2 border-line'
            }`}
          >
            {f.label}
          </button>
        ))}
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
            <button onClick={applyDate} className="flex-1 bg-brand text-white py-2 rounded font-bold text-sm">ရှာဖွေမည်</button>
            <button onClick={clearDate} className="px-4 border border-line rounded text-sm">ဖျက်မည်</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-10 text-ink-2">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {parcels.map((p) => (
            <ParcelCard key={p.id} parcel={p} canChangeStatus={canChangeStatus} />
          ))}
          {parcels.length === 0 && <div className="col-span-full text-center py-10 text-ink-3">ပါဆယ် မတွေ့ပါ</div>}
        </div>
      )}

      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded border border-line disabled:opacity-40"
          >
            နှုတ်
          </button>
          <span className="text-sm">{page} / {meta.last_page}</span>
          <button
            disabled={page >= meta.last_page}
            onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
            className="px-3 py-1.5 rounded border border-line disabled:opacity-40"
          >
            နောက်
          </button>
        </div>
      )}
    </div>
  );
}

function ParcelCard({ parcel, canChangeStatus }: { parcel: any; canChangeStatus: boolean }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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

  return (
    <div className="card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-brand cursor-pointer" onClick={() => navigate(`/parcels/${parcel.id}`)}>
          {parcel.tracking_number}
        </span>
        <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ color: statusColor, backgroundColor: statusColor + '18' }}>
          {statusLabel}
        </span>
      </div>
      <div className="border-t border-line pt-2 flex gap-3">
        {firstImage ? (
          <img src={firstImage.url} alt="" className="w-14 h-14 rounded object-cover flex-shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded bg-muted flex-shrink-0" />
        )}
        <div className="flex-1 text-sm space-y-0.5">
          {parcel.sender_name && <div className="text-xs text-ink-2 truncate">{parcel.sender_name} · {parcel.sender_phone}</div>}
          <div className="text-ink font-medium truncate">{parcel.recipient_name}</div>
          <div className="text-ink-2 text-xs">{parcel.recipient_phone}</div>
          <div className="text-ink-2 text-xs truncate">{parcel.delivery_address}</div>
        </div>
      </div>
      <div className="text-xs text-ink-3 space-y-0.5">
        <div>လက်ခံရက်စွဲ: {new Date(parcel.received_at || parcel.created_at).toLocaleString()}</div>
        {parcel.status === 'DELIVERED' && (parcel.delivered_at || parcel.updated_at) && (
          <div>ပို့ဆောင်ပြီးရက်စွဲ: {new Date(parcel.delivered_at || parcel.updated_at).toLocaleString()}</div>
        )}
        {parcel.status === 'FAILED' && (parcel.failed_at || parcel.updated_at) && (
          <div>မအောင်မြင်ရက်စွဲ: {new Date(parcel.failed_at || parcel.updated_at).toLocaleString()}</div>
        )}
      </div>
      {canVerify && (
        <button
          onClick={() => setVerifyOpen(true)}
          disabled={verifyMutation.isPending}
          className="w-full bg-ok text-white py-2 rounded text-sm font-bold disabled:opacity-60"
        >
          {verifyMutation.isPending ? '...' : 'စစ်ဆေးပြီး အတည်ပြုမည်'}
        </button>
      )}
      <div className="flex items-center justify-between pt-1">
        <div className="flex gap-2 items-center">
          <span className="text-xs px-2 py-0.5 rounded" style={{ color: priorityColor, backgroundColor: priorityColor + '18' }}>
            {priorityLabel}
          </span>
          {parcel.is_cod && (
            <span className="text-xs bg-info-bg text-info px-2 py-0.5 rounded font-bold">
              COD {Number(parcel.cod_amount).toLocaleString()} {(parcel.cod_currency ?? parcel.currency) === 'THB' ? 'THB' : 'MMK'}
            </span>
          )}
          {firstImage && <span className="text-xs text-ink-3">{parcel.images.length}</span>}
        </div>
        <span className="text-sm font-bold text-ink">{Number(parcel.delivery_fee).toLocaleString()} {parcel.currency === 'THB' ? 'THB' : 'MMK'}</span>
      </div>

      <ConfirmModal
        visible={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        onConfirm={() => verifyMutation.mutate()}
        title="စစ်ဆေးပြီး အတည်ပြုမည်"
        message={`${parcel.tracking_number} ကို စစ်ဆေးပြီး (VERIFIED) status သို့ ပြောင်းမည်လား?`}
        confirmText="အတည်ပြုမည်"
        isLoading={verifyMutation.isPending}
      />
    </div>
  );
}