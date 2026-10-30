import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, Package, Users } from 'lucide-react'

export default function ReportsPage() {
  const { t } = useTranslation()

  const reportCards = [
    { title: t('reports.parcelSummary'), desc: 'Summary of all parcels by status and area', icon: Package, color: 'text-primary bg-primary/10 border-primary/20' },
    { title: t('reports.deliveryPerformance'), desc: 'Success rates, failed deliveries analysis', icon: TrendingUp, color: 'text-success bg-success/10 border-success/20' },
    { title: t('reports.staffPerformance'), desc: 'Per-staff delivery stats and rankings', icon: Users, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    { title: t('reports.financialReport'), desc: 'Revenue, expenses, and cash flow', icon: BarChart3, color: 'text-warning bg-warning/10 border-warning/20' },
    { title: t('reports.failedDeliveries'), desc: 'Reasons and patterns in failed deliveries', icon: Package, color: 'text-destructive bg-destructive/10 border-destructive/20' },
    { title: t('reports.cashHandoverReport'), desc: 'Cash handover audit trail and discrepancies', icon: BarChart3, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-foreground text-2xl font-bold">{t('reports.title')}</h1>
        <p className="text-secondary text-sm mt-1">Business intelligence and analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportCards.map(report => (
          <Card key={report.title} className="hover:border-primary/40 transition-colors cursor-pointer group">
            <CardContent className="pt-5">
              <div className={`w-10 h-10 rounded border flex items-center justify-center mb-4 ${report.color}`}>
                <report.icon className="w-5 h-5" />
              </div>
              <h3 className="text-foreground font-semibold mb-1 group-hover:text-primary transition-colors">{report.title}</h3>
              <p className="text-secondary text-sm">{report.desc}</p>
              <div className="mt-4 text-primary text-xs font-medium">
                Coming soon →
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="py-10 text-center">
          <BarChart3 className="w-12 h-12 text-secondary mx-auto mb-3" />
          <p className="text-foreground font-medium">Advanced Reports</p>
          <p className="text-secondary text-sm mt-1">
            Full reporting with date ranges, export to CSV/PDF is available via the API.
            <br />UI implementation coming in the next phase.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
