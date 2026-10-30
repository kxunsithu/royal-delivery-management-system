import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/AuthContext'
import userService from '@/services/userService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, User, Eye, EyeOff, Camera, Trash2, Shield, Phone, Mail, BadgeCheck, Lock, Save } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { getErrorMessage, getValidationErrors } from '@/utils/helpers'
import { queryClient } from '@/lib/queryClient'

export default function ProfilePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user: authUser, updateUser } = useAuth()

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm_password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPw, setShowPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)

  const { data: user, isLoading } = useQuery({
    queryKey: ['profile', authUser?.id],
    queryFn: () => userService.get(authUser!.id).then(r => r.data.data),
    enabled: !!authUser?.id,
  })

  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        name: user.name ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
      }))
    }
  }, [user])

  const imageInputRef = useRef<HTMLInputElement>(null)

  const uploadImageMutation = useMutation({
    mutationFn: (file: File) => userService.uploadProfileImage(authUser!.id, file),
    onSuccess: (res) => {
      const updated = (res.data as any).data
      if (updated) updateUser(updated)
      queryClient.invalidateQueries({ queryKey: ['profile', authUser?.id] })
      toast({ title: 'Profile image updated', variant: 'success' as any })
    },
    onError: (err: any) => toast({ title: getErrorMessage(err), variant: 'destructive' }),
  })

  const deleteImageMutation = useMutation({
    mutationFn: () => userService.deleteProfileImage(authUser!.id),
    onSuccess: (res) => {
      const updated = (res.data as any).data
      if (updated) updateUser(updated)
      queryClient.invalidateQueries({ queryKey: ['profile', authUser?.id] })
      toast({ title: 'Profile image removed', variant: 'success' as any })
    },
    onError: (err: any) => toast({ title: getErrorMessage(err), variant: 'destructive' }),
  })

  const set = (k: string, v: string) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => { const n = { ...e }; delete n[k]; return n })
  }

  const mutation = useMutation({
    mutationFn: () => {
      const payload: any = { name: form.name }
      if (form.phone) payload.phone = form.phone
      if (form.password) payload.password = form.password
      return userService.update(authUser!.id, payload)
    },
    onSuccess: (res) => {
      const updated = (res.data as any).data
      if (updated) updateUser(updated)
      queryClient.invalidateQueries({ queryKey: ['profile', authUser?.id] })
      setForm(f => ({ ...f, password: '', confirm_password: '' }))
      toast({ title: t('auth.profileUpdated'), variant: 'success' as any })
    },
    onError: (err: any) => {
      const ve = getValidationErrors(err)
      if (Object.keys(ve).length) {
        const m: Record<string, string> = {}
        Object.entries(ve).forEach(([k, v]) => { m[k] = Array.isArray(v) ? v[0] : String(v) })
        setErrors(m)
      } else {
        toast({ title: getErrorMessage(err), variant: 'destructive' })
      }
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!form.name) errs.name = t('errors.required', { field: t('common.name') })
    if (!form.email) errs.email = t('errors.required', { field: t('auth.email') })
    if (form.password && form.password !== form.confirm_password) errs.confirm_password = t('errors.passwordMismatch')
    if (form.password && form.password.length < 8) errs.password = t('errors.minLength', { field: t('auth.password'), min: 8 })
    if (Object.keys(errs).length) { setErrors(errs); return }
    mutation.mutate()
  }

  const profileImageUrl = user?.profile_image_url || authUser?.profile_image_url
  const hasProfileImage = !!(user?.profile_image || authUser?.profile_image)

  const roleColors: Record<string, string> = {
    admin: 'bg-primary/15 text-primary border-primary/30',
    manager: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    accountant: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    delivery_staff: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  }
  const roleColor = roleColors[authUser?.role ?? ''] ?? 'bg-muted text-secondary border-border'

  if (isLoading || !authUser) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-secondary text-sm">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-foreground text-2xl font-bold">{t('auth.profile')}</h1>
          <p className="text-secondary text-sm">Manage your account settings and preferences</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">

          {/* LEFT COLUMN — Avatar + Identity card */}
          <div className="lg:col-span-1 space-y-4">

            {/* Avatar Card */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Banner */}
              <div className="h-20 bg-gradient-to-br from-primary/30 via-primary/10 to-transparent relative">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(var(--primary)/0.2),transparent_60%)]" />
              </div>

              {/* Avatar */}
              <div className="px-5 pb-5">
                <div className="relative -mt-10 mb-4 w-fit">
                  <div className="w-20 h-20 rounded-full border-4 border-card bg-muted overflow-hidden flex items-center justify-center shadow-lg">
                    {profileImageUrl ? (
                      <img src={profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-9 h-9 text-secondary" />
                    )}
                  </div>
                  {/* Camera overlay button */}
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploadImageMutation.isPending}
                    className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/80 transition-all hover:scale-110"
                    title="Change photo"
                  >
                    {uploadImageMutation.isPending
                      ? <div className="w-3 h-3 rounded-full border border-primary-foreground border-t-transparent animate-spin" />
                      : <Camera className="w-3.5 h-3.5" />
                    }
                  </button>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/webp"
                    className="hidden"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) uploadImageMutation.mutate(e.target.files[0])
                      e.target.value = ''
                    }}
                  />
                </div>

                <div className="space-y-1 mb-4">
                  <h2 className="text-foreground font-semibold text-lg leading-tight">{authUser.name}</h2>
                  <p className="text-secondary text-sm">{authUser.email}</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${roleColor}`}>
                    <BadgeCheck className="w-3 h-3" />
                    {authUser.role_display ?? authUser.role}
                  </span>
                </div>

                {hasProfileImage && (
                  <button
                    type="button"
                    onClick={() => deleteImageMutation.mutate()}
                    disabled={deleteImageMutation.isPending}
                    className="mt-4 flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove photo
                  </button>
                )}
                <p className="mt-2 text-muted-foreground text-xs">JPEG, PNG, WebP · max 5 MB</p>
              </div>
            </div>

            {/* Info summary card */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <p className="text-xs font-semibold text-secondary uppercase tracking-wider">Contact Info</p>
              <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Mail className="w-3.5 h-3.5 text-secondary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-secondary">Email</p>
                    <p className="text-foreground text-sm truncate">{authUser.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Phone className="w-3.5 h-3.5 text-secondary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-secondary">Phone</p>
                    <p className="text-foreground text-sm">{form.phone || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Shield className="w-3.5 h-3.5 text-secondary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-secondary">Role</p>
                    <p className="text-foreground text-sm">{authUser.role_display ?? authUser.role}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN — Forms */}
          <div className="lg:col-span-2 space-y-5">

            {/* Account Information */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <h3 className="text-foreground text-sm font-semibold">Account Information</h3>
                  <p className="text-secondary text-xs">Update your personal details</p>
                </div>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-secondary text-xs font-medium uppercase tracking-wide">{t('common.name')}</Label>
                  <Input
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                    placeholder="Your full name"
                    className={errors.name ? 'border-destructive focus-visible:ring-destructive/30' : ''}
                  />
                  {errors.name && <p className="text-destructive text-xs flex items-center gap-1">{errors.name}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-secondary text-xs font-medium uppercase tracking-wide">{t('auth.email')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-secondary" />
                    <Input
                      type="email"
                      value={form.email}
                      disabled
                      className="pl-9 opacity-60 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-secondary">Email cannot be changed</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-secondary text-xs font-medium uppercase tracking-wide">{t('common.phone')}</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-secondary" />
                    <Input
                      value={form.phone}
                      onChange={e => set('phone', e.target.value)}
                      placeholder="+95 9 xxx xxx xxx"
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-secondary text-xs font-medium uppercase tracking-wide">{t('users.role')}</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-secondary" />
                    <Input
                      value={authUser.role_display ?? authUser.role}
                      disabled
                      className="pl-9 opacity-60 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Change Password */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                  <Lock className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <h3 className="text-foreground text-sm font-semibold">Change Password</h3>
                  <p className="text-secondary text-xs">Leave blank to keep your current password</p>
                </div>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-secondary text-xs font-medium uppercase tracking-wide">{t('users.newPassword')}</Label>
                  <div className="relative">
                    <Input
                      type={showPw ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => set('password', e.target.value)}
                      placeholder="Min. 8 characters"
                      className={`pr-10 ${errors.password ? 'border-destructive' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-foreground transition-colors"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-destructive text-xs">{errors.password}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-secondary text-xs font-medium uppercase tracking-wide">{t('users.confirmPassword')}</Label>
                  <div className="relative">
                    <Input
                      type={showConfirmPw ? 'text' : 'password'}
                      value={form.confirm_password}
                      onChange={e => set('confirm_password', e.target.value)}
                      placeholder="Repeat password"
                      className={`pr-10 ${errors.confirm_password ? 'border-destructive' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-foreground transition-colors"
                    >
                      {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirm_password && <p className="text-destructive text-xs">{errors.confirm_password}</p>}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <Button variant="outline" type="button" onClick={() => navigate(-1)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" loading={mutation.isPending} className="gap-2 min-w-[100px]">
                <Save className="w-3.5 h-3.5" />
                {t('common.save')}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
