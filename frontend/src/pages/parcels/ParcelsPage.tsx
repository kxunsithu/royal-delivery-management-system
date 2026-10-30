import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import parcelService from '@/services/parcelService'
import type { ParcelStatus } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Search, Filter, Package, Eye, RefreshCw } from 'lucide-react'
import { getParcelStatusClass, getPriorityClass, formatDate, formatCurrency } from '@/utils/helpers'
import { useAuth } from '@/features/auth/AuthContext'

const STATUSES: ParcelStatus[] = [
  'RECEIVED_AT_MYAWADDY','VERIFIED','READY_FOR_DELIVERY','ASSIGNED',
  'OUT_FOR_DELIVERY','DELIVERED','DELIVERY_FAILED','RETURN_TO_OFFICE',
  'RETURNED_TO_SENDER','DAMAGED','MISSING'
]

export default function ParcelsPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { hasRole } = useAuth()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ParcelStatus | ''>('')
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['parcels', search, statusFilter, page],
    queryFn: () => parcelService.list({
      search: search || undefined,
      status: statusFilter || undefined,
      page,
      per_page: 20,
    }).then(r => r.data),
    keepPreviousData: true,
  } as any)

  const parcels = (data as any)?.data ?? []
  const meta = (data as any)?.meta

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
                className="pl-9"
              />
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
                    {['Tracking #', t('parcels.recipientName'), t('parcels.deliveryArea'), t('parcels.deliveryFee'), t('parcels.priority'), t('common.status'), t('parcels.receivedAt'), ''].map(h => (
                      <th key={h} className="text-left text-xs text-secondary font-medium px-5 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parcels.map((p: any) => (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="text-primary font-mono text-sm font-medium">{p.tracking_number}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-foreground text-sm">{p.recipient_name}</p>
                        <p className="text-secondary text-xs">{p.recipient_phone}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-secondary text-sm">
                          {i18n.language === 'my' && p.delivery_area?.name_mm
                            ? p.delivery_area.name_mm
                            : p.delivery_area?.name ?? '-'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-foreground text-sm">{formatCurrency(p.delivery_fee, i18n.language)}</span>
                        {p.is_cod && (
                          <span className="ml-1.5 text-xs text-warning">+COD</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs px-2 py-0.5 rounded ${getPriorityClass(p.priority)}`}>
                          {t(`parcels.priorities.${p.priority}`)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs px-2 py-0.5 rounded ${getParcelStatusClass(p.status)}`}>
                          {t(`status.${p.status}`)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-secondary text-xs whitespace-nowrap">
                          {formatDate(p.received_at, i18n.language)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <Link to={`/parcels/${p.id}`}>
                          <Button variant="ghost" size="icon-sm">
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
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
    </div>
  )
}
