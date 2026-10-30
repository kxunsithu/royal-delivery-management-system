import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import financeService from '@/services/financeService'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DollarSign, Receipt, ArrowRightLeft, TrendingUp, ArrowRight } from 'lucide-react'
import { formatCurrency } from '@/utils/helpers'

export default function FinancePage() {
  const { t, i18n } = useTranslation()

  const { data: summary } = useQuery({
    queryKey: ['finance-summary'],
    queryFn: () => financeService.summary().then(r => r.data.data),
  })

  const s = summary as any

  const tiles = [
    {
      title: t('finance.deliveryFees'),
      value: s ? formatCurrency(s.delivery_fees_collected, i18n.language) : '—',
      icon: DollarSign,
      color: 'text-primary bg-primary/10 border-primary/20',
      href: '/finance/payments',
    },
    {
      title: 'COD Collected',
      value: s ? formatCurrency(s.cod_collected, i18n.language) : '—',
      icon: TrendingUp,
      color: 'text-success bg-success/10 border-success/20',
      href: '/finance/payments',
    },
    {
      title: t('finance.expenses'),
      value: s ? formatCurrency(s.total_expenses, i18n.language) : '—',
      icon: Receipt,
      color: 'text-destructive bg-destructive/10 border-destructive/20',
      href: '/finance/expenses',
    },
    {
      title: t('finance.cashHandovers'),
      value: s ? `${s.pending_handovers_count} pending` : '—',
      icon: ArrowRightLeft,
      color: 'text-warning bg-warning/10 border-warning/20',
      href: '/finance/handovers',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-foreground text-2xl font-bold">{t('finance.title')}</h1>
        {s && <p className="text-secondary text-sm mt-1">Period: {s.period?.from} → {s.period?.to}</p>}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map(tile => (
          <Link key={tile.href + tile.title} to={tile.href}>
            <Card className="hover:border-primary/40 transition-colors cursor-pointer">
              <CardContent className="pt-5">
                <div className={`w-9 h-9 rounded border flex items-center justify-center mb-3 ${tile.color}`}>
                  <tile.icon className="w-4 h-4" />
                </div>
                <p className="text-secondary text-sm">{tile.title}</p>
                <p className="text-foreground text-xl font-bold mt-1">{tile.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {s && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[
            ['Net Income (this month)', formatCurrency(s.net_income, i18n.language), 'text-primary'],
            ['Pending Payments', formatCurrency(s.pending_payments, i18n.language), 'text-warning'],
          ].map(([k, v, c]) => (
            <Card key={k}>
              <CardContent className="pt-5 flex items-center justify-between">
                <p className="text-secondary text-sm">{k}</p>
                <p className={`text-xl font-bold ${c}`}>{v}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: t('finance.payments'), desc: 'View all collected payments', href: '/finance/payments', icon: DollarSign },
          { title: t('finance.expenses'), desc: 'Manage office expenses', href: '/finance/expenses', icon: Receipt },
          { title: t('finance.cashHandovers'), desc: 'Submit & verify cash handovers', href: '/finance/handovers', icon: ArrowRightLeft },
        ].map(item => (
          <Link key={item.href} to={item.href}>
            <Card className="hover:border-primary/40 transition-colors cursor-pointer h-full">
              <CardContent className="pt-5 flex items-center justify-between">
                <div>
                  <p className="text-foreground font-semibold">{item.title}</p>
                  <p className="text-secondary text-xs mt-1">{item.desc}</p>
                </div>
                <item.icon className="w-5 h-5 text-secondary" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
