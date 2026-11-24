import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { deliveryService } from '../services/deliveryService';
import { FAILURE_REASONS } from '../constants';

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
          window.alert(`သတိပေးချက်: ပို့ဆောင်မှု မှတ်တမ်းတင်ပြီးသော်လည်း ${uploadError?.response?.data?.message || 'သက်သေဓာတ်ပုံ တင်မရပါ'}`);
        } finally {
          setUploadingProof(false);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['my-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignment', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      const isDelivered = res?.data?.result === 'DELIVERED' || res?.result === 'DELIVERED';
      window.alert(isDelivered ? 'ပါဆယ် အောင်မြင်စွာ ပို့ဆောင်ပြီးပါပြီ' : 'မအောင်မြင်မှု မှတ်တမ်းတင်ပြီးပါပြီ');
      navigate(-1);
    },
    onError: (error: any) => {
      window.alert(error?.response?.data?.message || 'မှတ်တမ်းတင်မှု မအောင်မြင်ပါ');
    },
  });

  function handleSubmit() {
    if (!result) { window.alert('ပို့ဆောင်ရလဒ် ရွေးချယ်ပါ'); return; }
    if (result === 'FAILED' && !failureReason) { window.alert('မအောင်မြင်မှု အကြောင်းအရင်း ရွေးချယ်ပါ'); return; }
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

  if (isLoading) return <div className="p-6 text-center text-ink-2">Loading...</div>;

  return (
    <div className="p-4 md:p-6 space-y-3 max-w-2xl mx-auto">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="px-3 py-1.5 rounded border border-line text-sm">← နောက်</button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-ink">ရလဒ် မှတ်တမ်းတင်မည်</h1>
          {parcel && <p className="text-xs text-ink-2">{parcel.tracking_number}</p>}
        </div>
      </div>

      {parcel && (
        <div className="card p-3 space-y-1">
          <h3 className="section-label">ပါဆယ် အချက်အလက်</h3>
          <Row label="ခြေရာခံ" value={parcel.tracking_number} />
          <Row label="လက်ခံသူ" value={parcel.recipient_name} />
          <Row label="ဖုန်းနံပါတ်" value={parcel.recipient_phone} />
          <Row label="လိပ်စာ" value={parcel.delivery_address} />
          {parcel.is_cod && <Row label="COD" value={`${Number(parcel.cod_amount).toLocaleString()} ကျပ်`} />}
        </div>
      )}

      <div className="card p-3 space-y-2">
        <h3 className="section-label">ပို့ဆောင်ရလဒ် *</h3>
        <div className="flex gap-2">
          <button onClick={() => setResult('DELIVERED')} className={`flex-1 py-3 rounded font-bold text-sm ${result === 'DELIVERED' ? 'bg-ok text-white' : 'bg-surface border border-line text-ink'}`}>ပို့ဆောင်ပြီး</button>
          <button onClick={() => setResult('FAILED')} className={`flex-1 py-3 rounded font-bold text-sm ${result === 'FAILED' ? 'bg-bad text-white' : 'bg-surface border border-line text-ink'}`}>မအောင်မြင်</button>
        </div>
      </div>

      {result === 'FAILED' && (
        <div className="card p-3 space-y-2">
          <h3 className="section-label">မအောင်မြင်မှု အကြောင်းအရင်း *</h3>
          <div className="flex flex-wrap gap-2">
            {FAILURE_REASONS.map((r) => (
              <button key={r.value} onClick={() => setFailureReason(r.value)} className={`px-3 py-1.5 rounded text-xs font-semibold border ${failureReason === r.value ? 'bg-brand text-white border-brand' : 'bg-surface text-ink-2 border-line'}`}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {result === 'DELIVERED' && (
        <div className="card p-3 space-y-2">
          <h3 className="section-label">လက်ခံသူ နာမည်</h3>
          <input className="field" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="လက်ခံသူ၏ နာမည်" />
        </div>
      )}

      {result === 'DELIVERED' && (
        <div className="card p-3 space-y-2">
          <h3 className="section-label">သက်သေဓာတ်ပုံ (အကြံပြု)</h3>
          <p className="text-xs text-ink-2">ပို့ဆောင်ပြီးကြောင်း သက်သေဓာတ်ပုံ ရိုက်ပါ — လက်ခံသူ၊ ပါဆယ်နဲ့ တစ်ပါတည်း ရိုက်ပေးပါ</p>
          <div className="flex gap-2">
            <button onClick={() => fileRef.current?.click()} className="flex-1 bg-surface border border-line py-2 rounded text-sm font-semibold">ဓာတ်ပုံရွေးရန်</button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => {
            const selected = Array.from(e.target.files || []);
            setProofPhotos((prev) => [...prev, ...selected].slice(0, 5));
            e.target.value = '';
          }} />
          {proofPhotos.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {proofPhotos.map((f, i) => (
                <div key={i} className="relative">
                  <img src={URL.createObjectURL(f)} alt="" className="w-20 h-20 rounded object-cover" />
                  <button onClick={() => setProofPhotos((prev) => prev.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 bg-white rounded-full border border-line w-5 h-5 text-xs">×</button>
                </div>
              ))}
            </div>
          )}
          {proofPhotos.length === 0 && <div className="text-xs text-ink-3 text-center py-2">ဓာတ်ပုံ မရှိသေးပါ · အများဆုံး 5 ပုံ</div>}
        </div>
      )}

      <div className="card p-3 space-y-2">
        <h3 className="section-label">မှတ်ချက် (ချန်ထားနိုင်)</h3>
        <textarea className="field-area" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="အပိုသတင်းအချက်အလက်..." />
      </div>

      {uploadingProof && <div className="text-center text-sm text-ink-2">သက်သေဓာတ်ပုံ တင်နေသည်...</div>}

      <button
        onClick={handleSubmit}
        disabled={!result || isPending}
        className={`w-full py-3 rounded font-bold text-white disabled:opacity-60 ${result === 'DELIVERED' ? 'bg-ok' : result === 'FAILED' ? 'bg-bad' : 'bg-ink-3'}`}
      >
        {isPending ? '...' : result === 'DELIVERED' ? 'ပို့ဆောင်ပြီး အတည်ပြုမည်' : result === 'FAILED' ? 'မအောင်မြင်မှု တင်မည်' : 'ရလဒ် ရွေးပါ'}
      </button>
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