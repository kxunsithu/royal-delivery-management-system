import { useState, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import parcelService from '@/services/parcelService'
import type { ParcelImageData } from '@/services/parcelService'
import userService from '@/services/userService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ArrowLeft, Edit, MapPin, Phone, User, Package, Clock,
  ExternalLink, Truck, ImagePlus, Trash2, X, ZoomIn,
  ChevronLeft, ChevronRight, Images, Printer
} from 'lucide-react'
import {
  getParcelStatusClass, getPriorityClass, formatDate,
  formatDateTime, formatCurrency, buildGoogleMapsUrl,
} from '@/utils/helpers'
import { useAuth } from '@/features/auth/AuthContext'
import { printParcelReceipt } from '@/utils/printReceipt'
import { toast } from '@/hooks/use-toast'
import { CameraCapture } from '@/components/CameraCapture'
import type { ParcelStatus } from '@/types'
import { queryClient } from '@/lib/queryClient'

const STATUS_TRANSITIONS: Record<ParcelStatus, ParcelStatus[]> = {
  RECEIVED: ['IN_TRANSIT', 'DAMAGED'],
  IN_TRANSIT: ['DELIVERED', 'FAILED'],
  DELIVERED: [],
  FAILED: ['IN_TRANSIT'],
  DAMAGED: [],
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function ParcelDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { hasRole } = useAuth()

  const [showAssign, setShowAssign]         = useState(false)
  const [showStatus, setShowStatus]         = useState(false)
  const [selectedStaff, setSelectedStaff]   = useState('')
  const [assignNotes, setAssignNotes]       = useState('')
  const [selectedStatus, setSelectedStatus] = useState<ParcelStatus | ''>('')
  const [statusReason, setStatusReason]     = useState('')

  // Image gallery state
  const [lightboxIdx, setLightboxIdx]   = useState<number | null>(null)
  const [imageDragOver, setImageDragOver] = useState(false)
  const [deletingId, setDeletingId]     = useState<number | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const { data: parcelData, isLoading } = useQuery({
    queryKey: ['parcel', id],
    queryFn: () => parcelService.get(Number(id)).then(r => r.data.data),
  })

  const { data: staffData } = useQuery({
    queryKey: ['delivery-staff'],
    queryFn: () => userService.deliveryStaff().then(r => r.data.data),
    enabled: showAssign,
  })

  const assignMutation = useMutation({
    mutationFn: () => parcelService.assign(Number(id), parseInt(selectedStaff), assignNotes),
    onSuccess: () => {
      toast({ title: t('parcels.assignedSuccess'), variant: 'success' as any })
      queryClient.invalidateQueries({ queryKey: ['parcel', id] })
      setShowAssign(false)
    },
    onError: (err: any) => toast({ title: err?.response?.data?.message ?? 'Failed', variant: 'destructive' }),
  })

  const statusMutation = useMutation({
    mutationFn: () => parcelService.statusTransition(Number(id), selectedStatus as ParcelStatus, statusReason),
    onSuccess: () => {
      toast({ title: 'Status updated', variant: 'success' as any })
      queryClient.invalidateQueries({ queryKey: ['parcel', id] })
      setShowStatus(false)
    },
    onError: (err: any) => toast({ title: err?.response?.data?.message ?? 'Failed', variant: 'destructive' }),
  })

  const uploadMutation = useMutation({
    mutationFn: (files: File[]) => parcelService.uploadImages(Number(id), files),
    onSuccess: (res) => {
      const count = (res.data as any).data?.length ?? 0
      toast({ title: `${count} image(s) uploaded`, variant: 'success' as any })
      queryClient.invalidateQueries({ queryKey: ['parcel', id] })
    },
    onError: (err: any) => toast({ title: err?.response?.data?.message ?? 'Upload failed', variant: 'destructive' }),
  })

  const deleteImageMutation = useMutation({
    mutationFn: (imageId: number) => parcelService.deleteImage(Number(id), imageId),
    onSuccess: () => {
      toast({ title: 'Image deleted', variant: 'success' as any })
      queryClient.invalidateQueries({ queryKey: ['parcel', id] })
      setLightboxIdx(null)
      setDeletingId(null)
    },
    onError: (err: any) => {
      toast({ title: err?.response?.data?.message ?? 'Delete failed', variant: 'destructive' })
      setDeletingId(null)
    },
  })

  const handleFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (arr.length === 0) {
      toast({ title: 'Please select image files only', variant: 'destructive' })
      return
    }
    if (arr.length > 10) {
      toast({ title: 'Maximum 10 images per upload', variant: 'destructive' })
      return
    }
    uploadMutation.mutate(arr)
  }, [uploadMutation])

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 bg-background-surface border border-border rounded animate-pulse" />
        ))}
      </div>
    )
  }

  if (!parcelData) {
    return <div className="text-secondary text-center py-16">{t('common.noData')}</div>
  }

  const p = parcelData
  const images: ParcelImageData[] = (p as any).images ?? []
  const isTerminal = ['DELIVERED', 'RETURNED_TO_SENDER', 'DAMAGED', 'MISSING'].includes(p.status)
  const canAssign = hasRole(['admin', 'manager']) && ['RECEIVED', 'IN_TRANSIT', 'FAILED'].includes(p.status)
  const possibleTransitions = STATUS_TRANSITIONS[p.status as ParcelStatus] ?? []
  const canChangeStatus = hasRole('admin')
    ? possibleTransitions.length > 0
    : hasRole('manager')
      ? possibleTransitions.length > 0 && p.status !== 'IN_TRANSIT'
      : false
  const canManageImages = (hasRole('admin') || (hasRole('manager') && !isTerminal))
  const canEdit = hasRole('admin') || (hasRole('manager') && !isTerminal)

  const lightboxImage = lightboxIdx !== null ? images[lightboxIdx] : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(hasRole('delivery_staff') ? '/deliveries/my-assignments' : '/parcels')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-foreground text-2xl font-bold font-mono">{p.tracking_number}</h1>
            <span className={`text-xs px-2.5 py-1 rounded ${getParcelStatusClass(p.status as ParcelStatus)}`}>
              {t(`status.${p.status}`)}
            </span>
            <span className={`text-xs px-2.5 py-1 rounded ${getPriorityClass(p.priority as any)}`}>
              {t(`parcels.priorities.${p.priority}`)}
            </span>
          </div>
          <p className="text-secondary text-sm mt-1">
            {t('parcels.receivedAt')}: {formatDateTime(p.received_at ?? '', i18n.language)}
            {p.received_by && ` • ${p.received_by.name}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canChangeStatus && (
            <Button variant="outline" size="sm" onClick={() => setShowStatus(!showStatus)}>
              <Clock className="w-3.5 h-3.5" />
              {t('parcels.changeStatus')}
            </Button>
          )}
          {canAssign && (
            <Button size="sm" onClick={() => setShowAssign(!showAssign)}>
              <Truck className="w-3.5 h-3.5" />
              {p.active_assignment ? t('parcels.reassign') : t('parcels.assign')}
            </Button>
          )}
          {canEdit && (
            <Link to={`/parcels/${id}/edit`}>
              <Button variant="outline" size="icon-sm">
                <Edit className="w-3.5 h-3.5" />
              </Button>
            </Link>
          )}
          <Button variant="outline" size="sm" onClick={() => printParcelReceipt(p, i18n.language)}>
            <Printer className="w-3.5 h-3.5" />
            {t('common.print')}
          </Button>
        </div>
      </div>

      {/* Status change panel */}
      {showStatus && canChangeStatus && (
        <Card className="border-primary/30">
          <CardContent className="pt-5 space-y-3">
            <p className="text-foreground font-medium text-sm">{t('parcels.changeStatus')}</p>
            <div className="flex flex-wrap gap-2">
              {possibleTransitions.map(s => (
                <button
                  key={s}
                  onClick={() => setSelectedStatus(s)}
                  className={`px-3 py-1.5 rounded text-xs transition-all ${
                    selectedStatus === s
                      ? `${getParcelStatusClass(s)} font-medium`
                      : 'bg-muted text-secondary hover:text-foreground'
                  }`}
                >
                  {t(`status.${s}`)}
                </button>
              ))}
            </div>
            {selectedStatus && (
              <Input
                placeholder={t('parcels.reason')}
                value={statusReason}
                onChange={e => setStatusReason(e.target.value)}
              />
            )}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowStatus(false)}>{t('common.cancel')}</Button>
              <Button size="sm" disabled={!selectedStatus} loading={statusMutation.isPending} onClick={() => statusMutation.mutate()}>
                {t('common.confirm')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assign panel */}
      {showAssign && (
        <Card className="border-primary/30">
          <CardContent className="pt-5 space-y-3">
            <p className="text-foreground font-medium text-sm">{t('parcels.assign')}</p>
            <select
              value={selectedStaff}
              onChange={e => setSelectedStaff(e.target.value)}
              className="w-full rounded border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">-- {t('parcels.selectStaff')} --</option>
              {(staffData as any[])?.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name} {s.phone ? `(${s.phone})` : ''}</option>
              ))}
            </select>
            <Input
              placeholder={`${t('parcels.assignmentNotes')} (${t('common.optional')})`}
              value={assignNotes}
              onChange={e => setAssignNotes(e.target.value)}
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowAssign(false)}>{t('common.cancel')}</Button>
              <Button size="sm" disabled={!selectedStaff} loading={assignMutation.isPending} onClick={() => assignMutation.mutate()}>
                {t('parcels.assign')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {/* Sender info */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><User className="w-4 h-4 text-primary" />{t('parcels.senderInfo')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-secondary" />
              <span className="text-foreground">{p.sender_name ?? '-'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-secondary" />
              {p.sender_phone ? (
                <a href={`tel:${p.sender_phone}`} className="text-primary hover:underline">{p.sender_phone}</a>
              ) : (
                <span className="text-secondary">-</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recipient info */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><User className="w-4 h-4 text-primary" />{t('parcels.recipientName')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-secondary" />
              <span className="text-foreground">{p.recipient_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-secondary" />
              <a href={`tel:${p.recipient_phone}`} className="text-primary hover:underline">{p.recipient_phone}</a>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-foreground text-sm">{p.delivery_address}</p>
                {p.delivery_area && (
                  <p className="text-secondary text-xs mt-0.5">
                    {i18n.language === 'my' && p.delivery_area.name_mm ? p.delivery_area.name_mm : p.delivery_area.name}
                  </p>
                )}
              </div>
            </div>
            <a
              href={buildGoogleMapsUrl(p.delivery_address)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-primary text-sm hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {t('deliveries.openInMaps')}
            </a>
          </CardContent>
        </Card>

        {/* Parcel + fees */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Package className="w-4 h-4 text-primary" />Parcel Info</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              [t('parcels.parcelDescription'), p.description ?? '-'],
              [t('parcels.quantity'), `${p.quantity} pcs`],
              [t('parcels.weight'), p.weight ? `${p.weight} kg` : '-'],
              [t('parcels.condition'), t(`parcels.conditions.${p.condition}`)],
              [t('parcels.deliveryFee'), formatCurrency(p.delivery_fee, i18n.language)],
              [t('parcels.isCOD'), p.is_cod ? `Yes — ${formatCurrency(p.cod_amount, i18n.language)}` : 'No'],
              [t('parcels.parcelNotes'), p.notes ?? '-'],
              [t('parcels.damageDescription'), p.damage_description ?? '-'],
              [t('parcels.createdAt'), formatDateTime(p.created_at, i18n.language)],
              [t('parcels.updatedAt'), formatDateTime(p.updated_at, i18n.language)],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between border-b border-border/40 pb-2 last:border-0">
                <span className="text-secondary">{k}</span>
                <span className="text-foreground font-medium">{v}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Assignment */}
        {p.active_assignment && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Truck className="w-4 h-4 text-primary" />Current Assignment</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-secondary">Staff</span>
                <span className="text-foreground">{p.active_assignment.staff?.name ?? '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-secondary">Assigned At</span>
                <span className="text-foreground">{formatDate(p.active_assignment.assigned_at, i18n.language)}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Parcel Images ───────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Images className="w-4 h-4 text-primary" />
              Parcel Images
              {images.length > 0 && (
                <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded font-normal">
                  {images.length}
                </span>
              )}
            </CardTitle>
            {canManageImages && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => imageInputRef.current?.click()}
                  loading={uploadMutation.isPending}
                >
                  <ImagePlus className="w-3.5 h-3.5" />
                  Add Images
                </Button>
                <CameraCapture onCapture={(file) => handleFiles([file])} />
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Drag-and-drop upload zone — always visible when can manage */}
          {canManageImages && (
            <div
              className={`mb-4 border-2 border-dashed rounded px-6 py-5 flex items-center gap-4 cursor-pointer transition-all ${
                imageDragOver
                  ? 'border-primary bg-primary/5 scale-[1.01]'
                  : 'border-border hover:border-primary/40 hover:bg-muted/40'
              } ${uploadMutation.isPending ? 'opacity-60 pointer-events-none' : ''}`}
              onClick={() => imageInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setImageDragOver(true) }}
              onDragLeave={() => setImageDragOver(false)}
              onDrop={e => {
                e.preventDefault()
                setImageDragOver(false)
                handleFiles(e.dataTransfer.files)
              }}
            >
              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                <ImagePlus className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-foreground text-sm font-medium">
                  {uploadMutation.isPending ? 'Uploading…' : 'Click or drag & drop images here'}
                </p>
                <p className="text-secondary text-xs mt-0.5">JPEG, PNG, WebP · max 5 MB each · up to 10 at once</p>
              </div>
            </div>
          )}

          {/* Hidden file input — allows multiple */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg,image/webp"
            capture="environment"
            multiple
            className="hidden"
            onChange={e => {
              if (e.target.files) handleFiles(e.target.files)
              e.target.value = ''
            }}
          />

          {/* Image grid */}
          {images.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-3">
              {images.map((img, idx) => (
                <div
                  key={img.id}
                  className="group relative aspect-square rounded overflow-hidden border border-border bg-muted cursor-pointer"
                  onClick={() => setLightboxIdx(idx)}
                >
                  <img
                    src={img.url}
                    alt={img.original_name ?? `Image ${idx + 1}`}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {/* Delete button */}
                  {canManageImages && (
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        setDeletingId(img.id)
                        deleteImageMutation.mutate(img.id)
                      }}
                      disabled={deletingId === img.id}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive disabled:opacity-50"
                      title="Delete image"
                    >
                      {deletingId === img.id ? (
                        <span className="w-3 h-3 border border-white border-t-transparent rounded animate-spin block" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </button>
                  )}
                  {/* Index badge */}
                  <div className="absolute bottom-1.5 left-1.5 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                    {idx + 1}/{images.length}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !canManageImages && (
              <p className="text-secondary text-sm text-center py-6">No images attached to this parcel.</p>
            )
          )}
        </CardContent>
      </Card>

      {/* Status timeline */}
      {p.status_histories && p.status_histories.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary" />{t('parcels.tracking')}</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-0">
              {[...p.status_histories].reverse().map((h: any, idx: number) => (
                <div key={h.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded mt-1 ${idx === 0 ? 'bg-primary' : 'bg-border'}`} />
                    {idx < p.status_histories.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                  </div>
                  <div className="pb-5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded ${getParcelStatusClass(h.to_status)}`}>
                        {t(`status.${h.to_status}`)}
                      </span>
                      <span className="text-secondary text-xs">{formatDateTime(h.created_at, i18n.language)}</span>
                    </div>
                    {h.reason && <p className="text-secondary text-xs mt-1">{h.reason}</p>}
                    {h.changed_by && <p className="text-secondary text-xs">by {h.changed_by.name}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Lightbox ──────────────────────────────────────────────────────────── */}
      {lightboxImage !== null && lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col"
          onClick={() => setLightboxIdx(null)}
        >
          {/* Top bar */}
          <div
            className="flex items-center justify-between px-5 py-3 flex-shrink-0"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-white/70 text-sm">
              <span className="font-medium text-white">{lightboxIdx + 1}</span>
              <span className="mx-1">/</span>
              {images.length}
              {lightboxImage.original_name && (
                <span className="ml-3 text-white/50 truncate max-w-xs hidden sm:inline">
                  {lightboxImage.original_name}
                </span>
              )}
              {lightboxImage.size && (
                <span className="ml-2 text-white/40 text-xs">{formatBytes(lightboxImage.size)}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {canManageImages && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDeletingId(lightboxImage.id)
                    deleteImageMutation.mutate(lightboxImage.id)
                  }}
                  loading={deletingId === lightboxImage.id}
                  className="border-destructive/40 text-destructive hover:bg-destructive/10 text-xs"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </Button>
              )}
              <button
                className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                onClick={() => setLightboxIdx(null)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Image area */}
          <div className="flex-1 flex items-center justify-center px-16 min-h-0">
            <img
              src={lightboxImage.url}
              alt={lightboxImage.original_name ?? `Image ${lightboxIdx + 1}`}
              className="max-w-full max-h-full object-contain rounded shadow-2xl"
              onClick={e => e.stopPropagation()}
            />
          </div>

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
                onClick={e => { e.stopPropagation(); setLightboxIdx((lightboxIdx - 1 + images.length) % images.length) }}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
                onClick={e => { e.stopPropagation(); setLightboxIdx((lightboxIdx + 1) % images.length) }}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div
              className="flex-shrink-0 flex items-center gap-2 px-4 py-3 overflow-x-auto"
              onClick={e => e.stopPropagation()}
            >
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setLightboxIdx(idx)}
                  className={`flex-shrink-0 w-14 h-14 rounded overflow-hidden border-2 transition-all ${
                    idx === lightboxIdx
                      ? 'border-primary scale-105'
                      : 'border-white/20 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
