import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/AuthContext'
import {
  LayoutDashboard, Package, Truck, DollarSign, Users,
  Settings, LogOut, Menu, X, Globe,
  ClipboardList, ArrowDownToLine, User
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

type NavItem = {
  key: string
  labelKey: string
  href: string
  icon: React.ElementType
  roles?: string[]
  end?: boolean
}

const navItems: NavItem[] = [
  { key: 'dashboard',  labelKey: 'nav.dashboard',     href: '/',                          icon: LayoutDashboard, end: true },
  { key: 'parcels',    labelKey: 'nav.parcels',       href: '/parcels',                   icon: Package,         roles: ['admin','manager','accountant'] },
  { key: 'deliveries', labelKey: 'nav.deliveries',    href: '/deliveries',                icon: Truck,           roles: ['admin','manager'] },
  { key: 'mywork',     labelKey: 'nav.myAssignments', href: '/deliveries/my-assignments', icon: ClipboardList,   roles: ['delivery_staff'] },
  { key: 'handovers',  labelKey: 'nav.cashHandovers', href: '/finance/handovers',         icon: ArrowDownToLine, roles: ['delivery_staff','accountant','admin'] },
  { key: 'finance',    labelKey: 'nav.finance',       href: '/finance',                   icon: DollarSign,      roles: ['admin','accountant'], end: true },
  { key: 'users',      labelKey: 'nav.users',         href: '/users',                     icon: Users,           roles: ['admin'] },
  { key: 'settings',   labelKey: 'nav.settings',      href: '/settings',                  icon: Settings,        roles: ['admin'] },
  { key: 'profile',    labelKey: 'nav.profile',       href: '/profile',                   icon: User },
]

export default function AppLayout() {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const visibleNav = navItems.filter(item =>
    !item.roles || (user && item.roles.includes(user.role))
  )

  const handleLogout = () => {
    setShowLogoutModal(true)
  }

  const confirmLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      navigate('/login')
    } finally {
      setIsLoggingOut(false)
      setShowLogoutModal(false)
    }
  }

  const toggleLanguage = () => {
    const next = i18n.language === 'en' ? 'my' : 'en'
    i18n.changeLanguage(next)
  }

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside className={cn(
      'flex flex-col h-full bg-background-surface border-r border-border',
      mobile ? 'w-72' : 'w-64'
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
        <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
          <Package className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-foreground font-semibold text-sm leading-tight truncate">Royal's</p>
          <p className="text-secondary text-xs truncate">Myawaddy Delivery</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
        {visibleNav.map(item => (
          <NavLink
            key={item.key}
            to={item.href}
            end={item.end ?? false}
            onClick={() => mobile && setSidebarOpen(false)}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-all duration-150 min-w-0 overflow-hidden',
              isActive
                ? 'bg-primary/15 text-primary font-medium'
                : 'text-secondary hover:bg-muted hover:text-foreground'
            )}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{t(item.labelKey)}</span>
          </NavLink>
        ))}
      </nav>

      {/* User + actions */}
      <div className="border-t border-border p-3 space-y-1">
        {/* Language toggle */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded text-sm text-secondary hover:bg-muted hover:text-foreground transition-all"
        >
          <Globe className="w-4 h-4 flex-shrink-0" />
          <span>{i18n.language === 'en' ? 'မြန်မာ' : 'English'}</span>
        </button>

        {/* Theme toggle */}
        <ThemeToggle showLabel className="w-full" />

        {/* User info */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded">
          <div className="w-7 h-7 rounded bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {user?.profile_image_url ? (
              <img src={user.profile_image_url} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-primary text-xs font-semibold">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-foreground text-xs font-medium truncate">{user?.name}</p>
            <p className="text-secondary text-xs truncate">{user?.role_display}</p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded text-sm text-secondary hover:bg-destructive/10 hover:text-destructive transition-all"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>{t('auth.logout')}</span>
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-10 animate-slide-in-left">
            <Sidebar mobile />
          </div>
          <button
            className="absolute top-4 right-4 z-20 text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-background-surface flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-secondary hover:text-foreground transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Package className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-foreground text-sm font-semibold">Royal's Myawaddy</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={toggleLanguage} className="text-secondary hover:text-foreground transition-colors">
              <Globe className="w-4 h-4" />
            </button>
            <ThemeToggle className="px-2 py-2" />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="w-full p-4 lg:p-6 animate-fade-in">
            <div className="max-w-screen-xl mx-auto">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      {/* Logout confirmation modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-background-surface border border-border rounded shadow-xl p-6 space-y-4">
            <h2 className="text-foreground text-lg font-semibold">Confirm Logout</h2>
            <p className="text-secondary text-sm">Are you sure you want to log out of your account?</p>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                className="px-4 py-2 rounded border border-border text-secondary hover:text-foreground hover:bg-muted transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                disabled={isLoggingOut}
                className="px-4 py-2 rounded bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
