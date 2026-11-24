import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { userService, User } from '../services/userService';
import { ROLE_LABELS_MM } from '../constants';

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
    enabled: !!userId,
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
    if (!name.trim()) e.name = 'လိုအပ်သည်';
    if (!phone.trim()) e.phone = 'လိုအပ်သည်';
    if (password && password.length < 8) e.password = 'စကားဝှက် အနည်းဆုံး ၈ လုံး';
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

  if (isLoading || !user) return <div className="p-6 text-center text-ink-2">Loading...</div>;

  const rc = roleColor(user.role);
  const roleLabel = ROLE_LABELS_MM[user.role] || user.role;

  return (
    <div className="p-4 md:p-6 space-y-3 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="px-3 py-1.5 rounded border border-line text-sm">← နောက်</button>
        <h1 className="text-lg font-bold text-ink">{isEditing ? 'ပြင်ဆင်နေဆဲ' : 'အသုံးပြုသူ အချက်အလက်'}</h1>
        <button onClick={() => { setIsEditing((v) => !v); setErrors({}); }} className="px-3 py-1.5 rounded border border-line text-sm">
          {isEditing ? 'ပိတ်' : 'ပြင်ဆင်'}
        </button>
      </div>

      <div className="card p-4 flex flex-col items-center text-center space-y-2">
        {user.profile_image_url ? (
          <img src={user.profile_image_url} alt="" className="w-20 h-20 rounded-full object-cover" />
        ) : (
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold" style={{ backgroundColor: rc }}>{user.name[0]?.toUpperCase()}</div>
        )}
        <div className="text-lg font-bold text-ink">{user.name}</div>
        <div className="text-sm text-ink-2">{user.phone || user.email}</div>
        <div className="flex gap-2">
          <span className="text-xs px-2 py-0.5 rounded font-semibold" style={{ color: rc, backgroundColor: rc + '18' }}>{roleLabel}</span>
          <span className={`text-xs px-2 py-0.5 rounded font-semibold ${user.is_active ? 'bg-ok-bg text-ok' : 'bg-bad-bg text-bad'}`}>{user.is_active ? 'အသက်ဝင်' : 'ပိတ်ထား'}</span>
        </div>
        {user.phone && (
          <a href={`tel:${user.phone}`} className="text-sm text-brand font-semibold">ဖုန်းခေါ်ရန် · {user.phone}</a>
        )}
      </div>

      {!isEditing && (
        <>
          <div className="card p-3 space-y-1">
            <h3 className="section-label">အကောင့် အချက်အလက်</h3>
            <Row label="နာမည်" value={user.name} />
            <Row label="ဖုန်းနံပါတ်" value={user.phone || '—'} />
            <Row label="အီးမေးလ်" value={user.email || '—'} />
            <Row label="အခန်းကဏ္ဍ" value={roleLabel} valueColor={rc} />
          </div>
          <button onClick={handleToggleStatus} disabled={statusMutation.isPending} className={`w-full py-3 rounded font-bold ${user.is_active ? 'bg-bad-bg text-bad' : 'bg-ok-bg text-ok'}`}>
            {statusMutation.isPending ? '...' : user.is_active ? 'အကောင့် ပိတ်မည်' : 'အကောင့် ဖွင့်မည်'}
          </button>
        </>
      )}

      {isEditing && (
        <>
          <div className="card p-4 space-y-3">
            <h3 className="text-sm font-bold text-ink">အချက်အလက် ပြင်ဆင်ရန်</h3>
            <Field label="နာမည် *" value={name} onChange={setName} error={errors.name} />
            <Field label="ဖုန်းနံပါတ် *" value={phone} onChange={setPhone} error={errors.phone} type="tel" />
            <Field label="အီးမေးလ် (ရွေးချယ်ရန်)" value={email} onChange={setEmail} type="email" />
            <div>
              <label className="label">စကားဝှက်အသစ် (မပြောင်းလျှင် ကွက်ချန်)</label>
              <div className="flex gap-2">
                <input className={`field flex-1 ${errors.password ? 'border-bad' : ''}`} type={showPass ? 'text' : 'password'} value={password} onChange={(e) => { setPassword(e.target.value); setErrors((prev) => { const n = { ...prev }; delete n.password; return n; }); }} placeholder="အနည်းဆုံး ၈ လုံး" />
                <button onClick={() => setShowPass((v) => !v)} className="px-3 border border-line rounded text-sm">{showPass ? 'ဖျောက်' : 'ပြ'}</button>
              </div>
              {errors.password && <p className="text-xs text-bad mt-1">{errors.password}</p>}
            </div>
          </div>

          <div className="card p-4 space-y-3">
            <h3 className="text-sm font-bold text-ink">အခန်းကဏ္ဍ ရွေးချယ်ရန်</h3>
            <div className="space-y-2">
              {ROLES.map((r) => {
                const selected = role === r.value;
                return (
                  <button key={r.value} onClick={() => setRole(r.value)} className={`w-full flex items-center gap-2 px-3 py-2 rounded border ${selected ? 'border-2' : 'border-line'}`} style={selected ? { borderColor: r.color, backgroundColor: r.color + '12' } : {}}>
                    <span className="w-4 h-4 rounded-full border flex items-center justify-center" style={{ borderColor: r.color }}>
                      {selected && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />}
                    </span>
                    <span className="text-sm font-semibold" style={selected ? { color: r.color } : {}}>{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button onClick={handleSave} disabled={updateMutation.isPending} className="w-full bg-brand text-white py-3 rounded font-bold disabled:opacity-60">
            {updateMutation.isPending ? '...' : 'ပြင်ဆင်မှု သိမ်းမည်'}
          </button>
        </>
      )}
    </div>
  );
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex justify-between py-1 border-b border-line last:border-0 gap-2">
      <span className="text-xs text-ink-2 font-semibold">{label}</span>
      <span className="text-sm text-ink text-right" style={valueColor ? { color: valueColor, fontWeight: 700 } : {}}>{value}</span>
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