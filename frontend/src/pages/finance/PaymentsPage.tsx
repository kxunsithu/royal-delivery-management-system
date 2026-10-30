import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import financeService from '@/services/financeService'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RefreshCw, DollarSign } from 'lucide-react'
import { formatCurrency, formatDate } from '@/utils/helpers'

export default function PaymentsPage() {
  const { t, i18n } = useTranslation()
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['payments', typeFilter, statusFilter, dateFrom, dateTo, page],
    queryFn: () => financeService.payments({
      payment_type: typeFilter || undefined,
      status: statusFilter || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      page,
      per_page: 30,
    }).then(r => r.data),
  } as any)

  const payments = (data as any)?.data ?? []
  const meta = (data as any)?.meta

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-bold">{t('finance.payments')}</h1>
          <p className="text-secondary text-sm mt-1">{meta?.total ?? 0} records</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => refetch()} disabled={isRefetching}>
          <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-wrap gap-3">
            <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1) }}
              className="h-9 rounded border border-border bg-muted px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">All Types</option>
              <option value="DELIVERY_FEE">{t('finance.paymentType.DELIVERY_FEE')}</option>
              <option value="COD">{t('finance.paymentType.COD')}</option>
            </select>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
              className="h-9 rounded border border-border bg-muted px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">All Status</option>
              <option value="COLLECTED">{t('finance.paymentStatus.COLLECTED')}</option>
              <option value="HANDED_OVER">{t('finance.paymentStatus.HANDED_OVER')}</option>
              <option value="RECONCILED">{t('finance.paymentStatus.RECONCILED')}</option>
            </select>
            <Input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1) }} className="w-40" />
            <Input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1) }} className="w-40" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <DollarSign className="w-12 h-12 text-secondary" />
              <p className="text-foreground font-medium">{t('common.noData')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {['Tracking #', 'Recipient', 'Type', 'Amount', 'Status', 'Collected By', 'Date'].map(h => (
                      <th key={h} className="text-left text-xs text-secondary font-medium px-5 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p: any) => (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="text-primary font-mono text-sm">{p.parcel?.tracking_number ?? '-'}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-foreground text-sm">{p.parcel?.recipient_name ?? '-'}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          p.payment_type === 'DELIVERY_FEE'
                            ? 'bg-primary/15 text-primary border border-primary/30'
                            : 'bg-warning/15 text-warning border border-warning/30'
                        }`}>
                          {t(`finance.paymentType.${p.payment_type}`)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-foreground font-semibold">{formatCurrency(p.amount, i18n.language)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          p.status === 'RECONCILED' ? 'bg-success/15 text-success border border-success/30' :
                          p.status === 'HANDED_OVER' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' :
                          'bg-warning/15 text-warning border border-warning/30'
                        }`}>
                          {t(`finance.paymentStatus.${p.status}`)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-secondary text-sm">{p.collected_by?.name ?? '-'}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-secondary text-xs whitespace-nowrap">{formatDate(p.collected_at, i18n.language)}</span>
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
    </div>
  )
}
