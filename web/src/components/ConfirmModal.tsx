import React from 'react';

export interface ConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  children?: React.ReactNode;
}

export default function ConfirmModal({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'အတည်ပြုမည်',
  cancelText = 'မလုပ်တော့',
  isDestructive = false,
  isLoading = false,
  children,
}: ConfirmModalProps) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-5 bg-black/45">
      <div className="absolute inset-0" onClick={isLoading ? undefined : onClose} />
      <div className="relative w-full max-w-md bg-surface rounded border border-line shadow-float p-5">
        <h3 className="text-lg font-bold text-ink text-center mb-2">{title}</h3>
        {message && <p className="text-sm text-ink-2 text-center mb-3">{message}</p>}
        {children}
        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded bg-muted text-ink-2 font-semibold text-sm"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-2.5 rounded text-white font-semibold text-sm ${isDestructive ? 'bg-bad' : 'bg-brand'}`}
          >
            {isLoading ? '...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}