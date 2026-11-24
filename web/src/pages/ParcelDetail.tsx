import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { parcelService } from '../services/parcelService';
import { userService } from '../services/userService';
import { printHtml } from '../lib/receipt';
import {
  STATUS_LABELS_MM,
  STATUS_COLORS,
  PRIORITY_LABELS_MM,
  PRIORITY_COLORS,
  STATUS_TRANSITIONS,
} from '../constants';
import ConfirmModal from '../components/ConfirmModal';
import ImagePreviewModal from '../components/ImagePreviewModal';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Phone,
  Printer,
  FileDown,
  User,
  MapPin,
  Check,
  ChevronRight,
  Package,
  Calendar,
  Banknote,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export default function ParcelDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  const numId = Number(id);
  const { data: parcel, isLoading } = useQuery({
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

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-3 max-w-3xl mx-auto">
        <div className="h-20 rounded-2xl bg-muted animate-pulse" />
        <div className="h-44 rounded-2xl bg-muted animate-pulse" />
      </div>
    );
  }

  if (!parcel) {
    return (
      <div className="p-8 text-center text-ink-2 max-w-md mx-auto">
        <div className="text-sm font-bold">ပါဆယ် မတွေ့ပါ</div>
        <button
          onClick={() => navigate('/parcels')}
          className="mt-3 px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold"
        >
          ပါဆယ်များသို့ ပြန်သွားမည်
        </button>
      </div>
    );
  }

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
    <div className="p-3.5 sm:p-6 space-y-3.5 max-w-3xl mx-auto pb-28 md:pb-8">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl border border-line bg-surface hover:bg-muted active:scale-95 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-black font-mono text-brand truncate">
              {parcel.tracking_number}
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className="text-[11px] font-bold px-2 py-0.2 rounded-full"
                style={{ color: statusColor, backgroundColor: statusColor + '18' }}
              >
                {statusLabel}
              </span>
            </div>
          </div>
        </div>

        {canEditParcel && !isTerminal && (
          <div className="flex gap-1.5">
            <button
              onClick={() => navigate(`/parcels/${id}/edit`)}
              className="p-2 rounded-xl border border-line bg-surface hover:bg-muted active:scale-95 transition"
              title="ပြင်ဆင်ရန်"
            >
              <Pencil className="w-4 h-4 text-ink" />
            </button>
            <button
              onClick={() => setDeleteOpen(true)}
              className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/30 text-rose-600 hover:bg-rose-100 active:scale-95 transition"
              title="ဖျက်မည်"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Recipient & Sender Cards */}
      <div className="card p-4 space-y-3">
        <div className="section-label">လက်ခံသူ (Recipient)</div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-base font-bold text-ink">{parcel.recipient_name}</div>
            <div className="text-xs text-ink-2 font-mono">{parcel.recipient_phone}</div>
          </div>
          {parcel.recipient_phone && (
            <a
              href={`tel:${parcel.recipient_phone}`}
              className="px-3.5 py-2 rounded-xl bg-brand text-white text-xs font-bold shadow-sm shadow-brand/20 flex items-center gap-1.5 active:scale-95 transition"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>ဖုန်းခေါ်မည်</span>
            </a>
          )}
        </div>
        <div className="p-2.5 rounded-xl bg-muted/40 text-xs text-ink flex items-start gap-2">
          <MapPin className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" />
          <span>{parcel.delivery_address}</span>
        </div>
      </div>

      {(parcel.sender_name || parcel.sender_phone) && (
        <div className="card p-4 space-y-2">
          <div className="section-label">ပေးပို့သူ (Sender)</div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-ink">{parcel.sender_name || '—'}</div>
              <div className="text-xs text-ink-2 font-mono">{parcel.sender_phone || '—'}</div>
            </div>
            {parcel.sender_phone && (
              <a
                href={`tel:${parcel.sender_phone}`}
                className="px-3 py-1.5 rounded-xl border border-line bg-surface text-ink text-xs font-semibold hover:bg-muted active:scale-95 transition flex items-center gap-1"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>ဖုန်းခေါ်မည်</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Financial Info Card */}
      <div className="card p-4 space-y-2.5">
        <div className="section-label">ငွေကြေး အချက်အလက်</div>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-3 rounded-xl bg-muted/40">
            <div className="text-xs text-ink-3">ပို့ဆောင်ခ</div>
            <div className="text-base font-black text-ink mt-0.5">
              {Number(parcel.delivery_fee).toLocaleString()} {parcel.currency === 'THB' ? '฿' : 'K'}
            </div>
          </div>
          {parcel.is_cod && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-200 dark:border-amber-900/40">
              <div className="text-xs font-bold text-amber-700 dark:text-amber-400">COD ကောက်ခံရန်</div>
              <div className="text-base font-black text-amber-700 dark:text-amber-400 mt-0.5">
                {Number(parcel.cod_amount).toLocaleString()} {(parcel.cod_currency ?? parcel.currency) === 'THB' ? '฿' : 'K'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Parcel Details */}
      <div className="card p-4 space-y-2">
        <div className="section-label">ပါဆယ် အချက်အလက်</div>
        {parcel.description && <InfoRow label="ဖော်ပြချက်" value={parcel.description} />}
        {parcel.items && parcel.items.length > 0 && (
          <div className="py-2 border-b border-line/60">
            <div className="text-xs font-semibold text-ink-2 mb-1">ထုတ်ကုန်များ</div>
            {parcel.items.map((it: any, idx: number) => (
              <div key={idx} className="flex justify-between text-xs py-1">
                <span>{it.product_name}</span>
                <span className="font-bold text-brand">×{it.quantity}</span>
              </div>
            ))}
          </div>
        )}
        {parcel.weight && <InfoRow label="အလေးချိန်" value={`${parcel.weight} kg`} />}
        {Number(parcel.kg_fee) > 0 && <InfoRow label="Kg ဖိုး" value={`${Number(parcel.kg_fee).toLocaleString()} THB`} />}
        <InfoRow label="ဦးစားပေးအဆင့်" value={PRIORITY_LABELS_MM[parcel.priority] || parcel.priority} valueColor={PRIORITY_COLORS[parcel.priority]} />
        <InfoRow label="လက်ခံရက်စွဲ" value={new Date(parcel.received_at || parcel.created_at).toLocaleString()} />
        {parcel.status === 'DELIVERED' && (parcel.delivered_at || parcel.updated_at) && (
          <InfoRow label="ပို့ဆောင်ပြီးရက်" value={new Date(parcel.delivered_at || parcel.updated_at).toLocaleString()} />
        )}
      </div>

      {/* Photos */}
      {parcel.images && parcel.images.length > 0 && (
        <div className="card p-4">
          <div className="section-label mb-2">ဓာတ်ပုံများ ({parcel.images.length})</div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {parcel.images.map((img: any, index: number) => (
              <button
                key={img.id}
                onClick={() => {
                  setPreviewIndex(index);
                  setPreviewVisible(true);
                }}
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
          <ImagePreviewModal
            visible={previewVisible}
            images={parcel.images}
            initialIndex={previewIndex}
            onClose={() => setPreviewVisible(false)}
          />
        </div>
      )}

      {/* Delivery proofs */}
      {deliveryProofs.length > 0 && (
        <div className="card p-4">
          <div className="section-label mb-2">ပို့ဆောင်ပြီးစီးမှု သက်သေ ({deliveryProofs.length})</div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {deliveryProofs.map((proof: any, index: number) => (
              <button
                key={proof.id}
                onClick={() => {
                  setProofPreviewIndex(index);
                  setProofPreviewVisible(true);
                }}
                className="flex-shrink-0 active:scale-95 transition"
              >
                <img
                  src={proof.url}
                  alt=""
                  className="w-20 h-20 rounded-xl object-cover border border-line"
                />
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

      {/* Status Transitions */}
      {canChangeStatus && availableTransitions.length > 0 && (
        <div className="card p-4 space-y-2">
          <div className="section-label">အခြေအနေ ပြောင်းမည်</div>
          <div className="flex flex-wrap gap-2">
            {availableTransitions.map((toStatus) => {
              const color = STATUS_COLORS[toStatus] || '#6B7280';
              const label = STATUS_LABELS_MM[toStatus] || toStatus;
              return (
                <button
                  key={toStatus}
                  onClick={() => {
                    setTargetStatus(toStatus);
                    setTransitionReason('');
                  }}
                  disabled={statusMutation.isPending}
                  className="px-3.5 py-2 rounded-xl border text-xs font-bold transition active:scale-95"
                  style={{ color, borderColor: color }}
                >
                  {label} သို့ ပြောင်းမည်
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Assign Staff */}
      {canAssign && staffList && staffList.length > 0 && ['VERIFIED', 'IN_TRANSIT', 'FAILED'].includes(parcel.status) && (
        <div className="card p-4 space-y-2.5">
          <div className="section-label">
            {parcel.active_assignment ? 'ဝန်ထမ်း ပြောင်းချိတ်မည်' : 'ဝန်ထမ်းကို ချိတ်ဆက်မည်'}
          </div>
          {parcel.active_assignment && (
            <div className="text-xs text-ink-2 font-medium">
              လက်ရှိ ချိတ်ဆက်ထားသူ: <span className="font-bold text-ink">{parcel.active_assignment.staff?.name}</span>
            </div>
          )}
          <input
            className="field text-xs"
            placeholder="ဝန်ထမ်းအမည်ဖြင့် ရှာရန်..."
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
                  className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-muted active:scale-98 transition ${
                    isCurrent ? 'bg-brand/10' : ''
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      isCurrent ? 'bg-brand' : 'bg-ink-3'
                    }`}
                  >
                    {s.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-ink truncate">{s.name}</div>
                    {isCurrent && <div className="text-[10px] text-brand">လက်ရှိ တာဝန်ကျသူ</div>}
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-3" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Print receipt action buttons */}
      <div className="grid grid-cols-2 gap-2 pt-2">
        <button
          onClick={() => printHtml(buildReceiptHtml())}
          className="py-3 rounded-2xl bg-brand text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 active:scale-98 transition"
        >
          <Printer className="w-4 h-4" />
          <span>ဘောင်ချာ ထုတ်မည်</span>
        </button>
        <button
          onClick={() => printHtml(buildReceiptHtml())}
          className="py-3 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 active:scale-98 transition"
        >
          <FileDown className="w-4 h-4" />
          <span>PDF ဒေါင်းလုပ်</span>
        </button>
      </div>

      {/* Confirm Status Transition Modal */}
      <ConfirmModal
        visible={Boolean(targetStatus)}
        onClose={() => {
          setTargetStatus(null);
          setTransitionReason('');
        }}
        onConfirm={() => {
          if (!targetStatus) return;
          statusMutation.mutate(
            { status: targetStatus, reason: transitionReason.trim() || undefined },
            {
              onSuccess: () => {
                setTargetStatus(null);
                setTransitionReason('');
              },
              onError: (err: any) =>
                window.alert(err?.response?.data?.message || 'အခြေအနေ ပြောင်း၍ မရပါ'),
            }
          );
        }}
        title="အခြေအနေ ပြောင်းမည်"
        message={
          targetStatus
            ? `ပါဆယ်အခြေအနေကို "${STATUS_LABELS_MM[targetStatus] || targetStatus}" သို့ ပြောင်းမည်လား?`
            : ''
        }
        confirmText="ပြောင်းမည်"
        isLoading={statusMutation.isPending}
      >
        {targetStatus && ['FAILED', 'DAMAGED'].includes(targetStatus) && (
          <div className="w-full space-y-1.5 mt-2">
            <label className="label">အကြောင်းအရင်း / မှတ်ချက်</label>
            <input
              className="field"
              value={transitionReason}
              onChange={(e) => setTransitionReason(e.target.value)}
              placeholder="အကြောင်းအရင်း ရိုက်ထည့်ပါ..."
            />
          </div>
        )}
      </ConfirmModal>

      {/* Delete Modal */}
      <ConfirmModal
        visible={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() =>
          deleteMutation.mutate(undefined, {
            onSuccess: () => setDeleteOpen(false),
            onError: (err: any) =>
              window.alert(err?.response?.data?.message || 'ပါဆယ် ဖျက်၍ မရပါ'),
          })
        }
        title="ပါဆယ် ဖျက်မည်"
        message="ဤပါဆယ်ကို အပြီးအပိုင် ဖျက်မည်လား? ပြန်လည်ပြင်ဆင်၍ မရနိုင်ပါ။"
        confirmText="ဖျက်မည်"
        isDestructive
        isLoading={deleteMutation.isPending}
      />

      {/* Assign Staff Modal */}
      <ConfirmModal
        visible={Boolean(assignTarget)}
        onClose={() => setAssignTarget(null)}
        onConfirm={() => {
          if (!assignTarget) return;
          assignMutation.mutate(
            { staffId: assignTarget.id },
            {
              onSuccess: () => setAssignTarget(null),
              onError: (err: any) =>
                window.alert(err?.response?.data?.message || 'ဝန်ထမ်း ချိတ်ဆက်၍ မရပါ'),
            }
          );
        }}
        title={parcel.active_assignment ? 'ဝန်ထမ်း ပြောင်းချိတ်မည်' : 'ဝန်ထမ်း ချိတ်ဆက်မည်'}
        message={
          assignTarget
            ? parcel.active_assignment
              ? `${parcel.active_assignment.staff?.name} မှ ${assignTarget.name} သို့ ပြောင်းမည်လား?`
              : `${assignTarget.name} ကို ဤပါဆယ်နှင့် ချိတ်ဆက်မည်လား?`
            : ''
        }
        confirmText={parcel.active_assignment ? 'ပြောင်းချိတ်မည်' : 'ချိတ်ဆက်မည်'}
        isLoading={assignMutation.isPending}
      />
    </div>
  );
}

function InfoRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex justify-between py-1.5 border-b border-line/50 last:border-0 gap-2 text-xs">
      <span className="text-ink-2 font-medium">{label}</span>
      <span className="text-ink text-right font-semibold" style={valueColor ? { color: valueColor } : {}}>
        {value}
      </span>
    </div>
  );
}
