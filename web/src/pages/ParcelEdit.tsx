import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { parcelService, ParcelImage } from '../services/parcelService';
import CameraCapture from '../components/CameraCapture';
import {
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  Save,
  X,
  Plus,
} from 'lucide-react';

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
    sender_name: '',
    sender_phone: '',
    recipient_name: '',
    recipient_phone: '',
    delivery_address: '',
    description: '',
    weight: '',
    kg_fee: '',
    notes: '',
    delivery_fee: '',
    cod_amount: '0',
    is_cod: false,
    currency: 'MMK' as 'MMK' | 'THB',
    cod_currency: 'MMK' as 'MMK' | 'THB',
    items: [] as { product_name: string; quantity: string }[],
    priority: 'NORMAL',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [existingImages, setExistingImages] = useState<ParcelImage[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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
        items: (parcel.items ?? []).map((it: any) => ({
          product_name: it.product_name,
          quantity: String(it.quantity ?? 1),
        })),
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
          const chunkSize = 10;
          for (let i = 0; i < newFiles.length; i += chunkSize) {
            const chunk = newFiles.slice(i, i + chunkSize);
            const formData = new FormData();
            chunk.forEach((f) => formData.append('images[]', f, f.name));
            await parcelService.uploadImages(numId, formData);
          }
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
    setErrors((e) => {
      const n = { ...e };
      delete n[field];
      return n;
    });
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
    if (!form.recipient_name.trim()) newErrors.recipient_name = 'အမည် လိုအပ်ပါသည်';
    if (!form.recipient_phone.trim()) newErrors.recipient_phone = 'ဖုန်း လိုအပ်ပါသည်';
    if (!form.delivery_address.trim()) newErrors.delivery_address = 'လိပ်စာ လိုအပ်ပါသည်';
    if (!form.delivery_fee.trim()) newErrors.delivery_fee = 'ပို့ဆောင်ခ လိုအပ်ပါသည်';
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
    return (
      <div className="p-4 sm:p-6 space-y-3 max-w-2xl mx-auto">
        <div className="h-20 rounded-2xl bg-muted animate-pulse" />
        <div className="h-44 rounded-2xl bg-muted animate-pulse" />
      </div>
    );
  }

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
        <h1 className="text-base sm:text-lg font-black text-ink">ပါဆယ် ပြင်ဆင်မည်</h1>
        <span />
      </div>

      {/* Recipient Section */}
      <div className="card p-4 space-y-3 border-brand/30">
        <div className="section-label text-brand">လက်ခံသူ အချက်အလက် *</div>
        <div>
          <label className="label">လက်ခံသူ ဖုန်းနံပါတ် *</label>
          <input
            className={`field ${errors.recipient_phone ? 'border-bad' : ''}`}
            value={form.recipient_phone}
            onChange={(e) => update('recipient_phone', e.target.value)}
            type="tel"
          />
          {errors.recipient_phone && (
            <p className="text-xs text-bad mt-1">{errors.recipient_phone}</p>
          )}
        </div>

        <div>
          <label className="label">လက်ခံသူ နာမည် *</label>
          <input
            className={`field ${errors.recipient_name ? 'border-bad' : ''}`}
            value={form.recipient_name}
            onChange={(e) => update('recipient_name', e.target.value)}
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
          />
          {errors.delivery_address && (
            <p className="text-xs text-bad mt-1">{errors.delivery_address}</p>
          )}
        </div>
      </div>

      {/* Sender Section */}
      <div className="card p-4 space-y-3">
        <div className="section-label">ပေးပို့သူ အချက်အလက်</div>
        <div>
          <label className="label">ပေးပို့သူ ဖုန်းနံပါတ်</label>
          <input
            className="field"
            value={form.sender_phone}
            onChange={(e) => update('sender_phone', e.target.value)}
            type="tel"
          />
        </div>
        <div>
          <label className="label">ပေးပို့သူ နာမည်</label>
          <input
            className="field"
            value={form.sender_name}
            onChange={(e) => update('sender_name', e.target.value)}
          />
        </div>
      </div>

      {/* Financial Info */}
      <div className="card p-4 space-y-3">
        <div className="section-label">ငွေကြေး သတ်မှတ်ချက်</div>

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
          />
          {errors.delivery_fee && <p className="text-xs text-bad mt-1">{errors.delivery_fee}</p>}
        </div>

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
                COD ပမာဏ ({form.cod_currency})
              </label>
              <input
                className="field border-amber-300 dark:border-amber-800"
                type="number"
                value={form.cod_amount}
                onChange={(e) => update('cod_amount', e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Parcel Specifics */}
      <div className="card p-4 space-y-3">
        <div className="section-label">ပါဆယ် အချက်အလက်များ</div>

        <div>
          <label className="label">ဖော်ပြချက်</label>
          <input
            className="field"
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
          />
        </div>

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
              onChange={(e) => update('weight', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Kg ဖိုး (THB)</label>
            <input
              className="field"
              type="number"
              value={form.kg_fee}
              onChange={(e) => update('kg_fee', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Existing and New Photos */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="section-label">ဓာတ်ပုံများ</div>
          <span className="text-xs text-ink-3">အများဆုံး ၃၀ ပုံ</span>
        </div>

        {existingImages.length > 0 && (
          <div>
            <div className="text-xs text-ink-3 mb-2">လက်ရှိ ဓာတ်ပုံများ</div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {existingImages.map((img) => (
                <div key={img.id} className="relative group">
                  <img
                    src={img.url}
                    alt=""
                    className="w-full aspect-square rounded-xl object-cover border border-line"
                  />
                  <button
                    type="button"
                    onClick={() => deleteExistingImage(img.id)}
                    className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="py-2.5 px-3 rounded-xl border border-brand bg-brand/10 text-brand text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition"
          >
            <Camera className="w-4 h-4" />
            <span>ဓာတ်ပုံရိုက်မည်</span>
          </button>
          <button
            type="button"
            onClick={() => document.getElementById('parcel-images-edit')?.click()}
            className="py-2.5 px-3 rounded-xl border border-line bg-surface text-ink text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-muted active:scale-95 transition"
          >
            <ImageIcon className="w-4 h-4" />
            <span>ပုံထပ်ရွေးမည်</span>
          </button>
        </div>

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const selected = Array.from(e.target.files || []);
            const maxAllowed = Math.max(0, 30 - existingImages.length);
            setNewFiles((prev) => [...prev, ...selected].slice(0, maxAllowed));
            e.target.value = '';
          }}
        />
        <input
          id="parcel-images-edit"
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const selected = Array.from(e.target.files || []);
            const maxAllowed = Math.max(0, 30 - existingImages.length);
            setNewFiles((prev) => [...prev, ...selected].slice(0, maxAllowed));
            e.target.value = '';
          }}
        />

        {newFiles.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
            {newFiles.map((f, i) => (
              <div key={i} className="relative group">
                <img
                  src={URL.createObjectURL(f)}
                  alt=""
                  className="w-full aspect-square rounded-xl object-cover border border-line"
                />
                <button
                  type="button"
                  onClick={() => setNewFiles((prev) => prev.filter((_, idx) => idx !== i))}
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
          disabled={updateMutation.isPending || uploadingImages}
          className="w-full bg-brand hover:bg-brand-dark text-white py-3.5 rounded-2xl font-black text-sm shadow-lg shadow-brand/25 flex items-center justify-center gap-2 active:scale-98 transition disabled:opacity-60 touch-press"
        >
          <Save className="w-5 h-5" />
          <span>
            {updateMutation.isPending || uploadingImages
              ? 'ပြင်ဆင်မှု သိမ်းနေဆဲ...'
              : 'ပြင်ဆင်မှု သိမ်းမည်'}
          </span>
        </button>
      </div>
    </div>
  );
}
