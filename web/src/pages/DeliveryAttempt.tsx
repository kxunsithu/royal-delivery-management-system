import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { deliveryService } from '../services/deliveryService';
import { FAILURE_REASONS } from '../constants';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Camera,
  Image as ImageIcon,
  X,
  UploadCloud,
  Banknote,
  MapPin,
  Phone,
} from 'lucide-react';

export default function DeliveryAttempt() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  const { data: assignment, isLoading } = useQuery({
    queryKey: ['assignment', id],
    queryFn: () => deliveryService.getAssignment(Number(id)),
  });

  const [result, setResult] = useState<'DELIVERED' | 'FAILED' | ''>('');
  const [failureReason, setFailureReason] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [notes, setNotes] = useState('');
  const [proofPhotos, setProofPhotos] = useState<File[]>([]);
  const [uploadingProof, setUploadingProof] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const attemptMutation = useMutation({
    mutationFn: (data: any) => deliveryService.recordAttempt(Number(id), data),
    onSuccess: async (res: any) => {
      const attemptId = res?.data?.attempt_id || res?.attempt_id;
      if (proofPhotos.length > 0 && attemptId) {
        setUploadingProof(true);
        try {
          const formData = new FormData();
          formData.append('delivery_attempt_id', String(attemptId));
          formData.append('type', 'PHOTO');
          proofPhotos.forEach((f) => formData.append('files[]', f, f.name));
          await deliveryService.uploadProof(Number(id), formData);
        } catch (uploadError: any) {
          window.alert(
            `သတိပေးချက်: ပို့ဆောင်မှု မှတ်တမ်းတင်ပြီးသော်လည်း ${
              uploadError?.response?.data?.message || 'သက်သေဓာတ်ပုံ တင်မရပါ'
            }`
          );
        } finally {
          setUploadingProof(false);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['my-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignment', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      const isDelivered = res?.data?.result === 'DELIVERED' || res?.result === 'DELIVERED';
      window.alert(
        isDelivered
          ? 'ပါဆယ် အောင်မြင်စွာ ပို့ဆောင်ပြီးပါပြီ'
          : 'မအောင်မြင်မှု မှတ်တမ်းတင်ပြီးပါပြီ'
      );
      navigate(-1);
    },
    onError: (error: any) => {
      window.alert(error?.response?.data?.message || 'မှတ်တမ်းတင်မှု မအောင်မြင်ပါ');
    },
  });

  function handleSubmit() {
    if (!result) {
      window.alert('ပို့ဆောင်ရလဒ် ရွေးချယ်ပါ');
      return;
    }
    if (result === 'FAILED' && !failureReason) {
      window.alert('မအောင်မြင်မှု အကြောင်းအရင်း ရွေးချယ်ပါ');
      return;
    }
    if (result === 'DELIVERED' && proofPhotos.length === 0) {
      if (!window.confirm('သက်သေဓာတ်ပုံ မပါဘဲ တင်မည်လား?')) return;
    }
    attemptMutation.mutate({
      result,
      failure_reason: result === 'FAILED' ? failureReason : undefined,
      recipient_name: recipientName || undefined,
      notes: notes || undefined,
    });
  }

  const parcel = assignment?.parcel;
  const isPending = attemptMutation.isPending || uploadingProof;

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-3 max-w-xl mx-auto">
        <div className="h-20 rounded-2xl bg-muted animate-pulse" />
        <div className="h-32 rounded-2xl bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-3.5 sm:p-6 space-y-3 max-w-xl mx-auto pb-28 md:pb-8">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl border border-line bg-surface hover:bg-muted active:scale-95 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base sm:text-lg font-bold text-ink">ရလဒ် မှတ်တမ်းတင်မည်</h1>
          {parcel && (
            <p className="text-xs text-brand font-mono font-bold truncate">
              {parcel.tracking_number}
            </p>
          )}
        </div>
      </div>

      {/* Parcel Quick Glance */}
      {parcel && (
        <div className="card p-3.5 bg-muted/30 space-y-1 text-xs">
          <div className="font-bold text-ink text-sm truncate">{parcel.recipient_name}</div>
          <div className="text-ink-2 flex items-center gap-1">
            <Phone className="w-3 h-3 text-brand" />
            <span>{parcel.recipient_phone}</span>
          </div>
          <div className="text-ink-3 flex items-center gap-1 truncate">
            <MapPin className="w-3 h-3 text-ink-3 flex-shrink-0" />
            <span className="truncate">{parcel.delivery_address}</span>
          </div>
          {parcel.is_cod && (
            <div className="text-amber-700 dark:text-amber-400 font-bold pt-1 flex items-center gap-1">
              <Banknote className="w-3.5 h-3.5" />
              <span>COD ကောက်ခံရန်: {Number(parcel.cod_amount).toLocaleString()} {parcel.currency === 'THB' ? '฿' : 'K'}</span>
            </div>
          )}
        </div>
      )}

      {/* Primary Result Choice (BIG TOUCH TARGETS) */}
      <div className="card p-4 space-y-2.5">
        <div className="section-label">ပို့ဆောင်ရလဒ် *</div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setResult('DELIVERED')}
            className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 transition active:scale-95 ${
              result === 'DELIVERED'
                ? 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-black shadow-sm'
                : 'border-line bg-surface text-ink-2 hover:bg-muted'
            }`}
          >
            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-bold">ပို့ဆောင်ပြီး</span>
          </button>

          <button
            type="button"
            onClick={() => setResult('FAILED')}
            className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 transition active:scale-95 ${
              result === 'FAILED'
                ? 'border-rose-500 bg-rose-500/15 text-rose-700 dark:text-rose-400 font-black shadow-sm'
                : 'border-line bg-surface text-ink-2 hover:bg-muted'
            }`}
          >
            <XCircle className="w-8 h-8 text-rose-600 dark:text-rose-400" />
            <span className="text-sm font-bold">မအောင်မြင်</span>
          </button>
        </div>
      </div>

      {/* If Failed: Reason Selection Chips */}
      {result === 'FAILED' && (
        <div className="card p-4 space-y-3 animate-fade-in border-rose-200 dark:border-rose-900/40">
          <div className="text-xs font-bold text-rose-600 uppercase tracking-wider">
            မအောင်မြင်မှု အကြောင်းအရင်း *
          </div>
          <div className="grid grid-cols-2 gap-2">
            {FAILURE_REASONS.map((r) => {
              const selected = failureReason === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setFailureReason(r.value)}
                  className={`p-2.5 rounded-xl text-xs font-bold border text-left transition active:scale-95 ${
                    selected
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                      : 'bg-surface text-ink border-line hover:bg-muted'
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* If Delivered: Recipient Name & Proof Photos */}
      {result === 'DELIVERED' && (
        <div className="card p-4 space-y-3 animate-fade-in">
          <div>
            <label className="label">လက်ခံသူ နာမည် (ကိုယ်တိုင်မဟုတ်လျှင် ဖြည့်ပါ)</label>
            <input
              className="field"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="ဥပမာ - ဒေါ်လှ (အမေ)"
            />
          </div>

          <div>
            <label className="label">သက်သေဓာတ်ပုံ (အကြံပြု)</label>
            <p className="text-xs text-ink-3 mb-2">
              လက်ခံသူ၊ ပါဆယ် သို့မဟုတ် လက်ခံလက်မှတ်ကို ဓာတ်ပုံရိုက်ပါ
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => cameraRef.current?.click()}
                className="py-2.5 px-3 rounded-xl border border-brand bg-brand/10 text-brand text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition"
              >
                <Camera className="w-4 h-4" />
                <span>ဓာတ်ပုံရိုက်မည်</span>
              </button>

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="py-2.5 px-3 rounded-xl border border-line bg-surface text-ink text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-muted active:scale-95 transition"
              >
                <ImageIcon className="w-4 h-4" />
                <span>ပုံရွေးမည်</span>
              </button>
            </div>

            {/* Direct Camera capture input */}
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const selected = Array.from(e.target.files || []);
                setProofPhotos((prev) => [...prev, ...selected].slice(0, 5));
                e.target.value = '';
              }}
            />

            {/* Gallery picker input */}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const selected = Array.from(e.target.files || []);
                setProofPhotos((prev) => [...prev, ...selected].slice(0, 5));
                e.target.value = '';
              }}
            />

            {/* Photos Preview */}
            {proofPhotos.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {proofPhotos.map((f, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={URL.createObjectURL(f)}
                      alt=""
                      className="w-20 h-20 rounded-xl object-cover border border-line"
                    />
                    <button
                      type="button"
                      onClick={() => setProofPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes text area */}
      <div className="card p-4 space-y-2">
        <label className="label">မှတ်ချက် (ချန်ထားနိုင်)</label>
        <textarea
          className="field-area"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="ပို့ဆောင်မှုနှင့် ပတ်သက်သည့် အပိုမှတ်ချက်..."
        />
      </div>

      {/* Sticky Bottom Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 z-30 p-3 bg-surface/95 backdrop-blur-md border-t border-line pb-safe md:static md:p-0 md:bg-transparent md:border-0">
        <button
          onClick={handleSubmit}
          disabled={!result || isPending}
          className={`w-full py-3.5 rounded-2xl font-black text-sm shadow-lg text-white disabled:opacity-50 active:scale-98 transition flex items-center justify-center gap-2 ${
            result === 'DELIVERED'
              ? 'bg-emerald-600 shadow-emerald-600/25'
              : result === 'FAILED'
              ? 'bg-rose-600 shadow-rose-600/25'
              : 'bg-ink-3'
          }`}
        >
          {isPending ? (
            <span>တင်နေဆဲ...</span>
          ) : result === 'DELIVERED' ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span>ပို့ဆောင်ပြီးစီးမှု အတည်ပြုမည်</span>
            </>
          ) : result === 'FAILED' ? (
            <>
              <XCircle className="w-5 h-5" />
              <span>မအောင်မြင်မှု မှတ်တမ်းတင်မည်</span>
            </>
          ) : (
            <span>ရလဒ် ရွေးချယ်ပါ</span>
          )}
        </button>
      </div>
    </div>
  );
}
