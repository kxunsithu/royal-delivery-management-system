import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { userService } from '../services/userService';

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
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'delivery_staff' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useMutation({
    mutationFn: (data: any) => userService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      window.alert('အသုံးပြုသူ ဖန်တီးပြီးပါပြီ');
      navigate('/users');
    },
    onError: (error: any) => window.alert(error?.response?.data?.message || 'ဖန်တီးမှု မအောင်မြင်ပါ'),
  });

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  }

  function validate() {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'လိုအပ်သည်';
    if (!form.phone.trim()) newErrors.phone = 'လိုအပ်သည်';
    if (!form.password.trim()) newErrors.password = 'လိုအပ်သည်';
    if (form.password.length < 8) newErrors.password = 'စကားဝှက် အနည်းဆုံး ၈ လုံး';
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
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">အသုံးပြုသူ အသစ်ဖန်တီးမည်</h1>
        <button onClick={handleSubmit} disabled={createMutation.isPending} className="px-4 py-2 rounded bg-brand text-white font-bold disabled:opacity-60">
          {createMutation.isPending ? '...' : 'သိမ်းမည်'}
        </button>
      </div>

      <div className="card p-4 space-y-3">
        <h3 className="text-sm font-bold text-ink">အသုံးပြုသူ အချက်အလက်</h3>
        <Field label="နာမည် *" value={form.name} onChange={(v) => update('name', v)} error={errors.name} />
        <Field label="ဖုန်းနံပါတ် *" value={form.phone} onChange={(v) => update('phone', v)} error={errors.phone} type="tel" />
        <Field label="စကားဝှက် *" value={form.password} onChange={(v) => update('password', v)} error={errors.password} type="password" />
        <Field label="အီးမေးလ် (ရွေးချယ်ရန်)" value={form.email} onChange={(v) => update('email', v)} type="email" />
      </div>

      <div className="card p-4 space-y-3">
        <h3 className="text-sm font-bold text-ink">အခန်းကဏ္ဍ</h3>
        <div className="grid grid-cols-2 gap-2">
          {ROLES.map((r) => (
            <button key={r.value} onClick={() => update('role', r.value)} className={`px-3 py-2 rounded border text-sm font-semibold ${form.role === r.value ? 'bg-brand text-white border-brand' : 'border-line text-ink'}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <button onClick={handleSubmit} disabled={createMutation.isPending} className="w-full bg-brand text-white py-3 rounded font-bold disabled:opacity-60">
        {createMutation.isPending ? '...' : 'အသုံးပြုသူ ဖန်တီးမည်'}
      </button>
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