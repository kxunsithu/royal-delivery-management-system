import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { parcelService, ContactSuggestion } from '../services/parcelService';
import CameraCapture from '../components/CameraCapture';
import {
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  Plus,
  Trash2,
  X,
  Check,
  Save,
} from 'lucide-react';

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
  const cameraInputRef = useRef<HTMLInputElement>(null);

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
    setErrors((e) => {
      const n = { ...e };
      delete n[field];
      return n;
    });
  }

  function handleSenderInput(field: 'sender_name' | 'sender_phone', value: string) {
    update(field, value);
    setShowRecipientSug(false);
    clearTimeout(senderTimer.current);
    if (value.trim().length < 1) {
      setSenderSuggestions([]);
      setShowSenderSug(false);
      return;
    }
    senderTimer.current = setTimeout(async () => {
      try {
        const results = await parcelService.searchContacts(value, 'sender');
        setSenderSuggestions(results);
        setShowSenderSug(results.length > 0);
      } catch {
        /* ignore */
      }
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
    if (value.trim().length < 1) {
      setRecipientSuggestions([]);
      setShowRecipientSug(false);
      return;
    }
    recipientTimer.current = setTimeout(async () => {
      try {
        const results = await parcelService.searchContacts(value, 'recipient');
        setRecipientSuggestions(results);
        setShowRecipientSug(results.length > 0);
      } catch {
        /* ignore */
      }
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
    if (!form.recipient_name.trim()) newErrors.recipient_name = 'အမည် လိုအပ်ပါသည်';
    if (!form.recipient_phone.trim()) newErrors.recipient_phone = 'ဖုန်း လိုအပ်ပါသည်';
    if (!form.delivery_address.trim()) newErrors.delivery_address = 'လိပ်စာ လိုအပ်ပါသည်';
    if (!form.delivery_fee.trim()) newErrors.delivery_fee = 'ပို့ဆောင်ခ လိုအပ်ပါသည်';
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
    <div className="p-3.5 sm:p-6 max-w-2xl mx-auto space-y-4 pb-28 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl border border-line bg-surface hover:bg-muted active:scale-95 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-base sm:text-lg font-black text-ink">ပါဆယ်အသစ် ထည့်သွင်းမည်</h1>
        <span />
      </div>

      {/* Recipient Section (PRIMARY) */}
      <div className="card p-4 space-y-3 border-brand/30">
        <div className="section-label text-brand">လက်ခံသူ အချက်အလက် *</div>
        <div className="relative">
          <label className="label">ဖုန်းနံပါတ် *</label>
          <input
            className={`field ${errors.recipient_phone ? 'border-bad' : ''}`}
            value={form.recipient_phone}
            onChange={(e) => handleRecipientInput('recipient_phone', e.target.value)}
            placeholder="09xxxxxxxxx"
            type="tel"
          />
          {errors.recipient_phone && (
            <p className="text-xs text-bad mt-1">{errors.recipient_phone}</p>
          )}
          {showRecipientSug && recipientSuggestions.length > 0 && (
            <SuggestionBox
              items={recipientSuggestions}
              onPick={applyRecipientSuggestion}
              onClose={() => setShowRecipientSug(false)}
            />
          )}
        </div>

        <div className="relative">
          <label className="label">လက်ခံသူ နာမည် *</label>
          <input
            className={`field ${errors.recipient_name ? 'border-bad' : ''}`}
            value={form.recipient_name}
            onChange={(e) => handleRecipientInput('recipient_name', e.target.value)}
            placeholder="လက်ခံသူ နာမည်"
          />
          {errors.recipient_name && (
            <p className="text-xs text-bad mt-1">{errors.recipient_name}</p>
          )}
        </div>

        <div>
          <label className="label">လိပ်စာ *</label>
          <textarea
            className={`field-area ${errors.delivery_address ? 'border-bad' : ''}`}
            value={form.delivery_address}
            onChange={(e) => update('delivery_address', e.target.value)}
            placeholder="မြို့၊ ရပ်ကွက်၊ လမ်း၊ အိမ်အမှတ်..."
          />
          {errors.delivery_address && (
            <p className="text-xs text-bad mt-1">{errors.delivery_address}</p>
          )}
        </div>
      </div>

      {/* Sender Section */}
      <div className="card p-4 space-y-3">
        <div className="section-label">ပေးပို့သူ အချက်အလက် (ချန်ထားနိုင်)</div>
        <div className="relative">
          <label className="label">ပေးပို့သူ ဖုန်းနံပါတ်</label>
          <input
            className="field"
            value={form.sender_phone}
            onChange={(e) => handleSenderInput('sender_phone', e.target.value)}
            placeholder="09xxxxxxxxx"
            type="tel"
          />
          {showSenderSug && senderSuggestions.length > 0 && (
            <SuggestionBox
              items={senderSuggestions}
              onPick={applySenderSuggestion}
              onClose={() => setShowSenderSug(false)}
            />
          )}
        </div>
        <div>
          <label className="label">ပေးပို့သူ နာမည်</label>
          <input
            className="field"
            value={form.sender_name}
            onChange={(e) => handleSenderInput('sender_name', e.target.value)}
            placeholder="ပေးပို့သူ နာမည်"
          />
        </div>
      </div>

      {/* Financial Info */}
      <div className="card p-4 space-y-3">
        <div className="section-label">ငွေကြေး သတ်မှတ်ချက်</div>

        {/* Currency Switcher */}
        <div>
          <label className="label">ငွေကြေးအမျိုးအစား</label>
          <div className="grid grid-cols-2 rounded-xl border border-line bg-muted/40 p-0.5">
            {(['MMK', 'THB'] as const).map((cur) => (
              <button
                key={cur}
                type="button"
                onClick={() => update('currency', cur)}
                className={`py-2 rounded-lg text-xs font-bold transition ${
                  form.currency === cur
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-ink-2 hover:text-ink'
                }`}
              >
                {cur === 'MMK' ? 'ကျပ် (MMK)' : 'ဘတ် (THB)'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">ပို့ဆောင်ခ ({form.currency}) *</label>
          <input
            className={`field ${errors.delivery_fee ? 'border-bad' : ''}`}
            type="number"
            value={form.delivery_fee}
            onChange={(e) => update('delivery_fee', e.target.value)}
            placeholder="ဥပမာ - 3000"
          />
          {errors.delivery_fee && <p className="text-xs text-bad mt-1">{errors.delivery_fee}</p>}
        </div>

        {/* COD Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-line">
          <div>
            <div className="text-xs font-bold text-ink">COD (ငွေကောက်ခံရန်)</div>
            <div className="text-[10px] text-ink-3">ပစ္စည်းရောက်မှ လက်ခံသူထံမှ ငွေတောင်းမည်</div>
          </div>
          <input
            type="checkbox"
            className="w-5 h-5 accent-brand rounded cursor-pointer"
            checked={form.is_cod}
            onChange={(e) => update('is_cod', e.target.checked)}
          />
        </div>

        {form.is_cod && (
          <div className="space-y-3 p-3 rounded-xl bg-amber-500/10 border border-amber-200 dark:border-amber-900/40 animate-fade-in">
            <div>
              <label className="label text-amber-800 dark:text-amber-300">
                COD ပမာဏ ({form.cod_currency}) *
              </label>
              <input
                className="field border-amber-300 dark:border-amber-800"
                type="number"
                value={form.cod_amount}
                onChange={(e) => update('cod_amount', e.target.value)}
                placeholder="ကောက်ခံရမည့် ငွေပမာဏ"
              />
            </div>

            <div>
              <label className="label text-amber-800 dark:text-amber-300">COD ငွေကြေး</label>
              <div className="grid grid-cols-2 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-surface p-0.5">
                {(['MMK', 'THB'] as const).map((cur) => (
                  <button
                    key={cur}
                    type="button"
                    onClick={() => update('cod_currency', cur)}
                    className={`py-1.5 rounded-lg text-xs font-bold transition ${
                      form.cod_currency === cur
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-ink-2 hover:text-ink'
                    }`}
                  >
                    {cur === 'MMK' ? 'ကျပ် (MMK)' : 'ဘတ် (THB)'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Parcel Specifics */}
      <div className="card p-4 space-y-3">
        <div className="section-label">ပါဆယ် အချက်အလက်များ</div>

        <div>
          <label className="label">ခြေရာခံနံပါတ် (မဖြည့်လျှင် အလိုအလျောက် သတ်မှတ်မည်)</label>
          <input
            className="field font-mono"
            value={form.tracking_number}
            onChange={(e) => update('tracking_number', e.target.value)}
            placeholder="ဥပမာ - RMD-202611-001"
          />
        </div>

        <div>
          <label className="label">ဖော်ပြချက်</label>
          <input
            className="field"
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="ဥပမာ - အင်္ကျီ ၂ ထည်၊ အလှကုန်"
          />
        </div>

        {/* Priority Selector */}
        <div>
          <label className="label">ဦးစားပေးအဆင့်</label>
          <div className="grid grid-cols-3 rounded-xl border border-line bg-muted/40 p-0.5">
            {priorities.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => update('priority', p.value)}
                className={`py-2 rounded-lg text-xs font-bold transition ${
                  form.priority === p.value
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-ink-2 hover:text-ink'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
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
              placeholder="0.0"
            />
          </div>
          <div>
            <label className="label">Kg ဖိုး (THB)</label>
            <input
              className="field"
              type="number"
              value={form.kg_fee}
              onChange={(e) => update('kg_fee', e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* Parcel Photos */}
      <div className="card p-4 space-y-3">
        <div className="section-label">ပါဆယ် ဓာတ်ပုံများ</div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="py-3 px-3 rounded-xl border border-brand bg-brand/10 text-brand text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition"
          >
            <Camera className="w-4 h-4" />
            <span>ဓာတ်ပုံရိုက်မည်</span>
          </button>
          <button
            type="button"
            onClick={() => document.getElementById('parcel-images')?.click()}
            className="py-3 px-3 rounded-xl border border-line bg-surface text-ink text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-muted active:scale-95 transition"
          >
            <ImageIcon className="w-4 h-4" />
            <span>ပုံရွေးမည်</span>
          </button>
        </div>

        {/* Hidden inputs for camera capture & gallery */}
        <input
          ref={cameraInputRef}
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

        {files.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
            {files.map((f, i) => (
              <div key={i} className="relative group">
                <img
                  src={URL.createObjectURL(f)}
                  alt=""
                  className="w-full aspect-square rounded-xl object-cover border border-line"
                />
                <button
                  type="button"
                  onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sticky Bottom Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 z-30 p-3 bg-surface/95 backdrop-blur-md border-t border-line pb-safe md:static md:p-0 md:bg-transparent md:border-0">
        <button
          onClick={handleSubmit}
          disabled={createMutation.isPending}
          className="w-full bg-brand hover:bg-brand-dark text-white py-3.5 rounded-2xl font-black text-sm shadow-lg shadow-brand/25 flex items-center justify-center gap-2 active:scale-98 transition disabled:opacity-60 touch-press"
        >
          <Save className="w-5 h-5" />
          <span>{createMutation.isPending ? 'သိမ်းဆည်းနေဆဲ...' : 'ပါဆယ် စာရင်းသွင်းမည်'}</span>
        </button>
      </div>

      <CameraCapture
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(file) => setFiles((prev) => [...prev, file].slice(0, 10))}
      />
    </div>
  );
}

function SuggestionBox({
  items,
  onPick,
  onClose,
}: {
  items: ContactSuggestion[];
  onPick: (s: ContactSuggestion) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-surface border border-line rounded-2xl shadow-float max-h-48 overflow-y-auto">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-muted text-[10px] font-bold text-ink-3">
        <span>ရှိပြီးသား ဖောက်သည်များ</span>
        <button onClick={onClose}>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {items.map((s, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onPick(s)}
          className="w-full text-left px-3.5 py-2.5 border-b border-line last:border-0 hover:bg-muted active:scale-98 transition"
        >
          <div className="text-xs font-bold text-ink">{s.name}</div>
          <div className="text-[11px] text-ink-2 font-mono">{s.phone}</div>
          {s.delivery_address && (
            <div className="text-[10px] text-ink-3 truncate mt-0.5">{s.delivery_address}</div>
          )}
        </button>
      ))}
    </div>
  );
}
