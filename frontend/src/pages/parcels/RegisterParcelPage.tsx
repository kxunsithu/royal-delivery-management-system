import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation } from '@tanstack/react-query'
import parcelService from '@/services/parcelService'
import dashboardService from '@/services/dashboardService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Package, User, DollarSign, ImagePlus, X, Images } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { getErrorMessage, getValidationErrors } from '@/utils/helpers'

interface LocalImage {
  file: File
  preview: string
  id: string
}

export default function RegisterParcelPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    tracking_number: '',
    sender_name: '',
    sender_phone: '',
    recipient_name: '',
    recipient_phone: '',
    delivery_address: '',
    delivery_area_id: '',
    description: '',
    quantity: '1',
    weight: '',
    notes: '',
    delivery_fee: '',
    cod_amount: '0',
    is_cod: false,
    condition: 'GOOD',
    priority: 'NORMAL',
    received_at: '',
    damage_description: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Image state
  const [localImages, setLocalImages] = useState<LocalImage[]>([])
  const [imageDragOver, setImageDragOver] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const { data: areasData } = useQuery({
    queryKey: ['delivery-areas'],
    queryFn: () => dashboardService.deliveryAreas().then(r => r.data.data),
  })
  const areas = areasData ?? []

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (arr.length === 0) { toast({ title: 'Please select image files only', variant: 'destructive' }); return }
    const combined = [...localImages, ...arr.map(file => ({ file, preview: URL.createObjectURL(file), id: Math.random().toString(36).slice(2) }))]
    if (combined.length > 10) { toast({ title: 'Maximum 10 images allowed', variant: 'destructive' }); return }
    setLocalImages(combined)
  }, [localImages])

  const removeLocalImage = (id: string) => {
    setLocalImages(prev => { const img = prev.find(i => i.id === id); if (img) URL.revokeObjectURL(img.preview); return prev.filter(i => i.id !== id) })
  }

  const mutation = useMutation({
    mutationFn: parcelService.create,
    onSuccess: async (res) => {
      const parcelId = (res.data as any).data.id
      if (localImages.length > 0) {
        setUploadingImages(true)
        try {
          await parcelService.uploadImages(parcelId, localImages.map(i => i.file))
          toast({ title: `Parcel registered with ${localImages.length} image(s)`, variant: 'success' as any })
        } catch {
          toast({ title: 'Parcel saved but image upload failed. You can upload later.', variant: 'destructive' })
        } finally {
          setUploadingImages(false)
          localImages.forEach(i => URL.revokeObjectURL(i.preview))
        }
      } else {
        toast({ title: t('parcels.registeredSuccess'), variant: 'success' as any })
      }
      navigate(`/parcels/${parcelId}`)
    },
    onError: (err: any) => {
      const ve = getValidationErrors(err)
      if (Object.keys(ve).length > 0) {
        const mapped: Record<string, string> = {}
        Object.entries(ve).forEach(([k, v]) => { mapped[k] = Array.isArray(v) ? v[0] : String(v) })
        setErrors(mapped)
        toast({ title: t('errors.validationFailed'), variant: 'destructive' })
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
      recipient_name: form.recipient_name,
      recipient_phone: form.recipient_phone,
      delivery_address: form.delivery_address,
      delivery_fee: parseFloat(form.delivery_fee) || 0,
      quantity: parseInt(form.quantity) || 1,
      is_cod: form.is_cod,
      cod_amount: parseFloat(form.cod_amount) || 0,
      condition: form.condition,
      priority: form.priority,
    }
    if (form.tracking_number)    payload.tracking_number    = form.tracking_number
    if (form.sender_name)        payload.sender_name        = form.sender_name
    if (form.sender_phone)       payload.sender_phone       = form.sender_phone
    if (form.delivery_area_id)   payload.delivery_area_id   = parseInt(form.delivery_area_id)
    if (form.description)        payload.description        = form.description
    if (form.weight)             payload.weight             = parseFloat(form.weight)
    if (form.notes)              payload.notes              = form.notes
    if (form.received_at)        payload.received_at        = form.received_at
    if (form.damage_description) payload.damage_description = form.damage_description
    mutation.mutate(payload)
  }

  const isBusy = mutation.isPending || uploadingImages

  // Reusable field wrapper
  const Field = ({ label, error, children, className = '' }: { label: string; error?: string; children: React.ReactNode; className?: string }) => (
    <div className={`space-y-1.5 ${className}`}>
      <Label className="text-xs text-secondary">{label}</Label>
      {children}
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  )

  const selectCls = 'flex h-9 w-full rounded border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring'

  return (
    <div className="space-y-5">
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/parcels')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-foreground text-2xl font-bold">{t('parcels.register')}</h1>
          <p className="text-secondary text-sm">{t('parcels.parcelList')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── 2-column main grid ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

          {/* ── LEFT COLUMN ── */}
          <div className="space-y-5">

            {/* Sender Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-foreground/80">
                  <Package className="w-4 h-4 text-primary" />
                  Sender Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <Field label={`${t('parcels.trackingNumber')} (${t('common.optional')})`} error={errors.tracking_number} className="col-span-2">
                  <Input
                    placeholder={t('parcels.autoGenerate')}
                    value={form.tracking_number}
                    onChange={e => set('tracking_number', e.target.value)}
                    className={errors.tracking_number ? 'border-destructive' : ''}
                  />
                </Field>
                <Field label={`${t('parcels.senderName')} (${t('common.optional')})`}>
                  <Input value={form.sender_name} onChange={e => set('sender_name', e.target.value)} />
                </Field>
                <Field label={`${t('parcels.senderPhone')} (${t('common.optional')})`}>
                  <Input value={form.sender_phone} onChange={e => set('sender_phone', e.target.value)} />
                </Field>
              </CardContent>
            </Card>

            {/* Recipient Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-foreground/80">
                  <User className="w-4 h-4 text-primary" />
                  Recipient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <Field label={t('parcels.recipientName')} error={errors.recipient_name}>
                  <Input
                    value={form.recipient_name}
                    onChange={e => set('recipient_name', e.target.value)}
                    required
                    className={errors.recipient_name ? 'border-destructive' : ''}
                  />
                </Field>
                <Field label={t('parcels.recipientPhone')} error={errors.recipient_phone}>
                  <Input
                    value={form.recipient_phone}
                    onChange={e => set('recipient_phone', e.target.value)}
                    required
                    className={errors.recipient_phone ? 'border-destructive' : ''}
                  />
                </Field>
                <Field label={t('parcels.deliveryAddress')} error={errors.delivery_address} className="col-span-2">
                  <Input
                    value={form.delivery_address}
                    onChange={e => set('delivery_address', e.target.value)}
                    required
                    className={errors.delivery_address ? 'border-destructive' : ''}
                  />
                </Field>
                <Field label={`${t('parcels.deliveryArea')} (${t('common.optional')})`} className="col-span-2">
                  <select value={form.delivery_area_id} onChange={e => set('delivery_area_id', e.target.value)} className={selectCls}>
                    <option value="">-- {t('common.none')} --</option>
                    {areas.map((a: any) => (
                      <option key={a.id} value={a.id}>
                        {i18n.language === 'my' && a.name_mm ? a.name_mm : a.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </CardContent>
            </Card>

          </div>{/* end LEFT */}

          {/* ── RIGHT COLUMN ── */}
          <div className="space-y-5">

            {/* Parcel Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-foreground/80">
                  <Package className="w-4 h-4 text-primary" />
                  Parcel Details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <Field label={`${t('parcels.parcelDescription')} (${t('common.optional')})`} className="col-span-2">
                  <Input value={form.description} onChange={e => set('description', e.target.value)} />
                </Field>
                <Field label={t('parcels.quantity')}>
                  <Input type="number" min="1" value={form.quantity} onChange={e => set('quantity', e.target.value)} />
                </Field>
                <Field label={`${t('parcels.weight')} kg (${t('common.optional')})`}>
                  <Input type="number" min="0" step="0.1" value={form.weight} onChange={e => set('weight', e.target.value)} placeholder="0.0" />
                </Field>
                <Field label={t('parcels.condition')}>
                  <select value={form.condition} onChange={e => set('condition', e.target.value)} className={selectCls}>
                    <option value="GOOD">{t('parcels.conditions.GOOD')}</option>
                    <option value="DAMAGED">{t('parcels.conditions.DAMAGED')}</option>
                    <option value="MISSING">{t('parcels.conditions.MISSING')}</option>
                  </select>
                </Field>
                <Field label={t('parcels.priority')}>
                  <select value={form.priority} onChange={e => set('priority', e.target.value)} className={selectCls}>
                    <option value="NORMAL">{t('parcels.priorities.NORMAL')}</option>
                    <option value="HIGH">{t('parcels.priorities.HIGH')}</option>
                    <option value="URGENT">{t('parcels.priorities.URGENT')}</option>
                  </select>
                </Field>
                {form.condition === 'DAMAGED' && (
                  <Field label={t('parcels.damageDescription')} className="col-span-2">
                    <Input value={form.damage_description} onChange={e => set('damage_description', e.target.value)} />
                  </Field>
                )}
                <Field label={`${t('parcels.parcelNotes')} (${t('common.optional')})`} className="col-span-2">
                  <Input value={form.notes} onChange={e => set('notes', e.target.value)} />
                </Field>
              </CardContent>
            </Card>

            {/* Fee & Payment */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-foreground/80">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Fee &amp; Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <Field label={t('parcels.deliveryFee')} error={errors.delivery_fee}>
                  <Input
                    type="number" min="0" step="100"
                    value={form.delivery_fee}
                    onChange={e => set('delivery_fee', e.target.value)}
                    placeholder="5000"
                    required
                    className={errors.delivery_fee ? 'border-destructive' : ''}
                  />
                </Field>
                <Field label={`${t('parcels.receivedAt')} (${t('common.optional')})`}>
                  <Input type="datetime-local" value={form.received_at} onChange={e => set('received_at', e.target.value)} />
                </Field>
                <div className="col-span-2 flex items-center gap-3 py-1">
                  <input
                    type="checkbox"
                    id="is_cod"
                    checked={form.is_cod}
                    onChange={e => set('is_cod', e.target.checked)}
                    className="w-4 h-4 rounded border-border bg-muted accent-primary"
                  />
                  <Label htmlFor="is_cod">{t('parcels.isCOD')}</Label>
                </div>
                {form.is_cod && (
                  <Field label={t('parcels.codAmount')} error={errors.cod_amount} className="col-span-2">
                    <Input
                      type="number" min="0" step="100"
                      value={form.cod_amount}
                      onChange={e => set('cod_amount', e.target.value)}
                      placeholder="0"
                    />
                  </Field>
                )}
              </CardContent>
            </Card>

          </div>{/* end RIGHT */}
        </div>{/* end 2-col grid */}

        {/* ── Images — full width ────────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2 text-foreground/80">
                <Images className="w-4 h-4 text-primary" />
                Parcel Images
                <span className="text-xs font-normal text-secondary">(optional)</span>
                {localImages.length > 0 && (
                  <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded font-normal">
                    {localImages.length}/10
                  </span>
                )}
              </CardTitle>
              {localImages.length > 0 && localImages.length < 10 && (
                <Button type="button" variant="outline" size="sm" onClick={() => imageInputRef.current?.click()}>
                  <ImagePlus className="w-3.5 h-3.5" />
                  Add More
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Drop zone */}
            {localImages.length < 10 && (
              <div
                className={`border-2 border-dashed rounded px-6 py-5 flex items-center gap-4 cursor-pointer transition-all ${
                  imageDragOver ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/40 hover:bg-muted/40'
                }`}
                onClick={() => imageInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setImageDragOver(true) }}
                onDragLeave={() => setImageDragOver(false)}
                onDrop={e => { e.preventDefault(); setImageDragOver(false); addFiles(e.dataTransfer.files) }}
              >
                <div className="w-9 h-9 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <ImagePlus className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-foreground text-sm font-medium">Click or drag &amp; drop images here</p>
                  <p className="text-secondary text-xs mt-0.5">JPEG, PNG, WebP · max 5 MB each · up to 10 images</p>
                </div>
              </div>
            )}

            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/webp"
              multiple
              className="hidden"
              onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = '' }}
            />

            {/* Preview grid — 6 columns to use the full width nicely */}
            {localImages.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                {localImages.map(img => (
                  <div key={img.id} className="group relative aspect-square rounded overflow-hidden border border-border bg-muted">
                    <img src={img.preview} alt={img.file.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                    <button
                      type="button"
                      onClick={() => removeLocalImage(img.id)}
                      className="absolute top-1 right-1 w-5 h-5 rounded bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-[9px] truncate">{img.file.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Actions ───────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 pb-4">
          <Button variant="outline" type="button" onClick={() => navigate('/parcels')}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={isBusy} disabled={isBusy}>
            {uploadingImages
              ? `Uploading ${localImages.length} image(s)…`
              : mutation.isPending
              ? (t('common.saving') || 'Saving…')
              : localImages.length > 0
              ? `${t('parcels.register')} + ${localImages.length} image(s)`
              : t('parcels.register')}
          </Button>
        </div>

      </form>
    </div>
  )
}
