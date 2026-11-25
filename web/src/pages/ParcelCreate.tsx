import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
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
  Package,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface UploadProgressState {
  isOpen: boolean;
  step: 'saving_parcel' | 'uploading_images' | 'completed' | 'error';
  percent: number;
  currentChunk: number;
  totalChunks: number;
  uploadedCount: number;
  totalImages: number;
  errorMessage?: string;
  createdParcelId?: number;
}

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

  const [progressState, setProgressState] = useState<UploadProgressState>({
    isOpen: false,
    step: 'saving_parcel',
    percent: 0,
    currentChunk: 0,
    totalChunks: 0,
    uploadedCount: 0,
    totalImages: 0,
  });
  const [lastCreatedParcelId, setLastCreatedParcelId] = useState<number | null>(null);
  const [failedChunkIndex, setFailedChunkIndex] = useState<number>(0);

  const isSubmitting =
    progressState.isOpen && progressState.step !== 'error' && progressState.step !== 'completed';

  const requiredFields = [
    Boolean(form.recipient_phone.trim()),
    Boolean(form.recipient_name.trim()),
    Boolean(form.delivery_address.trim()),
    Boolean(form.delivery_fee.trim()),
  ];
  const completedFieldsCount = requiredFields.filter(Boolean).length;
  const formCompletionPercent = Math.round((completedFieldsCount / requiredFields.length) * 100);

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

  async function uploadRemainingImages(parcelId: number, startChunkIndex = 0) {
    const chunkSize = 10;
    const totalChunks = Math.ceil(files.length / chunkSize);

    setProgressState((prev) => ({
      ...prev,
      isOpen: true,
      step: 'uploading_images',
      createdParcelId: parcelId,
      currentChunk: startChunkIndex + 1,
      totalChunks,
      totalImages: files.length,
    }));

    try {
      for (let c = startChunkIndex; c < totalChunks; c++) {
        setFailedChunkIndex(c);
        const chunk = files.slice(c * chunkSize, (c + 1) * chunkSize);
        const formData = new FormData();
        chunk.forEach((f) => formData.append('images[]', f, f.name));

        const basePercent = 15 + Math.round((c / totalChunks) * 80);
        const chunkWeight = 80 / totalChunks;

        await parcelService.uploadImages(parcelId, formData, (percent) => {
          const overall = Math.min(96, Math.round(basePercent + (percent / 100) * chunkWeight));
          const currentUploaded = Math.min(
            files.length,
            c * chunkSize + Math.round((chunk.length * percent) / 100)
          );
          setProgressState((prev) => ({
            ...prev,
            percent: overall,
            currentChunk: c + 1,
            uploadedCount: currentUploaded,
          }));
        });
      }

      queryClient.invalidateQueries({ queryKey: ['parcels'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['parcel', String(parcelId)] });

      setProgressState((prev) => ({
        ...prev,
        step: 'completed',
        percent: 100,
        uploadedCount: files.length,
      }));

      setTimeout(() => {
        navigate(`/parcels/${parcelId}`);
      }, 1200);
    } catch (uploadErr: any) {
      const msg =
        uploadErr?.response?.data?.message ||
        uploadErr?.message ||
        'ဓာတ်ပုံ အချို့ တင်ရာတွင် အမှားဖြစ်ပွားခဲ့ပါသည်။';
      setProgressState((prev) => ({
        ...prev,
        step: 'error',
        errorMessage: msg,
      }));
    }
  }

  function handleRetryImages() {
    if (!lastCreatedParcelId) return;
    uploadRemainingImages(lastCreatedParcelId, failedChunkIndex);
  }

  async function handleSubmit() {
    if (!validate() || isSubmitting) return;

    const payload = {
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
    };

    const chunkSize = 10;
    const totalChunks = Math.ceil(files.length / chunkSize) || 1;

    setProgressState({
      isOpen: true,
      step: 'saving_parcel',
      percent: files.length > 0 ? 10 : 35,
      currentChunk: 0,
      totalChunks,
      uploadedCount: 0,
      totalImages: files.length,
    });

    try {
      const createdParcel = await parcelService.create(payload);
      setLastCreatedParcelId(createdParcel.id);

      if (files.length === 0) {
        setProgressState({
          isOpen: true,
          step: 'completed',
          percent: 100,
          currentChunk: 1,
          totalChunks: 1,
          uploadedCount: 0,
          totalImages: 0,
          createdParcelId: createdParcel.id,
        });
        queryClient.invalidateQueries({ queryKey: ['parcels'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        setTimeout(() => {
          navigate(`/parcels/${createdParcel.id}`);
        }, 1000);
        return;
      }

      await uploadRemainingImages(createdParcel.id, 0);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'ပါဆယ် မှတ်ပုံတင်မှု မအောင်မြင်ပါ';
      setProgressState((prev) => ({
        ...prev,
        step: 'error',
        errorMessage: msg,
      }));
    }
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

      {/* Form Completion Progress Bar */}
      <div className="card p-3 sm:p-4 space-y-2 border-line bg-surface/60 backdrop-blur-sm">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-ink flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
            ဖြည့်သွင်းမှု တိုးတက်မှု (Form Progress)
          </span>
          <span className="font-extrabold text-brand">
            {formCompletionPercent}% ({completedFieldsCount}/4 အချက်အလက်)
          </span>
        </div>
        <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand transition-all duration-300 ease-out rounded-full"
            style={{ width: `${formCompletionPercent}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1 text-[11px]">
          <span
            className={`px-2 py-0.5 rounded-full border transition flex items-center gap-1 ${
              form.recipient_phone.trim()
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-muted/40 text-ink-3 border-line'
            }`}
          >
            <Check className="w-3 h-3" /> ဖုန်းနံပါတ်
          </span>
          <span
            className={`px-2 py-0.5 rounded-full border transition flex items-center gap-1 ${
              form.recipient_name.trim()
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-muted/40 text-ink-3 border-line'
            }`}
          >
            <Check className="w-3 h-3" /> နာမည်
          </span>
          <span
            className={`px-2 py-0.5 rounded-full border transition flex items-center gap-1 ${
              form.delivery_address.trim()
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-muted/40 text-ink-3 border-line'
            }`}
          >
            <Check className="w-3 h-3" /> လိပ်စာ
          </span>
          <span
            className={`px-2 py-0.5 rounded-full border transition flex items-center gap-1 ${
              form.delivery_fee.trim()
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-muted/40 text-ink-3 border-line'
            }`}
          >
            <Check className="w-3 h-3" /> ပို့ဆောင်ခ
          </span>
          {files.length > 0 && (
            <span className="px-2 py-0.5 rounded-full border bg-brand/10 text-brand border-brand/20 font-bold flex items-center gap-1">
              <ImageIcon className="w-3 h-3" /> {files.length}/30 ပုံ
            </span>
          )}
        </div>
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
        <div className="flex items-center justify-between">
          <div className="section-label">ပါဆယ် ဓာတ်ပုံများ</div>
          <span className="text-xs text-ink-3">အများဆုံး ၃၀ ပုံ</span>
        </div>

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
            setFiles((prev) => [...prev, ...selected].slice(0, 30));
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
            setFiles((prev) => [...prev, ...selected].slice(0, 30));
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
          disabled={isSubmitting}
          className="w-full bg-brand hover:bg-brand-dark text-white py-3.5 rounded-2xl font-black text-sm shadow-lg shadow-brand/25 flex items-center justify-center gap-2 active:scale-98 transition disabled:opacity-60 touch-press"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>
                {progressState.step === 'saving_parcel' && 'အချက်အလက် သိမ်းနေဆဲ...'}
                {progressState.step === 'uploading_images' &&
                  `ဓာတ်ပုံ တင်နေသည် (${progressState.uploadedCount}/${progressState.totalImages})...`}
              </span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>ပါဆယ် စာရင်းသွင်းမည်</span>
            </>
          )}
        </button>
      </div>

      <CameraCapture
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(file) => setFiles((prev) => [...prev, file].slice(0, 30))}
      />

      {/* Upload & Submission Progress Modal */}
      {progressState.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card w-full max-w-md p-6 space-y-5 bg-surface border-line shadow-2xl rounded-3xl">
            {/* Header Icon & Title */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center transition-all duration-300">
                {progressState.step === 'saving_parcel' && (
                  <div className="w-16 h-16 rounded-2xl bg-brand/10 text-brand flex items-center justify-center animate-pulse">
                    <Package className="w-8 h-8 animate-bounce" />
                  </div>
                )}
                {progressState.step === 'uploading_images' && (
                  <div className="w-16 h-16 rounded-2xl bg-brand/10 text-brand flex items-center justify-center relative">
                    <UploadCloud className="w-8 h-8 animate-pulse" />
                    <Loader2 className="w-12 h-12 absolute text-brand/30 animate-spin" />
                  </div>
                )}
                {progressState.step === 'completed' && (
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center scale-110 transition-transform">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                )}
                {progressState.step === 'error' && (
                  <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                    <AlertCircle className="w-10 h-10" />
                  </div>
                )}
              </div>

              <h2 className="text-lg font-black text-ink">
                {progressState.step === 'saving_parcel' && 'ပါဆယ် အချက်အလက် သိမ်းဆည်းနေပါသည်...'}
                {progressState.step === 'uploading_images' && 'ဓာတ်ပုံများ တင်ပို့နေပါသည်...'}
                {progressState.step === 'completed' && 'ပါဆယ် မှတ်ပုံတင်ခြင်း အောင်မြင်ပါသည်!'}
                {progressState.step === 'error' && 'လုပ်ဆောင်မှု မအောင်မြင်ပါ'}
              </h2>

              <p className="text-xs text-ink-3 leading-relaxed">
                {progressState.step === 'saving_parcel' && 'ဆာဗာပေါ်တွင် ပါဆယ်စာရင်းကို ထည့်သွင်းနေပါသည်'}
                {progressState.step === 'uploading_images' && (
                  <span>
                    ဓာတ်ပုံ <strong>{progressState.uploadedCount} / {progressState.totalImages}</strong> ပုံ တင်ပြီးပါပြီ • အတွဲ ({progressState.currentChunk} / {progressState.totalChunks})
                  </span>
                )}
                {progressState.step === 'completed' && (
                  <span>
                    ပါဆယ်နှင့် ဓာတ်ပုံ ({progressState.totalImages} ပုံ) အားလုံးကို အောင်မြင်စွာ မှတ်ပုံတင်ပြီးပါပြီ။
                  </span>
                )}
                {progressState.step === 'error' && (progressState.errorMessage || 'အမှားတစ်ခု ဖြစ်ပွားခဲ့ပါသည်')}
              </p>
            </div>

            {/* Progress Bar & Percentage */}
            {progressState.step !== 'error' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-ink-2">တိုးတက်မှု (Progress)</span>
                  <span className="text-brand font-mono text-sm">{progressState.percent}%</span>
                </div>
                <div className="w-full bg-muted/60 h-3 rounded-full overflow-hidden p-0.5 border border-line">
                  <div
                    className={`h-full rounded-full transition-all duration-200 ease-out ${
                      progressState.step === 'completed' ? 'bg-emerald-500' : 'bg-brand'
                    }`}
                    style={{ width: `${progressState.percent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Steps Visual Checklist */}
            <div className="p-3.5 rounded-2xl bg-muted/30 border border-line space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-ink">
                  {progressState.step === 'saving_parcel' ? (
                    <Loader2 className="w-3.5 h-3.5 text-brand animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  )}
                  ၁။ ပါဆယ် အချက်အလက် မှတ်ပုံတင်ခြင်း
                </span>
                <span className="font-bold text-[10px] text-ink-3">
                  {progressState.step === 'saving_parcel' ? 'ဆောင်ရွက်ဆဲ' : 'ပြီးပါပြီ'}
                </span>
              </div>

              {progressState.totalImages > 0 && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-ink">
                    {progressState.step === 'saving_parcel' ? (
                      <span className="w-3.5 h-3.5 rounded-full border border-ink-3/40 inline-block" />
                    ) : progressState.step === 'uploading_images' ? (
                      <Loader2 className="w-3.5 h-3.5 text-brand animate-spin" />
                    ) : progressState.step === 'completed' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                    )}
                    ၂။ ဓာတ်ပုံများ အပ်လုဒ်တင်ခြင်း ({progressState.totalImages} ပုံ)
                  </span>
                  <span className="font-bold text-[10px] text-ink-3">
                    {progressState.step === 'saving_parcel'
                      ? 'စောင့်ဆိုင်းဆဲ'
                      : progressState.step === 'uploading_images'
                      ? `${progressState.uploadedCount}/${progressState.totalImages}`
                      : progressState.step === 'completed'
                      ? 'ပြီးပါပြီ'
                      : 'မအောင်မြင်ပါ'}
                  </span>
                </div>
              )}
            </div>

            {/* Actions for completed or error state */}
            {progressState.step === 'completed' && (
              <button
                type="button"
                onClick={() => {
                  if (progressState.createdParcelId) {
                    navigate(`/parcels/${progressState.createdParcelId}`);
                  } else {
                    navigate('/parcels');
                  }
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl active:scale-98 transition flex items-center justify-center gap-2"
              >
                <span>ပါဆယ် အသေးစိတ် ကြည့်မည်</span>
              </button>
            )}

            {progressState.step === 'error' && (
              <div className="flex gap-2 pt-2">
                {progressState.createdParcelId ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleRetryImages()}
                      className="flex-1 bg-brand text-white font-bold py-2.5 rounded-xl hover:bg-brand-dark transition"
                    >
                      ပြန်လည်ကြိုးစားမည်
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/parcels/${progressState.createdParcelId}`)}
                      className="flex-1 bg-surface border border-line text-ink font-bold py-2.5 rounded-xl hover:bg-muted transition"
                    >
                      ပါဆယ်သို့ သွားမည်
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setProgressState((p) => ({ ...p, isOpen: false }))}
                    className="w-full bg-muted text-ink font-bold py-2.5 rounded-xl hover:bg-muted/80 transition"
                  >
                    ပိတ်မည်
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
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
