import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ROLE_LABELS_MM } from '../constants';

export default function More() {
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  const navigate = useNavigate();

  const canSeeParcels = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'accountant';
  const canAssign = user?.role === 'admin' || user?.role === 'accountant';
  const isStaff = user?.role === 'delivery_staff';
  const isAdmin = user?.role === 'admin';

  const roleLabel = (user?.role && ROLE_LABELS_MM[user.role]) || user?.role || 'ဝန်ထမ်း';

  async function handleLogout() {
    if (!window.confirm('အကောင့်မှ ထွက်မည်လား?')) return;
    await logout();
    navigate('/login');
  }

  const items: { label: string; to: string }[] = [];
  items.push({ label: 'ပရိုဖိုင်', to: '/profile' });
  if (canSeeParcels) {
    items.push({ label: 'ပါဆယ်များ', to: '/parcels' });
    items.push({ label: 'ပို့ဆောင်မှု အားလုံး', to: '/deliveries' });
    items.push({ label: 'ဖောက်သည်များ', to: '/customers' });
    items.push({ label: 'မှတ်တမ်း', to: '/daily-summary' });
  }
  if (canAssign) items.push({ label: 'ချိတ်ဆက်ထားသောဝန်ထမ်း', to: '/assign-staff' });
  if (isStaff) items.push({ label: 'ကျွန်ုပ်၏ လုပ်ငန်းများ', to: '/my-assignments' });
  if (isAdmin) items.push({ label: 'အသုံးပြုသူ စီမံခန့်ခွဲမှု', to: '/users' });

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-ink">မီနူး</h1>
        <p className="text-sm text-ink-2">သင့်အကောင့်နှင့် ဝန်ဆောင်မှုများ</p>
      </div>

      <button onClick={() => navigate('/profile')} className="card w-full p-4 text-left flex items-center gap-3 hover:bg-muted">
        <div className="w-12 h-12 rounded-full bg-brand-bg text-brand flex items-center justify-center font-bold text-lg">
          {user?.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="flex-1">
          <div className="font-bold text-ink">{user?.name ?? 'အသုံးပြုသူ'}</div>
          <div className="text-xs bg-brand-bg text-brand px-2 py-0.5 rounded inline-block mt-1">{roleLabel}</div>
        </div>
        <span className="text-ink-3">›</span>
      </button>

      <div className="card divide-y divide-line">
        {items.map((it) => (
          <button key={it.to} onClick={() => navigate(it.to)} className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-muted">
            <span className="text-sm font-semibold text-ink">{it.label}</span>
            <span className="text-ink-3">›</span>
          </button>
        ))}
      </div>

      <button onClick={handleLogout} className="w-full bg-bad-bg text-bad py-3 rounded font-bold">အကောင့်မှ ထွက်ရန်</button>
      <p className="text-center text-xs text-ink-3">Royal Myawaddy Delivery © 2026</p>
    </div>
  );
}