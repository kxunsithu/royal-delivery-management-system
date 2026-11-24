import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { dashboardService } from '../services/dashboardService';
import { ROLE_LABELS_MM } from '../constants';

export default function Dashboard() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardService.getDashboard(),
  });

  const isStaff = user?.role === 'delivery_staff';
  const isAdmin = user?.role === 'admin';
  const canCreateParcel = user?.role === 'admin' || user?.role === 'manager';

  const roleLabel = (user?.role && ROLE_LABELS_MM[user.role]) || user?.role || 'ဝန်ထမ်း';

  if (isLoading) {
    return <div className="p-6 text-center text-ink-2">Loading...</div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="rounded bg-brand text-white p-6 flex items-center justify-between overflow-hidden">
        <div>
          <div className="text-xs font-semibold opacity-90">Royal Myawaddy</div>
          <h1 className="text-2xl font-bold">ပို့ဆောင်ရေး စနစ်</h1>
          <p className="text-sm opacity-80">Delivery Management System</p>
          <p className="text-sm mt-2">{user?.name} · {roleLabel}</p>
        </div>
        <img src="/hero.png" alt="" className="w-40 h-28 object-contain hidden sm:block" />
      </div>

      {isStaff ? (
        <StaffDashboard data={data} navigate={navigate} colors={colors} />
      ) : (
        <AdminDashboard data={data} navigate={navigate} colors={colors} canCreateParcel={canCreateParcel} />
      )}
    </div>
  );
}

function StaffDashboard({ data, navigate, colors }: any) {
  const stats = [
    { label: 'ဆောင်ရွက်နေဆဲ', value: data?.assignments?.active ?? 0 },
    { label: 'ယနေ့ပြီးစီး', value: data?.assignments?.completed_today ?? 0 },
    { label: 'ကြိုးပမ်းမှု', value: data?.attempts_today ?? 0 },
    { label: 'မအောင်မြင်', value: data?.failed_today ?? 0 },
  ];
  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="text-sm text-ink-2">စုစုပေါင်း ပြီးစီးသောလုပ်ငန်းများ</div>
        <div className="text-3xl font-bold text-ink">{data?.assignments?.total_completed ?? 0}</div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="card p-3">
            <div className="text-xl font-bold text-ink">{Number(s.value).toLocaleString()}</div>
            <div className="text-xs text-ink-2">{s.label}</div>
          </div>
        ))}
      </div>
      <button
        onClick={() => navigate('/my-assignments')}
        className="w-full bg-brand text-white py-3 rounded font-bold"
      >
        ကျွန်ုပ်၏ လုပ်ငန်းများ
      </button>
    </div>
  );
}

function AdminDashboard({ data, navigate, colors }: any) {
  const stats = data?.parcel_stats;
  const todayCount = stats?.today ?? data?.today_received ?? 0;
  const inTransitCount = stats?.in_transit ?? stats?.out_for_delivery ?? stats?.in_progress ?? 0;
  const items = [
    { label: 'စုစုပေါင်း', value: stats?.total ?? 0 },
    { label: 'ယနေ့ရောက်', value: todayCount },
    { label: 'လက်ခံ', value: stats?.received ?? 0 },
    { label: 'စစ်ဆေးပြီး', value: stats?.verified ?? 0 },
    { label: 'ဆောင်ရွက်နေဆဲ', value: inTransitCount },
    { label: 'ပို့ပြီး', value: stats?.delivered ?? 0 },
    { label: 'မအောင်မြင်', value: stats?.failed ?? 0 },
    { label: 'ပျက်ဆီး', value: stats?.damaged ?? 0 },
  ];
  return (
    <div className="space-y-4">
      <div className="text-xs font-bold text-ink-2 uppercase">ပါဆယ် အခြေအနေ</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((it) => (
          <div key={it.label} className="card p-3">
            <div className="text-xl font-bold text-ink">{Number(it.value).toLocaleString()}</div>
            <div className="text-xs text-ink-2">{it.label}</div>
          </div>
        ))}
      </div>
      <div className="text-xs font-bold text-ink-2 uppercase mt-4">အမြန်သွားရောက်မည်</div>
      <div className="grid grid-cols-3 gap-3">
        <button onClick={() => navigate('/parcels')} className="card p-4 text-center hover:bg-muted">
          <div className="text-sm font-semibold">ပါဆယ်</div>
        </button>
        <button onClick={() => navigate('/deliveries')} className="card p-4 text-center hover:bg-muted">
          <div className="text-sm font-semibold">ပို့ဆောင်</div>
        </button>
        <button onClick={() => navigate('/daily-summary')} className="card p-4 text-center hover:bg-muted">
          <div className="text-sm font-semibold">မှတ်တမ်း</div>
        </button>
        <button onClick={() => navigate('/users')} className="card p-4 text-center hover:bg-muted">
          <div className="text-sm font-semibold">သုံးစွဲသူ</div>
        </button>
        <button onClick={() => navigate('/customers')} className="card p-4 text-center hover:bg-muted">
          <div className="text-sm font-semibold">ဖောက်သည်</div>
        </button>
        <button onClick={() => navigate('/monthly-summary/2026-01')} className="card p-4 text-center hover:bg-muted">
          <div className="text-sm font-semibold">လစဉ်</div>
        </button>
      </div>
    </div>
  );
}