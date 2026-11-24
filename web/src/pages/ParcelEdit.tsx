import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { parcelService, ParcelImage } from '../services/parcelService';
import CameraCapture from '../components/CameraCapture';

export default function ParcelEdit() {
  const { id } = useParams();
  const numId = Number(id);
  const { user } = useAuth();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const canEdit = !user || user.role === 'admin' || user.role === 'manager';
  useEffect(() => {
    if (user && !canEdit) navigate(`/parcels/${id}`);
  }, [user, canEdit]);

  const { data: parcel, isLoading } = useQuery({
    queryKey: ['parcel', id],
    queryFn: () => parcelService.get(numId),
  });

  const [form, setForm] = useState({
    sender_name: '', sender_phone: '',
    recipient_name: '', recipient_phone: '',
    delivery_address: '',
    description: '', weight: '', kg_fee: '', notes: '',
    delivery_fee: '', cod_amount: '0', is_cod: false,
    currency: 'MMK' as 'MMK' | 'THB',
    cod_currency: 'MMK' as 'MMK' | 'THB',
    items: [] as { product_name: string; quantity: string }[],
    priority: 'NORMAL',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [existingImages, setExistingImages] = useState<ParcelImage[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);

  useEffect(() => {
    if (parcel) {
      setForm({
        sender_name: parcel.sender_name || '',
        sender_phone: parcel.sender_phone || '',
        recipient_name: parcel.recipient_name || '',
        recipient_phone: parcel.recipient_phone || '',
        delivery_address: parcel.delivery_address || '',
        description: parcel.description || '',
        weight: parcel.weight ? String(parcel.weight) : '',
        kg_fee: parcel.kg_fee ? String(parcel.kg_fee) : '',
        notes: parcel.notes || '',
        delivery_fee: String(parcel.delivery_fee || 0),
        cod_amount: String(parcel.cod_amount || 0),
        is_cod: parcel.is_cod || false,
        currency: (parcel.currency as 'MMK' | 'THB') || 'MMK',
        cod_currency: (parcel.cod_currency as 'MMK' | 'THB') || (parcel.currency as 'MMK' | 'THB') || 'MMK',
        items: (parcel.items ?? []).map((it: any) => ({ product_name: it.product_name, quantity: String(it.quantity ?? 1) })),
        priority: parcel.priority || 'NORMAL',
      });
      setExistingImages(parcel.images ?? []);
    }
  }, [parcel]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => parcelService.update(numId, data),
    onSuccess: async () => {
      if (newFiles.length > 0) {
        setUploadingImages(true);
        try {
          const formData = new FormData();
          newFiles.forEach((f) => formData.append('images[]', f, f.name));
          await parcelService.uploadImages(numId, formData);
        } catch {
          // ignore
        } finally {
          setUploadingImages(false);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['parcel', id] });
      queryClient.invalidateQueries({ queryKey: ['parcels'] });
      window.alert('ပါဆယ် ပြင်ဆင်မှု ပြီးပါပြီ');
      navigate(`/parcels/${id}`);
    },
    onError: (error: any) => {
      window.alert(error?.response?.data?.message || 'ပြင်ဆင်မှု မအောင်မြင်ပါ');
    },
  });

  function update(field: string, value: any) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  }

  async function deleteExistingImage(imageId: number) {
    if (!window.confirm('ဤဓာတ်ပုံကို ဖျက်မည်လား?')) return;
    try {
      await parcelService.deleteImage(numId, imageId);
      setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
      queryClient.invalidateQueries({ queryKey: ['parcel', id] });
    } catch {
      window.alert('ဓာတ်ပုံ ဖျက်မှု မအောင်မြင်ပါ');
    }
  }

  function validate() {
    const newErrors: Record<string, string> = {};
    if (!form.recipient_name.trim()) newErrors.recipient_name = 'လိုအပ်သည်';
    if (!form.recipient_phone.trim()) newErrors.recipient_phone = 'လိုအပ်သည်';
    if (!form.delivery_address.trim()) newErrors.delivery_address = 'လိုအပ်သည်';
    if (!form.delivery_fee.trim()) newErrors.delivery_fee = 'လိုအပ်သည်';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    updateMutation.mutate({
      sender_name: form.sender_name || undefined,
      sender_phone: form.sender_phone || undefined,
      recipient_name: form.recipient_name,
      recipient_phone: form.recipient_phone,
      delivery_address: form.delivery_address,
      description: form.description || undefined,
      weight: form.weight ? Number(form.weight) : undefined,
      kg_fee: form.kg_fee ? Number(form.kg_fee) : 0,
      notes: form.notes || undefined,
      delivery_fee: Number(form.delivery_fee),
      cod_amount: Number(form.cod_amount) || 0,
      is_cod: form.is_cod,
      currency: form.currency,
      cod_currency: form.cod_currency,
      items: form.items
        .filter((it) => it.product_name.trim())
        .map((it) => ({ product_name: it.product_name.trim(), quantity: Number(it.quantity) || 1 })),
      priority: form.priority,
    });
  }

  const priorities = [
    { value: 'NORMAL', label: 'ပုံမှန်' },
    { value: 'HIGH', label: 'အရေးကြီး' },
    { value: 'URGENT', label: 'အရေးပေါ်' },
  ];

  if (isLoading || !canEdit) {
    return <div className="p-6 text-center text-ink-2">Loading...</div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="px-3 py-1.5 rounded border border-line text-sm">← နောက်</button>
        <h1 className="text-xl font-bold text-ink">ပါဆယ် ပြင်ဆင်မည်</h1>
        <span />
      </div>

      <Section title="ပါဆယ် အချက်အလက်">
        <div>
          <label className="label">ဖော်ပြချက် (ပစ္စည်းအမျိုးအမည်များ / ထပ်ပေါင်းပစ္စည်း)</label>
          <textarea className="field-area" value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="ဥပမာ - အင်္ကျီ ၂ ထည်၊ ဖုန်း ၁ လုံး" />
        </div>
        <div>
          <label className="label">ထုတ်ကုန်များ (အမည် + အရေအတွက်)</label>
          {form.items.map((item, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <input className="field flex-1" value={item.product_name} onChange={(e) => { const next = [...form.items]; next[idx] = { ...next[idx], product_name: e.target.value }; update('items', next); }} placeholder="ထုတ်ကုန်အမည်" />
              <input className="field w-20 text-center" value={item.quantity} onChange={(e) => { const next = [...form.items]; next[idx] = { ...next[idx], quantity: e.target.value }; update('items', next); }} placeholder="1" />
              <button onClick={() => { const next = form.items.filter((_, i) => i !== idx); update('items', next.length ? next : [{ product_name: '', quantity: '1' }]); }} className="px-2 text-bad">×</button>
            </div>
          ))}
          <button onClick={() => update('items', [...form.items, { product_name: '', quantity: '1' }])} className="text-brand text-sm font-semibold">+ ထုတ်ကုန် ထပ်ထည့်မည်</button>
        </div>
        <div>
          <label className="label">အလေးချိန် (kg)</label>
          <input
            className="field"
            type="number"
            value={form.weight}
            onChange={(e) => {
              update('weight', e.target.value);
              const w = Number(e.target.value);
              if (w > 0) {
                const fee = w <= 5 ? 40 : w <= 50 ? 33 : w <= 100 ? 31 : w <= 300 ? 27 : 20;
                update('kg_fee', String(fee));
              } else {
                update('kg_fee', '');
              }
            }}
            placeholder="ချန်ထားနိုင်"
          />
          {Number(form.weight) >= 20 && <p className="text-xs text-ok mt-1">20Kg အထက် — အိမ်အရောက် ပို့ဆောင်ပေးပါမည်</p>}
        </div>
        <Field label="Kg ဖိုး (THB)" value={form.kg_fee} onChange={(v) => update('kg_fee', v)} type="number" />
        <div>
          <label className="label">ဦးစားပေးအဆင့်</label>
          <div className="flex rounded border border-line overflow-hidden">
            {priorities.map((p) => (
              <button key={p.value} onClick={() => update('priority', p.value)} className={`flex-1 py-2 text-sm font-semibold ${form.priority === p.value ? 'bg-brand text-white' : 'bg-surface text-ink-2'}`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section title="ပေးပို့သူ">
        <Field label="နာမည်" value={form.sender_name} onChange={(v) => update('sender_name', v)} />
        <Field label="ဖုန်းနံပါတ်" value={form.sender_phone} onChange={(v) => update('sender_phone', v)} />
      </Section>

      <Section title="လက်ခံသူ *">
        <Field label="နာမည် *" value={form.recipient_name} onChange={(v) => update('recipient_name', v)} error={errors.recipient_name} />
        <Field label="ဖုန်းနံပါတ် *" value={form.recipient_phone} onChange={(v) => update('recipient_phone', v)} error={errors.recipient_phone} />
        <div>
          <label className="label">လိပ်စာ *</label>
          <textarea className={`field-area ${errors.delivery_address ? 'border-bad' : ''}`} value={form.delivery_address} onChange={(e) => update('delivery_address', e.target.value)} />
          {errors.delivery_address && <p className="text-xs text-bad mt-1">{errors.delivery_address}</p>}
        </div>
      </Section>

      <Section title="ငွေကြေး">
        <div>
          <label className="label">ပို့ဆောင်ခ ငွေကြေး *</label>
          <div className="flex rounded border border-line overflow-hidden mb-2">
            {(['MMK', 'THB'] as const).map((cur) => (
              <button key={cur} onClick={() => update('currency', cur)} className={`flex-1 py-2 text-sm font-semibold ${form.currency === cur ? 'bg-brand text-white' : 'bg-surface text-ink-2'}`}>
                {cur === 'MMK' ? 'ကျပ် (MMK)' : 'ဘတ် (THB)'}
              </button>
            ))}
          </div>
        </div>
        <Field label={`ပို့ဆောင်ခ (${form.currency}) *`} value={form.delivery_fee} onChange={(v) => update('delivery_fee', v)} type="number" error={errors.delivery_fee} />
        <div className="flex items-center justify-between py-2">
          <div>
            <div className="text-sm font-semibold text-ink">COD (ငွေတောင်းမည်)</div>
            <div className="text-xs text-ink-2">လက်ခံသူထံမှ ငွေကောက်မည်</div>
          </div>
          <input type="checkbox" checked={form.is_cod} onChange={(e) => update('is_cod', e.target.checked)} />
        </div>
        {form.is_cod && (
          <>
            <Field label={`COD ပမာဏ (${form.cod_currency})`} value={form.cod_amount} onChange={(v) => update('cod_amount', v)} type="number" />
            <div>
              <label className="label">COD ငွေကြေး</label>
              <div className="flex rounded border border-line overflow-hidden">
                {(['MMK', 'THB'] as const).map((cur) => (
                  <button key={cur} onClick={() => update('cod_currency', cur)} className={`flex-1 py-2 text-sm font-semibold ${form.cod_currency === cur ? 'bg-brand text-white' : 'bg-surface text-ink-2'}`}>
                    {cur === 'MMK' ? 'ကျပ် (MMK)' : 'ဘတ် (THB)'}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </Section>

      <Section title="မှတ်ချက်">
        <textarea className="field-area" value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="ချန်ထားနိုင်" />
      </Section>

      <Section title="ပါဆယ် ဓာတ်ပုံများ">
        {existingImages.length > 0 && (
          <>
            <div className="text-xs text-ink-2 mb-1">လက်ရှိ ဓာတ်ပုံများ</div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
              {existingImages.map((img, i) => (
                <div key={img.id} className="relative group">
                  <img src={img.url} alt="" className="w-full aspect-square rounded object-cover border border-line" />
                  <button
                    onClick={() => deleteExistingImage(img.id)}
                    className="absolute top-1 right-1 bg-white/90 rounded-full w-6 h-6 text-xs text-bad shadow opacity-0 group-hover:opacity-100 transition"
                  >
                    ✕
                  </button>
                  <span className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">{i + 1}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="border-2 border-dashed border-line rounded-lg p-4 text-center bg-muted/40">
          <p className="text-sm text-ink-2 mb-2">ဓာတ်ပုံအသစ်များ ထည့်ရန်</p>
          <div className="flex gap-2 justify-center">
            <button onClick={() => document.getElementById('parcel-images-edit')?.click()} className="px-4 py-2 rounded bg-brand text-white text-sm font-bold">
              ဓာတ်ပုံရွေးရန်
            </button>
            <button onClick={() => setCameraOpen(true)} className="px-4 py-2 rounded border border-line text-sm font-bold">
              ဓာတ်ပုံရိုက်ရန်
            </button>
          </div>
          <input
            id="parcel-images-edit"
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const selected = Array.from(e.target.files || []);
              setNewFiles((prev) => [...prev, ...selected].slice(0, 10));
              e.target.value = '';
            }}
          />
          <input
            id="parcel-images-edit-camera"
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const selected = Array.from(e.target.files || []);
              setNewFiles((prev) => [...prev, ...selected].slice(0, 10));
              e.target.value = '';
            }}
          />
        </div>

        {newFiles.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
            {newFiles.map((f, i) => (
              <div key={i} className="relative group">
                <img src={URL.createObjectURL(f)} alt="" className="w-full aspect-square rounded object-cover border border-line" />
                <button
                  onClick={() => setNewFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 bg-white/90 rounded-full w-6 h-6 text-xs text-bad shadow opacity-0 group-hover:opacity-100 transition"
                >
                  ✕
                </button>
                <span className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">{existingImages.length + i + 1}</span>
              </div>
            ))}
          </div>
        )}

        {existingImages.length === 0 && newFiles.length === 0 && (
          <p className="text-xs text-ink-3 text-center mt-2">ဓာတ်ပုံ မရှိသေးပါ</p>
        )}
        <p className="text-xs text-ink-3 text-center mt-2">အများဆုံး 10 ပုံ · JPEG, PNG · 5MB အောက်</p>
      </Section>

      <button onClick={handleSubmit} disabled={updateMutation.isPending || uploadingImages} className="w-full bg-brand text-white py-3 rounded font-bold disabled:opacity-60">
        {(updateMutation.isPending || uploadingImages) ? '...' : 'ပြင်ဆင်မှု သိမ်းမည်'}
      </button>
      <CameraCapture
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(file) => setNewFiles((prev) => [...prev, file].slice(0, 10))}
      />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-4 space-y-3">
      <h3 className="text-sm font-bold text-ink">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', error }: { label: string; value: string; onChange: (v: string) => void; type?: string; error?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className={`field ${error ? 'border-bad' : ''}`} type={type} value={value} onChange={(e) => onChange(e.target.value)} />
      {error && <p className="text-xs text-bad mt-1">{error}</p>}
    </div>
  );
}