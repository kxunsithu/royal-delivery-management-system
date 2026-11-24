import React, { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Role } from '../types';
import { ROLE_LABELS_MM } from '../constants';
import { SunIcon, MoonIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

interface NavItem {
  to: string;
  label: string;
  icon?: string;
  show: boolean;
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

  const items: NavItem[] = [
    { to: '/', label: 'ဒက်ရှ်ဘုတ်', show: true },
    { to: '/parcels', label: 'ပါဆယ်များ', show: canSeeParcels },
    { to: '/customers', label: 'ဖောက်သည်များ', show: canSeeParcels },
    { to: '/deliveries', label: 'ပို့ဆောင်မှုများ', show: true },
    { to: '/my-assignments', label: 'ကျွန်ုပ်၏လုပ်ငန်းများ', show: isStaff },
    { to: '/daily-summary', label: 'မှတ်တမ်း', show: canSeeParcels },
    { to: '/assign-staff', label: 'ချိတ်ဆက်ထားသောဝန်ထမ်း', show: canAssign },
    { to: '/users', label: 'အသုံးပြုသူများ', show: isAdmin },
    { to: '/profile', label: 'ပရိုဖိုင်', show: true },
  ].filter((i) => i.show);



  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen flex bg-app">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:sticky md:top-0 md:h-screen w-64 flex-col border-r border-line bg-surface">
        <div className="px-4 py-4 border-b border-line">
          <Link to="/" className="text-lg font-bold text-brand">Royal Myawaddy</Link>
          <div className="text-xs text-ink-2">Delivery Management</div>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) =>
                `block px-3 py-2 rounded text-sm font-semibold ${isActive ? 'bg-brand text-white' : 'text-ink hover:bg-muted'}`
              }
            >
              {it.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-line space-y-2">
          <div className="text-xs text-ink-2 truncate">{user?.name}</div>
          <div className="text-[11px] text-ink-3">{role ? ROLE_LABELS_MM[role] : ''}</div>
          <button onClick={toggleTheme} className="w-full text-left text-sm px-2 py-1 rounded hover:bg-muted">
            {mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button onClick={handleLogout} className="w-full text-left text-sm px-2 py-1 rounded text-bad hover:bg-bad-bg">
            ထွက်မည်
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar (mobile) */}
        <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-3 py-2 border-b border-line bg-surface">
          <button onClick={() => setDrawerOpen(true)} className="p-2 rounded hover:bg-muted"><Bars3Icon className="w-5 h-5" /></button>
          <Link to="/" className="font-bold text-brand">Royal Myawaddy</Link>
          <button onClick={toggleTheme} className="p-2 rounded hover:bg-muted">{mode === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}</button>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-surface border-r border-line p-3 overflow-y-auto animate-slide-in">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-brand">Royal Myawaddy</span>
              <button onClick={() => setDrawerOpen(false)} className="p-2"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="space-y-1">
              {items.map((it) => (
                <NavLink
                  key={it.to}
                  to={it.to}
                  onClick={() => setDrawerOpen(false)}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded text-sm font-semibold ${isActive ? 'bg-brand text-white' : 'text-ink hover:bg-muted'}`
                  }
                >
                  {it.label}
                </NavLink>
              ))}
            </div>
            <div className="mt-4 border-t border-line pt-3 space-y-2">
              <div className="text-xs text-ink-2">{user?.name}</div>
              <button onClick={handleLogout} className="w-full text-left text-sm px-2 py-1 rounded text-bad hover:bg-bad-bg">
                ထွက်မည်
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}