import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel: string
  cancelLabel: string
  onCancel: () => void
  onConfirm: () => void
  loading?: boolean
  variant?: 'default' | 'destructive'
}

/**
 * Centered confirmation card with a full-screen backdrop overlay.
 * Rendered through a portal so the backdrop always covers the whole viewport.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onCancel,
  onConfirm,
  loading = false,
  variant = 'default',
}: ConfirmDialogProps) {
  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <Card className="w-full max-w-sm border-border">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-secondary text-sm">{message}</div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
              {cancelLabel}
            </Button>
            <Button type="button" variant={variant} className="flex-1" loading={loading} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>,
    document.body,
  )
}
