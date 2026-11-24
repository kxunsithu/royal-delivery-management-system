import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { parcelService, Parcel } from '../services/parcelService';
import { STATUS_LABELS_MM, STATUS_COLORS } from '../constants';
import {
  ArrowLeft,
  Phone,
  MapPin,
  Package,
  Plus,
  ChevronLeft,
  ChevronRight,
  Banknote,
} from 'lucide-react';

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
  const { data, isLoading } = useQuery({
    queryKey: ['customer-parcels', decodedPhone, page],
    queryFn: () => parcelService.list({ search: decodedPhone, page, per_page: 20 }),
    enabled: Boolean(decodedPhone),
  });

  const parcels = (data?.data ?? []) as Parcel[];
  const meta = data?.meta;

  const totalMMK = parcels
    .filter((p) => p.currency === 'MMK')
    .reduce((s, p) => s + Number(p.delivery_fee), 0);
  const totalTHB = parcels
    .filter((p) => p.currency === 'THB')
    .reduce((s, p) => s + Number(p.delivery_fee), 0);
  const codMMK = parcels
    .filter((p) => (p.cod_currency ?? p.currency) === 'MMK' && p.is_cod)
    .reduce((s, p) => s + Number(p.cod_amount), 0);
  const codTHB = parcels
    .filter((p) => (p.cod_currency ?? p.currency) === 'THB' && p.is_cod)
    .reduce((s, p) => s + Number(p.cod_amount), 0);

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
    <div className="p-3.5 sm:p-6 space-y-3.5 max-w-3xl mx-auto pb-28 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl border border-line bg-surface hover:bg-muted active:scale-95 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="text-center flex-1 min-w-0 px-2">
          <h1 className="text-base sm:text-lg font-black text-ink truncate">{decodedName}</h1>
          <p className="text-xs text-ink-2 font-mono">
            {decodedPhone} · {isRecipient ? 'လက်ခံသူ' : 'ပေးပို့သူ'}
          </p>
        </div>
        {canCreateParcel && (
          <button
            onClick={handleAddParcel}
            className="px-3.5 py-1.5 rounded-xl bg-brand text-white text-xs font-bold shadow-sm shadow-brand/20 active:scale-95 transition flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            <span>ပါဆယ်ထည့်</span>
          </button>
        )}
      </div>

      {/* Customer Contact & Summary */}
      <div className="card p-4 space-y-3 bg-gradient-to-br from-surface to-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-ink">{decodedName}</div>
            {decodedPhone && (
              <a
                href={`tel:${decodedPhone}`}
                className="inline-flex items-center gap-1.5 text-xs font-mono text-brand font-semibold hover:underline mt-0.5"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{decodedPhone}</span>
              </a>
            )}
          </div>
          {decodedPhone && (
            <a
              href={`tel:${decodedPhone}`}
              className="px-3 py-1.5 rounded-xl bg-brand text-white text-xs font-bold shadow-sm active:scale-95 transition flex items-center gap-1"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>ခေါ်ဆိုမည်</span>
            </a>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 text-center border-t border-line/60 pt-2.5 text-xs">
          <div>
            <div className="text-lg font-black text-ink">{meta?.total ?? parcels.length}</div>
            <div className="text-[10px] text-ink-3">ပါဆယ် စုစုပေါင်း</div>
          </div>
          <div>
            <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
              {totalMMK.toLocaleString()}
            </div>
            <div className="text-[10px] text-ink-3">MMK ပို့ဆောင်ခ</div>
          </div>
          <div>
            <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
              {totalTHB.toLocaleString()}
            </div>
            <div className="text-[10px] text-ink-3">THB ပို့ဆောင်ခ</div>
          </div>
        </div>

        {(codMMK > 0 || codTHB > 0) && (
          <div className="grid grid-cols-2 gap-2 text-center border-t border-line/40 pt-2 text-xs">
            {codMMK > 0 && (
              <div>
                <div className="text-sm font-black text-amber-600 dark:text-amber-400">
                  {codMMK.toLocaleString()} K
                </div>
                <div className="text-[10px] text-ink-3">COD (MMK)</div>
              </div>
            )}
            {codTHB > 0 && (
              <div>
                <div className="text-sm font-black text-amber-600 dark:text-amber-400">
                  {codTHB.toLocaleString()} ฿
                </div>
                <div className="text-[10px] text-ink-3">COD (THB)</div>
              </div>
            )}
          </div>
        )}
      </div>

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
                <div className="text-xs text-ink-3 truncate">📍 {p.delivery_address}</div>

                <div className="flex justify-between items-center pt-1 border-t border-line/60 text-xs">
                  <span className="text-[10px] text-ink-3">
                    {new Date(p.received_at || p.created_at).toLocaleDateString()}
                  </span>
                  <span className="font-black text-ink">
                    {Number(p.delivery_fee).toLocaleString()} {p.currency}
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
