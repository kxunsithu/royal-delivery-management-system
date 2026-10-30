import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/AuthContext'
import userService from '@/services/userService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Edit, User, Mail, Phone, Briefcase, Shield, Clock, Power } from 'lucide-react'
import { formatDate, getRoleBadgeClass } from '@/utils/helpers'
import { toast } from '@/hooks/use-toast'
import { queryClient } from '@/lib/queryClient'

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user: currentUser, hasRole } = useAuth()

  const { data: user, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['user', id],
    queryFn: () => userService.get(Number(id)).then(r => r.data.data),
  })

  const u = user as any

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 bg-background-surface border border-border rounded animate-pulse" />
        ))}
      </div>
    )
  }

  if (!u) {
    return <div className="text-secondary py-16 text-center">{t('common.noData')}</div>
  }

  const isSelf = currentUser?.id === u.id

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/users')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-12 h-12 rounded bg-primary/20 border border-primary/30 flex items-center justify-center overflow-hidden flex-shrink-0">
            {u.profile_image_url ? (
              <img src={u.profile_image_url} alt={u.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-primary font-bold text-lg">{u.name?.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-foreground text-2xl font-bold truncate">{u.name}</h1>
            <p className="text-secondary text-sm truncate">{u.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasRole('admin') && (
            <Link to={`/users/${u.id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="w-3.5 h-3.5" />
                {t('common.edit')}
              </Button>
            </Link>
          )}
          {isSelf && (
            <Link to="/profile">
              <Button variant="outline" size="sm">
                <User className="w-3.5 h-3.5" />
                {t('auth.profile')}
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><User className="w-4 h-4 text-primary" />Account</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              [t('common.name'), u.name],
              [t('auth.email'), u.email],
              [t('common.phone'), u.phone ?? '-'],
              [t('users.employeeId'), u.employee_id ?? '-'],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between border-b border-border/40 pb-2 last:border-0">
                <span className="text-secondary">{k}</span>
                <span className="text-foreground font-medium">{v}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-4 h-4 text-primary" />Role & Status</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <span className="text-secondary">{t('users.role')}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${getRoleBadgeClass(u.role)}`}>
                {t(`users.roles.${u.role}`)}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <span className="text-secondary">{t('common.status')}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${u.is_active ? 'bg-success/15 text-success border border-success/30' : 'bg-destructive/15 text-destructive border border-destructive/30'}`}>
                {u.is_active ? t('common.active') : t('common.inactive')}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <span className="text-secondary">{t('users.lastLogin')}</span>
              <span className="text-foreground">{u.last_login_at ? formatDate(u.last_login_at, i18n.language) : 'Never'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-secondary">Created</span>
              <span className="text-foreground">{formatDate(u.created_at, i18n.language)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isRefetching}>
          <Clock className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>
    </div>
  )
}
