import { useState } from 'react'
import { usePersistedState } from '@/hooks/usePersistedState'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import parcelService from '@/services/parcelService'
import type { ParcelStatus } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Plus, Search, Filter, Package, Eye, RefreshCw, X, Trash2 } from 'lucide-react'
import { getParcelStatusClass, getPriorityClass, formatDate, formatCurrency } from '@/utils/helpers'
import { useAuth } from '@/features/auth/AuthContext'
import { toast } from '@/hooks/use-toast'

const STATUSES: ParcelStatus[] = [
  'RECEIVED','VERIFIED','IN_TRANSIT','DELIVERED','FAILED','DAMAGED'
]

export default function ParcelsPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { hasRole } = useAuth()
  const queryClient = useQueryClient()
  const verifyMutation = useMutation({
    mutationFn: (id: number) => parcelService.statusTransition(id, 'VERIFIED'),
    onSuccess: () => {
      toast({ title: t('status.VERIFIED'), variant: 'success' as any })
      setVerifyId(null)
      queryClient.invalidateQueries({ queryKey: ['parcels'] })
    },
    onError: (err: any) => {
      toast({ title: err?.response?.data?.message ?? 'Failed', variant: 'destructive' })
    },
  })

  const deleteParcelMutation = useMutation({
    mutationFn: (id: number) => parcelService.delete(id),
    onSuccess: () => {
      toast({ title: 'Parcel deleted', variant: 'success' as any })
      setDeleteId(null)
      queryClient.invalidateQueries({ queryKey: ['parcels'] })
    },
    onError: (err: any) => {
      toast({ title: err?.response?.data?.message ?? 'Delete failed', variant: 'destructive' })
    },
  })

  const [search, setSearch] = usePersistedState('parcels:search', '')
  const [statusFilter, setStatusFilter] = usePersistedState<ParcelStatus | ''>('parcels:statusFilter', '')
  const [dateFrom, setDateFrom] = usePersistedState('parcels:dateFrom', '')
  const [dateTo, setDateTo] = usePersistedState('parcels:dateTo', '')
  const [page, setPage] = usePersistedState('parcels:page', 1)
  const [showFilters, setShowFilters] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [verifyId, setVerifyId] = useState<number | null>(null)

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['parcels', search, statusFilter, dateFrom, dateTo, page],
    queryFn: () => parcelService.list({
      search: search || undefined,
      status: statusFilter || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      page,
      per_page: 20,
    }).then(r => r.data),
    keepPreviousData: true,
  } as any)

  const parcels = (data as any)?.data ?? []
  const meta = (data as any)?.meta
  const verifyParcel = parcels.find((p: any) => p.id === verifyId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-bold">{t('parcels.title')}</h1>
          <p className="text-secondary text-sm mt-1">
            {meta ? `${meta.total} parcels total` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
          {hasRole(['admin', 'manager']) && (
            <Button onClick={() => navigate('/parcels/register')}>
              <Plus className="w-4 h-4" />
              {t('parcels.register')}
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
              <Input
                placeholder={t('parcels.searchPlaceholder')}
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                className="pl-9 pr-9"
              />
              {search && (
                <button type="button" onClick={() => { setSearch(''); setPage(1) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-foreground" aria-label="Clear search">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'border-primary text-primary' : ''}
            >
              <Filter className="w-4 h-4" />
              {t('common.filter')}
            </Button>
          </div>

          {showFilters && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-secondary text-xs mb-2">{t('parcels.filterByStatus')}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { setStatusFilter(''); setPage(1) }}
                  className={`px-3 py-1 rounded text-xs transition-all ${
                    statusFilter === '' ? 'bg-primary text-primary-foreground font-medium' : 'bg-muted text-secondary hover:text-foreground'
                  }`}
                >
                  {t('common.all')}
                </button>
                {STATUSES.map(s => (
                  <button
                    key={s}
                    onClick={() => { setStatusFilter(s); setPage(1) }}
                    className={`px-3 py-1 rounded text-xs transition-all ${
                      statusFilter === s ? 'bg-primary text-primary-foreground font-medium' : 'bg-muted text-secondary hover:text-foreground'
                    }`}
                  >
                    {t(`status.${s}`)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-border flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2">
              <label className="text-secondary text-xs whitespace-nowrap">{t('common.from') ?? 'From'}</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={e => { setDateFrom(e.target.value); setPage(1) }}
                className="w-auto"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-secondary text-xs whitespace-nowrap">{t('common.to') ?? 'To'}</label>
              <Input
                type="date"
                value={dateTo}
                onChange={e => { setDateTo(e.target.value); setPage(1) }}
              />
            </div>
            {(dateFrom || dateTo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setDateFrom(''); setDateTo(''); setPage(1) }}
              >
                {'Clear'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Parcels table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : parcels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div className="w-14 h-14 rounded bg-muted flex items-center justify-center">
                <Package className="w-7 h-7 text-secondary" />
              </div>
              <p className="text-foreground font-medium">{t('parcels.noParcelFound')}</p>
              <p className="text-secondary text-sm">{t('common.noResults')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {['Image', 'Tracking #', t('parcels.senderName'), t('parcels.recipientName'), t('parcels.receivedAt'), t('common.status'), ''].map(h => (
                      <th key={h} className="text-left text-xs text-secondary font-medium px-5 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parcels.map((p: any) => (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3.5">
                        {p.images?.[0]?.url ? (
                          <img
                            src={p.images[0].url}
                            alt={p.images[0].original_name ?? p.tracking_number}
                            className="w-12 h-12 object-cover rounded border border-border"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded border border-border bg-muted flex items-center justify-center">
                            <Package className="w-5 h-5 text-secondary" />
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-primary font-mono text-sm font-medium">{p.tracking_number}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-foreground text-sm">{p.sender_name ?? '-'}</p>
                        <p className="text-secondary text-xs">{p.sender_phone ?? ''}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-foreground text-sm">{p.recipient_name}</p>
                        <p className="text-secondary text-xs">{p.recipient_phone}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-secondary text-xs">{formatDate(p.received_at, i18n.language)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs px-2 py-0.5 rounded ${getParcelStatusClass(p.status)}`}>
                          {t(`status.${p.status}`)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          {hasRole(['admin', 'manager']) && p.status === 'RECEIVED' && (
                            <Button
                              variant="outline"
                              size="sm"
                              loading={verifyMutation.isPending}
                              onClick={() => setVerifyId(p.id)}
                            >
                              {t('parcels.verify')}
                            </Button>
                          )}
                          <Link to={`/parcels/${p.id}`}>
                            <Button variant="ghost" size="icon-sm">
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                          {hasRole(['admin', 'manager']) && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(p.id)}
                              title="Delete parcel"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

          {/* Pagination */}
          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-border">
              <p className="text-secondary text-xs">
                {t('common.showing')} {((page - 1) * meta.per_page) + 1}–{Math.min(page * meta.per_page, meta.total)} {t('common.of')} {meta.total}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  {t('common.previous')}
                </Button>
                <span className="text-secondary text-xs">{page} / {meta.last_page}</span>
                <Button variant="outline" size="sm" disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)}>
                  {t('common.next')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={verifyId !== null}
        title={t('parcels.confirmVerifyTitle')}
        message={t('parcels.confirmVerifyMessage', { tracking: verifyParcel?.tracking_number ?? '' })}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('common.confirm')}
        onCancel={() => setVerifyId(null)}
        onConfirm={() => { if (verifyId !== null) verifyMutation.mutate(verifyId) }}
        loading={verifyMutation.isPending}
      />

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete parcel?"
        message="This action cannot be undone. Are you sure you want to delete this parcel?"
        cancelLabel={t('common.cancel')}
        confirmLabel={t('common.delete')}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId !== null) deleteParcelMutation.mutate(deleteId) }}
        loading={deleteParcelMutation.isPending}
        variant="destructive"
      />
    </div>
  )
}
