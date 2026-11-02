import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/AuthContext'
import dashboardService from '@/services/dashboardService'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Package, Truck, CheckCircle2, XCircle, ArrowUpRight,
  Users, TrendingUp, AlertTriangle, Clock
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts'
import { formatDate } from '@/utils/helpers'

function StatCard({
  title, value, icon: Icon, trend, color = 'primary', sub
}: {
  title: string
  value: string | number
  icon: React.ElementType
  trend?: string
  color?: 'primary' | 'success' | 'destructive' | 'warning' | 'blue'
  sub?: string
}) {
  const colorMap = {
    primary:     'bg-primary/10 text-primary border-primary/20',
    success:     'bg-success/10 text-success border-success/20',
    destructive: 'bg-destructive/10 text-destructive border-destructive/20',
    warning:     'bg-warning/10 text-warning border-warning/20',
    blue:        'bg-blue-500/10 text-blue-400 border-blue-500/20',
  }

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-secondary text-sm">{title}</p>
            <p className="text-foreground text-2xl font-bold">{value}</p>
            {sub && <p className="text-secondary text-xs">{sub}</p>}
          </div>
          <div className={`w-10 h-10 rounded border flex items-center justify-center flex-shrink-0 ${colorMap[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        {trend && (
          <div className="mt-3 flex items-center gap-1 text-xs text-success">
            <ArrowUpRight className="w-3 h-3" />
            <span>{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-background-surface border border-border rounded p-3 text-xs">
        <p className="text-secondary mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function DashboardPage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardService.get().then(r => r.data.data),
    refetchInterval: 60_000,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-background-surface border border-border rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <AlertTriangle className="w-10 h-10 text-warning mx-auto" />
          <p className="text-foreground font-medium">{t('dashboard.failedToLoad')}</p>
          <p className="text-secondary text-sm">{t('dashboard.refreshPage')}</p>
        </div>
      </div>
    )
  }

  // ── Admin / CEO dashboard ──────────────────────────────────────────────────
  if (data.role === 'admin') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-foreground text-2xl font-bold">{t('dashboard.title')}</h1>
          <p className="text-secondary text-sm mt-1">
            {t('dashboard.welcome', { name: user?.name })}
          </p>
        </div>

        {/* Parcel stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard title={t('dashboard.receivedToday')} value={data.parcel_stats.today} icon={Package} color="blue" />
          <StatCard title={t('dashboard.inProgress')} value={data.parcel_stats.in_progress} icon={Clock} color="warning" />
          <StatCard title={t('dashboard.delivered')} value={data.parcel_stats.delivered} icon={CheckCircle2} color="success" />
          <StatCard title={t('dashboard.failed')} value={data.parcel_stats.failed} icon={XCircle} color="destructive" />
          <StatCard title={t('dashboard.returned')} value={data.parcel_stats.returned} icon={Truck} color="warning" />
          <StatCard title={t('dashboard.successRate')} value={`${data.parcel_stats.delivery_success_rate}%`} icon={TrendingUp} color="success" />
        </div>


        {/* Trend chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{t('dashboard.deliveryTrends')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data.trends} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="colorDelivered" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C7FF24" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#C7FF24" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF4444" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#FF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2F332B" />
                  <XAxis dataKey="date" tick={{ fill: '#888B82', fontSize: 11 }} tickLine={false} axisLine={false}
                    tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fill: '#888B82', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="delivered" name="Delivered" stroke="#C7FF24" strokeWidth={2} fill="url(#colorDelivered)" />
                  <Area type="monotone" dataKey="received" name="Received" stroke="#60A5FA" strokeWidth={2} fill="none" strokeDasharray="4 4" />
                  <Area type="monotone" dataKey="failed" name="Failed" stroke="#FF4444" strokeWidth={1.5} fill="url(#colorFailed)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.parcelStatus')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: t('dashboard.inProgress'), value: data.parcel_stats.in_progress, color: 'bg-warning' },
                  { label: t('dashboard.delivered'), value: data.parcel_stats.delivered, color: 'bg-success' },
                  { label: t('dashboard.failed'), value: data.parcel_stats.failed, color: 'bg-destructive' },
                  { label: t('dashboard.returned'), value: data.parcel_stats.returned, color: 'bg-orange-400' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded ${item.color}`} />
                      <span className="text-secondary">{item.label}</span>
                    </div>
                    <span className="text-foreground font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm">
                <span className="text-secondary">{t('common.total')}</span>
                <span className="text-foreground font-bold">{data.parcel_stats.total}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ── Manager dashboard ──────────────────────────────────────────────────────
  if (data.role === 'manager') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-foreground text-2xl font-bold">{t('dashboard.title')}</h1>
          <p className="text-secondary text-sm mt-1">{t('dashboard.welcome', { name: user?.name })}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title={t('dashboard.receivedToday')} value={data.today_received} icon={Package} color="blue" />
          <StatCard title={t('dashboard.readyForDelivery')} value={data.parcel_stats.ready_for_delivery} icon={Clock} color="warning" />
          <StatCard title={t('dashboard.assigned')} value={data.parcel_stats.assigned} icon={Truck} color="primary" />
          <StatCard title={t('dashboard.outForDelivery')} value={data.parcel_stats.out_for_delivery} icon={Truck} color="success" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title={t('status.RECEIVED_AT_MYAWADDY')} value={data.parcel_stats.received} icon={Package} color="blue" />
          <StatCard title={t('status.VERIFIED')} value={data.parcel_stats.verified} icon={CheckCircle2} color="success" />
          <StatCard title={t('dashboard.failed')} value={data.parcel_stats.failed} icon={XCircle} color="destructive" />
          <StatCard title={t('dashboard.returnToOffice')} value={data.parcel_stats.return_to_office} icon={ArrowUpRight} color="warning" />
        </div>

        <Card>
          <CardHeader><CardTitle>{t('dashboard.staffWorkload')}</CardTitle></CardHeader>
          <CardContent>
            {data.staff_workload?.length === 0 ? (
              <p className="text-secondary text-sm">{t('common.noData')}</p>
            ) : (
              <div className="space-y-3">
                {data.staff_workload?.map((w: any) => (
                  <div key={w.staff_name} className="flex items-center justify-between">
                    <span className="text-foreground text-sm">{w.staff_name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded overflow-hidden">
                        <div
                          className="h-full bg-primary rounded"
                          style={{ width: `${Math.min(100, (w.active_count / 10) * 100)}%` }}
                        />
                      </div>
                      <span className="text-primary text-sm font-medium w-6 text-right">{w.active_count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Accountant dashboard — removed (financial features removed)
  // Fallthrough to delivery staff / default view

  // ── Delivery Staff dashboard ───────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-foreground text-2xl font-bold">{t('dashboard.title')}</h1>
        <p className="text-secondary text-sm mt-1">{t('dashboard.welcome', { name: user?.name })}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard title={t('dashboard.pendingDeliveries')} value={data.assignments?.active ?? 0} icon={Package} color="warning" />
        <StatCard title={t('dashboard.completedToday')} value={data.assignments?.completed_today ?? 0} icon={CheckCircle2} color="success" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard title="Attempts Today" value={data.attempts_today ?? 0} icon={Truck} color="blue" />
        <StatCard title={t('dashboard.failedToday')} value={data.failed_today ?? 0} icon={XCircle} color="destructive" />
      </div>
    </div>
  )
}
