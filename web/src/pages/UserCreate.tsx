import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { userService } from '../services/userService';
import { ArrowLeft, Save, UserPlus, Shield } from 'lucide-react';

const ROLES = [
  { value: 'admin', label: 'အက်ဒ်မင်' },
  { value: 'manager', label: 'မန်နေဂျာ' },
  { value: 'accountant', label: 'စာရင်းကိုင်' },
  { value: 'delivery_staff', label: 'ပို့ဆောင်ရေးဝန်ထမ်း' },
];

export default function UserCreate() {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'delivery_staff',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useMutation({
    mutationFn: (data: any) => userService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      window.alert('အသုံးပြုသူ ဖန်တီးပြီးပါပြီ');
      navigate('/users');
    },
    onError: (error: any) =>
      window.alert(error?.response?.data?.message || 'ဖန်တီးမှု မအောင်မြင်ပါ'),
  });

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => {
      const n = { ...e };
      delete n[field];
      return n;
    });
  }

  function validate() {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'အမည် လိုအပ်ပါသည်';
    if (!form.phone.trim()) newErrors.phone = 'ဖုန်းနံပါတ် လိုအပ်ပါသည်';
    if (!form.password.trim()) newErrors.password = 'စကားဝှက် လိုအပ်ပါသည်';
    if (form.password.length < 8) newErrors.password = 'စကားဝှက် အနည်းဆုံး ၈ လုံး ရှိရပါမည်';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    createMutation.mutate({
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      password: form.password,
      role: form.role,
    });
  }

  return (
    <div className="p-3.5 sm:p-6 max-w-xl mx-auto space-y-4 pb-28 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl border border-line bg-surface hover:bg-muted active:scale-95 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-base sm:text-lg font-black text-ink">အသုံးပြုသူ အသစ်ဖန်တီးမည်</h1>
        <span />
      </div>

      {/* Account Info */}
      <div className="card p-4 space-y-3">
        <div className="section-label">အသုံးပြုသူ အချက်အလက်</div>
        <Field
          label="နာမည် *"
          value={form.name}
          onChange={(v) => update('name', v)}
          error={errors.name}
          placeholder="ဝန်ထမ်းအမည်"
        />
        <Field
          label="ဖုန်းနံပါတ် *"
          value={form.phone}
          onChange={(v) => update('phone', v)}
          error={errors.phone}
          type="tel"
          placeholder="09xxxxxxxxx"
        />
        <Field
          label="စကားဝှက် *"
          value={form.password}
          onChange={(v) => update('password', v)}
          error={errors.password}
          type="password"
          placeholder="အနည်းဆုံး ၈ လုံး"
        />
        <Field
          label="အီးမေးလ် (ရွေးချယ်ရန်)"
          value={form.email}
          onChange={(v) => update('email', v)}
          type="email"
          placeholder="user@example.com"
        />
      </div>

      {/* Role Picker */}
      <div className="card p-4 space-y-3">
        <div className="section-label">အခန်းကဏ္ဍ (Role)</div>
        <div className="grid grid-cols-2 gap-2">
          {ROLES.map((r) => {
            const isSelected = form.role === r.value;
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => update('role', r.value)}
                className={`p-3 rounded-xl border text-xs font-bold transition active:scale-95 ${
                  isSelected
                    ? 'bg-brand text-white border-brand shadow-sm'
                    : 'bg-surface border-line text-ink hover:bg-muted'
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sticky Bottom Save Button */}
      <div className="fixed bottom-0 left-0 right-0 z-30 p-3 bg-surface/95 backdrop-blur-md border-t border-line pb-safe md:static md:p-0 md:bg-transparent md:border-0">
        <button
          onClick={handleSubmit}
          disabled={createMutation.isPending}
          className="w-full bg-brand hover:bg-brand-dark text-white py-3.5 rounded-2xl font-black text-sm shadow-lg shadow-brand/25 flex items-center justify-center gap-2 active:scale-98 transition disabled:opacity-60 touch-press"
        >
          <UserPlus className="w-5 h-5" />
          <span>
            {createMutation.isPending ? 'ဖန်တီးနေဆဲ...' : 'အသုံးပြုသူ အကောင့် ဖန်တီးမည်'}
          </span>
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  error,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  error?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        className={`field ${error ? 'border-bad' : ''}`}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {error && <p className="text-xs text-bad mt-1">{error}</p>}
    </div>
  );
}
