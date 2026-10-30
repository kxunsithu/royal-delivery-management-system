import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import financeService from '@/services/financeService'
import { useAuth } from '@/features/auth/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, RefreshCw, CheckCircle2, AlertTriangle, ArrowRightLeft } from 'lucide-react'
import { formatCurrency, formatDate, getHandoverStatusClass } from '@/utils/helpers'
import { toast } from '@/hooks/use-toast'
import { queryClient } from '@/lib/queryClient'

export default function HandoversPage() {
  const { t, i18n } = useTranslation()
  const { hasRole } = useAuth()
  const [page, setPage] = useState(1)
  const [showSubmitForm, setShowSubmitForm] = useState(false)
  const [verifyingId, setVerifyingId] = useState<number | null>(null)
  const [submitForm, setSubmitForm] = useState({ period_start: '', period_end: '', submitted_amount: '', submission_notes: '' })
  const [verifyForm, setVerifyForm] = useState({ verified_amount: '', status: 'VERIFIED', verification_notes: '' })

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['handovers', page],
    queryFn: () => financeService.handovers({ page, per_page: 20 }).then(r => r.data),
  } as any)

  const handovers = (data as any)?.data ?? []
  const meta = (data as any)?.meta

  const submitMutation = useMutation({
    mutationFn: () => financeService.submitHandover({
      period_start: submitForm.period_start,
      period_end: submitForm.period_end,
      submitted_amount: parseFloat(submitForm.submitted_amount),
      submission_notes: submitForm.submission_notes || undefined,
    }),
    onSuccess: () => {
      toast({ title: t('finance.handoverSubmitted'), variant: 'success' as any })
      queryClient.invalidateQueries({ queryKey: ['handovers'] })
      setShowSubmitForm(false)
    },
    onError: (err: any) => toast({ title: err?.response?.data?.message ?? 'Failed', variant: 'destructive' }),
  })

  const verifyMutation = useMutation({
    mutationFn: (id: number) => financeService.verifyHandover(id, {
      verified_amount: parseFloat(verifyForm.verified_amount),
      status: verifyForm.status as any,
      verification_notes: verifyForm.verification_notes || undefined,
    }),
    onSuccess: () => {
      toast({ title: t('finance.handoverVerified'), variant: 'success' as any })
      queryClient.invalidateQueries({ queryKey: ['handovers'] })
      setVerifyingId(null)
    },
    onError: (err: any) => toast({ title: err?.response?.data?.message ?? 'Failed', variant: 'destructive' }),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-bold">{t('finance.cashHandovers')}</h1>
          <p className="text-secondary text-sm mt-1">{meta?.total ?? 0} records</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => refetch()} disabled={isRefetching}>
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
          {hasRole(['delivery_staff']) && (
            <Button onClick={() => setShowSubmitForm(!showSubmitForm)}>
              <Plus className="w-4 h-4" />
              {t('finance.submitHandover')}
            </Button>
          )}
        </div>
      </div>

      {/* Submit form (delivery staff) */}
      {showSubmitForm && hasRole(['delivery_staff']) && (
        <Card className="border-primary/30">
          <CardHeader><CardTitle className="text-base">{t('finance.submitHandover')}</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{t('finance.periodStart')}</Label>
              <Input type="date" value={submitForm.period_start} onChange={e => setSubmitForm(f => ({ ...f, period_start: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>{t('finance.periodEnd')}</Label>
              <Input type="date" value={submitForm.period_end} onChange={e => setSubmitForm(f => ({ ...f, period_end: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>{t('finance.submittedAmount')}</Label>
              <Input type="number" min="0" value={submitForm.submitted_amount} onChange={e => setSubmitForm(f => ({ ...f, submitted_amount: e.target.value }))} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>{t('finance.submissionNotes')} ({t('common.optional')})</Label>
              <Input value={submitForm.submission_notes} onChange={e => setSubmitForm(f => ({ ...f, submission_notes: e.target.value }))} />
            </div>
            <div className="flex gap-2 items-end">
              <Button variant="outline" onClick={() => setShowSubmitForm(false)}>{t('common.cancel')}</Button>
              <Button loading={submitMutation.isPending} onClick={() => submitMutation.mutate()}
                disabled={!submitForm.period_start || !submitForm.period_end || !submitForm.submitted_amount}>
                {t('finance.submitHandover')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : handovers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <ArrowRightLeft className="w-12 h-12 text-secondary" />
              <p className="text-foreground font-medium">{t('common.noData')}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {handovers.map((h: any) => (
                <div key={h.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-foreground font-medium text-sm">{h.staff?.name ?? '-'}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${getHandoverStatusClass(h.status)}`}>
                          {t(`finance.handoverStatus.${h.status}`)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs text-secondary">
                        <span>Period: {formatDate(h.period_start, i18n.language)} → {formatDate(h.period_end, i18n.language)}</span>
                        <span>Expected: <span className="text-foreground">{formatCurrency(h.expected_amount, i18n.language)}</span></span>
                        <span>Submitted: <span className={h.submitted_amount !== h.expected_amount ? 'text-warning' : 'text-success'}>
                          {formatCurrency(h.submitted_amount, i18n.language)}
                        </span></span>
                        {h.discrepancy !== undefined && h.discrepancy !== 0 && (
                          <span>Discrepancy: <span className="text-destructive">{formatCurrency(Math.abs(h.discrepancy), i18n.language)}</span></span>
                        )}
                      </div>
                      {h.submission_notes && <p className="text-secondary text-xs">{h.submission_notes}</p>}
                    </div>

                    {/* Verify button */}
                    {hasRole(['admin', 'accountant']) && h.status === 'SUBMITTED' && (
                      verifyingId === h.id ? (
                        <div className="flex flex-col gap-2 min-w-48">
                          <Input type="number" placeholder="Verified amount"
                            value={verifyForm.verified_amount}
                            onChange={e => setVerifyForm(f => ({ ...f, verified_amount: e.target.value }))}
                            className="h-8 text-xs" />
                          <select
                            value={verifyForm.status}
                            onChange={e => setVerifyForm(f => ({ ...f, status: e.target.value }))}
                            className="h-8 rounded border border-border bg-muted px-2 text-xs text-foreground focus:outline-none"
                          >
                            <option value="VERIFIED">Verified</option>
                            <option value="DISPUTED">Disputed</option>
                          </select>
                          <Input placeholder="Notes (optional)" value={verifyForm.verification_notes}
                            onChange={e => setVerifyForm(f => ({ ...f, verification_notes: e.target.value }))}
                            className="h-8 text-xs" />
                          <div className="flex gap-1">
                            <Button size="sm" className="flex-1" loading={verifyMutation.isPending}
                              onClick={() => verifyMutation.mutate(h.id)} disabled={!verifyForm.verified_amount}>
                              {t('finance.verifyHandover')}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setVerifyingId(null)}>✕</Button>
                          </div>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => {
                          setVerifyingId(h.id)
                          setVerifyForm({ verified_amount: h.submitted_amount?.toString() ?? '', status: 'VERIFIED', verification_notes: '' })
                        }}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Verify
                        </Button>
                      )
                    )}
                  </div>
                </div>
              ))}
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
