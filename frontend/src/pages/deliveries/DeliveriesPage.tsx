import { useState } from 'react'
import { usePersistedState } from '@/hooks/usePersistedState'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import deliveryService from '@/services/deliveryService'
import userService from '@/services/userService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Eye, RefreshCw, Users, Package, X } from 'lucide-react'
import { getParcelStatusClass, formatDate } from '@/utils/helpers'

export default function DeliveriesPage() {
  const { t, i18n } = useTranslation()
  const [search, setSearch] = usePersistedState('deliveries:search', '')
  const [staffFilter, setStaffFilter] = usePersistedState('deliveries:staffFilter', '')
  const [statusFilter, setStatusFilter] = usePersistedState('deliveries:statusFilter', '')
  const [page, setPage] = usePersistedState('deliveries:page', 1)

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['assignments', staffFilter, statusFilter, page],
    queryFn: () => deliveryService.allAssignments({
      staff_id: staffFilter ? parseInt(staffFilter) : undefined,
      status: statusFilter || undefined,
      page,
      per_page: 20,
    }).then(r => r.data),
  } as any)

  const { data: staffData } = useQuery({
    queryKey: ['delivery-staff'],
    queryFn: () => userService.deliveryStaff().then(r => r.data.data),
  })

  const { data: workloadData } = useQuery({
    queryKey: ['staff-workload'],
    queryFn: () => deliveryService.staffWorkload().then(r => r.data.data),
  })

  const assignments = (data as any)?.data ?? []
  const meta = (data as any)?.meta

  const filtered = assignments.filter((a: any) =>
    !search ||
    a.parcel?.tracking_number?.toLowerCase().includes(search.toLowerCase()) ||
    a.parcel?.recipient_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.staff?.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-bold">{t('deliveries.title')}</h1>
          <p className="text-secondary text-sm mt-1">{meta?.total ?? 0} {t('deliveries.assignments').toLowerCase()}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => refetch()} disabled={isRefetching}>
          <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Staff workload summary */}
      {workloadData && (workloadData as any[]).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="w-4 h-4 text-primary" />
              {t('dashboard.staffWorkload')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {(workloadData as any[]).map((w: any) => (
                <div key={w.staff?.id} className="flex items-center gap-2 bg-muted border border-border rounded px-3 py-2">
                  <div className="w-6 h-6 rounded bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <span className="text-primary text-xs font-bold">{w.staff?.name?.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-foreground text-xs font-medium">{w.staff?.name}</p>
                    <p className="text-secondary text-xs">{w.active} active</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
              <Input
                placeholder="Search tracking #, recipient or staff name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-9"
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-foreground" aria-label="Clear search">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <select
              value={staffFilter}
              onChange={e => { setStaffFilter(e.target.value); setPage(1) }}
              className="h-9 rounded border border-border bg-muted px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All Staff</option>
              {(staffData as any[] ?? []).map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
              className="h-9 rounded border border-border bg-muted px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">{t('common.all')} {t('common.status')}</option>
              {['ACTIVE','COMPLETED','REASSIGNED','CANCELLED'].map(s => (
                <option key={s} value={s}>{t(`deliveries.statuses.${s}`)}</option>
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
                <div key={i} className="h-14 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <Package className="w-12 h-12 text-secondary" />
              <p className="text-foreground font-medium">{t('common.noData')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {['Tracking #', 'Recipient', 'Staff', 'Area', t('common.status'), 'Assigned', ''].map(h => (
                      <th key={h} className="text-left text-xs text-secondary font-medium px-5 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a: any) => (
                    <tr key={a.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="text-primary font-mono text-sm">{a.parcel?.tracking_number ?? '-'}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-foreground text-sm">{a.parcel?.recipient_name ?? '-'}</p>
                        <p className="text-secondary text-xs">{a.parcel?.recipient_phone ?? ''}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-foreground text-sm">{a.staff?.name ?? '-'}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-secondary text-sm">
                          {i18n.language === 'my' && a.parcel?.delivery_area?.name_mm
                            ? a.parcel.delivery_area.name_mm
                            : a.parcel?.delivery_area?.name ?? '-'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          a.status === 'ACTIVE' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' :
                          a.status === 'COMPLETED' ? 'bg-success/15 text-success border border-success/30' :
                          'bg-muted text-secondary border border-border'
                        }`}>
                          {t(`deliveries.statuses.${a.status}`)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-secondary text-xs whitespace-nowrap">{formatDate(a.assigned_at, i18n.language)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <Link to={`/deliveries/${a.id}`}>
                          <Button variant="ghost" size="icon-sm"><Eye className="w-3.5 h-3.5" /></Button>
                        </Link>
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
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  {t('common.previous')}
                </Button>
                <span className="text-secondary text-xs">{page}/{meta.last_page}</span>
                <Button variant="outline" size="sm" disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)}>
                  {t('common.next')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
