import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Package, Eye, EyeOff, Globe } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/utils/helpers'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export default function LoginPage() {
  const { t, i18n } = useTranslation()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const newErrors: Record<string, string> = {}
    if (!email) newErrors.email = t('errors.required', { field: t('auth.email') })
    if (!password) newErrors.password = t('errors.required', { field: t('auth.password') })
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    try {
      await login(email, password)
      toast({ title: t('auth.loginSuccess'), variant: 'success' as any })
    } catch (err: any) {
      const apiErrors = err?.response?.data?.errors
      if (apiErrors) {
        const mapped: Record<string, string> = {}
        Object.entries(apiErrors).forEach(([k, v]) => {
          mapped[k] = Array.isArray(v) ? v[0] : String(v)
        })
        setErrors(mapped)
      } else {
        toast({ title: getErrorMessage(err), variant: 'destructive' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex flex-col w-1/2 bg-background-surface border-r border-border p-12 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded bg-primary/5 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded bg-primary/3 blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded bg-primary flex items-center justify-center">
              <Package className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-foreground font-bold text-lg">Royal's Myawaddy</h1>
              <p className="text-secondary text-sm">Delivery Office</p>
            </div>
          </div>

          <div className="mt-auto pt-32">
            <h2 className="text-foreground text-4xl font-bold leading-tight mb-4">
              Manage your
              <span className="text-primary"> deliveries </span>
              efficiently.
            </h2>
            <p className="text-secondary text-base leading-relaxed">
              Track parcels from Mae Sot to Myawaddy. Manage staff, finances,
              and deliver with confidence.
            </p>

            {/* Stats */}
            <div className="mt-10 grid grid-cols-3 gap-4">
              {[
                { label: 'Parcel Tracking', value: 'Real-time' },
                { label: 'Bilingual', value: 'EN / မြန်မာ' },
                { label: 'All Roles', value: '4 Roles' },
              ].map((stat) => (
                <div key={stat.label} className="border border-border rounded p-4">
                  <p className="text-primary font-semibold text-sm">{stat.value}</p>
                  <p className="text-secondary text-xs mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded bg-primary flex items-center justify-center">
            <Package className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-foreground font-bold">Royal's Myawaddy</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-foreground text-2xl font-bold">{t('auth.loginTitle')}</h2>
              <p className="text-secondary text-sm mt-1">{t('auth.loginSubtitle')}</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'my' : 'en')}
                className="text-secondary hover:text-foreground transition-colors flex items-center gap-1.5 text-sm px-2 py-2 rounded hover:bg-muted"
              >
                <Globe className="w-4 h-4" />
                {i18n.language === 'en' ? 'မြန်မာ' : 'EN'}
              </button>
              <ThemeToggle className="px-2 py-2" />
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('auth.emailPlaceholder')}
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                className={errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}
              />
              {errors.email && <p className="text-destructive text-xs">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.passwordPlaceholder')}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-destructive text-xs">{errors.password}</p>}
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={loading}
            >
              {t('auth.loginButton')}
            </Button>
          </form>

        </div>
      </div>
    </div>
  )
}
