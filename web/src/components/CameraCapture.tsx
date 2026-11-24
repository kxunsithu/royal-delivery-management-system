import React, { useEffect, useRef, useState } from 'react';

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
        if (!mounted) { stream.getTracks().forEach((t) => t.stop()); return; }
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
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
      onCapture(file);
      onClose();
    }, 'image/jpeg', 0.9);
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-surface rounded border border-line w-full max-w-lg p-3 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-ink">ကင်မရာ</h3>
          <button onClick={onClose} className="px-2 py-1 border border-line rounded text-sm">✕</button>
        </div>
        {error ? (
          <div className="text-center text-bad text-sm py-6">{error}</div>
        ) : (
          <video ref={videoRef} className="w-full rounded bg-black" playsInline muted />
        )}
        <div className="flex gap-2">
          <button onClick={capture} disabled={!ready} className="flex-1 bg-brand text-white py-2 rounded font-bold disabled:opacity-50">
            ဓာတ်ပုံရိုက်မည်
          </button>
          <button onClick={onClose} className="px-4 border border-line rounded text-sm">ပိတ်မည်</button>
        </div>
      </div>
    </div>
  );
}