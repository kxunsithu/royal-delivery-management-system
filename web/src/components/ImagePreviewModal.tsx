import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export interface PreviewImage {
  id: number | string;
  url: string;
  original_name?: string;
}

interface Props {
  visible: boolean;
  images: PreviewImage[];
  initialIndex?: number;
  onClose: () => void;
}

export default function ImagePreviewModal({ visible, images, initialIndex = 0, onClose }: Props) {
  const [idx, setIdx] = useState(initialIndex);
  React.useEffect(() => {
    if (visible) setIdx(initialIndex);
  }, [visible, initialIndex]);

  if (!visible || images.length === 0) return null;
  const img = images[idx];

  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex flex-col justify-between p-3 sm:p-5 select-none animate-fade-in">
      {/* Top Bar */}
      <div className="flex items-center justify-between text-white pt-safe">
        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition"
        >
          <X className="w-5 h-5" />
        </button>
        <span className="text-xs font-bold font-mono tracking-wider bg-white/15 px-3 py-1 rounded-full">
          {idx + 1} / {images.length}
        </span>
        <span className="w-9" />
      </div>

      {/* Main Image View */}
      <div className="flex-1 flex items-center justify-center p-2 min-h-0">
        <img
          src={img.url}
          alt=""
          className="max-w-full max-h-full object-contain rounded-2xl shadow-float"
        />
      </div>

      {/* Controls & Filename */}
      <div className="flex flex-col items-center gap-2 pb-safe">
        {images.length > 1 && (
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIdx((i) => Math.max(0, i - 1))}
              disabled={idx === 0}
              className="w-12 h-12 rounded-2xl bg-white/15 text-white flex items-center justify-center disabled:opacity-20 active:scale-95 transition"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => setIdx((i) => Math.min(images.length - 1, i + 1))}
              disabled={idx === images.length - 1}
              className="w-12 h-12 rounded-2xl bg-white/15 text-white flex items-center justify-center disabled:opacity-20 active:scale-95 transition"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        )}
        {img.original_name && (
          <div className="text-center text-white/70 text-xs font-mono">{img.original_name}</div>
        )}
      </div>
    </div>
  );
}
