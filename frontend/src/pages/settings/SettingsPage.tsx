import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import apiClient from '@/lib/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Save, Plus, Trash2, Settings, MapPin, Building2, CheckCircle2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { queryClient } from '@/lib/queryClient'

export default function SettingsPage() {
  const { t } = useTranslation()
  const [saving, setSaving] = useState<string | null>(null)   // key currently saving
  const [newArea, setNewArea] = useState({ name: '', name_mm: '' })
  const [showAddArea, setShowAddArea] = useState(false)
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set())

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => apiClient.get('/settings').then(r => r.data.data),
  })

  const { data: areasData, refetch: refetchAreas } = useQuery({
    queryKey: ['delivery-areas'],
    queryFn: () => apiClient.get('/settings/delivery-areas').then(r => r.data.data),
  })
  const areas = (areasData as any[]) ?? []

  const [settingsForm, setSettingsForm] = useState<Record<string, string>>({})

  const handleSettingSave = async (key: string, value: string) => {
    setSaving(key)
    try {
      await apiClient.post('/settings', { key, value })
      toast({ title: t('settings.settingsSaved'), variant: 'success' as any })
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      setSavedKeys(prev => new Set([...prev, key]))
      setTimeout(() => setSavedKeys(prev => { const n = new Set(prev); n.delete(key); return n }), 2000)
    } catch {
      toast({ title: 'Failed to save', variant: 'destructive' })
    } finally {
      setSaving(null)
    }
  }

  const addAreaMutation = useMutation({
    mutationFn: () => apiClient.post('/settings/delivery-areas', newArea),
    onSuccess: () => {
      toast({ title: 'Area added', variant: 'success' as any })
      refetchAreas()
      setNewArea({ name: '', name_mm: '' })
      setShowAddArea(false)
    },
    onError: () => toast({ title: 'Failed to add area', variant: 'destructive' }),
  })

  const deleteAreaMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/settings/delivery-areas/${id}`),
    onSuccess: () => {
      toast({ title: 'Area removed', variant: 'success' as any })
      refetchAreas()
    },
    onError: () => toast({ title: 'Failed to remove area', variant: 'destructive' }),
  })

  const settingsList = [
    { key: 'business_name',         label: t('settings.businessName'),    type: 'text' },
    { key: 'business_phone',        label: t('settings.businessPhone'),   type: 'text' },
    { key: 'business_address',      label: t('settings.businessAddress'), type: 'text' },
    { key: 'currency_symbol',       label: t('settings.currencySymbol'),  type: 'text' },
    { key: 'tracking_number_prefix', label: t('settings.trackingPrefix'),  type: 'text' },
    { key: 'max_delivery_attempts', label: t('settings.maxAttempts'),     type: 'number' },
  ]

  const getSettingValue = (key: string) => {
    const s = (settings as any[])?.find((s: any) => s.key === key)
    return settingsForm[key] ?? s?.value ?? ''
  }

  return (
    <div className="space-y-5">

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Settings className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h1 className="text-foreground text-2xl font-bold">{t('settings.title')}</h1>
          <p className="text-secondary text-sm">Business configuration</p>
        </div>
      </div>

      {/* ── 2-column grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">

        {/* ── LEFT — Business Settings ──────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-foreground/80">
              <Building2 className="w-4 h-4 text-primary" />
              {t('settings.businessInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {settingsList.map(s => (
              <div key={s.key} className="space-y-1.5">
                <Label className="text-xs text-secondary">{s.label}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type={s.type}
                    value={getSettingValue(s.key)}
                    onChange={e => setSettingsForm(f => ({ ...f, [s.key]: e.target.value }))}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && settingsForm[s.key] !== undefined) {
                        handleSettingSave(s.key, settingsForm[s.key])
                      }
                    }}
                    placeholder={`Enter ${s.label.toLowerCase()}…`}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={saving === s.key || settingsForm[s.key] === undefined}
                    loading={saving === s.key}
                    onClick={() => settingsForm[s.key] !== undefined && handleSettingSave(s.key, settingsForm[s.key])}
                    className={savedKeys.has(s.key) ? 'border-success text-success' : ''}
                    title="Save"
                  >
                    {savedKeys.has(s.key)
                      ? <CheckCircle2 className="w-4 h-4" />
                      : <Save className="w-4 h-4" />
                    }
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ── RIGHT — Delivery Areas ────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2 text-foreground/80">
                <MapPin className="w-4 h-4 text-primary" />
                {t('settings.deliveryAreas')}
                {areas.length > 0 && (
                  <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded font-normal">
                    {areas.length}
                  </span>
                )}
              </CardTitle>
              <Button size="sm" onClick={() => setShowAddArea(!showAddArea)}>
                <Plus className="w-3.5 h-3.5" />
                {t('settings.addArea')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">

            {/* Add area inline form */}
            {showAddArea && (
              <div className="space-y-2 p-3 bg-muted/60 rounded border border-primary/30">
                <p className="text-xs text-secondary font-medium">New Delivery Area</p>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder={t('settings.areaName')}
                    value={newArea.name}
                    onChange={e => setNewArea(f => ({ ...f, name: e.target.value }))}
                  />
                  <Input
                    placeholder={t('settings.areaMyanmarName')}
                    value={newArea.name_mm}
                    onChange={e => setNewArea(f => ({ ...f, name_mm: e.target.value }))}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    loading={addAreaMutation.isPending}
                    disabled={!newArea.name}
                    onClick={() => addAreaMutation.mutate()}
                  >
                    {t('common.add')}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setShowAddArea(false); setNewArea({ name: '', name_mm: '' }) }}>
                    {t('common.cancel')}
                  </Button>
                </div>
              </div>
            )}

            {/* Areas list */}
            {areas.length === 0 ? (
              <div className="py-8 flex flex-col items-center gap-2 text-center">
                <MapPin className="w-8 h-8 text-border" />
                <p className="text-secondary text-sm">{t('common.noData')}</p>
                <p className="text-secondary/60 text-xs">Click "Add Area" to create your first delivery area</p>
              </div>
            ) : (
              <div className="space-y-1">
                {areas.map((area: any) => (
                  <div
                    key={area.id}
                    className="flex items-center justify-between px-3 py-2.5 rounded hover:bg-muted/50 transition-colors group"
                  >
                    <div className="min-w-0">
                      <span className="text-foreground text-sm font-medium">{area.name}</span>
                      {area.name_mm && (
                        <span className="text-secondary text-xs ml-2">({area.name_mm})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        area.is_active
                          ? 'bg-success/15 text-success'
                          : 'bg-destructive/15 text-destructive'
                      }`}>
                        {area.is_active ? t('common.active') : t('common.inactive')}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => deleteAreaMutation.mutate(area.id)}
                        disabled={deleteAreaMutation.isPending}
                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </CardContent>
        </Card>

      </div>{/* end 2-col grid */}
    </div>
  )
}
