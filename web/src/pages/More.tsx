import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ROLE_LABELS_MM } from '../constants';
import {
  Package,
  Truck,
  ClipboardList,
  Building2,
  UserCheck,
  Users,
  FileText,
  Calendar,
  User as UserIcon,
  Sun,
  Moon,
  LogOut,
  ChevronRight,
  Smartphone,
  Share2,
  Download,
  X,
  Check,
} from 'lucide-react';

export default function More() {
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [installGuideOpen, setInstallGuideOpen] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone (no browser bar) mode
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    // Listen for beforeinstallprompt on Chromium browsers
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  async function handleInstallClick() {
    if (installPrompt) {
      installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstallPrompt(null);
      }
    } else {
      setInstallGuideOpen(true);
    }
  }

  const canSeeParcels = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'accountant';
  const canAssign = user?.role === 'admin' || user?.role === 'accountant';
  const isStaff = user?.role === 'delivery_staff';
  const isAdmin = user?.role === 'admin';

  const roleLabel = (user?.role && ROLE_LABELS_MM[user.role]) || user?.role || 'ဝန်ထမ်း';
  const initial = user?.name ? user.name[0]?.toUpperCase() : 'R';

  async function handleLogout() {
    if (!window.confirm('အကောင့်မှ ထွက်မည်လား?')) return;
    await logout();
    navigate('/login');
  }

  const roleColorClass =
    user?.role === 'admin'
      ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
      : user?.role === 'manager'
      ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
      : user?.role === 'accountant'
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300';

  return (
    <div className="p-3.5 sm:p-6 space-y-4 max-w-xl mx-auto pb-28 md:pb-8">
      {/* Title */}
      <div>
        <h1 className="text-lg sm:text-xl font-black text-ink">မီနူး</h1>
        <p className="text-xs text-ink-2">သင့်အကောင့်နှင့် လုပ်ဆောင်ချက်များ အားလုံး</p>
      </div>

      {/* User Profile Card */}
      <button
        onClick={() => navigate('/profile')}
        className="card w-full p-4 flex items-center gap-3 text-left hover:border-brand/40 active:scale-[0.99] transition"
      >
        {user?.profile_image_url ? (
          <img
            src={user.profile_image_url}
            alt=""
            className="w-14 h-14 rounded-2xl object-cover border border-line"
          />
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-brand/10 text-brand font-black text-xl flex items-center justify-center border border-brand/20">
            {initial}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-base font-bold text-ink truncate">{user?.name ?? 'အသုံးပြုသူ'}</div>
          <div className="text-xs text-ink-2 font-mono truncate">{user?.phone || user?.email}</div>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-1 ${roleColorClass}`}>
            {roleLabel}
          </span>
        </div>
        <ChevronRight className="w-5 h-5 text-ink-3" />
      </button>

      {/* PWA Install Banner (If not yet in standalone mode) */}
      {!isStandalone && (
        <div className="card p-4 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-brand/10 border-brand/30 space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand text-white flex items-center justify-center shadow-sm flex-shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-ink">မိုဘိုင်း App အဖြစ် သွင်းယူရန်</div>
              <div className="text-xs text-ink-2">
                Browser ရှာဖွေရေးဘားမပါဘဲ Fullscreen သုံးနိုင်ပါသည်
              </div>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            className="w-full mt-2 py-2.5 px-3 rounded-xl bg-brand text-white text-xs font-bold shadow-sm shadow-brand/20 active:scale-98 transition flex items-center justify-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>{installPrompt ? 'အက်ပ်ကို ချက်ချင်းသွင်းမည်' : 'အက်ပ်သွင်းယူနည်း ကြည့်မည်'}</span>
          </button>
        </div>
      )}

      {/* Operations Group */}
      <div className="space-y-1.5">
        <div className="section-label px-1">ပို့ဆောင်ရေး စီမံခန့်ခွဲမှု</div>
        <div className="card overflow-hidden divide-y divide-line/60">
          {canSeeParcels && (
            <MenuItem
              icon={Package}
              label="ပါဆယ်များ (Parcels)"
              subtitle="စာရင်းသွင်း၊ စစ်ဆေး၊ ခြေရာခံခြင်း"
              onClick={() => navigate('/parcels')}
            />
          )}

          <MenuItem
            icon={Truck}
            label="ပို့ဆောင်မှု အားလုံး (Deliveries)"
            subtitle="နေ့စဉ်နှင့် လစဉ် ပို့ဆောင်မှု မှတ်တမ်း"
            onClick={() => navigate('/deliveries')}
          />

          {isStaff && (
            <MenuItem
              icon={ClipboardList}
              label="ကျွန်ုပ်၏ လုပ်ငန်းများ (My Tasks)"
              subtitle="လက်ရှိတာဝန်ကျ ပို့ဆောင်မှုများ"
              onClick={() => navigate('/my-assignments')}
              highlight
            />
          )}

          {canAssign && (
            <MenuItem
              icon={UserCheck}
              label="ချိတ်ဆက်ထားသော ဝန်ထမ်းများ"
              subtitle="ဝန်ထမ်းအလိုက် ပါဆယ်တာဝန်ခွဲဝေမှု"
              onClick={() => navigate('/assign-staff')}
            />
          )}

          {canSeeParcels && (
            <MenuItem
              icon={Building2}
              label="ဖောက်သည်များ (Customers)"
              subtitle="ပေးပို့သူနှင့် လက်ခံသူ စာရင်း"
              onClick={() => navigate('/customers')}
            />
          )}
        </div>
      </div>

      {/* Records & Reports Group */}
      {canSeeParcels && (
        <div className="space-y-1.5">
          <div className="section-label px-1">စာရင်းဇယားနှင့် မှတ်တမ်း</div>
          <div className="card overflow-hidden divide-y divide-line/60">
            <MenuItem
              icon={FileText}
              label="နေ့စဉ်မှတ်တမ်း (Daily Summary)"
              subtitle="တစ်ရက်ချင်းစီအလိုက် အသေးစိတ်"
              onClick={() => navigate('/daily-summary')}
            />
            <MenuItem
              icon={Calendar}
              label="လစဉ်မှတ်တမ်း (Monthly Summary)"
              subtitle="လအလိုက် စာရင်းချုပ်"
              onClick={() => navigate('/daily-summary?view=month')}
            />
          </div>
        </div>
      )}

      {/* Administration & Account Group */}
      <div className="space-y-1.5">
        <div className="section-label px-1">စနစ်နှင့် အကောင့်</div>
        <div className="card overflow-hidden divide-y divide-line/60">
          {isAdmin && (
            <MenuItem
              icon={Users}
              label="အသုံးပြုသူ စီမံခန့်ခွဲမှု (Users)"
              subtitle="ဝန်ထမ်းအကောင့်များ ထည့်သွင်း/ပြင်ဆင်ခြင်း"
              onClick={() => navigate('/users')}
            />
          )}

          <MenuItem
            icon={UserIcon}
            label="ပရိုဖိုင် အချက်အလက် (Profile)"
            subtitle="စကားဝှက်၊ အချက်အလက် ပြင်ဆင်ရန်"
            onClick={() => navigate('/profile')}
          />

          {/* Dark Mode Switcher Row */}
          <div
            onClick={toggleTheme}
            className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-muted active:scale-[0.99] transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                {mode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </div>
              <div>
                <div className="text-sm font-bold text-ink">အပြင်အဆင် (Theme)</div>
                <div className="text-xs text-ink-3">
                  {mode === 'dark' ? 'Dark Mode ဖွင့်ထားသည်' : 'Light Mode ဖွင့်ထားသည်'}
                </div>
              </div>
            </div>
            <div className="w-12 h-6 rounded-full bg-line-strong p-0.5 flex items-center transition">
              <div
                className={`w-5 h-5 rounded-full bg-surface shadow-sm transform transition-transform ${
                  mode === 'dark' ? 'translate-x-6 bg-brand' : 'translate-x-0'
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Logout button */}
      <button
        onClick={handleLogout}
        className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 py-3.5 rounded-2xl font-bold text-sm shadow-sm flex items-center justify-center gap-2 active:scale-98 transition touch-press"
      >
        <LogOut className="w-4 h-4" />
        <span>အကောင့်မှ ထွက်မည်</span>
      </button>

      <div className="text-center text-[11px] text-ink-3 pt-2">
        Royal Myawaddy Delivery Management System · v1.0.0
      </div>

      {/* PWA INSTALL INSTRUCTION MODAL */}
      {installGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface rounded-3xl border border-line w-full max-w-sm p-5 space-y-4 shadow-float animate-scale-in">
            <div className="flex items-center justify-between pb-2 border-b border-line">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-brand" />
                <h3 className="font-black text-sm text-ink">မိုဘိုင်း App အဖြစ် သွင်းနည်း</h3>
              </div>
              <button
                onClick={() => setInstallGuideOpen(false)}
                className="p-1 rounded-lg text-ink-3 hover:text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-ink-2 leading-relaxed">
              ဖုန်းမျက်နှာပြင်တွင် App အဖြစ်သွင်းထားပါက <strong>Browser Search Bar မပေါ်တော့ဘဲ Fullscreen</strong> ဖြင့် တကယ့် Application အစစ်ကဲ့သို့ အသုံးပြုနိုင်ပါသည်။
            </p>

            {/* Android Instructions */}
            <div className="p-3 rounded-2xl bg-muted/40 space-y-1.5 border border-line/60">
              <div className="text-xs font-bold text-ink flex items-center gap-1.5">
                <span>🤖 Android (Chrome Browser ဖြင့်)</span>
              </div>
              <ol className="text-xs text-ink-2 list-decimal list-inside space-y-1">
                <li>ညာဘက်အပေါ်ရှိ အစက် ၃ စက် (⋮) ကို နှိပ်ပါ</li>
                <li><strong>"Install app"</strong> သို့မဟုတ် <strong>"Add to Home screen"</strong> ကို ရွေးပါ</li>
                <li><strong>"Install" (သို့) "Add"</strong> ကို နှိပ်ပါ</li>
              </ol>
            </div>

            {/* iPhone Instructions */}
            <div className="p-3 rounded-2xl bg-muted/40 space-y-1.5 border border-line/60">
              <div className="text-xs font-bold text-ink flex items-center gap-1.5">
                <span>🍎 iPhone (Safari Browser ဖြင့်)</span>
              </div>
              <ol className="text-xs text-ink-2 list-decimal list-inside space-y-1">
                <li>အောက်ဘက်ရှိ Share ခလုတ် (⎋) ကို နှိပ်ပါ</li>
                <li>အောက်သို့ဆွဲပြီး <strong>"Add to Home Screen"</strong> ကို နှိပ်ပါ</li>
                <li>ညာဘက်အပေါ်မှ <strong>"Add"</strong> ကို နှိပ်ပါ</li>
              </ol>
            </div>

            <button
              onClick={() => setInstallGuideOpen(false)}
              className="w-full bg-brand text-white py-3 rounded-2xl font-bold text-xs shadow-sm active:scale-98 transition"
            >
              နားလည်ပါပြီ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  subtitle,
  onClick,
  highlight,
}: {
  icon: any;
  label: string;
  subtitle?: string;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-3.5 text-left flex items-center justify-between hover:bg-muted active:scale-[0.99] transition ${
        highlight ? 'bg-brand/5' : ''
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
            highlight ? 'bg-brand text-white shadow-sm' : 'bg-muted text-ink-2'
          }`}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0 py-0.5">
          <div className={`text-sm font-bold leading-normal truncate ${highlight ? 'text-brand' : 'text-ink'}`}>
            {label}
          </div>
          {subtitle && (
            <div className="text-xs text-ink-3 leading-relaxed truncate pt-0.5 pb-0.5">
              {subtitle}
            </div>
          )}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-ink-3 flex-shrink-0 ml-2" />
    </button>
  );
}
