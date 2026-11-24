import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { userService, User } from '../services/userService';
import { ROLE_LABELS_MM } from '../constants';
import {
  ArrowLeft,
  Pencil,
  Phone,
  Mail,
  Shield,
  Save,
  X,
  Check,
} from 'lucide-react';

const ROLES = [
  { value: 'admin', label: 'အက်ဒ်မင်', color: '#8B5CF6' },
  { value: 'manager', label: 'မန်နေဂျာ', color: '#3B82F6' },
  { value: 'accountant', label: 'စာရင်းကိုင်', color: '#F59E0B' },
  { value: 'delivery_staff', label: 'ပို့ဆောင်ရေးဝန်ထမ်း', color: '#10B981' },
];

function roleColor(role: string) {
  return ROLES.find((r) => r.value === role)?.color ?? '#6B7280';
}

export default function UserDetail() {
  const { id } = useParams();
  const userId = Number(id);
  const navigate = useNavigate();
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('delivery_staff');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: user, isLoading, refetch } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const data = await userService.get(userId);
      setName(data.name);
      setEmail(data.email || '');
      setPhone(data.phone || '');
      setRole(data.role);
      return data;
    },
    enabled: Boolean(userId),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: any) => userService.update(userId, payload),
    onSuccess: () => {
      window.alert('အသုံးပြုသူ အချက်အလက်များ ပြင်ဆင်ပြီးပါပြီ');
      setIsEditing(false);
      setPassword('');
      setErrors({});
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      refetch();
    },
    onError: (err: any) => window.alert(err?.response?.data?.message || 'ပြင်ဆင်မှု မအောင်မြင်ပါ'),
  });

  const statusMutation = useMutation({
    mutationFn: (isActive: boolean) => userService.updateStatus(userId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      refetch();
    },
  });

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'အမည် လိုအပ်ပါသည်';
    if (!phone.trim()) e.phone = 'ဖုန်း လိုအပ်ပါသည်';
    if (password && password.length < 8) e.password = 'စကားဝှက် အနည်းဆုံး ၈ လုံး ရှိရပါမည်';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const payload: any = { name: name.trim(), phone: phone.trim(), email: email.trim() || null, role };
    if (password.trim()) payload.password = password.trim();
    updateMutation.mutate(payload);
  }

  function handleToggleStatus() {
    if (!user) return;
    if (!window.confirm(`${user.name} ၏ အကောင့်ကို ${user.is_active ? 'ပိတ်' : 'ဖွင့်'}မည်လား?`)) return;
    statusMutation.mutate(!user.is_active);
  }

  if (isLoading || !user) {
    return (
      <div className="p-4 sm:p-6 space-y-3 max-w-xl mx-auto">
        <div className="h-20 rounded-2xl bg-muted animate-pulse" />
        <div className="h-44 rounded-2xl bg-muted animate-pulse" />
      </div>
    );
  }

  const rc = roleColor(user.role);
  const roleLabel = ROLE_LABELS_MM[user.role] || user.role;

  return (
    <div className="p-3.5 sm:p-6 space-y-3.5 max-w-xl mx-auto pb-28 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl border border-line bg-surface hover:bg-muted active:scale-95 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-base sm:text-lg font-black text-ink">
          {isEditing ? 'ပြင်ဆင်နေဆဲ' : 'အသုံးပြုသူ အချက်အလက်'}
        </h1>
        <button
          onClick={() => {
            setIsEditing((v) => !v);
            setErrors({});
          }}
          className="px-3.5 py-1.5 rounded-xl border border-line bg-surface text-xs font-bold hover:bg-muted active:scale-95 transition flex items-center gap-1"
        >
          {isEditing ? (
            <>
              <X className="w-3.5 h-3.5" />
              <span>ပိတ်မည်</span>
            </>
          ) : (
            <>
              <Pencil className="w-3.5 h-3.5" />
              <span>ပြင်ဆင်</span>
            </>
          )}
        </button>
      </div>

      {/* User Avatar Card */}
      <div className="card p-5 flex flex-col items-center text-center space-y-2.5 bg-gradient-to-b from-surface to-muted/30">
        {user.profile_image_url ? (
          <img
            src={user.profile_image_url}
            alt=""
            className="w-20 h-20 rounded-3xl object-cover border border-line shadow-sm"
          />
        ) : (
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center text-white text-2xl font-black shadow-sm"
            style={{ backgroundColor: rc }}
          >
            {user.name[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <div className="text-base font-black text-ink">{user.name}</div>
          <div className="text-xs text-ink-2 font-mono mt-0.5">{user.phone || user.email}</div>
        </div>

        <div className="flex gap-2">
          <span
            className="text-xs font-bold px-2.5 py-0.5 rounded-full"
            style={{ color: rc, backgroundColor: rc + '18' }}
          >
            {roleLabel}
          </span>
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              user.is_active
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                : 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
            }`}
          >
            {user.is_active ? 'အသက်ဝင်' : 'ပိတ်ထား'}
          </span>
        </div>

        {user.phone && (
          <a
            href={`tel:${user.phone}`}
            className="inline-flex items-center gap-1 text-xs text-brand font-bold hover:underline pt-1"
          >
            <Phone className="w-3 h-3" />
            <span>ဖုန်းခေါ်မည် ({user.phone})</span>
          </a>
        )}
      </div>

      {!isEditing ? (
        <div className="space-y-3">
          <div className="card p-4 space-y-2">
            <div className="section-label">အကောင့် အချက်အလက်</div>
            <Row label="နာမည်" value={user.name} />
            <Row label="ဖုန်းနံပါတ်" value={user.phone || '—'} />
            <Row label="အီးမေးလ်" value={user.email || '—'} />
            <Row label="အခန်းကဏ္ဍ" value={roleLabel} valueColor={rc} />
          </div>

          <button
            onClick={handleToggleStatus}
            disabled={statusMutation.isPending}
            className={`w-full py-3 rounded-2xl font-bold text-xs shadow-sm active:scale-98 transition ${
              user.is_active
                ? 'bg-rose-500/10 text-rose-600 border border-rose-200 dark:border-rose-900/40'
                : 'bg-emerald-500/10 text-emerald-600 border border-emerald-200 dark:border-emerald-900/40'
            }`}
          >
            {statusMutation.isPending
              ? 'ပြောင်းလဲနေဆဲ...'
              : user.is_active
              ? 'အကောင့် ပိတ်မည်'
              : 'အကောင့် ဖွင့်မည်'}
          </button>
        </div>
      ) : (
        <div className="space-y-3 animate-fade-in">
          <div className="card p-4 space-y-3">
            <div className="section-label">အချက်အလက် ပြင်ဆင်ရန်</div>
            <Field label="နာမည် *" value={name} onChange={setName} error={errors.name} />
            <Field
              label="ဖုန်းနံပါတ် *"
              value={phone}
              onChange={setPhone}
              error={errors.phone}
              type="tel"
            />
            <Field
              label="အီးမေးလ် (ရွေးချယ်ရန်)"
              value={email}
              onChange={setEmail}
              type="email"
            />
            <div>
              <label className="label">စကားဝှက်အသစ် (မပြောင်းလျှင် ကွက်ချန်)</label>
              <div className="flex gap-2">
                <input
                  className={`field flex-1 ${errors.password ? 'border-bad' : ''}`}
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="အနည်းဆုံး ၈ လုံး"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="px-3 border border-line rounded-xl text-xs font-semibold hover:bg-muted"
                >
                  {showPass ? 'ဖျောက်' : 'ပြ'}
                </button>
              </div>
              {errors.password && <p className="text-xs text-bad mt-1">{errors.password}</p>}
            </div>
          </div>

          <div className="card p-4 space-y-3">
            <div className="section-label">အခန်းကဏ္ဍ ရွေးချယ်ရန်</div>
            <div className="space-y-2">
              {ROLES.map((r) => {
                const selected = role === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition active:scale-98 ${
                      selected
                        ? 'border-brand bg-brand/10 font-bold'
                        : 'border-line bg-surface hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                      <span className="text-xs font-semibold text-ink">{r.label}</span>
                    </div>
                    {selected && <Check className="w-4 h-4 text-brand" />}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="w-full bg-brand text-white py-3.5 rounded-2xl font-black text-sm shadow-lg shadow-brand/25 flex items-center justify-center gap-2 active:scale-98 transition disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            <span>{updateMutation.isPending ? 'သိမ်းနေဆဲ...' : 'ပြင်ဆင်မှု သိမ်းမည်'}</span>
          </button>
        </div>
      )}
    </div>
  );
}

function Row({
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

function Field({
  label,
  value,
  onChange,
  type = 'text',
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  error?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        className={`field ${error ? 'border-bad' : ''}`}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <p className="text-xs text-bad mt-1">{error}</p>}
    </div>
  );
}
