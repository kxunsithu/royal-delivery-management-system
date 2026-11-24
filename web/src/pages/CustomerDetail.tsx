import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { parcelService, Parcel } from '../services/parcelService';
import { STATUS_LABELS_MM, STATUS_COLORS } from '../constants';

export default function CustomerDetail() {
  const { phone } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { colors } = useTheme();
  const decodedPhone = phone ? decodeURIComponent(phone) : '';
  const type = searchParams.get('type') || 'recipient';
  const nameParam = searchParams.get('name');
  const decodedName = nameParam ? decodeURIComponent(nameParam) : decodedPhone;
  const isRecipient = type !== 'sender';

  const canCreateParcel = user?.role === 'admin' || user?.role === 'manager';

  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['customer-parcels', decodedPhone, page],
    queryFn: () => parcelService.list({ search: decodedPhone, page, per_page: 20 }),
    enabled: !!decodedPhone,
  });

  const parcels = (data?.data ?? []) as Parcel[];
  const meta = data?.meta;

  const totalMMK = parcels.filter((p) => p.currency === 'MMK').reduce((s, p) => s + Number(p.delivery_fee), 0);
  const totalTHB = parcels.filter((p) => p.currency === 'THB').reduce((s, p) => s + Number(p.delivery_fee), 0);
  const codMMK = parcels.filter((p) => (p.cod_currency ?? p.currency) === 'MMK' && p.is_cod).reduce((s, p) => s + Number(p.cod_amount), 0);
  const codTHB = parcels.filter((p) => (p.cod_currency ?? p.currency) === 'THB' && p.is_cod).reduce((s, p) => s + Number(p.cod_amount), 0);

  function handleAddParcel() {
    const params = new URLSearchParams();
    if (isRecipient) {
      params.set('recipient_name', encodeURIComponent(decodedName));
      params.set('recipient_phone', encodeURIComponent(decodedPhone));
    } else {
      params.set('sender_name', encodeURIComponent(decodedName));
      params.set('sender_phone', encodeURIComponent(decodedPhone));
    }
    navigate(`/parcels/create?${params.toString()}`);
  }

  return (
    <div className="p-4 md:p-6 space-y-3">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="px-3 py-1.5 rounded border border-line text-sm">← နောက်</button>
        <div className="text-center flex-1">
          <h1 className="text-lg font-bold text-ink">{decodedName}</h1>
          <p className="text-xs text-ink-2">{decodedPhone} · {isRecipient ? 'လက်ခံသူ' : 'ပို့သူ'}</p>
        </div>
        {canCreateParcel && (
          <button onClick={handleAddParcel} className="px-3 py-1.5 rounded bg-brand text-white text-sm font-bold">ထည့်မည်</button>
        )}
      </div>

      <div className="card p-3">
        <div className="flex justify-around text-center">
          <div>
            <div className="text-xl font-bold text-ink">{meta?.total ?? parcels.length}</div>
            <div className="text-xs text-ink-2">ပါဆယ်</div>
          </div>
          <div>
            <div className="text-xl font-bold text-ink">{totalMMK.toLocaleString()}</div>
            <div className="text-xs text-ink-2">MMK</div>
          </div>
          <div>
            <div className="text-xl font-bold text-ink">{totalTHB.toLocaleString()}</div>
            <div className="text-xs text-ink-2">THB</div>
          </div>
        </div>
        {(codMMK > 0 || codTHB > 0) && (
          <div className="flex justify-around text-center mt-2 pt-2 border-t border-line">
            {codMMK > 0 && <div><div className="text-lg font-bold text-warn">{codMMK.toLocaleString()}</div><div className="text-xs text-ink-2">COD (K)</div></div>}
            {codTHB > 0 && <div><div className="text-lg font-bold text-warn">{codTHB.toLocaleString()}</div><div className="text-xs text-ink-2">COD (฿)</div></div>}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-ink-2">Loading...</div>
      ) : (
        <div className="space-y-2">
          {parcels.map((p) => {
            const statusColor = STATUS_COLORS[p.status] || '#6B7280';
            const statusLabel = STATUS_LABELS_MM[p.status] || p.status;
            return (
              <button key={p.id} onClick={() => navigate(`/parcels/${p.id}`)} className="card w-full p-3 text-left hover:bg-muted">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-brand">{p.tracking_number}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ color: statusColor, backgroundColor: statusColor + '18' }}>{statusLabel}</span>
                </div>
                <div className="text-sm text-ink">{p.recipient_name}</div>
                <div className="text-xs text-ink-2">{p.recipient_phone}</div>
                <div className="text-xs text-ink-3 truncate">{p.delivery_address}</div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-line">
                  <span className="text-xs text-ink-3">လက်ခံရက်စွဲ: {new Date(p.received_at || p.created_at).toLocaleString()}</span>
                  <span className="text-sm font-bold text-ink">{Number(p.delivery_fee).toLocaleString()} {p.currency}</span>
                </div>
              </button>
            );
          })}
          {parcels.length === 0 && <div className="text-center py-10 text-ink-3">ပါဆယ် မတွေ့ပါ</div>}
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