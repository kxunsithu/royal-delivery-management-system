import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { parcelService, ContactSuggestion } from '../services/parcelService';
import { PARCEL_CATEGORIES } from '../constants';
import CameraCapture from '../components/CameraCapture';

export default function ParcelCreate() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const canCreate = !user || user.role === 'admin' || user.role === 'manager';
  useEffect(() => {
    if (user && !canCreate) navigate('/parcels');
  }, [user, canCreate]);

  const [form, setForm] = useState({
    tracking_number: '',
    sender_name: searchParams.get('sender_name') ? decodeURIComponent(searchParams.get('sender_name')!) : '',
    sender_phone: searchParams.get('sender_phone') ? decodeURIComponent(searchParams.get('sender_phone')!) : '',
    recipient_name: searchParams.get('recipient_name') ? decodeURIComponent(searchParams.get('recipient_name')!) : '',
    recipient_phone: searchParams.get('recipient_phone') ? decodeURIComponent(searchParams.get('recipient_phone')!) : '',
    delivery_address: '',
    description: '',
    items: [{ product_name: '', quantity: '1' }],
    weight: '',
    kg_fee: '',
    notes: '',
    delivery_fee: '',
    cod_amount: '0',
    is_cod: false,
    currency: 'MMK' as 'MMK' | 'THB',
    cod_currency: 'MMK' as 'MMK' | 'THB',
    priority: 'NORMAL',
    condition: 'GOOD',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [cameraOpen, setCameraOpen] = useState(false);

  const [senderSuggestions, setSenderSuggestions] = useState<ContactSuggestion[]>([]);
  const [recipientSuggestions, setRecipientSuggestions] = useState<ContactSuggestion[]>([]);
  const [showSenderSug, setShowSenderSug] = useState(false);
  const [showRecipientSug, setShowRecipientSug] = useState(false);
  const senderTimer = useRef<any>(null);
  const recipientTimer = useRef<any>(null);

  const createMutation = useMutation({
    mutationFn: (data: any) => parcelService.create(data),
    onSuccess: async (createdParcel) => {
      if (files.length > 0) {
        try {
          const formData = new FormData();
          files.forEach((f) => formData.append('images[]', f, f.name));
          await parcelService.uploadImages(createdParcel.id, formData);
        } catch {
          // ignore
        }
      }
      queryClient.invalidateQueries({ queryKey: ['parcels'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      window.alert('ပါဆယ် မှတ်ပုံတင်ပြီးပါပြီ');
      navigate('/parcels');
    },
    onError: (error: any) => {
      window.alert(error?.response?.data?.message || 'ပါဆယ် မှတ်ပုံတင်မှု မအောင်မြင်ပါ');
    },
  });

  function update(field: string, value: any) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  }

  function handleSenderInput(field: 'sender_name' | 'sender_phone', value: string) {
    update(field, value);
    setShowRecipientSug(false);
    clearTimeout(senderTimer.current);
    if (value.trim().length < 1) { setSenderSuggestions([]); setShowSenderSug(false); return; }
    senderTimer.current = setTimeout(async () => {
      try {
        const results = await parcelService.searchContacts(value, 'sender');
        setSenderSuggestions(results);
        setShowSenderSug(results.length > 0);
      } catch { /* ignore */ }
    }, 400);
  }

  function applySenderSuggestion(s: ContactSuggestion) {
    update('sender_name', s.name);
    update('sender_phone', s.phone);
    setSenderSuggestions([]);
    setShowSenderSug(false);
  }

  function handleRecipientInput(field: 'recipient_name' | 'recipient_phone', value: string) {
    update(field, value);
    setShowSenderSug(false);
    clearTimeout(recipientTimer.current);
    if (value.trim().length < 1) { setRecipientSuggestions([]); setShowRecipientSug(false); return; }
    recipientTimer.current = setTimeout(async () => {
      try {
        const results = await parcelService.searchContacts(value, 'recipient');
        setRecipientSuggestions(results);
        setShowRecipientSug(results.length > 0);
      } catch { /* ignore */ }
    }, 400);
  }

  function applyRecipientSuggestion(s: ContactSuggestion) {
    update('recipient_name', s.name);
    update('recipient_phone', s.phone);
    if (s.delivery_address) update('delivery_address', s.delivery_address);
    setRecipientSuggestions([]);
    setShowRecipientSug(false);
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
    createMutation.mutate({
      tracking_number: form.tracking_number || undefined,
      sender_name: form.sender_name || undefined,
      sender_phone: form.sender_phone || undefined,
      recipient_name: form.recipient_name,
      recipient_phone: form.recipient_phone,
      delivery_address: form.delivery_address,
      description: form.description || undefined,
      items: form.items
        .filter((it) => it.product_name.trim())
        .map((it) => ({ product_name: it.product_name.trim(), quantity: Number(it.quantity) || 1 })),
      weight: form.weight ? Number(form.weight) : undefined,
      kg_fee: form.kg_fee ? Number(form.kg_fee) : 0,
      notes: form.notes || undefined,
      delivery_fee: Number(form.delivery_fee),
      cod_amount: Number(form.cod_amount) || 0,
      is_cod: form.is_cod,
      currency: form.currency,
      cod_currency: form.cod_currency,
      priority: form.priority,
      condition: form.condition,
    });
  }

  const priorities = [
    { value: 'NORMAL', label: 'ပုံမှန်' },
    { value: 'HIGH', label: 'အရေးကြီး' },
    { value: 'URGENT', label: 'အရေးပေါ်' },
  ];

  if (!canCreate) return null;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="px-3 py-1.5 rounded border border-line text-sm">← နောက်</button>
        <h1 className="text-xl font-bold text-ink">ပါဆယ်ထည့်ရန်</h1>
        <button
          onClick={handleSubmit}
          disabled={createMutation.isPending}
          className="px-4 py-2 rounded bg-brand text-white font-bold disabled:opacity-60"
        >
          {createMutation.isPending ? '...' : 'သိမ်းမည်'}
        </button>
      </div>

      <Section title="ပါဆယ် အချက်အလက်">
        <Field label="ခြေရာခံနံပါတ် (ဗလာထားပါ - အလိုအလျောက်)" value={form.tracking_number} onChange={(v) => update('tracking_number', v)} />
        <Field label="ဖော်ပြချက်" value={form.description} onChange={(v) => update('description', v)} />
        <div>
          <label className="label">ထုတ်ကုန်များ (အမည် + အရေအတွက်)</label>
          {form.items.map((item, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <input
                className="field flex-1"
                value={item.product_name}
                onChange={(e) => {
                  const next = [...form.items];
                  next[idx] = { ...next[idx], product_name: e.target.value };
                  update('items', next);
                }}
                placeholder="ထုတ်ကုန်အမည်"
              />
              <input
                className="field w-20 text-center"
                value={item.quantity}
                onChange={(e) => {
                  const next = [...form.items];
                  next[idx] = { ...next[idx], quantity: e.target.value };
                  update('items', next);
                }}
                placeholder="1"
              />
              <button
                onClick={() => {
                  const next = form.items.filter((_, i) => i !== idx);
                  update('items', next.length ? next : [{ product_name: '', quantity: '1' }]);
                }}
                className="px-2 text-bad"
              >
                ×
              </button>
            </div>
          ))}
          <button onClick={() => update('items', [...form.items, { product_name: '', quantity: '1' }])} className="text-brand text-sm font-semibold">
            + ထုတ်ကုန် ထပ်ထည့်မည်
          </button>
        </div>
        <Field
          label="အလေးချိန် (kg)"
          value={form.weight}
          onChange={(v) => {
            update('weight', v);
            const w = Number(v);
            if (w > 0) {
              const fee = w <= 5 ? 40 : w <= 50 ? 33 : w <= 100 ? 31 : w <= 300 ? 27 : 20;
              update('kg_fee', String(fee));
            } else {
              update('kg_fee', '');
            }
          }}
          type="number"
        />
        {Number(form.weight) >= 20 && (
          <p className="text-xs text-ok -mt-2 mb-2">20Kg အထက် — အိမ်အရောက် ပို့ဆောင်ပေးပါမည်</p>
        )}
        <Field label="Kg ဖိုး (THB)" value={form.kg_fee} onChange={(v) => update('kg_fee', v)} type="number" />
        <div>
          <label className="label">ဦးစားပေးအဆင့်</label>
          <div className="flex rounded border border-line overflow-hidden">
            {priorities.map((p) => (
              <button
                key={p.value}
                onClick={() => update('priority', p.value)}
                className={`flex-1 py-2 text-sm font-semibold ${form.priority === p.value ? 'bg-brand text-white' : 'bg-surface text-ink-2'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section title="ပေးပို့သူ">
        <div className="relative">
          <label className="label">ဖုန်းနံပါတ်</label>
          <input className="field" value={form.sender_phone} onChange={(e) => handleSenderInput('sender_phone', e.target.value)} placeholder="09..." />
          {showSenderSug && senderSuggestions.length > 0 && (
            <SuggestionBox items={senderSuggestions} onPick={applySenderSuggestion} onClose={() => setShowSenderSug(false)} />
          )}
        </div>
        <div className="relative">
          <label className="label">နာမည်</label>
          <input className="field" value={form.sender_name} onChange={(e) => handleSenderInput('sender_name', e.target.value)} placeholder="ပေးပို့သူ နာမည်" />
        </div>
      </Section>

      <Section title="လက်ခံသူ *">
        <div className="relative">
          <label className="label">ဖုန်းနံပါတ် *</label>
          <input
            className={`field ${errors.recipient_phone ? 'border-bad' : ''}`}
            value={form.recipient_phone}
            onChange={(e) => handleRecipientInput('recipient_phone', e.target.value)}
            placeholder="09..."
          />
          {errors.recipient_phone && <p className="text-xs text-bad mt-1">{errors.recipient_phone}</p>}
          {showRecipientSug && recipientSuggestions.length > 0 && (
            <SuggestionBox items={recipientSuggestions} onPick={applyRecipientSuggestion} onClose={() => setShowRecipientSug(false)} />
          )}
        </div>
        <div className="relative">
          <label className="label">နာမည် *</label>
          <input
            className={`field ${errors.recipient_name ? 'border-bad' : ''}`}
            value={form.recipient_name}
            onChange={(e) => handleRecipientInput('recipient_name', e.target.value)}
            placeholder="လက်ခံသူ နာမည်"
          />
          {errors.recipient_name && <p className="text-xs text-bad mt-1">{errors.recipient_name}</p>}
        </div>
        <div>
          <label className="label">လိပ်စာ *</label>
          <textarea
            className={`field-area ${errors.delivery_address ? 'border-bad' : ''}`}
            value={form.delivery_address}
            onChange={(e) => update('delivery_address', e.target.value)}
            placeholder="တိကျသောလိပ်စာ"
          />
          {errors.delivery_address && <p className="text-xs text-bad mt-1">{errors.delivery_address}</p>}
        </div>
      </Section>

      <Section title="ငွေကြေး">
        <div>
          <label className="label">ပို့ဆောင်ခ ငွေကြေး *</label>
          <div className="flex rounded border border-line overflow-hidden mb-2">
            {(['MMK', 'THB'] as const).map((cur) => (
              <button
                key={cur}
                onClick={() => update('currency', cur)}
                className={`flex-1 py-2 text-sm font-semibold ${form.currency === cur ? 'bg-brand text-white' : 'bg-surface text-ink-2'}`}
              >
                {cur === 'MMK' ? 'ကျပ် (MMK)' : 'ဘတ် (THB)'}
              </button>
            ))}
          </div>
        </div>
        <Field
          label={`ပို့ဆောင်ခ (${form.currency}) *`}
          value={form.delivery_fee}
          onChange={(v) => update('delivery_fee', v)}
          type="number"
          error={errors.delivery_fee}
        />
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
                  <button
                    key={cur}
                    onClick={() => update('cod_currency', cur)}
                    className={`flex-1 py-2 text-sm font-semibold ${form.cod_currency === cur ? 'bg-brand text-white' : 'bg-surface text-ink-2'}`}
                  >
                    {cur === 'MMK' ? 'ကျပ် (MMK)' : 'ဘတ် (THB)'}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </Section>

      <Section title="မှတ်ချက်">
        <textarea className="field-area" value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="မိဆာ သတ်မှတ်ချက် (ချန်ထားနိုင်)" />
      </Section>

      <Section title="ပါဆယ် ဓာတ်ပုံများ">
        <div className="border-2 border-dashed border-line rounded-lg p-4 text-center bg-muted/40">
          <p className="text-sm text-ink-2 mb-2">ဓာတ်ပုံများ ထည့်ရန်</p>
          <div className="flex gap-2 justify-center">
            <button onClick={() => document.getElementById('parcel-images')?.click()} className="px-4 py-2 rounded bg-brand text-white text-sm font-bold">
              ဓာတ်ပုံရွေးရန်
            </button>
            <button onClick={() => setCameraOpen(true)} className="px-4 py-2 rounded border border-line text-sm font-bold">
              ဓာတ်ပုံရိုက်ရန်
            </button>
          </div>
          <input
            id="parcel-images"
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const selected = Array.from(e.target.files || []);
              setFiles((prev) => [...prev, ...selected].slice(0, 10));
              e.target.value = '';
            }}
          />
          <input
            id="parcel-images-camera"
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const selected = Array.from(e.target.files || []);
              setFiles((prev) => [...prev, ...selected].slice(0, 10));
              e.target.value = '';
            }}
          />
        </div>
        {files.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
            {files.map((f, i) => (
              <div key={i} className="relative group">
                <img src={URL.createObjectURL(f)} alt="" className="w-full aspect-square rounded object-cover border border-line" />
                <button
                  onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 bg-white/90 rounded-full w-6 h-6 text-xs text-bad shadow opacity-0 group-hover:opacity-100 transition"
                >
                  ✕
                </button>
                <span className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">{i + 1}</span>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-ink-3 text-center mt-2">အများဆုံး 10 ပုံ · JPEG, PNG · 5MB အောက်</p>
      </Section>

      <button
        onClick={handleSubmit}
        disabled={createMutation.isPending}
        className="w-full bg-brand text-white py-3 rounded font-bold disabled:opacity-60"
      >
        {createMutation.isPending ? '...' : 'ပါဆယ်ထည့်ရန်'}
      </button>
      <CameraCapture
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(file) => setFiles((prev) => [...prev, file].slice(0, 10))}
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

function SuggestionBox({ items, onPick, onClose }: { items: ContactSuggestion[]; onPick: (s: ContactSuggestion) => void; onClose: () => void }) {
  return (
    <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-surface border border-line rounded shadow-float max-h-48 overflow-y-auto">
      <div className="flex items-center justify-between px-3 py-1 bg-muted text-xs text-ink-2">
        <span>ရှိပြီးသား ဖောက်သည်များ</span>
        <button onClick={onClose}>×</button>
      </div>
      {items.map((s, i) => (
        <button key={i} onClick={() => onPick(s)} className="w-full text-left px-3 py-2 border-b border-line hover:bg-muted">
          <div className="text-sm font-semibold text-ink">{s.name}</div>
          <div className="text-xs text-ink-2">{s.phone}</div>
          {s.delivery_address && <div className="text-xs text-ink-3 truncate">{s.delivery_address}</div>}
        </button>
      ))}
    </div>
  );
}