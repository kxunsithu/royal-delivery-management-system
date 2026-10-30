import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, X } from 'lucide-react'

export function CameraCapture({ onCapture }: { onCapture: (file: File) => void }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [deviceIndex, setDeviceIndex] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const start = async () => {
    setError('')
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Camera is not supported in this browser.')
      setOpen(true)
      return
    }
    const constraintsList = [
      { video: { facingMode: { ideal: 'environment' } } },
      { video: { facingMode: { ideal: 'user' } } },
      { video: true },
    ]
    for (const constraints of constraintsList) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints as any)
        streamRef.current = stream
        setOpen(true)
        setTimeout(() => {
          if (videoRef.current) videoRef.current.srcObject = stream
        }, 0)
        // enumerate devices after permission
        try {
          const all = await navigator.mediaDevices.enumerateDevices()
          const vids = all.filter(d => d.kind === 'videoinput')
          setDevices(vids)
          if (vids.length) {
            const idx = vids.findIndex(d => d.deviceId === stream.getVideoTracks()[0]?.getSettings().deviceId)
            setDeviceIndex(idx >= 0 ? idx : 0)
          }
        } catch {}
        return
      } catch (e: any) {
        // try next
      }
    }
    setError('Unable to access camera/webcam.')
    setOpen(true)
  }

  const stop = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setOpen(false)
    setError('')
  }

  const switchCamera = async () => {
    if (devices.length < 2) return
    const nextIndex = (deviceIndex + 1) % devices.length
    const nextDevice = devices[nextIndex]
    try {
      streamRef.current?.getTracks().forEach(t => t.stop())
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: nextDevice.deviceId } },
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setDeviceIndex(nextIndex)
    } catch (e: any) {
      setError(e?.message || 'Unable to switch camera.')
    }
  }

  const capture = () => {
    const video = videoRef.current
    if (!video || !video.videoWidth) {
      setError('Camera not ready.')
      return
    }
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(blob => {
      if (blob) {
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })
        onCapture(file)
      }
      stop()
    }, 'image/jpeg', 0.92)
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={start}>
        <Camera className="w-3.5 h-3.5" />
        Take Photo
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={stop}>
          <div className="bg-background-surface border border-border rounded shadow-xl p-4 space-y-3 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="text-foreground font-medium text-sm">Camera</p>
              <button type="button" onClick={stop} className="text-secondary hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            {error ? (
              <p className="text-destructive text-sm">{error}</p>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full rounded border border-border bg-black"
              />
            )}
            <div className="flex gap-2 justify-end flex-wrap">
              {devices.length > 1 && (
                <Button variant="outline" size="sm" onClick={switchCamera}>
                  <Camera className="w-3.5 h-3.5" />
                  Switch Camera
                </Button>
              )}
              {!error && (
                <Button size="sm" onClick={capture}>
                  <Camera className="w-3.5 h-3.5" />
                  Capture
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={stop}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}