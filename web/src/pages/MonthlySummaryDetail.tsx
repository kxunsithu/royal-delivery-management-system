import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { parcelService, Parcel } from '../services/parcelService';
import { STATUS_LABELS_MM, STATUS_COLORS } from '../constants';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Package,
} from 'lucide-react';

const MM_MONTHS = [
  'ဇန်နဝါရီ', 'ဖေဖော်ဝါရီ', 'မတ်', 'ဧပြီ', 'မေ', 'ဇွန်',
  'ဇူလိုင်', 'သြဂုတ်', 'စက်တင်ဘာ', 'အောက်တိုဘာ', 'နိုဝင်ဘာ', 'ဒီဇင်ဘာ',
];

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

  const { data, isLoading } = useQuery({
    queryKey: ['parcels-monthly-detail', month, page],
    queryFn: () => parcelService.list({ date_from: firstDay, date_to: lastDay, page, per_page: 50 }),
    enabled: Boolean(month),
  });

  const parcels = (data?.data ?? []) as Parcel[];
  const meta = data?.meta;

  const feeMmk = parcels
    .filter((p) => p.currency === 'MMK')
    .reduce((s, p) => s + Number(p.delivery_fee), 0);
  const feeThb = parcels
    .filter((p) => p.currency === 'THB')
    .reduce((s, p) => s + Number(p.delivery_fee), 0);
  const codMmk = parcels
    .filter((p) => (p.cod_currency ?? p.currency) === 'MMK' && p.is_cod)
    .reduce((s, p) => s + Number(p.cod_amount), 0);
  const codThb = parcels
    .filter((p) => (p.cod_currency ?? p.currency) === 'THB' && p.is_cod)
    .reduce((s, p) => s + Number(p.cod_amount), 0);
  const uniqueSenders = new Set(parcels.map((p) => p.sender_phone).filter(Boolean)).size;
  const uniqueRecipients = new Set(parcels.map((p) => p.recipient_phone)).size;

  return (
    <div className="p-3.5 sm:p-6 space-y-3.5 max-w-3xl mx-auto pb-28 md:pb-8">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl border border-line bg-surface hover:bg-muted active:scale-95 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-base sm:text-lg font-black text-ink">လစဉ် မှတ်တမ်း</h1>
          {label && <p className="text-xs text-ink-2">{label}</p>}
        </div>
      </div>

      {/* Summary Card */}
      {!isLoading && parcels.length > 0 && (
        <div className="card p-4 space-y-3 bg-gradient-to-br from-surface to-muted/30">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg sm:text-xl font-black text-ink">
                {meta?.total ?? parcels.length}
              </div>
              <div className="text-[10px] text-ink-3">ပါဆယ် ခု</div>
            </div>
            <div>
              <div className="text-lg sm:text-xl font-black text-ink">{uniqueSenders}</div>
              <div className="text-[10px] text-ink-3">ပို့သူ ဦး</div>
            </div>
            <div>
              <div className="text-lg sm:text-xl font-black text-blue-600 dark:text-blue-400">
                {uniqueRecipients}
              </div>
              <div className="text-[10px] text-ink-3">လက်ခံသူ ဦး</div>
            </div>
          </div>

          {(feeMmk > 0 || codMmk > 0 || feeThb > 0 || codThb > 0) && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-2.5 border-t border-line/60 text-xs">
              {feeMmk > 0 && (
                <div>
                  <div className="font-black text-emerald-600 dark:text-emerald-400">
                    {feeMmk.toLocaleString()} K
                  </div>
                  <div className="text-[10px] text-ink-3">ပို့ခ</div>
                </div>
              )}
              {codMmk > 0 && (
                <div>
                  <div className="font-black text-amber-600 dark:text-amber-400">
                    {codMmk.toLocaleString()} K
                  </div>
                  <div className="text-[10px] text-ink-3">COD</div>
                </div>
              )}
              {feeThb > 0 && (
                <div>
                  <div className="font-black text-emerald-600 dark:text-emerald-400">
                    {feeThb.toLocaleString()} ฿
                  </div>
                  <div className="text-[10px] text-ink-3">ပို့ခ</div>
                </div>
              )}
              {codThb > 0 && (
                <div>
                  <div className="font-black text-amber-600 dark:text-amber-400">
                    {codThb.toLocaleString()} ฿
                  </div>
                  <div className="text-[10px] text-ink-3">COD</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Parcels List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-4 h-24 bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2.5">
          {parcels.map((p) => {
            const statusColor = STATUS_COLORS[p.status] || '#6B7280';
            const statusLabel = STATUS_LABELS_MM[p.status] || p.status;
            return (
              <div
                key={p.id}
                onClick={() => navigate(`/parcels/${p.id}`)}
                className="card p-3.5 space-y-1.5 cursor-pointer hover:border-brand/40 active:scale-[0.99] transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold font-mono text-brand">
                    {p.tracking_number}
                  </span>
                  <span
                    className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                    style={{ color: statusColor, backgroundColor: statusColor + '18' }}
                  >
                    {statusLabel}
                  </span>
                </div>

                <div className="text-xs font-semibold text-ink">{p.recipient_name}</div>
                <div className="text-xs text-ink-2 font-mono">{p.recipient_phone}</div>
                <div className="text-xs text-ink-3 truncate">📍 {p.delivery_address}</div>

                <div className="flex justify-between items-center pt-1 border-t border-line/60 text-xs">
                  <span className="text-[10px] text-ink-3">
                    {new Date(p.received_at || p.created_at).toLocaleDateString()}
                  </span>
                  <span className="font-black text-ink">
                    {Number(p.delivery_fee).toLocaleString()} {p.currency === 'THB' ? '฿' : 'K'}
                  </span>
                </div>
              </div>
            );
          })}

          {parcels.length === 0 && (
            <div className="card p-8 text-center text-ink-3 text-xs">ပါဆယ် မတွေ့ပါ</div>
          )}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
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
