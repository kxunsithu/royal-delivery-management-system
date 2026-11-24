import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { dashboardService } from '../services/dashboardService';
import { ROLE_LABELS_MM, formatMMDate } from '../constants';
import {
  Package,
  Truck,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Users,
  Building2,
  CalendarDays,
  ArrowRight,
  Sparkles,
  ClipboardList,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

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

  const todayStr = new Date().toISOString().slice(0, 10);
  const formattedToday = formatMMDate(todayStr);

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-4 max-w-5xl mx-auto">
        <div className="h-36 rounded-2xl bg-muted animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-3.5 sm:p-6 space-y-4 max-w-5xl mx-auto">
      {/* MOBILE HERO BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-dark via-brand to-orange-500 text-white p-5 sm:p-6 shadow-lg shadow-brand/15">
        {/* Soft background glow circles */}
        <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-44 h-44 rounded-full bg-black/10 blur-xl pointer-events-none" />

        <div className="relative z-10 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                Royal Myawaddy
              </span>
              <span className="text-xs text-white/80">{formattedToday}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight pt-1">
              မင်္ဂလာပါ၊ {user?.name ?? 'ဝန်ထမ်း'}
            </h1>
            <p className="text-xs sm:text-sm text-white/90">
              {roleLabel} · ပို့ဆောင်ရေး စီမံခန့်ခွဲမှု စနစ်
            </p>
          </div>

          <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md items-center justify-center text-white shadow-inner">
            <Truck className="w-8 h-8" />
          </div>
        </div>

        {/* Action ribbon for delivery staff */}
        {isStaff && (
          <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between">
            <div className="text-xs text-white/90">
              ဆောင်ရွက်ဆဲ: <span className="font-bold text-white text-sm">{data?.assignments?.active ?? 0}</span> ခု
            </div>
            <button
              onClick={() => navigate('/my-assignments')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-brand font-bold text-xs shadow-sm hover:bg-orange-50 active:scale-95 transition"
            >
              <span>ကျွန်ုပ်၏ လုပ်ငန်းများ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* DASHBOARD CONTENT BASED ON ROLE */}
      {isStaff ? (
        <StaffDashboard data={data} navigate={navigate} />
      ) : (
        <AdminDashboard data={data} navigate={navigate} canCreateParcel={canCreateParcel} />
      )}
    </div>
  );
}

function StaffDashboard({ data, navigate }: { data: any; navigate: any }) {
  const activeCount = data?.assignments?.active ?? 0;
  const completedToday = data?.assignments?.completed_today ?? 0;
  const attemptsToday = data?.attempts_today ?? 0;
  const failedToday = data?.failed_today ?? 0;
  const totalCompleted = data?.assignments?.total_completed ?? 0;

  const stats = [
    {
      label: 'ဆောင်ရွက်ဆဲ',
      value: activeCount,
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-200 dark:border-amber-900/40',
    },
    {
      label: 'ယနေ့ပြီးစီး',
      value: completedToday,
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-200 dark:border-emerald-900/40',
    },
    {
      label: 'ကြိုးပမ်းမှု',
      value: attemptsToday,
      icon: RotateCcw,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-200 dark:border-blue-900/40',
    },
    {
      label: 'မအောင်မြင်',
      value: failedToday,
      icon: XCircle,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-200 dark:border-rose-900/40',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Primary Action Button for Mobile Riders */}
      <button
        onClick={() => navigate('/my-assignments')}
        className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-brand to-brand-dark text-white font-bold shadow-md shadow-brand/20 active:scale-[0.99] transition touch-press"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div className="text-left">
            <div className="text-sm font-bold">ကျွန်ုပ်၏ လုပ်ငန်းများ စစ်ဆေးရန်</div>
            <div className="text-xs text-white/80 font-normal">ယနေ့ ပို့ဆောင်ရမည့် ပါဆယ်များ</div>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
          <ArrowRight className="w-4 h-4" />
        </div>
      </button>

      {/* Metric 2x2 Grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className={`card p-3.5 border ${s.border} flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink-2">{s.label}</span>
                <div className={`w-8 h-8 rounded-xl ${s.bg} ${s.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-ink mt-2">
                {Number(s.value).toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lifetime Completed Card */}
      <div className="card p-4 flex items-center justify-between bg-gradient-to-r from-surface to-muted/40">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-ink-2 font-medium">စုစုပေါင်း ပို့ဆောင်ပြီးစီးမှု</div>
            <div className="text-2xl font-black text-ink">
              {Number(totalCompleted).toLocaleString()} <span className="text-xs font-normal text-ink-3">ခု</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate('/deliveries')}
          className="text-xs font-bold text-brand hover:underline p-2"
        >
          ကြည့်ရှုရန် ›
        </button>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          onClick={() => navigate('/deliveries')}
          className="card p-3.5 text-left hover:bg-muted active:scale-[0.99] transition"
        >
          <Truck className="w-5 h-5 text-brand mb-1.5" />
          <div className="text-sm font-bold text-ink">ပို့ဆောင်မှု အားလုံး</div>
          <div className="text-xs text-ink-3">မှတ်တမ်းများ ရှာဖွေရန်</div>
        </button>
        <button
          onClick={() => navigate('/profile')}
          className="card p-3.5 text-left hover:bg-muted active:scale-[0.99] transition"
        >
          <Users className="w-5 h-5 text-brand mb-1.5" />
          <div className="text-sm font-bold text-ink">ပရိုဖိုင် / အကောင့်</div>
          <div className="text-xs text-ink-3">ကိုယ်ရေးအချက်အလက်</div>
        </button>
      </div>
    </div>
  );
}

function AdminDashboard({
  data,
  navigate,
  canCreateParcel,
}: {
  data: any;
  navigate: any;
  canCreateParcel: boolean;
}) {
  const stats = data?.parcel_stats;
  const todayCount = stats?.today ?? data?.today_received ?? 0;
  const inTransitCount = stats?.in_transit ?? stats?.out_for_delivery ?? stats?.in_progress ?? 0;

  // Key highlights
  const keyMetrics = [
    {
      label: 'ယနေ့ရောက်',
      value: todayCount,
      color: 'text-brand',
      bg: 'bg-brand/10',
      border: 'border-brand/30',
    },
    {
      label: 'ဆောင်ရွက်ဆဲ',
      value: inTransitCount,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-200 dark:border-amber-900/40',
    },
    {
      label: 'ပို့ပြီး',
      value: stats?.delivered ?? 0,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-200 dark:border-emerald-900/40',
    },
    {
      label: 'မအောင်မြင်',
      value: stats?.failed ?? 0,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-200 dark:border-rose-900/40',
    },
  ];

  const fullStatusList = [
    { label: 'စုစုပေါင်း', value: stats?.total ?? 0, color: 'text-ink' },
    { label: 'လက်ခံထား', value: stats?.received ?? 0, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'စစ်ဆေးပြီး', value: stats?.verified ?? 0, color: 'text-purple-600 dark:text-purple-400' },
    { label: 'ပျက်ဆီး', value: stats?.damaged ?? 0, color: 'text-rose-700 dark:text-rose-400' },
  ];

  return (
    <div className="space-y-4">
      {/* Primary Register Parcel CTA */}
      {canCreateParcel && (
        <button
          onClick={() => navigate('/parcels/create')}
          className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-brand to-brand-dark text-white font-bold shadow-md shadow-brand/20 active:scale-[0.99] transition touch-press"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold">+ ပါဆယ်အသစ် ထည့်သွင်းမည်</div>
              <div className="text-xs text-white/80 font-normal">ပေးပို့သူ၊ လက်ခံသူ၊ COD စာရင်းသွင်းရန်</div>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>
      )}

      {/* Key Status Grid */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-ink-2 uppercase tracking-wider">
            ပါဆယ် အခြေအနေ
          </span>
          <button
            onClick={() => navigate('/parcels')}
            className="text-xs font-semibold text-brand hover:underline"
          >
            အားလုံးကြည့်မည် ›
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {keyMetrics.map((it) => (
            <div
              key={it.label}
              onClick={() => navigate('/parcels')}
              className={`card p-3 border ${it.border} cursor-pointer active:scale-95 transition`}
            >
              <div className="text-xs font-medium text-ink-2">{it.label}</div>
              <div className={`text-2xl font-black mt-1 ${it.color}`}>
                {Number(it.value).toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {/* Secondary Status Strip */}
        <div className="grid grid-cols-4 gap-2 mt-2">
          {fullStatusList.map((st) => (
            <div
              key={st.label}
              onClick={() => navigate('/parcels')}
              className="card p-2 text-center cursor-pointer hover:bg-muted active:scale-95 transition"
            >
              <div className={`text-base sm:text-lg font-bold ${st.color}`}>
                {Number(st.value).toLocaleString()}
              </div>
              <div className="text-[10px] text-ink-3 truncate">{st.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Action Tiles */}
      <div>
        <div className="text-xs font-bold text-ink-2 uppercase tracking-wider mb-2">
          အမြန်သွားရောက်ရန်
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <button
            onClick={() => navigate('/parcels')}
            className="card p-3 flex flex-col items-center justify-center text-center hover:bg-muted active:scale-95 transition"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-brand flex items-center justify-center mb-1.5">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-ink">ပါဆယ်များ</span>
          </button>

          <button
            onClick={() => navigate('/deliveries')}
            className="card p-3 flex flex-col items-center justify-center text-center hover:bg-muted active:scale-95 transition"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-1.5">
              <Truck className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-ink">ပို့ဆောင်မှု</span>
          </button>

          <button
            onClick={() => navigate('/daily-summary')}
            className="card p-3 flex flex-col items-center justify-center text-center hover:bg-muted active:scale-95 transition"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-1.5">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-ink">မှတ်တမ်း</span>
          </button>

          <button
            onClick={() => navigate('/assign-staff')}
            className="card p-3 flex flex-col items-center justify-center text-center hover:bg-muted active:scale-95 transition"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1.5">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-ink">ဝန်ထမ်းခန့်</span>
          </button>

          <button
            onClick={() => navigate('/customers')}
            className="card p-3 flex flex-col items-center justify-center text-center hover:bg-muted active:scale-95 transition"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-1.5">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-ink">ဖောက်သည်</span>
          </button>

          <button
            onClick={() => navigate('/more')}
            className="card p-3 flex flex-col items-center justify-center text-center hover:bg-muted active:scale-95 transition"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-500/10 text-ink-2 flex items-center justify-center mb-1.5">
              <CalendarDays className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-ink">အားလုံး</span>
          </button>
        </div>
      </div>
    </div>
  );
}
