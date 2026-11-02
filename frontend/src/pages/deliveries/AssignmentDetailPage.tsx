import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import deliveryService from '@/services/deliveryService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, MapPin, Phone, Package, Clock, CheckCircle2, XCircle, ExternalLink } from 'lucide-react'
import { getParcelStatusClass, formatDate, formatDateTime, buildGoogleMapsUrl } from '@/utils/helpers'

export default function AssignmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const { data: assignment, isLoading } = useQuery({
    queryKey: ['assignment', id],
    queryFn: () => deliveryService.get(Number(id)).then(r => r.data.data),
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 bg-background-surface border border-border rounded animate-pulse" />
        ))}
      </div>
    )
  }

  if (!assignment) return <div className="text-secondary py-16 text-center">{t('common.noData')}</div>

  const a = assignment as any
  const p = a.parcel

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-foreground text-2xl font-bold">{t('deliveries.title')}</h1>
          {p && <p className="text-primary font-mono text-sm">{p.tracking_number}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Parcel info */}
        {p && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Package className="w-4 h-4 text-primary" />{t('parcels.parcel')}</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded ${getParcelStatusClass(p.status)}`}>{t(`status.${p.status}`)}</span>
                <span className="text-secondary">{p.tracking_number}</span>
              </div>
              <Link to={`/parcels/${p.id}`} className="text-primary text-xs hover:underline">
                {t('parcels.viewFullDetails')}
              </Link>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-secondary" />
                <a href={`tel:${p.recipient_phone}`} className="text-primary">{p.recipient_phone}</a>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-secondary mt-0.5" />
                <div>
                  <p className="text-foreground">{p.delivery_address}</p>
                  {p.delivery_area && <p className="text-secondary text-xs">{p.delivery_area.name}</p>}
                </div>
              </div>
              <a href={buildGoogleMapsUrl(p.delivery_address)} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-primary text-xs hover:underline">
                <ExternalLink className="w-3 h-3" />
                {t('deliveries.openInMaps')}
              </a>
            </CardContent>
          </Card>
        )}

        {/* Assignment info */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary" />{t('deliveries.assignment')}</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              ['Staff', a.staff?.name ?? '-'],
              ['Assigned by', a.assigned_by?.name ?? '-'],
              ['Status', t(`deliveries.statuses.${a.status}`)],
              [t('deliveries.assignedAt'), formatDate(a.assigned_at, i18n.language)],
              [t('deliveries.completedAt'), a.completed_at ? formatDate(a.completed_at, i18n.language) : '-'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-border/40 pb-2 last:border-0">
                <span className="text-secondary">{k}</span>
                <span className="text-foreground">{v}</span>
              </div>
            ))}
            {a.notes && <p className="text-secondary text-xs">{t('common.notes')}: {a.notes}</p>}
          </CardContent>
        </Card>
      </div>

      {/* Delivery attempts */}
      {a.delivery_attempts && a.delivery_attempts.length > 0 && (
        <Card>
          <CardHeader><CardTitle>{t('deliveries.deliveryAttempts')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {a.delivery_attempts.map((da: any) => (
              <div key={da.id} className="flex items-start gap-3 p-4 bg-muted rounded">
                <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${
                  da.result === 'DELIVERED' ? 'bg-success/15' : 'bg-destructive/15'
                }`}>
                  {da.result === 'DELIVERED'
                    ? <CheckCircle2 className="w-4 h-4 text-success" />
                    : <XCircle className="w-4 h-4 text-destructive" />
                  }
                </div>
                <div className="flex-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground font-medium">{da.result}</span>
                    <span className="text-secondary text-xs">{formatDateTime(da.attempted_at, i18n.language)}</span>
                  </div>
                  {da.failure_reason && <p className="text-secondary text-xs mt-1">{t(`deliveries.failureReasons.${da.failure_reason}`)}</p>}
                  {da.recipient_name && <p className="text-secondary text-xs">{t('deliveries.receivedBy', { name: da.recipient_name })}</p>}
                  {da.notes && <p className="text-secondary text-xs mt-1">{da.notes}</p>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
