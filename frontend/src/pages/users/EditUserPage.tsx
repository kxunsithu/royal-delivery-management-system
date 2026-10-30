import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import userService from '@/services/userService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { getErrorMessage, getValidationErrors } from '@/utils/helpers'
import { queryClient } from '@/lib/queryClient'

export default function EditUserPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', phone: '', employee_id: '', role: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: user } = useQuery({
    queryKey: ['user', id],
    queryFn: () => userService.get(Number(id)).then(r => r.data.data),
  })

  useEffect(() => {
    if (user) {
      setForm({ name: user.name ?? '', email: user.email ?? '', phone: user.phone ?? '',
        employee_id: user.employee_id ?? '', role: user.role ?? '', password: '' })
    }
  }, [user])

  const set = (k: string, v: string) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => { const n = { ...e }; delete n[k]; return n })
  }

  const mutation = useMutation({
    mutationFn: () => {
      const payload: any = { name: form.name, email: form.email, role: form.role }
      if (form.phone) payload.phone = form.phone
      if (form.employee_id) payload.employee_id = form.employee_id
      if (form.password) payload.password = form.password
      return userService.update(Number(id), payload)
    },
    onSuccess: () => {
      toast({ title: t('users.updatedSuccess'), variant: 'success' as any })
      queryClient.invalidateQueries({ queryKey: ['users'] })
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

  if (!user) return <div className="text-secondary py-16 text-center">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/users')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-foreground text-2xl font-bold">{t('users.editUser')}</h1>
          <p className="text-secondary text-sm">{user.name}</p>
        </div>
      </div>

      <form onSubmit={e => { e.preventDefault(); mutation.mutate() }} className="space-y-5">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Account Information</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              ['name', 'Full Name', 'text'],
              ['email', t('auth.email'), 'email'],
              ['phone', t('common.phone'), 'text'],
              ['employee_id', t('users.employeeId'), 'text'],
            ].map(([k, lbl, type]) => (
              <div key={k} className="space-y-1.5">
                <Label>{lbl}</Label>
                <Input type={type} value={(form as any)[k] ?? ''} onChange={e => set(k, e.target.value)}
                  className={errors[k] ? 'border-destructive' : ''} />
                {errors[k] && <p className="text-destructive text-xs">{errors[k]}</p>}
              </div>
            ))}
            <div className="space-y-1.5">
              <Label>{t('users.role')}</Label>
              <select value={form.role} onChange={e => set('role', e.target.value)}
                className="w-full rounded border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                {['admin','manager','accountant','delivery_staff'].map(r => (
                  <option key={r} value={r}>{t(`users.roles.${r}`)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>{t('users.newPassword')}</Label>
              <Input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                placeholder={t('users.passwordOptional')} />
            </div>
          </CardContent>
        </Card>
        <div className="flex gap-3">
          <Button variant="outline" type="button" onClick={() => navigate('/users')}>{t('common.cancel')}</Button>
          <Button type="submit" loading={mutation.isPending}>{t('common.save')}</Button>
        </div>
      </form>
    </div>
  )
}
