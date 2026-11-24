import React, { useState, useMemo } from 'react';
import { PencilIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { parcelService } from '../services/parcelService';
import { userService } from '../services/userService';
import { printHtml } from '../lib/receipt';
import {
  STATUS_LABELS_MM, STATUS_COLORS, PRIORITY_LABELS_MM, PRIORITY_COLORS,
  STATUS_TRANSITIONS,
} from '../constants';
import ConfirmModal from '../components/ConfirmModal';
import ImagePreviewModal from '../components/ImagePreviewModal';

export default function ParcelDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  const numId = Number(id);
  const { data: parcel, isLoading, refetch } = useQuery({
    queryKey: ['parcel', id],
    queryFn: () => parcelService.get(numId),
  });

  const canChangeStatus = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'accountant';
  const canAssign = user?.role === 'admin' || user?.role === 'accountant';
  const canEditParcel = user?.role === 'admin' || user?.role === 'manager';

  const { data: staffList } = useQuery({
    queryKey: ['delivery-staff'],
    queryFn: () => userService.getDeliveryStaff(),
    enabled: canAssign,
  });

  const deleteMutation = useMutation({
    mutationFn: () => parcelService.delete(numId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parcels'] });
      navigate('/parcels');
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ status, reason }: { status: string; reason?: string }) =>
      parcelService.statusTransition(numId, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parcel', id] });
      queryClient.invalidateQueries({ queryKey: ['parcels'] });
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ staffId }: { staffId: number }) => parcelService.assign(numId, staffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parcel', id] });
      queryClient.invalidateQueries({ queryKey: ['parcels'] });
    },
  });

  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [proofPreviewVisible, setProofPreviewVisible] = useState(false);
  const [proofPreviewIndex, setProofPreviewIndex] = useState(0);
  const [staffSearch, setStaffSearch] = useState('');
  const [targetStatus, setTargetStatus] = useState<string | null>(null);
  const [transitionReason, setTransitionReason] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<{ id: number; name: string } | null>(null);

  const deliveryProofs = useMemo(() => {
    if (!parcel) return [];
    if (parcel.proof_photos && parcel.proof_photos.length > 0) {
      return parcel.proof_photos.map((p, idx) => ({
        id: p.id || `proof-${idx}`,
        url: p.file_url,
        notes: p.notes,
        recipient_name: p.recipient_name,
        attempted_at: p.attempted_at,
      }));
    }
    const list: any[] = [];
    parcel.delivery_attempts?.forEach((da: any) => {
      da.proof_photos?.forEach((p: any, idx: number) => {
        if (p.file_url) {
          list.push({
            id: p.id || `attempt-${da.id}-${idx}`,
            url: p.file_url,
            notes: p.notes || da.notes,
            recipient_name: da.recipient_name,
            attempted_at: da.attempted_at,
          });
        }
      });
    });
    return list;
  }, [parcel]);

  if (isLoading) return <div className="p-6 text-center text-ink-2">Loading...</div>;
  if (!parcel) return <div className="p-6 text-center text-ink-2">ပါဆယ် မတွေ့ပါ</div>;

  const statusColor = STATUS_COLORS[parcel.status] || '#6B7280';
  const statusLabel = STATUS_LABELS_MM[parcel.status] || parcel.status;
  const availableTransitions = (STATUS_TRANSITIONS[parcel.status] || []).filter((s) => s !== 'IN_TRANSIT');
  const isTerminal = parcel.status === 'DELIVERED' || parcel.status === 'DAMAGED';

  const buildReceiptHtml = () => {
    return `
      <html><head><meta charset="utf-8"/><style>
      body{font-family:sans-serif;padding:24px;color:#111827}
      h1{text-align:center;margin-bottom:4px} h2{text-align:center;color:#6B7280;font-size:14px;margin-top:0}
      .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #E5E7EB}
      .label{color:#6B7280;font-weight:600}.value{font-weight:700;text-align:right;max-width:60%}
      .section{margin-top:16px;font-size:16px;font-weight:800;color:#1F2937}
      .footer{text-align:center;margin-top:24px;color:#6B7280}
      </style></head><body>
      <h1>Royal Myawaddy Delivery</h1><h2>ပါဆယ် ဘောင်ချာ / Parcel Receipt</h2>
      <div class="section">ပါဆယ် အချက်အလက်</div>
      <div class="row"><span class="label">ခြေရာခံနံပါတ်</span><span class="value">${parcel.tracking_number}</span></div>
      <div class="row"><span class="label">အခြေအနေ</span><span class="value">${statusLabel}</span></div>
      <div class="row"><span class="label">ရက်စွဲ</span><span class="value">${new Date(parcel.created_at).toLocaleString()}</span></div>
      ${parcel.sender_name ? `<div class="row"><span class="label">ပေးပို့သူ</span><span class="value">${parcel.sender_name}</span></div>` : ''}
      ${parcel.sender_phone ? `<div class="row"><span class="label">ပေးပို့သူ ဖုန်း</span><span class="value">${parcel.sender_phone}</span></div>` : ''}
      <div class="row"><span class="label">လက်ခံသူ</span><span class="value">${parcel.recipient_name}</span></div>
      <div class="row"><span class="label">လက်ခံသူ ဖုန်း</span><span class="value">${parcel.recipient_phone}</span></div>
      <div class="row"><span class="label">လိပ်စာ</span><span class="value">${parcel.delivery_address}</span></div>
      <div class="row"><span class="label">ဦးစားပေးအဆင့်</span><span class="value">${PRIORITY_LABELS_MM[parcel.priority] || parcel.priority}</span></div>
      ${parcel.items && parcel.items.length ? `<div class="row"><span class="label">ထုတ်ကုန်များ</span><span class="value">${parcel.items.map((it: any) => `${it.product_name} x${it.quantity}`).join(', ')}</span></div>` : ''}
      ${parcel.weight ? `<div class="row"><span class="label">အလေးချိန်</span><span class="value">${parcel.weight} kg</span></div>` : ''}
      ${parcel.description ? `<div class="row"><span class="label">ဖော်ပြချက်</span><span class="value">${parcel.description}</span></div>` : ''}
      <div class="row"><span class="label">ပို့ဆောင်ခ</span><span class="value">${Number(parcel.delivery_fee).toLocaleString()} ${parcel.currency === 'THB' ? 'ဘတ်' : 'ကျပ်'}</span></div>
      ${parcel.is_cod ? `<div class="row"><span class="label">COD ပမာဏ</span><span class="value">${Number(parcel.cod_amount).toLocaleString()} ${(parcel.cod_currency ?? parcel.currency) === 'THB' ? 'ဘတ်' : 'ကျပ်'}</span></div>` : ''}
      ${parcel.active_assignment?.staff?.name ? `<div class="row"><span class="label">ချိတ်ဆက်ထားသောဝန်ထမ်း</span><span class="value">${parcel.active_assignment.staff.name}</span></div>` : ''}
      ${deliveryProofs.length > 0 ? `<div class="row"><span class="label">ပို့ဆောင်မှုသက်သေ</span><span class="value">${deliveryProofs.length} ပုံ</span></div>` : ''}
      <div class="footer">ကျေးဇူးတင်ပါသည်။</div>
      </body></html>`;
  };

  const filteredStaff = (staffList ?? []).filter((s: any) =>
    s.is_active && s.name.toLowerCase().includes(staffSearch.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="px-3 py-1.5 rounded border border-line text-sm">← နောက်</button>
        {canEditParcel && !isTerminal ? (
          <div className="flex gap-2">
            <button onClick={() => navigate(`/parcels/${id}/edit`)} className="px-3 py-1.5 rounded border border-line text-sm"><PencilIcon className="w-4 h-4" /></button>
            <button onClick={() => setDeleteOpen(true)} className="px-3 py-1.5 rounded border border-bad text-bad text-sm"><TrashIcon className="w-4 h-4" /></button>
          </div>
        ) : (
          <span />
        )}
      </div>

      {/* Images */}
      {parcel.images && parcel.images.length > 0 && (
        <div className="card p-3">
          <h3 className="section-label mb-2">ဓာတ်ပုံများ ({parcel.images.length})</h3>
          <div className="flex gap-2 overflow-x-auto">
            {parcel.images.map((img: any, index: number) => (
              <button
                key={img.id}
                onClick={() => { setPreviewIndex(index); setPreviewVisible(true); }}
                className="flex-shrink-0"
              >
                <img src={img.url} alt="" className="w-24 h-24 rounded object-cover" />
              </button>
            ))}
          </div>
          <ImagePreviewModal
            visible={previewVisible}
            images={parcel.images}
            initialIndex={previewIndex}
            onClose={() => setPreviewVisible(false)}
          />
        </div>
      )}

      {/* Info sections */}
      <InfoSection title="ပါဆယ် အချက်အလက်">
        <InfoRow label="ခြေရာခံနံပါတ်" value={parcel.tracking_number} />
        <InfoRow label="ဦးစားပေးအဆင့်" value={PRIORITY_LABELS_MM[parcel.priority] || parcel.priority} valueColor={PRIORITY_COLORS[parcel.priority]} />
        {parcel.description && <InfoRow label="ဖော်ပြချက်" value={parcel.description} />}
        {parcel.items && parcel.items.length > 0 && (
          <div className="py-2 border-b border-line">
            <div className="text-xs font-semibold text-ink-2 mb-1">ထုတ်ကုန်များ</div>
            {parcel.items.map((it: any, idx: number) => (
              <div key={idx} className="flex justify-between text-sm py-1">
                <span>{it.product_name}</span>
                <span className="font-bold">×{it.quantity}</span>
              </div>
            ))}
          </div>
        )}
        {parcel.weight && <InfoRow label="အလေးချိန်" value={`${parcel.weight} kg`} />}
        {Number(parcel.kg_fee) > 0 && <InfoRow label="Kg ဖိုး" value={`${Number(parcel.kg_fee).toLocaleString()} THB`} />}
      </InfoSection>

      <InfoSection title="ရက်စွဲများ">
        <InfoRow label="လက်ခံရက်စွဲ" value={new Date(parcel.received_at || parcel.created_at).toLocaleString()} />
        {parcel.status === 'DELIVERED' && (parcel.delivered_at || parcel.updated_at) && (
          <InfoRow label="ပို့ဆောင်ပြီးရက်စွဲ" value={new Date(parcel.delivered_at || parcel.updated_at).toLocaleString()} />
        )}
        {parcel.status === 'FAILED' && (parcel.failed_at || parcel.updated_at) && (
          <InfoRow label="မအောင်မြင်ရက်စွဲ" value={new Date(parcel.failed_at || parcel.updated_at).toLocaleString()} />
        )}
      </InfoSection>

      {(parcel.sender_name || parcel.sender_phone) && (
        <InfoSection title="ပေးပို့သူ">
          {parcel.sender_name && <InfoRow label="နာမည်" value={parcel.sender_name} />}
          {parcel.sender_phone && <InfoRow label="ဖုန်းနံပါတ်" value={parcel.sender_phone} />}
        </InfoSection>
      )}

      <InfoSection title="လက်ခံသူ">
        <InfoRow label="နာမည်" value={parcel.recipient_name} />
        <InfoRow label="ဖုန်းနံပါတ်" value={parcel.recipient_phone} />
        <InfoRow label="လိပ်စာ" value={parcel.delivery_address} />
      </InfoSection>

      <InfoSection title="ငွေကြေး">
        <InfoRow label="ငွေကြေးအမျိုး" value={parcel.currency === 'THB' ? 'Thai Baht (THB)' : 'ကျပ် (MMK)'} />
        <InfoRow label="ပို့ဆောင်ခ" value={`${Number(parcel.delivery_fee).toLocaleString()} ${parcel.currency === 'THB' ? 'THB' : 'MMK'}`} />
        {parcel.is_cod && <InfoRow label="COD ပမာဏ" value={`${Number(parcel.cod_amount).toLocaleString()} ${(parcel.cod_currency ?? parcel.currency) === 'THB' ? 'THB' : 'MMK'}`} />}
      </InfoSection>

      {parcel.active_assignment && (
        <InfoSection title="ချိတ်ဆက်ထားသောဝန်ထမ်း">
          <InfoRow label="ဝန်ထမ်း" value={parcel.active_assignment.staff?.name || '-'} />
        </InfoSection>
      )}

      {/* Delivery proof photos */}
      {deliveryProofs.length > 0 && (
        <div className="card p-3">
          <h3 className="section-label mb-2">ပို့ဆောင်ပြီးစီးမှု သက်သေ ({deliveryProofs.length})</h3>
          <div className="flex gap-2 overflow-x-auto">
            {deliveryProofs.map((proof: any, index: number) => (
              <button key={proof.id} onClick={() => { setProofPreviewIndex(index); setProofPreviewVisible(true); }} className="flex-shrink-0">
                <img src={proof.url} alt="" className="w-24 h-24 rounded object-cover" />
              </button>
            ))}
          </div>
          <ImagePreviewModal
            visible={proofPreviewVisible}
            images={deliveryProofs}
            initialIndex={proofPreviewIndex}
            onClose={() => setProofPreviewVisible(false)}
          />
        </div>
      )}

      {/* Status transitions */}
      {canChangeStatus && availableTransitions.length > 0 && (
        <div className="card p-3 space-y-2">
          <h3 className="section-label">အခြေအနေ ပြောင်းမည်</h3>
          <div className="flex flex-wrap gap-2">
            {availableTransitions.map((toStatus) => {
              const color = STATUS_COLORS[toStatus] || '#6B7280';
              const label = STATUS_LABELS_MM[toStatus] || toStatus;
              return (
                <button
                  key={toStatus}
                  onClick={() => { setTargetStatus(toStatus); setTransitionReason(''); }}
                  disabled={statusMutation.isPending}
                  className="px-3 py-1.5 rounded border text-sm font-semibold disabled:opacity-50"
                  style={{ color, borderColor: color }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Assign staff */}
      {canAssign && staffList && staffList.length > 0 && ['VERIFIED', 'IN_TRANSIT', 'FAILED'].includes(parcel.status) && (
        <div className="card p-3 space-y-2">
          <h3 className="section-label">{parcel.active_assignment ? 'ဝန်ထမ်း ပြောင်းချိတ်မည်' : 'ဝန်ထမ်းကို ချိတ်ဆက်မည်'}</h3>
          {parcel.active_assignment && (
            <div className="text-xs text-ink-2 mb-1">လက်ရှိ: {parcel.active_assignment.staff?.name}</div>
          )}
          <input
            className="field"
            placeholder="အမည်ဖြင့် ရှာရန်..."
            value={staffSearch}
            onChange={(e) => setStaffSearch(e.target.value)}
          />
          <div className="max-h-48 overflow-y-auto space-y-1">
            {filteredStaff.map((s: any) => {
              const isCurrent = parcel.active_assignment?.staff?.id === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setAssignTarget({ id: s.id, name: s.name })}
                  disabled={assignMutation.isPending}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-muted ${isCurrent ? 'bg-brand/10' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${isCurrent ? 'bg-brand' : 'bg-ink-3'}`}>
                    {s.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-ink">{s.name}</div>
                    {isCurrent && <div className="text-xs text-brand">လက်ရှိ ချိတ်ဆက်ထားသည်</div>}
                  </div>
                  <span className="text-ink-3">{isCurrent ? <CheckIcon className="w-4 h-4" /> : '>'}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Status history */}
      {parcel.status_histories && parcel.status_histories.length > 0 && (
        <div className="card p-3">
          <h3 className="section-label mb-2">အခြေအနေ မှတ်တမ်း</h3>
          <div className="space-y-2">
            {[...parcel.status_histories].reverse().map((h: any) => {
              const color = STATUS_COLORS[h.to_status] || '#6B7280';
              const label = STATUS_LABELS_MM[h.to_status] || h.to_status;
              return (
                <div key={h.id} className="flex gap-2">
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: color }} />
                  <div>
                    <div className="text-sm font-semibold" style={{ color }}>{label}</div>
                    {h.reason && <div className="text-xs text-ink-2">{h.reason}</div>}
                    <div className="text-xs text-ink-3">{new Date(h.created_at).toLocaleString()}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Receipt buttons */}
      <div className="flex gap-2">
        <button onClick={() => printHtml(buildReceiptHtml())} className="flex-1 bg-brand text-white py-2.5 rounded font-bold text-sm">
          ပါဆယ် ဘောင်ချာ ထုတ်ယူမည်
        </button>
        <button onClick={() => printHtml(buildReceiptHtml())} className="flex-1 bg-ok text-white py-2.5 rounded font-bold text-sm">
          PDF ဒေါင်းလုပ်မည်
        </button>
      </div>

      {/* Status change modal */}
      <ConfirmModal
        visible={!!targetStatus}
        onClose={() => { setTargetStatus(null); setTransitionReason(''); }}
        onConfirm={() => {
          if (!targetStatus) return;
          statusMutation.mutate(
            { status: targetStatus, reason: transitionReason.trim() || undefined },
            {
              onSuccess: () => { setTargetStatus(null); setTransitionReason(''); },
              onError: (err: any) => window.alert(err?.response?.data?.message || 'အခြေအနေ ပြောင်း၍ မရပါ'),
            }
          );
        }}
        title="အခြေအနေ ပြောင်းမည်"
        message={targetStatus ? `ပါဆယ်အခြေအနေကို "${STATUS_LABELS_MM[targetStatus] || targetStatus}" သို့ ပြောင်းလဲရန် သေချာပါသလား?` : ''}
        confirmText="ပြောင်းမည်"
        isLoading={statusMutation.isPending}
      >
        {targetStatus && (
          <div className="w-full space-y-2">
            <div className="flex items-center justify-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ color: statusColor, backgroundColor: statusColor + '18' }}>{statusLabel}</span>
              <span>→</span>
              <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ color: STATUS_COLORS[targetStatus], backgroundColor: STATUS_COLORS[targetStatus] + '18' }}>
                {STATUS_LABELS_MM[targetStatus] || targetStatus}
              </span>
            </div>
            {['FAILED', 'DAMAGED'].includes(targetStatus) && (
              <div>
                <label className="label">အကြောင်းအရင်း / မှတ်ချက်</label>
                <input className="field" value={transitionReason} onChange={(e) => setTransitionReason(e.target.value)} placeholder="အကြောင်းအရင်း ရိုက်ထည့်ပါ..." />
              </div>
            )}
          </div>
        )}
      </ConfirmModal>

      <ConfirmModal
        visible={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate(undefined, { onSuccess: () => setDeleteOpen(false), onError: (err: any) => window.alert(err?.response?.data?.message || 'ပါဆယ် ဖျက်၍ မရပါ') })}
        title="ပါဆယ် ဖျက်မည်"
        message="ဤပါဆယ်ကို အတည်ပြု ဖျက်မည်လား? ဤလုပ်ဆောင်ချက်ကို ပြန်လည်ပြင်ဆင်၍ မရနိုင်ပါ။"
        confirmText="ဖျက်မည်"
        isDestructive
        isLoading={deleteMutation.isPending}
      />

      <ConfirmModal
        visible={!!assignTarget}
        onClose={() => setAssignTarget(null)}
        onConfirm={() => {
          if (!assignTarget) return;
          assignMutation.mutate({ staffId: assignTarget.id }, {
            onSuccess: () => setAssignTarget(null),
            onError: (err: any) => window.alert(err?.response?.data?.message || 'ဝန်ထမ်း ချိတ်ဆက်၍ မရပါ'),
          });
        }}
        title={parcel.active_assignment ? 'ဝန်ထမ်း ပြောင်းချိတ်မည်' : 'ဝန်ထမ်း ချိတ်ဆက်မည်'}
        message={assignTarget ? (parcel.active_assignment ? `${parcel.active_assignment.staff?.name} မှ ${assignTarget.name} သို့ ပြောင်းချိတ်မည်လား?` : `${assignTarget.name} ကို ဤပါဆယ်နှင့် ချိတ်ဆက်မည်လား?`) : ''}
        confirmText={parcel.active_assignment ? 'ပြောင်းချိတ်မည်' : 'ချိတ်ဆက်မည်'}
        isLoading={assignMutation.isPending}
      />
    </div>
  );
}

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-3">
      <h3 className="section-label mb-2">{title}</h3>
      <div>{children}</div>
    </div>
  );
}

function InfoRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-line last:border-0 gap-2">
      <span className="text-xs text-ink-2 font-semibold">{label}</span>
      <span className="text-sm text-ink text-right" style={valueColor ? { color: valueColor, fontWeight: 700 } : {}}>
        {value}
      </span>
    </div>
  );
}