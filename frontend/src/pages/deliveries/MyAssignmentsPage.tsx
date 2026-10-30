import { useState } from 'react'
import { usePersistedState } from '@/hooks/usePersistedState'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import deliveryService from '@/services/deliveryService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Eye, RefreshCw, MapPin, Phone, Package, CheckCircle2, XCircle, X } from 'lucide-react'
import { getParcelStatusClass, formatDate, formatCurrency, buildGoogleMapsUrl } from '@/utils/helpers'
import { toast } from '@/hooks/use-toast'
import { queryClient } from '@/lib/queryClient'

export default function MyAssignmentsPage() {
  const { t, i18n } = useTranslation()
  const [search, setSearch] = usePersistedState('myAssignments:search', '')
  const [activeTab, setActiveTab] = usePersistedState<'active' | 'completed'>('myAssignments:activeTab', 'active')
  const [showAttemptModal, setShowAttemptModal] = useState<number | null>(null)
  const [attemptForm, setAttemptForm] = useState({
    result: 'DELIVERED' as 'DELIVERED' | 'FAILED',
    failure_reason: '',
    recipient_name: '',
    delivery_fee_collected: '',
    cod_collected: '0',
    notes: '',
  })

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['my-assignments', activeTab],
    queryFn: () => deliveryService.myAssignments({
      status: activeTab === 'active' ? 'ACTIVE' : 'COMPLETED',
      per_page: 50,
    }).then(r => r.data),
    refetchInterval: 30_000,
  } as any)

  const assignments = (data as any)?.data ?? []

  const attemptMutation = useMutation({
    mutationFn: (assignmentId: number) => deliveryService.recordAttempt(assignmentId, {
      result: attemptForm.result,
      failure_reason: attemptForm.failure_reason || undefined,
      recipient_name: attemptForm.recipient_name || undefined,
      delivery_fee_collected: parseFloat(attemptForm.delivery_fee_collected) || 0,
      cod_collected: parseFloat(attemptForm.cod_collected) || 0,
      notes: attemptForm.notes || undefined,
    }),
    onSuccess: () => {
      toast({ title: t('deliveries.attemptRecorded'), variant: 'success' as any })
      queryClient.invalidateQueries({ queryKey: ['my-assignments'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setShowAttemptModal(null)
      setAttemptForm({ result: 'DELIVERED', failure_reason: '', recipient_name: '', delivery_fee_collected: '', cod_collected: '0', notes: '' })
    },
    onError: (err: any) => toast({ title: err?.response?.data?.message ?? 'Failed', variant: 'destructive' }),
  })

  const filtered = assignments.filter((a: any) =>
    !search ||
    a.parcel?.tracking_number?.toLowerCase().includes(search.toLowerCase()) ||
    a.parcel?.recipient_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.parcel?.recipient_phone?.includes(search)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-bold">{t('deliveries.myAssignments')}</h1>
          <p className="text-secondary text-sm mt-1">{filtered.length} {t('deliveries.assignments').toLowerCase()}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => refetch()} disabled={isRefetching}>
          <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded p-1 w-fit">
        {(['active', 'completed'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-all ${
              activeTab === tab ? 'bg-primary text-primary-foreground' : 'text-secondary hover:text-foreground'
            }`}
          >
            {tab === 'active' ? t('deliveries.activeAssignments') : t('deliveries.completedAssignments')}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
        <Input
          placeholder={t('parcels.searchPlaceholder')}
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

      {/* Assignment cards */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-44 bg-background-surface border border-border rounded animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Package className="w-12 h-12 text-secondary mx-auto mb-3" />
            <p className="text-foreground font-medium">{t('common.noData')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((a: any) => {
            const p = a.parcel
            if (!p) return null
            return (
              <Card key={a.id} className={a.status === 'ACTIVE' ? 'border-border' : 'border-border/50 opacity-75'}>
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-3">
                      {/* Tracking + status */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-primary font-mono font-semibold text-sm">{p.tracking_number}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${getParcelStatusClass(p.status)}`}>
                          {t(`status.${p.status}`)}
                        </span>
                        {p.priority !== 'NORMAL' && (
                          <span className={`text-xs px-2 py-0.5 rounded ${p.priority === 'URGENT' ? 'bg-red-500/15 text-red-400 border border-red-500/30' : 'bg-orange-500/15 text-orange-400 border border-orange-500/30'}`}>
                            {t(`parcels.priorities.${p.priority}`)}
                          </span>
                        )}
                      </div>

                      {/* Recipient */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Package className="w-3.5 h-3.5 text-secondary" />
                          <span className="text-foreground font-medium">{p.recipient_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-3.5 h-3.5 text-secondary" />
                          <a href={`tel:${p.recipient_phone}`} className="text-primary">{p.recipient_phone}</a>
                        </div>
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="w-3.5 h-3.5 text-secondary mt-0.5" />
                          <div>
                            <p className="text-secondary">{p.delivery_address}</p>
                            {p.delivery_area && <p className="text-secondary text-xs">{p.delivery_area.name}</p>}
                          </div>
                        </div>
                      </div>

                      {/* Fees */}
                      <div className="flex items-center gap-4 text-xs text-secondary">
                        <span>{t('parcels.deliveryFee')}: <span className="text-foreground">{formatCurrency(p.delivery_fee, i18n.language)}</span></span>
                        {p.is_cod && <span>COD: <span className="text-warning">{formatCurrency(p.cod_amount, i18n.language)}</span></span>}
                      </div>

                      {/* Assigned at */}
                      <p className="text-secondary text-xs">{t('deliveries.assignedAt')}: {formatDate(a.assigned_at, i18n.language)}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 items-end">
                      <Link to={`/deliveries/${a.id}`}>
                        <Button variant="ghost" size="icon-sm">
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                      <a href={buildGoogleMapsUrl(p.delivery_address)} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          <MapPin className="w-3.5 h-3.5" />
                          Maps
                        </Button>
                      </a>
                      {a.status === 'ACTIVE' && (
                        <Button size="sm" onClick={() => {
                          setShowAttemptModal(a.id)
                          setAttemptForm(f => ({ ...f, delivery_fee_collected: p.delivery_fee?.toString() ?? '' }))
                        }}>
                          Record
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Record Attempt Modal */}
      {showAttemptModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md border-border">
            <CardHeader>
              <CardTitle>{t('deliveries.recordAttempt')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Result toggle */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setAttemptForm(f => ({ ...f, result: 'DELIVERED' }))}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded border text-sm font-medium transition-all ${
                    attemptForm.result === 'DELIVERED'
                      ? 'bg-success/15 border-success/40 text-success'
                      : 'border-border text-secondary hover:text-foreground'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {t('deliveries.delivered')}
                </button>
                <button
                  onClick={() => setAttemptForm(f => ({ ...f, result: 'FAILED' }))}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded border text-sm font-medium transition-all ${
                    attemptForm.result === 'FAILED'
                      ? 'bg-destructive/15 border-destructive/40 text-destructive'
                      : 'border-border text-secondary hover:text-foreground'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  {t('deliveries.failed')}
                </button>
              </div>

              {attemptForm.result === 'DELIVERED' && (
                <div className="space-y-1.5">
                  <label className="text-secondary text-sm">{t('deliveries.recipientName')}</label>
                  <Input
                    value={attemptForm.recipient_name}
                    onChange={e => setAttemptForm(f => ({ ...f, recipient_name: e.target.value }))}
                    placeholder="Full name of receiver"
                  />
                </div>
              )}

              {attemptForm.result === 'FAILED' && (
                <div className="space-y-1.5">
                  <label className="text-secondary text-sm">{t('deliveries.failureReason')}</label>
                  <select
                    value={attemptForm.failure_reason}
                    onChange={e => setAttemptForm(f => ({ ...f, failure_reason: e.target.value }))}
                    className="w-full rounded border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">-- Select reason --</option>
                    {['RECIPIENT_UNAVAILABLE','PHONE_UNREACHABLE','WRONG_ADDRESS','REFUSED','RESCHEDULED','OTHER'].map(r => (
                      <option key={r} value={r}>{t(`deliveries.failureReasons.${r}`)}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-secondary text-sm">{t('deliveries.deliveryFeeCollected')}</label>
                  <Input
                    type="number" min="0"
                    value={attemptForm.delivery_fee_collected}
                    onChange={e => setAttemptForm(f => ({ ...f, delivery_fee_collected: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-secondary text-sm">{t('deliveries.codCollected')}</label>
                  <Input
                    type="number" min="0"
                    value={attemptForm.cod_collected}
                    onChange={e => setAttemptForm(f => ({ ...f, cod_collected: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-secondary text-sm">{t('common.notes')} ({t('common.optional')})</label>
                <Input
                  value={attemptForm.notes}
                  onChange={e => setAttemptForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowAttemptModal(null)}>
                  {t('common.cancel')}
                </Button>
                <Button
                  className="flex-1"
                  loading={attemptMutation.isPending}
                  onClick={() => attemptMutation.mutate(showAttemptModal)}
                >
                  {t('deliveries.recordAttempt')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
