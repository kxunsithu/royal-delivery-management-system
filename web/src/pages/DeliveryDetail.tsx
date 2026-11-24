import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { deliveryService } from '../services/deliveryService';
import { STATUS_LABELS_MM, STATUS_COLORS } from '../constants';
import ImagePreviewModal from '../components/ImagePreviewModal';

export default function DeliveryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { colors } = useTheme();
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImages, setPreviewImages] = useState<any[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);

  const { data: assignment, isLoading } = useQuery({
    queryKey: ['assignment', id],
    queryFn: () => deliveryService.getAssignment(Number(id)),
  });

  if (isLoading) return <div className="p-6 text-center text-ink-2">Loading...</div>;
  if (!assignment) return <div className="p-6 text-center text-ink-2">မတွေ့ပါ</div>;

  const parcel = assignment.parcel;
  const parcelStatus = parcel?.status ?? '';
  const statusColor = STATUS_COLORS[parcelStatus] || '#6B7280';
  const statusLabel = STATUS_LABELS_MM[parcelStatus] || parcelStatus;
  const isActive = !['COMPLETED', 'FAILED', 'REASSIGNED'].includes(assignment.status ?? '');
  const assignmentStatusLabel = assignment.status === 'COMPLETED' ? 'ပြီးစီး' : assignment.status === 'FAILED' ? 'မအောင်မြင်' : assignment.status === 'REASSIGNED' ? 'ပြောင်းလဲ' : 'ဆောင်ရွက်နေ';

  function openImages(imgs: any[], idx: number) {
    setPreviewImages(imgs.map((im: any, i: number) => ({ id: im.id || i, url: im.url || im.file_url })));
    setPreviewIndex(idx);
    setPreviewVisible(true);
  }

  return (
    <div className="p-4 md:p-6 space-y-3 max-w-3xl mx-auto">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="px-3 py-1.5 rounded border border-line text-sm">← နောက်</button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-ink">{parcel?.tracking_number || 'ချိတ်ဆက်မှု'}</h1>
          {assignment.staff && <p className="text-xs text-ink-2">{assignment.staff.name}</p>}
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ color: statusColor, backgroundColor: statusColor + '18' }}>{statusLabel}</span>
      </div>

      <div className="card p-3 space-y-1">
        <h3 className="section-label">ပါဆယ် အချက်အလက်</h3>
        <Row label="ခြေရာခံ" value={parcel?.tracking_number || '—'} />
        <Row label="လက်ခံသူ" value={parcel?.recipient_name || '—'} />
        <Row label="ဖုန်းနံပါတ်" value={parcel?.recipient_phone || '—'} />
        <Row label="လိပ်စာ" value={parcel?.delivery_address || '—'} />
        {parcel?.items && parcel.items.length > 0 && (
          <div className="py-2 border-b border-line">
            <div className="text-xs font-semibold text-ink-2 mb-1">ထုတ်ကုန်များ</div>
            {parcel.items.map((it: any, idx: number) => (
              <div key={idx} className="flex justify-between text-sm py-0.5">
                <span>{it.product_name}</span>
                <span className="font-bold">×{it.quantity}</span>
              </div>
            ))}
          </div>
        )}
        {parcel?.description && <Row label="ဖော်ပြချက်" value={parcel.description} />}
        {parcel?.received_at && <Row label="လက်ခံရက်" value={new Date(parcel.received_at).toLocaleString()} />}
        {parcel?.status === 'DELIVERED' && (parcel?.delivered_at || parcel?.updated_at) && <Row label="ပို့ဆောင်ပြီးရက်" value={new Date((parcel.delivered_at || parcel.updated_at)!).toLocaleString()} />}
        {parcel?.status === 'FAILED' && (parcel?.failed_at || parcel?.updated_at) && <Row label="မအောင်မြင်ရက်" value={new Date((parcel.failed_at || parcel.updated_at)!).toLocaleString()} />}
      </div>

      {parcel && (Number(parcel.delivery_fee) > 0 || parcel.is_cod) && (
        <div className="card p-3 space-y-1">
          <h3 className="section-label">ငွေကြေး အချက်အလက်</h3>
          {Number(parcel.delivery_fee) > 0 && <Row label="ပို့ဆောင်ခ" value={`${Number(parcel.delivery_fee).toLocaleString()} ${parcel.currency === 'THB' ? '฿' : 'K'}`} />}
          {Number(parcel.kg_fee) > 0 && <Row label="Kg ဖိုး" value={`${Number(parcel.kg_fee).toLocaleString()} THB`} />}
          {parcel.is_cod && <Row label="COD" value={`${Number(parcel.cod_amount).toLocaleString()} ${(parcel.cod_currency ?? parcel.currency) === 'THB' ? '฿' : 'K'}`} />}
          <Row label="ငွေကြေး" value={parcel.currency === 'THB' ? 'ထိုင်းဘတ် (฿)' : 'ကျပ် (K)'} />
        </div>
      )}

      {parcel?.images && parcel.images.length > 0 && (
        <div className="card p-3">
          <h3 className="section-label mb-2">ပါဆယ် ဓာတ်ပုံများ ({parcel.images.length})</h3>
          <div className="flex gap-2 overflow-x-auto">
            {parcel.images.map((img: any, idx: number) => (
              <button key={img.id || idx} onClick={() => openImages(parcel.images || [], idx)} className="flex-shrink-0">
                <img src={img.url} alt="" className="w-20 h-20 rounded object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="card p-3 space-y-1">
        <h3 className="section-label">ချိတ်ဆက်မှု အချက်အလက်</h3>
        {assignment.staff && <Row label="ဝန်ထမ်း" value={assignment.staff.name} />}
        {assignment.assigned_by && <Row label="ချိတ်ဆက်သူ" value={assignment.assigned_by.name} />}
        {assignment.assigned_at && <Row label="ချိတ်ဆက်ရက်" value={new Date(assignment.assigned_at).toLocaleString()} />}
        <Row label="အခြေအနေ" value={assignmentStatusLabel} />
      </div>

      {assignment.delivery_attempts && assignment.delivery_attempts.length > 0 && (
        <div className="card p-3">
          <h3 className="section-label mb-2">ပို့ဆောင်ကြိုးပမ်းမှုများ ({assignment.delivery_attempts.length})</h3>
          <div className="space-y-2">
            {[...assignment.delivery_attempts].reverse().map((attempt: any, i: number) => {
              const delivered = attempt.result === 'DELIVERED';
              return (
                <div key={attempt.id ?? i} className="border border-line rounded p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${delivered ? 'bg-ok-bg text-ok' : 'bg-bad-bg text-bad'}`}>
                      {delivered ? 'ပို့ဆောင်ပြီး' : 'မအောင်မြင်'}
                    </span>
                    <span className="text-xs text-ink-3">{new Date(attempt.attempted_at).toLocaleString()}</span>
                  </div>
                  {attempt.failure_reason && <div className="text-xs text-ink-2">{attempt.failure_reason}</div>}
                  {attempt.recipient_name && <div className="text-xs text-ink-2">{attempt.recipient_name}</div>}
                  {attempt.notes && <div className="text-xs text-ink-2 italic">{attempt.notes}</div>}
                  {attempt.proof_photos && attempt.proof_photos.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-ink-2 mb-1">သက်သေဓာတ်ပုံ ({attempt.proof_photos.length})</div>
                      <div className="flex gap-2">
                        {attempt.proof_photos.map((p: any, pIdx: number) => (
                          <button key={p.id || pIdx} onClick={() => openImages(attempt.proof_photos.map((x: any) => ({ url: x.file_url })), pIdx)} className="flex-shrink-0">
                            <img src={p.file_url} alt="" className="w-16 h-16 rounded object-cover" />
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

      {isActive && (
        <button onClick={() => navigate(`/deliveries/${id}/attempt`)} className="w-full bg-brand text-white py-3 rounded font-bold">
          ရလဒ် မှတ်တမ်းတင်မည်
        </button>
      )}

      <ImagePreviewModal visible={previewVisible} images={previewImages} initialIndex={previewIndex} onClose={() => setPreviewVisible(false)} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1 border-b border-line last:border-0 gap-2">
      <span className="text-xs text-ink-2 font-semibold">{label}</span>
      <span className="text-sm text-ink text-right">{value}</span>
    </div>
  );
}