// Re-uses RegisterParcelPage logic but prefills from existing parcel
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import parcelService from '@/services/parcelService'
import dashboardService from '@/services/dashboardService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { getErrorMessage, getValidationErrors } from '@/utils/helpers'
import { queryClient } from '@/lib/queryClient'

export default function EditParcelPage() {
  const { id } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const { data: parcel } = useQuery({
    queryKey: ['parcel', id],
    queryFn: () => parcelService.get(Number(id)).then(r => r.data.data),
  })

  const { data: areasData } = useQuery({
    queryKey: ['delivery-areas'],
    queryFn: () => dashboardService.deliveryAreas().then(r => r.data.data),
  })

  const [form, setForm] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (parcel) {
      setForm({
        recipient_name: parcel.recipient_name ?? '',
        recipient_phone: parcel.recipient_phone ?? '',
        delivery_address: parcel.delivery_address ?? '',
        delivery_area_id: parcel.delivery_area?.id?.toString() ?? '',
        description: parcel.description ?? '',
        quantity: parcel.quantity?.toString() ?? '1',
        weight: parcel.weight?.toString() ?? '',
        notes: parcel.notes ?? '',
        delivery_fee: parcel.delivery_fee?.toString() ?? '',
        cod_amount: parcel.cod_amount?.toString() ?? '0',
        is_cod: parcel.is_cod ?? false,
        condition: parcel.condition ?? 'GOOD',
        priority: parcel.priority ?? 'NORMAL',
        damage_description: parcel.damage_description ?? '',
        sender_name: parcel.sender_name ?? '',
        sender_phone: parcel.sender_phone ?? '',
      })
    }
  }, [parcel])

  const mutation = useMutation({
    mutationFn: (data: any) => parcelService.update(Number(id), data),
    onSuccess: () => {
      toast({ title: t('parcels.updatedSuccess'), variant: 'success' as any })
      queryClient.invalidateQueries({ queryKey: ['parcel', id] })
      navigate(`/parcels/${id}`)
    },
    onError: (err: any) => {
      const ve = getValidationErrors(err)
      if (Object.keys(ve).length > 0) {
        const mapped: Record<string, string> = {}
        Object.entries(ve).forEach(([k, v]) => { mapped[k] = Array.isArray(v) ? v[0] : String(v) })
        setErrors(mapped)
      } else {
        toast({ title: getErrorMessage(err), variant: 'destructive' })
      }
    },
  })

  const set = (key: string, value: any) => {
    setForm(f => ({ ...f, [key]: value }))
    setErrors(e => { const n = { ...e }; delete n[key]; return n })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: any = {
      ...form,
      quantity: parseInt(form.quantity),
      delivery_fee: parseFloat(form.delivery_fee),
      cod_amount: parseFloat(form.cod_amount),
    }
    if (form.delivery_area_id) payload.delivery_area_id = parseInt(form.delivery_area_id)
    if (form.weight) payload.weight = parseFloat(form.weight)
    mutation.mutate(payload)
  }

  if (!parcel) return <div className="text-secondary py-16 text-center">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/parcels/${id}`)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-foreground text-2xl font-bold">{t('parcels.editParcel')}</h1>
          <p className="text-secondary text-sm font-mono">{parcel.tracking_number}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* LEFT — Recipient & Delivery */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Recipient &amp; Delivery</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              {[
                ['recipient_name', t('parcels.recipientName'), 'text'],
                ['recipient_phone', t('parcels.recipientPhone'), 'text'],
                ['delivery_address', t('parcels.deliveryAddress'), 'text'],
              ].map(([k, lbl, type]) => (
                <div key={k} className="space-y-1.5 col-span-2 sm:col-span-1 last:col-span-2">
                  <Label>{lbl}</Label>
                  <Input type={type} value={form[k] ?? ''} onChange={e => set(k, e.target.value)}
                    className={errors[k] ? 'border-destructive' : ''} />
                  {errors[k] && <p className="text-destructive text-xs">{errors[k]}</p>}
                </div>
              ))}
              <div className="space-y-1.5 col-span-2">
                <Label>{t('parcels.deliveryArea')}</Label>
                <select
                  value={form.delivery_area_id ?? ''}
                  onChange={e => set('delivery_area_id', e.target.value)}
                  className="flex h-9 w-full rounded border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">-- None --</option>
                  {(areasData as any[] ?? []).map((a: any) => (
                    <option key={a.id} value={a.id}>
                      {i18n.language === 'my' && a.name_mm ? a.name_mm : a.name}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* RIGHT — Parcel Details */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Parcel Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              {[
                ['description', t('parcels.parcelDescription'), 'text'],
                ['quantity', t('parcels.quantity'), 'number'],
                ['weight', t('parcels.weight'), 'number'],
                ['delivery_fee', t('parcels.deliveryFee'), 'number'],
              ].map(([k, lbl, type]) => (
                <div key={k} className="space-y-1.5">
                  <Label>{lbl}</Label>
                  <Input type={type} value={form[k] ?? ''} onChange={e => set(k, e.target.value)} />
                </div>
              ))}
              <div className="space-y-1.5">
                <Label>{t('parcels.priority')}</Label>
                <select value={form.priority ?? 'NORMAL'} onChange={e => set('priority', e.target.value)}
                  className="flex h-9 w-full rounded border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                  {['NORMAL','HIGH','URGENT'].map(v => <option key={v} value={v}>{t(`parcels.priorities.${v}`)}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>{t('parcels.condition')}</Label>
                <select value={form.condition ?? 'GOOD'} onChange={e => set('condition', e.target.value)}
                  className="flex h-9 w-full rounded border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                  {['GOOD','DAMAGED','MISSING'].map(v => <option key={v} value={v}>{t(`parcels.conditions.${v}`)}</option>)}
                </select>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>{t('parcels.parcelNotes')}</Label>
                <Input value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" type="button" onClick={() => navigate(`/parcels/${id}`)}>{t('common.cancel')}</Button>
          <Button type="submit" loading={mutation.isPending}>{t('common.save')}</Button>
        </div>
      </form>
    </div>
  )
}
