import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { deliveryService } from '../services/deliveryService';
import { STATUS_LABELS_MM, STATUS_COLORS } from '../constants';
import ImagePreviewModal from '../components/ImagePreviewModal';
import {
  ArrowLeft,
  Phone,
  MapPin,
  Package,
  Banknote,
  RotateCcw,
  User,
  Calendar,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
} from 'lucide-react';

export default function DeliveryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { colors } = useTheme();
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImages, setPreviewImages] = useState<any[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const { data: assignment, isLoading } = useQuery({
    queryKey: ['assignment', id],
    queryFn: () => deliveryService.getAssignment(Number(id)),
  });

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-3 max-w-2xl mx-auto">
        <div className="h-20 rounded-2xl bg-muted animate-pulse" />
        <div className="h-44 rounded-2xl bg-muted animate-pulse" />
        <div className="h-32 rounded-2xl bg-muted animate-pulse" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="p-8 text-center text-ink-2 max-w-md mx-auto">
        <div className="text-sm font-bold">ပို့ဆောင်မှု အချက်အလက် မတွေ့ပါ</div>
        <button
          onClick={() => navigate(-1)}
          className="mt-3 px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold"
        >
          ပြန်သွားမည်
        </button>
      </div>
    );
  }

  const parcel = assignment.parcel;
  const parcelStatus = parcel?.status ?? '';
  const statusColor = STATUS_COLORS[parcelStatus] || '#6B7280';
  const statusLabel = STATUS_LABELS_MM[parcelStatus] || parcelStatus;
  const isActive = !['COMPLETED', 'FAILED', 'REASSIGNED'].includes(assignment.status ?? '');
  const assignmentStatusLabel =
    assignment.status === 'COMPLETED'
      ? 'ပြီးစီး'
      : assignment.status === 'FAILED'
      ? 'မအောင်မြင်'
      : assignment.status === 'REASSIGNED'
      ? 'ပြောင်းလဲ'
      : 'ဆောင်ရွက်ဆဲ';

  function openImages(imgs: any[], idx: number) {
    setPreviewImages(imgs.map((im: any, i: number) => ({ id: im.id || i, url: im.url || im.file_url })));
    setPreviewIndex(idx);
    setPreviewVisible(true);
  }

  function copyAddress() {
    if (!parcel?.delivery_address) return;
    navigator.clipboard?.writeText(parcel.delivery_address);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 1500);
  }

  return (
    <div className="p-3.5 sm:p-6 space-y-3 max-w-2xl mx-auto pb-28 md:pb-8">
      {/* Top Header */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl border border-line bg-surface hover:bg-muted active:scale-95 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base sm:text-lg font-black text-ink font-mono truncate">
            {parcel?.tracking_number || 'ချိတ်ဆက်မှု'}
          </h1>
          {assignment.staff && (
            <p className="text-xs text-ink-2 font-medium">👤 ဝန်ထမ်း: {assignment.staff.name}</p>
          )}
        </div>
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
          style={{ color: statusColor, backgroundColor: statusColor + '18' }}
        >
          {statusLabel}
        </span>
      </div>

      {/* Customer Contact Card */}
      <div className="card p-4 space-y-3 bg-gradient-to-br from-surface to-muted/30">
        <div className="text-[11px] font-bold uppercase tracking-wider text-ink-3">
          လက်ခံသူ ဆက်သွယ်ရန်
        </div>

        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-base font-bold text-ink truncate">{parcel?.recipient_name || '—'}</div>
            <div className="text-xs text-ink-2 font-mono">{parcel?.recipient_phone || '—'}</div>
          </div>

          {parcel?.recipient_phone && (
            <a
              href={`tel:${parcel.recipient_phone}`}
              className="px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold shadow-sm shadow-brand/20 flex items-center gap-1.5 active:scale-95 transition touch-press"
            >
              <Phone className="w-4 h-4" />
              <span>ဖုန်းခေါ်မည်</span>
            </a>
          )}
        </div>

        {/* Address Row with Copy */}
        <div className="p-3 rounded-xl bg-surface border border-line flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <MapPin className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" />
            <div className="text-xs text-ink break-words">{parcel?.delivery_address || '—'}</div>
          </div>
          <button
            onClick={copyAddress}
            className="p-1.5 rounded-lg border border-line text-ink-3 hover:text-ink active:scale-95 transition flex-shrink-0"
            title="Copy address"
          >
            {copiedAddress ? <Check className="w-3.5 h-3.5 text-ok" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Financial Details */}
      {parcel && (Number(parcel.delivery_fee) > 0 || parcel.is_cod) && (
        <div className="card p-3.5 space-y-2">
          <div className="section-label">ငွေကြေး အချက်အလက်</div>
          <div className="grid grid-cols-2 gap-2 text-center">
            {Number(parcel.delivery_fee) > 0 && (
              <div className="p-2.5 rounded-xl bg-muted/40">
                <div className="text-xs text-ink-2 font-medium">ပို့ဆောင်ခ</div>
                <div className="text-base font-black text-ink mt-0.5">
                  {Number(parcel.delivery_fee).toLocaleString()} {parcel.currency === 'THB' ? '฿' : 'K'}
                </div>
              </div>
            )}
            {parcel.is_cod && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-200 dark:border-amber-900/40">
                <div className="text-xs font-bold text-amber-700 dark:text-amber-400">COD ကောက်ခံရန်</div>
                <div className="text-base font-black text-amber-700 dark:text-amber-400 mt-0.5">
                  {Number(parcel.cod_amount).toLocaleString()} {(parcel.cod_currency ?? parcel.currency) === 'THB' ? '฿' : 'K'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Parcel Info */}
      <div className="card p-3.5 space-y-1.5">
        <div className="section-label">ပါဆယ် အချက်အလက်</div>
        {parcel?.description && <Row label="ဖော်ပြချက်" value={parcel.description} />}
        {parcel?.items && parcel.items.length > 0 && (
          <div className="py-2 border-b border-line/60">
            <div className="text-xs font-semibold text-ink-2 mb-1">ထုတ်ကုန်များ</div>
            {parcel.items.map((it: any, idx: number) => (
              <div key={idx} className="flex justify-between text-xs py-1">
                <span className="text-ink">{it.product_name}</span>
                <span className="font-bold text-brand">×{it.quantity}</span>
              </div>
            ))}
          </div>
        )}
        {parcel?.received_at && (
          <Row label="လက်ခံရက်" value={new Date(parcel.received_at).toLocaleString()} />
        )}
        {parcel?.status === 'DELIVERED' && (parcel?.delivered_at || parcel?.updated_at) && (
          <Row label="ပို့ဆောင်ပြီးရက်" value={new Date((parcel.delivered_at || parcel.updated_at)!).toLocaleString()} />
        )}
        {parcel?.status === 'FAILED' && (parcel?.failed_at || parcel?.updated_at) && (
          <Row label="မအောင်မြင်ရက်" value={new Date((parcel.failed_at || parcel.updated_at)!).toLocaleString()} />
        )}
      </div>

      {/* Parcel Photos */}
      {parcel?.images && parcel.images.length > 0 && (
        <div className="card p-3.5">
          <div className="section-label mb-2">ပါဆယ် ဓာတ်ပုံများ ({parcel.images.length})</div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {parcel.images.map((img: any, idx: number) => (
              <button
                key={img.id || idx}
                onClick={() => openImages(parcel.images || [], idx)}
                className="flex-shrink-0 active:scale-95 transition"
              >
                <img
                  src={img.url}
                  alt=""
                  className="w-20 h-20 rounded-xl object-cover border border-line"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Assignment Info */}
      <div className="card p-3.5 space-y-1.5">
        <div className="section-label">ချိတ်ဆက်မှု အချက်အလက်</div>
        {assignment.staff && <Row label="တာဝန်ကျ ဝန်ထမ်း" value={assignment.staff.name} />}
        {assignment.assigned_by && <Row label="ချိတ်ဆက်သူ" value={assignment.assigned_by.name} />}
        {assignment.assigned_at && (
          <Row label="ချိတ်ဆက်ရက်" value={new Date(assignment.assigned_at).toLocaleString()} />
        )}
        <Row label="အခြေအနေ" value={assignmentStatusLabel} />
      </div>

      {/* Delivery Attempts History */}
      {assignment.delivery_attempts && assignment.delivery_attempts.length > 0 && (
        <div className="card p-3.5">
          <div className="section-label mb-2">
            ပို့ဆောင်ကြိုးပမ်းမှု မှတ်တမ်း ({assignment.delivery_attempts.length})
          </div>
          <div className="space-y-2.5">
            {[...assignment.delivery_attempts].reverse().map((attempt: any, i: number) => {
              const delivered = attempt.result === 'DELIVERED';
              return (
                <div
                  key={attempt.id ?? i}
                  className="border border-line rounded-xl p-3 bg-muted/30 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        delivered
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                          : 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                      }`}
                    >
                      {delivered ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      <span>{delivered ? 'ပို့ဆောင်ပြီး' : 'မအောင်မြင်'}</span>
                    </span>
                    <span className="text-[10px] text-ink-3">
                      {new Date(attempt.attempted_at).toLocaleString()}
                    </span>
                  </div>

                  {attempt.failure_reason && (
                    <div className="text-xs text-rose-600 font-semibold">
                      အကြောင်းအရင်း: {attempt.failure_reason}
                    </div>
                  )}
                  {attempt.recipient_name && (
                    <div className="text-xs text-ink-2">လက်ခံသူ: {attempt.recipient_name}</div>
                  )}
                  {attempt.notes && (
                    <div className="text-xs text-ink-2 italic">မှတ်ချက်: {attempt.notes}</div>
                  )}

                  {attempt.proof_photos && attempt.proof_photos.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-line/60">
                      <div className="text-[10px] font-semibold text-ink-3 mb-1.5">
                        သက်သေဓာတ်ပုံ ({attempt.proof_photos.length})
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                        {attempt.proof_photos.map((p: any, pIdx: number) => (
                          <button
                            key={p.id || pIdx}
                            onClick={() =>
                              openImages(
                                attempt.proof_photos.map((x: any) => ({ url: x.file_url })),
                                pIdx
                              )
                            }
                            className="flex-shrink-0"
                          >
                            <img
                              src={p.file_url}
                              alt=""
                              className="w-16 h-16 rounded-xl object-cover border border-line"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STICKY BOTTOM ACTION BAR ON MOBILE */}
      {isActive && (
        <div className="fixed bottom-0 left-0 right-0 z-30 p-3 bg-surface/95 backdrop-blur-md border-t border-line pb-safe md:static md:p-0 md:bg-transparent md:border-0">
          <button
            onClick={() => navigate(`/deliveries/${id}/attempt`)}
            className="w-full bg-brand hover:bg-brand-dark text-white py-3.5 rounded-2xl font-black text-sm shadow-lg shadow-brand/25 flex items-center justify-center gap-2 active:scale-98 transition touch-press"
          >
            <RotateCcw className="w-5 h-5" />
            <span>ရလဒ် မှတ်တမ်းတင်မည်</span>
          </button>
        </div>
      )}

      <ImagePreviewModal
        visible={previewVisible}
        images={previewImages}
        initialIndex={previewIndex}
        onClose={() => setPreviewVisible(false)}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-line/50 last:border-0 gap-2 text-xs">
      <span className="text-ink-2 font-medium">{label}</span>
      <span className="text-ink text-right font-semibold">{value}</span>
    </div>
  );
}
