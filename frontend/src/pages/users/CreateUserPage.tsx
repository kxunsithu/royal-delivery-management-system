import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import userService from '@/services/userService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { getErrorMessage, getValidationErrors } from '@/utils/helpers'

export default function CreateUserPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [showPw, setShowPw] = useState(false)
  const [showCpw, setShowCpw] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirm_password: '',
    employee_id: '', role: 'delivery_staff',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = (k: string, v: string) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => { const n = { ...e }; delete n[k]; return n })
  }

  const mutation = useMutation({
    mutationFn: () => userService.create({
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
      password: form.password,
      employee_id: form.employee_id || undefined,
      role: form.role,
    }),
    onSuccess: () => {
      toast({ title: t('users.createdSuccess'), variant: 'success' as any })
      navigate('/users')
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
    if (!form.name)     errs.name     = t('errors.required', { field: 'Name' })
    if (!form.email)    errs.email    = t('errors.required', { field: 'Email' })
    if (!form.password) errs.password = t('errors.required', { field: 'Password' })
    if (form.password !== form.confirm_password) errs.confirm_password = t('errors.passwordMismatch')
    if (Object.keys(errs).length) { setErrors(errs); return }
    mutation.mutate()
  }

  const Field = ({ k, label, type = 'text', placeholder = '' }: { k: string; label: string; type?: string; placeholder?: string }) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type={type} value={(form as any)[k]} onChange={e => set(k, e.target.value)}
        placeholder={placeholder}
        className={errors[k] ? 'border-destructive' : ''} />
      {errors[k] && <p className="text-destructive text-xs">{errors[k]}</p>}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/users')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-foreground text-2xl font-bold">{t('users.createUser')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Account Information</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><Field k="name" label="Full Name" /></div>
              <Field k="email" label={t('auth.email')} type="email" />
              <Field k="phone" label={t('common.phone')} />
              <Field k="employee_id" label={t('users.employeeId')} placeholder="EMP001" />
              <div className="space-y-1.5">
                <Label>{t('users.role')}</Label>
                <select value={form.role} onChange={e => set('role', e.target.value)}
                  className="w-full rounded border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                  {['admin','manager','accountant','delivery_staff'].map(r => (
                    <option key={r} value={r}>{t(`users.roles.${r}`)}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Password</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t('users.newPassword')}</Label>
                <div className="relative">
                  <Input type={showPw ? 'text' : 'password'} value={form.password}
                    onChange={e => set('password', e.target.value)} className={`pr-10 ${errors.password ? 'border-destructive' : ''}`} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-foreground">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-destructive text-xs">{errors.password}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>{t('users.confirmPassword')}</Label>
                <div className="relative">
                  <Input type={showCpw ? 'text' : 'password'} value={form.confirm_password}
                    onChange={e => set('confirm_password', e.target.value)} className={`pr-10 ${errors.confirm_password ? 'border-destructive' : ''}`} />
                  <button type="button" onClick={() => setShowCpw(!showCpw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-foreground">
                    {showCpw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirm_password && <p className="text-destructive text-xs">{errors.confirm_password}</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" type="button" onClick={() => navigate('/users')}>{t('common.cancel')}</Button>
          <Button type="submit" loading={mutation.isPending}>{t('users.createUser')}</Button>
        </div>
      </form>
    </div>
  )
}
