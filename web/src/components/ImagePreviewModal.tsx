import React, { useState } from 'react';

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
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      <div className="flex items-center justify-between p-3 text-white">
        <button onClick={onClose} className="p-2">✕</button>
        <span className="text-sm">{idx + 1} / {images.length}</span>
        <span className="w-8" />
      </div>
      <div className="flex-1 flex items-center justify-center">
        <img src={img.url} alt="" className="max-w-full max-h-full object-contain" />
      </div>
      <div className="flex items-center justify-center gap-4 p-3">
        {images.length > 1 && (
          <>
            <button
              onClick={() => setIdx((i) => Math.max(0, i - 1))}
              disabled={idx === 0}
              className="text-white px-3 py-1 rounded bg-white/10 disabled:opacity-40"
            >
              ‹
            </button>
            <button
              onClick={() => setIdx((i) => Math.min(images.length - 1, i + 1))}
              disabled={idx === images.length - 1}
              className="text-white px-3 py-1 rounded bg-white/10 disabled:opacity-40"
            >
              ›
            </button>
          </>
        )}
      </div>
      {img.original_name && <div className="text-center text-white/70 text-xs pb-3">{img.original_name}</div>}
    </div>
  );
}

