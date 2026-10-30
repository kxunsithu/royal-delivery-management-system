import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/AuthContext'
import userService from '@/services/userService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, User, Eye, EyeOff } from 'lucide-react'
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

  if (isLoading || !authUser) {
    return <div className="text-secondary py-16 text-center">Loading...</div>
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-foreground text-2xl font-bold">{t('auth.profile')}</h1>
          <p className="text-secondary text-sm">{authUser.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><User className="w-4 h-4 text-primary" />Profile Image</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded overflow-hidden border border-border bg-muted flex items-center justify-center flex-shrink-0">
                {(user?.profile_image_url || authUser?.profile_image_url) ? (
                  <img src={user?.profile_image_url || authUser?.profile_image_url || ''} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-secondary" />
                )}
              </div>
              <div className="flex flex-col gap-2">
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  loading={uploadImageMutation.isPending}
                  onClick={() => imageInputRef.current?.click()}
                >
                  Upload Image
                </Button>
                {(user?.profile_image || authUser?.profile_image) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    loading={deleteImageMutation.isPending}
                    onClick={() => deleteImageMutation.mutate()}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    Remove
                  </Button>
                )}
                <p className="text-secondary text-xs">JPEG, PNG, WebP · max 5 MB</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><User className="w-4 h-4 text-primary" />Account Information</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>{t('common.name')}</Label>
              <Input value={form.name} onChange={e => set('name', e.target.value)}
                className={errors.name ? 'border-destructive' : ''} />
              {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>{t('auth.email')}</Label>
              <Input type="email" value={form.email} disabled className="opacity-60 cursor-not-allowed" />
              {errors.email && <p className="text-destructive text-xs">{errors.email}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>{t('common.phone')}</Label>
              <Input value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t('users.role')}</Label>
              <Input value={authUser.role} disabled className="opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Change Password</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{t('users.newPassword')}</Label>
              <div className="relative">
                <Input type={showPw ? 'text' : 'password'} value={form.password}
                  onChange={e => set('password', e.target.value)}
                  className={`pr-10 ${errors.password ? 'border-destructive' : ''}`} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-foreground">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-destructive text-xs">{errors.password}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>{t('users.confirmPassword')}</Label>
              <Input type={showPw ? 'text' : 'password'} value={form.confirm_password}
                onChange={e => set('confirm_password', e.target.value)}
                className={errors.confirm_password ? 'border-destructive' : ''} />
              {errors.confirm_password && <p className="text-destructive text-xs">{errors.confirm_password}</p>}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" type="button" onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
          <Button type="submit" loading={mutation.isPending}>{t('common.save')}</Button>
        </div>
      </form>
    </div>
  )
}
