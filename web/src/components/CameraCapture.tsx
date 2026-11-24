import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, RotateCcw } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export default function CameraCapture({ open, onClose, onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!open) return;
    let mounted = true;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
        }
      } catch (e: any) {
        setError(e?.message || 'ကင်မရာ ဖွင့်၍ မရပါ');
      }
    }
    start();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setReady(false);
      setError(null);
    };
  }, [open]);

  function capture() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapture(file);
        onClose();
      },
      'image/jpeg',
      0.9
    );
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-surface rounded-3xl border border-line w-full max-w-md p-4 space-y-3.5 shadow-float">
        <div className="flex items-center justify-between pb-1 border-b border-line">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-brand" />
            <h3 className="font-bold text-sm text-ink">ကင်မရာ ရိုက်ကူးမည်</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-ink-3 hover:text-ink hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error ? (
          <div className="text-center text-rose-600 text-xs py-8 bg-rose-50 dark:bg-rose-950/20 rounded-2xl">
            {error}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-black aspect-video flex items-center justify-center">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-3 rounded-2xl border border-line text-xs font-bold text-ink hover:bg-muted active:scale-95 transition"
          >
            ပိတ်မည်
          </button>
          <button
            type="button"
            onClick={capture}
            disabled={!ready}
            className="py-2.5 px-3 rounded-2xl bg-brand text-white text-xs font-bold shadow-sm shadow-brand/25 disabled:opacity-50 active:scale-95 transition flex items-center justify-center gap-1.5"
          >
            <Camera className="w-4 h-4" />
            <span>ဓာတ်ပုံရိုက်မည်</span>
          </button>
        </div>
      </div>
    </div>
  );
}
