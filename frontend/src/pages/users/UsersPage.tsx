import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import userService from '@/services/userService'
import { useAuth } from '@/features/auth/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Search, Edit, Eye, Power, RefreshCw, Users } from 'lucide-react'
import { formatDate, getRoleBadgeClass } from '@/utils/helpers'
import { getErrorMessage, getValidationErrors } from '@/utils/helpers'
import { toast } from '@/hooks/use-toast'
import { queryClient } from '@/lib/queryClient'

export default function UsersPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user: currentUser, hasRole } = useAuth()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(1)
  const [viewUser, setViewUser] = useState<any>(null)
  const [editUser, setEditUser] = useState<any>(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', employee_id: '', role: '', password: '' })
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['users', search, roleFilter, page],
    queryFn: () => userService.list({
      search: search || undefined,
      role: roleFilter || undefined,
      page,
      per_page: 20,
    }).then(r => r.data),
    keepPreviousData: true,
  } as any)

  const users = (data as any)?.data ?? []
  const meta = (data as any)?.meta

  const statusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      userService.updateStatus(id, is_active),
    onSuccess: (_, { is_active }) => {
      toast({ title: is_active ? t('users.activatedSuccess') : t('users.deactivatedSuccess'), variant: 'success' as any })
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err: any) => toast({ title: err?.response?.data?.message ?? 'Failed', variant: 'destructive' }),
  })

  useEffect(() => {
    if (editUser) {
      setEditForm({
        name: editUser.name ?? '',
        email: editUser.email ?? '',
        phone: editUser.phone ?? '',
        employee_id: editUser.employee_id ?? '',
        role: editUser.role ?? '',
        password: '',
      })
      setEditErrors({})
    }
  }, [editUser])

  const editMutation = useMutation({
    mutationFn: () => {
      const payload: any = { name: editForm.name, email: editForm.email, role: editForm.role }
      if (editForm.phone) payload.phone = editForm.phone
      if (editForm.employee_id) payload.employee_id = editForm.employee_id
      if (editForm.password) payload.password = editForm.password
      return userService.update(editUser.id, payload)
    },
    onSuccess: () => {
      toast({ title: t('users.updatedSuccess'), variant: 'success' as any })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setEditUser(null)
    },
    onError: (err: any) => {
      const ve = getValidationErrors(err)
      if (Object.keys(ve).length) {
        const m: Record<string, string> = {}
        Object.entries(ve).forEach(([k, v]) => { m[k] = Array.isArray(v) ? v[0] : String(v) })
        setEditErrors(m)
      } else {
        toast({ title: getErrorMessage(err), variant: 'destructive' })
      }
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-bold">{t('users.title')}</h1>
          <p className="text-secondary text-sm mt-1">{meta?.total ?? 0} users</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => refetch()} disabled={isRefetching}>
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => navigate('/users/create')}>
            <Plus className="w-4 h-4" />
            {t('users.createUser')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
              <Input
                placeholder="Search by name, email or employee ID..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                className="pl-9"
              />
            </div>
            <select
              value={roleFilter}
              onChange={e => { setRoleFilter(e.target.value); setPage(1) }}
              className="h-9 rounded border border-border bg-muted px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All Roles</option>
              {['admin', 'manager', 'accountant', 'delivery_staff'].map(r => (
                <option key={r} value={r}>{t(`users.roles.${r}`)}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <Users className="w-12 h-12 text-secondary" />
              <p className="text-foreground font-medium">{t('common.noData')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {['Name', 'Email', t('users.employeeId'), t('users.role'), t('common.status'), t('users.lastLogin'), ''].map(h => (
                      <th key={h} className="text-left text-xs text-secondary font-medium px-5 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: any) => (
                    <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full overflow-hidden border border-border flex-shrink-0 flex items-center justify-center bg-primary/15">
                            {u.profile_image_url ? (
                              <img
                                src={u.profile_image_url}
                                alt={u.name}
                                className="w-full h-full object-cover"
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.removeAttribute('style') }}
                              />
                            ) : null}
                            <span
                              className="text-primary text-xs font-bold"
                              style={u.profile_image_url ? { display: 'none' } : {}}
                            >
                              {u.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <p className="text-foreground text-sm font-medium">{u.name}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-secondary text-sm">{u.email}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-secondary text-sm font-mono">{u.employee_id ?? '-'}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs px-2 py-0.5 rounded ${getRoleBadgeClass(u.role)}`}>
                          {t(`users.roles.${u.role}`)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          u.is_active
                            ? 'bg-success/15 text-success border border-success/30'
                            : 'bg-destructive/15 text-destructive border border-destructive/30'
                        }`}>
                          {u.is_active ? t('common.active') : t('common.inactive')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-secondary text-xs whitespace-nowrap">
                          {u.last_login_at ? formatDate(u.last_login_at, i18n.language) : 'Never'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon-sm" title={t('common.view') || 'View'} onClick={() => setViewUser(u)}>
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          {currentUser?.id !== u.id && hasRole('admin') && (
                            <Button variant="ghost" size="icon-sm" title={t('common.edit')} onClick={() => setEditUser(u)}>
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          {currentUser?.id !== u.id && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              disabled={statusMutation.isPending}
                              onClick={() => statusMutation.mutate({ id: u.id, is_active: !u.is_active })}
                              title={u.is_active ? t('users.deactivate') : t('users.activate')}
                            >
                              <Power className={`w-3.5 h-3.5 ${u.is_active ? 'text-destructive' : 'text-success'}`} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-border">
              <p className="text-secondary text-xs">{meta.total} total</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>{t('common.previous')}</Button>
                <span className="text-secondary text-xs">{page}/{meta.last_page}</span>
                <Button variant="outline" size="sm" disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)}>{t('common.next')}</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View user modal */}
      {viewUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-background-surface border border-border rounded shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-foreground text-lg font-semibold">{t('common.view')} {t('users.title')}</h2>
              <button onClick={() => setViewUser(null)} className="text-secondary hover:text-foreground">✕</button>
            </div>
            <div className="space-y-4">
              {/* Profile image in modal */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-border flex-shrink-0 flex items-center justify-center bg-primary/15">
                  {viewUser.profile_image_url ? (
                    <img src={viewUser.profile_image_url} alt={viewUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-primary text-2xl font-bold">{viewUser.name?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <p className="text-foreground font-semibold">{viewUser.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded ${getRoleBadgeClass(viewUser.role)}`}>
                    {t(`users.roles.${viewUser.role}`)}
                  </span>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {[
                  [t('auth.email'), viewUser.email],
                  [t('common.phone'), viewUser.phone ?? '-'],
                  [t('users.employeeId'), viewUser.employee_id ?? '-'],
                  [t('common.status'), viewUser.is_active ? t('common.active') : t('common.inactive')],
                  [t('users.lastLogin'), viewUser.last_login_at ? formatDate(viewUser.last_login_at, i18n.language) : 'Never'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-border/40 pb-2 last:border-0">
                    <span className="text-secondary">{k}</span>
                    <span className="text-foreground font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewUser(null)}>{t('common.close') || 'Close'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit user modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-background-surface border border-border rounded shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-foreground text-lg font-semibold">{t('users.editUser')}</h2>
              <button onClick={() => setEditUser(null)} className="text-secondary hover:text-foreground">✕</button>
            </div>
            <form onSubmit={e => { e.preventDefault(); editMutation.mutate() }} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-secondary text-sm">{t('common.name')}</label>
                <Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className={editErrors.name ? 'border-destructive' : ''} />
                {editErrors.name && <p className="text-destructive text-xs">{editErrors.name}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-secondary text-sm">{t('auth.email')}</label>
                <Input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className={editErrors.email ? 'border-destructive' : ''} />
                {editErrors.email && <p className="text-destructive text-xs">{editErrors.email}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-secondary text-sm">{t('common.phone')}</label>
                <Input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-secondary text-sm">{t('users.employeeId')}</label>
                <Input value={editForm.employee_id} onChange={e => setEditForm(f => ({ ...f, employee_id: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-secondary text-sm">{t('users.role')}</label>
                <select value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full rounded border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                  {['admin','manager','accountant','delivery_staff'].map(r => (
                    <option key={r} value={r}>{t(`users.roles.${r}`)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-secondary text-sm">{t('users.newPassword')}</label>
                <Input type="password" value={editForm.password} onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))} placeholder={t('users.passwordOptional')} />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditUser(null)}>{t('common.cancel')}</Button>
                <Button type="submit" size="sm" loading={editMutation.isPending}>{t('common.save')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
