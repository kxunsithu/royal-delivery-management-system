import React, { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Role } from '../types';
import { ROLE_LABELS_MM } from '../constants';
import {
  LayoutDashboard,
  Package,
  Truck,
  ClipboardList,
  FileText,
  Users,
  UserCheck,
  User as UserIcon,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Building2,
  CalendarCheck,
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  show: boolean;
  badge?: string | number;
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const role = (user?.role as Role) || 'delivery_staff';
  const isStaff = role === 'delivery_staff';
  const isAdmin = role === 'admin';
  const isManager = role === 'manager';
  const isAccountant = role === 'accountant';
  const canSeeParcels = isAdmin || isManager || isAccountant;
  const canAssign = isAdmin || isAccountant;

  const roleLabel = (role && ROLE_LABELS_MM[role]) || role;
  const roleColorClass =
    role === 'admin'
      ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
      : role === 'manager'
      ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
      : role === 'accountant'
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300';

  // Desktop sidebar navigation items
  const sidebarItems: NavItem[] = [
    { to: '/', label: 'ဒက်ရှ်ဘုတ်', icon: LayoutDashboard, show: true },
    { to: '/parcels', label: 'ပါဆယ်များ', icon: Package, show: canSeeParcels },
    { to: '/deliveries', label: 'ပို့ဆောင်မှုများ', icon: Truck, show: true },
    { to: '/my-assignments', label: 'ကျွန်ုပ်၏လုပ်ငန်းများ', icon: ClipboardList, show: isStaff },
    { to: '/customers', label: 'ဖောက်သည်များ', icon: Building2, show: canSeeParcels },
    { to: '/daily-summary', label: 'မှတ်တမ်း', icon: FileText, show: canSeeParcels },
    { to: '/assign-staff', label: 'ချိတ်ဆက်ထားသောဝန်ထမ်း', icon: UserCheck, show: canAssign },
    { to: '/users', label: 'အသုံးပြုသူများ', icon: Users, show: isAdmin },
    { to: '/profile', label: 'ပရိုဖိုင်', icon: UserIcon, show: true },
  ].filter((i) => i.show);

  // Mobile bottom navigation tabs (role optimized)
  const mobileBottomTabs: NavItem[] = isStaff
    ? [
        { to: '/', label: 'ဒက်ရှ်ဘုတ်', icon: LayoutDashboard, show: true },
        { to: '/my-assignments', label: 'ကျွန်ုပ်လုပ်ငန်း', icon: ClipboardList, show: true },
        { to: '/deliveries', label: 'ပို့ဆောင်မှု', icon: Truck, show: true },
        { to: '/more', label: 'မီနူး', icon: Menu, show: true },
      ]
    : [
        { to: '/', label: 'ဒက်ရှ်ဘုတ်', icon: LayoutDashboard, show: true },
        { to: '/parcels', label: 'ပါဆယ်များ', icon: Package, show: true },
        { to: '/deliveries', label: 'ပို့ဆောင်မှု', icon: Truck, show: true },
        { to: '/daily-summary', label: 'မှတ်တမ်း', icon: FileText, show: true },
        { to: '/more', label: 'မီနူး', icon: Menu, show: true },
      ];

  async function handleLogout() {
    if (!window.confirm('အကောင့်မှ ထွက်မည်လား?')) return;
    await logout();
    navigate('/login');
  }

  const initial = user?.name ? user.name[0]?.toUpperCase() : 'R';

  return (
    <div className="min-h-screen flex bg-app text-ink font-sans">
      {/* ============================================================ */}
      {/* DESKTOP SIDEBAR (hidden on mobile, visible on md and up)    */}
      {/* ============================================================ */}
      <aside className="hidden md:flex md:sticky md:top-0 md:h-screen w-64 flex-col border-r border-line bg-surface select-none">
        {/* Brand Header */}
        <div className="px-5 py-4 border-b border-line flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-dark to-brand flex items-center justify-center text-white shadow-sm font-black text-lg">
            R
          </div>
          <div>
            <Link to="/" className="text-base font-bold text-ink hover:text-brand transition flex items-center gap-1.5">
              Royal Myawaddy
            </Link>
            <div className="text-[11px] font-medium text-ink-3 tracking-wide">Delivery Management</div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                    isActive
                      ? 'bg-brand text-white shadow-sm'
                      : 'text-ink-2 hover:text-ink hover:bg-muted'
                  }`
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Settings Footer */}
        <div className="p-3 border-t border-line space-y-2 bg-muted/30">
          <Link
            to="/profile"
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted transition group"
          >
            {user?.profile_image_url ? (
              <img
                src={user.profile_image_url}
                alt=""
                className="w-10 h-10 rounded-full object-cover border border-line"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-brand/10 text-brand font-bold flex items-center justify-center text-sm border border-brand/20">
                {initial}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-ink truncate group-hover:text-brand transition">
                {user?.name ?? 'အသုံးပြုသူ'}
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block ${roleColorClass}`}>
                {roleLabel}
              </span>
            </div>
          </Link>

          <div className="grid grid-cols-2 gap-1 pt-1">
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold text-ink-2 hover:bg-muted transition"
              title={mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
            >
              {mode === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
              <span>{mode === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold text-bad hover:bg-bad-bg transition"
            >
              <LogOut className="w-4 h-4" />
              <span>ထွက်မည်</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* MAIN CONTAINER (Mobile Topbar, Content, Mobile Bottom Bar)    */}
      {/* ============================================================ */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* MOBILE TOPBAR (STICKY, TOUCH-OPTIMIZED) */}
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-3.5 py-2.5 border-b border-line bg-surface/95 backdrop-blur-md pt-safe">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-dark to-brand flex items-center justify-center text-white shadow-sm font-black text-sm">
              R
            </div>
            <div>
              <Link to="/" className="font-bold text-sm tracking-tight text-ink flex items-center gap-1">
                Royal Myawaddy
              </Link>
              <div className="text-[10px] text-ink-3 -mt-0.5 font-medium">Delivery System</div>
            </div>
          </div>

          {/* Light or Dark Mode toggle button only */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-ink-2 hover:bg-muted active:scale-95 transition border border-line/60 bg-surface/50"
            title={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {mode === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </header>

        {/* MAIN OUTLET (CONTENT AREA) */}
        {/* pb-24 ensures mobile content doesn't hide behind persistent bottom bar */}
        <main className="flex-1 overflow-y-auto pb-24 md:pb-8">
          <Outlet />
        </main>

        {/* ============================================================ */}
        {/* MOBILE BOTTOM NAVIGATION BAR (FIXED, THUMB-FRIENDLY)         */}
        {/* ============================================================ */}
        <nav
          aria-label="Bottom Navigation"
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-line pb-safe shadow-bottomNav"
        >
          <div className="flex items-center justify-around px-1 py-1">
            {mobileBottomTabs.map((item) => {
              const Icon = item.icon;
              const isItemActive =
                item.to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.to);

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition duration-150 touch-press ${
                    isItemActive
                      ? 'text-brand font-bold'
                      : 'text-ink-2 hover:text-ink font-medium'
                  }`}
                >
                  <div
                    className={`relative p-1 rounded-xl transition-all duration-200 ${
                      isItemActive ? 'bg-brand/15 text-brand scale-105' : 'text-ink-2'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[11px] mt-0.5 leading-tight ${isItemActive ? 'font-bold text-brand' : ''}`}>
                    {item.label}
                  </span>
                </NavLink>
              );
            })}
          </div>
        </nav>
      </div>

      {/* ============================================================ */}
      {/* MOBILE FULL-HEIGHT DRAWER (SLIDE-IN SIDE MENU)              */}
      {/* ============================================================ */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden animate-fade-in">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer Body */}
          <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-surface border-r border-line flex flex-col p-4 overflow-y-auto animate-slide-in shadow-float">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-dark to-brand flex items-center justify-center text-white shadow-sm font-black text-sm">
                  R
                </div>
                <div>
                  <div className="font-bold text-sm text-ink">Royal Myawaddy</div>
                  <div className="text-[10px] text-ink-3">Delivery Management</div>
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-2 hover:bg-muted transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Profile Card */}
            <div className="mt-4 p-3 rounded-2xl bg-muted/50 border border-line flex items-center gap-3">
              {user?.profile_image_url ? (
                <img
                  src={user.profile_image_url}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover border border-line"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-brand/10 text-brand font-bold text-base flex items-center justify-center border border-brand/20">
                  {initial}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-ink truncate">{user?.name}</div>
                <div className="text-xs text-ink-2 truncate">{user?.phone || user?.email}</div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-1 ${roleColorClass}`}>
                  {roleLabel}
                </span>
              </div>
            </div>

            {/* Navigation Sections */}
            <div className="mt-4 flex-1 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-ink-3 px-2 mb-1.5">
                စာမျက်နှာများ
              </div>
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => setDrawerOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                        isActive
                          ? 'bg-brand text-white shadow-sm'
                          : 'text-ink-2 hover:text-ink hover:bg-muted'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </NavLink>
                );
              })}
            </div>

            {/* Footer Options */}
            <div className="mt-6 pt-3 border-t border-line space-y-2">
              <button
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-ink-2 hover:bg-muted transition"
              >
                <div className="flex items-center gap-3">
                  {mode === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
                  <span>အပြင်အဆင်</span>
                </div>
                <span className="text-xs text-ink-3 font-normal">{mode === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-bad hover:bg-bad-bg transition"
              >
                <LogOut className="w-4 h-4" />
                <span>အကောင့်မှ ထွက်မည်</span>
              </button>

              <div className="text-center text-[10px] text-ink-3 pt-2">
                Royal Myawaddy Delivery © 2026
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
