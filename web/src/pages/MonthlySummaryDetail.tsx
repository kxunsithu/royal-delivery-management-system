import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { parcelService, Parcel } from '../services/parcelService';
import { STATUS_LABELS_MM, STATUS_COLORS } from '../constants';

const MM_MONTHS = ['ဇန်နဝါရီ', 'ဖေဖော်ဝါရီ', 'မတ်', 'ဧပြီ', 'မေ', 'ဇွန်', 'ဇူလိုင်', 'သြဂုတ်', 'စက်တင်ဘာ', 'အောက်တိုဘာ', 'နိုဝင်ဘာ', 'ဒီဇင်ဘာ'];

function parseMonth(monthStr: string) {
  const [y, m] = monthStr.split('-');
  const year = Number(y);
  const month = Number(m) - 1;
  const firstDay = `${y}-${m}-01`;
  const lastDayDate = new Date(year, month + 1, 0);
  const lastDay = `${y}-${m}-${String(lastDayDate.getDate()).padStart(2, '0')}`;
  const label = `${MM_MONTHS[month]} ${year}`;
  return { firstDay, lastDay, label };
}

export default function MonthlySummaryDetail() {
  const { month } = useParams();
  const navigate = useNavigate();
  const { colors } = useTheme();
  const [page, setPage] = useState(1);

  const { firstDay, lastDay, label } = parseMonth(month ?? '');

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['parcels-monthly-detail', month, page],
    queryFn: () => parcelService.list({ date_from: firstDay, date_to: lastDay, page, per_page: 50 }),
    enabled: !!month,
  });

  const parcels = (data?.data ?? []) as Parcel[];
  const meta = data?.meta;

  const feeMmk = parcels.filter((p) => p.currency === 'MMK').reduce((s, p) => s + Number(p.delivery_fee), 0);
  const feeThb = parcels.filter((p) => p.currency === 'THB').reduce((s, p) => s + Number(p.delivery_fee), 0);
  const codMmk = parcels.filter((p) => (p.cod_currency ?? p.currency) === 'MMK' && p.is_cod).reduce((s, p) => s + Number(p.cod_amount), 0);
  const codThb = parcels.filter((p) => (p.cod_currency ?? p.currency) === 'THB' && p.is_cod).reduce((s, p) => s + Number(p.cod_amount), 0);
  const uniqueSenders = new Set(parcels.map((p) => p.sender_phone).filter(Boolean)).size;
  const uniqueRecipients = new Set(parcels.map((p) => p.recipient_phone).filter(Boolean)).size;

  return (
    <div className="p-4 md:p-6 space-y-3">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="px-3 py-1.5 rounded border border-line text-sm">← နောက်</button>
        <div>
          <h1 className="text-lg font-bold text-ink">လစဉ် မှတ်တမ်း</h1>
          {label && <p className="text-xs text-ink-2">{label}</p>}
        </div>
      </div>

      {!isLoading && parcels.length > 0 && (
        <div className="card p-3 space-y-2">
          <div className="flex justify-around text-center">
            <div><div className="text-xl font-bold text-ink">{meta?.total ?? parcels.length}</div><div className="text-xs text-ink-2">ပါဆယ် ခု</div></div>
            <div><div className="text-xl font-bold text-ink">{uniqueSenders}</div><div className="text-xs text-ink-2">ပို့သူ ဦး</div></div>
            <div><div className="text-xl font-bold text-info">{uniqueRecipients}</div><div className="text-xs text-ink-2">လက်ခံသူ ဦး</div></div>
          </div>
          {(feeMmk > 0 || codMmk > 0 || feeThb > 0 || codThb > 0) && (
            <div className="flex flex-wrap justify-around text-center pt-2 border-t border-line">
              {feeMmk > 0 && <div><div className="font-bold text-ok">{feeMmk.toLocaleString()}</div><div className="text-xs text-ink-2">ပို့ဆောင်ခ (K)</div></div>}
              {codMmk > 0 && <div><div className="font-bold text-warn">{codMmk.toLocaleString()}</div><div className="text-xs text-ink-2">COD (K)</div></div>}
              {feeThb > 0 && <div><div className="font-bold text-ok">{feeThb.toLocaleString()}</div><div className="text-xs text-ink-2">ပို့ဆောင်ခ (฿)</div></div>}
              {codThb > 0 && <div><div className="font-bold text-warn">{codThb.toLocaleString()}</div><div className="text-xs text-ink-2">COD (฿)</div></div>}
            </div>
          )}
        </div>
      )}

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
                  <span className="text-sm font-bold text-ink">{Number(p.delivery_fee).toLocaleString()} {p.currency === 'THB' ? 'THB' : 'MMK'}</span>
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