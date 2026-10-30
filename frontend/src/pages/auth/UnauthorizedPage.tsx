import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ShieldOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function UnauthorizedPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto">
          <ShieldOff className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-foreground text-2xl font-bold">Access Denied</h1>
        <p className="text-secondary text-sm max-w-xs">
          {t('auth.unauthorized')}
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>{t('common.back')}</Button>
          <Button onClick={() => navigate('/')}>Go to Dashboard</Button>
        </div>
      </div>
    </div>
  )
}
