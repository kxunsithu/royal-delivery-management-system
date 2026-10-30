import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import financeService from '@/services/financeService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, RefreshCw, Receipt, Ban } from 'lucide-react'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { toast } from '@/hooks/use-toast'
import { queryClient } from '@/lib/queryClient'

export default function ExpensesPage() {
  const { t, i18n } = useTranslation()
  const [page, setPage] = useState(1)
  const [showAddForm, setShowAddForm] = useState(false)
  const [voidingId, setVoidingId] = useState<number | null>(null)
  const [voidReason, setVoidReason] = useState('')
  const [form, setForm] = useState({ category: '', description: '', amount: '', expense_date: '' })

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['expenses', page],
    queryFn: () => financeService.expenses({ page, per_page: 20 }).then(r => r.data),
  } as any)

  const expenses = (data as any)?.data ?? []
  const meta = (data as any)?.meta

  const createMutation = useMutation({
    mutationFn: () => financeService.createExpense({
      category: form.category,
      description: form.description,
      amount: parseFloat(form.amount),
      expense_date: form.expense_date,
    }),
    onSuccess: () => {
      toast({ title: t('finance.expenseAdded'), variant: 'success' as any })
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      setShowAddForm(false)
      setForm({ category: '', description: '', amount: '', expense_date: '' })
    },
    onError: (err: any) => toast({ title: err?.response?.data?.message ?? 'Failed', variant: 'destructive' }),
  })

  const voidMutation = useMutation({
    mutationFn: (id: number) => financeService.voidExpense(id, voidReason),
    onSuccess: () => {
      toast({ title: t('finance.expenseVoided'), variant: 'success' as any })
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      setVoidingId(null)
      setVoidReason('')
    },
    onError: (err: any) => toast({ title: err?.response?.data?.message ?? 'Failed', variant: 'destructive' }),
  })

  const CATEGORIES = ['Fuel', 'Office', 'Maintenance', 'Utilities', 'Staff', 'Other']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-bold">{t('finance.expenses')}</h1>
          <p className="text-secondary text-sm mt-1">{meta?.total ?? 0} records · Total: {formatCurrency((data as any)?.meta?.total_amount ?? 0, i18n.language)}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => refetch()} disabled={isRefetching}>
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="w-4 h-4" />
            {t('finance.addExpense')}
          </Button>
        </div>
      </div>

      {/* Add form */}
      {showAddForm && (
        <Card className="border-primary/30">
          <CardHeader><CardTitle className="text-base">{t('finance.addExpense')}</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{t('finance.expenseCategory')}</Label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full rounded border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">-- Select --</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>{t('finance.expenseDate')}</Label>
              <Input type="date" value={form.expense_date} onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>{t('finance.expenseDescription')}</Label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>{t('finance.expenseAmount')}</Label>
              <Input type="number" min="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" />
            </div>
            <div className="flex items-end gap-2">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>{t('common.cancel')}</Button>
              <Button
                loading={createMutation.isPending}
                disabled={!form.category || !form.description || !form.amount || !form.expense_date}
                onClick={() => createMutation.mutate()}
              >
                {t('common.save')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expenses list */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <Receipt className="w-12 h-12 text-secondary" />
              <p className="text-foreground font-medium">{t('common.noData')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {[t('finance.expenseDate'), t('finance.expenseCategory'), t('finance.expenseDescription'), t('finance.expenseAmount'), 'By', ''].map(h => (
                      <th key={h} className="text-left text-xs text-secondary font-medium px-5 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((e: any) => (
                    <tr key={e.id} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${e.is_voided ? 'opacity-50' : ''}`}>
                      <td className="px-5 py-3.5">
                        <span className="text-secondary text-sm whitespace-nowrap">{formatDate(e.expense_date, i18n.language)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-foreground text-sm">{e.category}</span>
                      </td>
                      <td className="px-5 py-3.5 max-w-xs">
                        <p className="text-secondary text-sm truncate">{e.description}</p>
                        {e.is_voided && <p className="text-destructive text-xs">Voided: {e.void_reason}</p>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`font-semibold ${e.is_voided ? 'text-secondary line-through' : 'text-foreground'}`}>
                          {formatCurrency(e.amount, i18n.language)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-secondary text-sm">{e.recorded_by?.name ?? '-'}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        {!e.is_voided && (
                          voidingId === e.id ? (
                            <div className="flex items-center gap-1.5">
                              <Input
                                placeholder="Void reason"
                                value={voidReason}
                                onChange={ev => setVoidReason(ev.target.value)}
                                className="h-7 text-xs w-28"
                              />
                              <Button size="icon-sm" variant="destructive" loading={voidMutation.isPending}
                                onClick={() => voidMutation.mutate(e.id)} disabled={!voidReason}>
                                <Ban className="w-3 h-3" />
                              </Button>
                              <Button size="icon-sm" variant="ghost" onClick={() => setVoidingId(null)}>✕</Button>
                            </div>
                          ) : (
                            <Button size="icon-sm" variant="ghost" onClick={() => setVoidingId(e.id)} title={t('finance.voidExpense')}>
                              <Ban className="w-3.5 h-3.5 text-destructive" />
                            </Button>
                          )
                        )}
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
