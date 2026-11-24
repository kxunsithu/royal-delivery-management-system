import React from 'react';
import { AlertCircle, AlertTriangle } from 'lucide-react';

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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-0" onClick={isLoading ? undefined : onClose} />
      <div className="relative w-full max-w-sm bg-surface rounded-3xl border border-line shadow-float p-5 sm:p-6 space-y-3 animate-scale-in">
        <div className="flex flex-col items-center text-center">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2.5 ${
              isDestructive
                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                : 'bg-brand/15 text-brand'
            }`}
          >
            {isDestructive ? <AlertTriangle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
          </div>
          <h3 className="text-base font-black text-ink">{title}</h3>
          {message && <p className="text-xs text-ink-2 mt-1 leading-relaxed">{message}</p>}
        </div>

        {children}

        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="py-2.5 px-3 rounded-2xl border border-line bg-surface text-ink-2 hover:bg-muted font-bold text-xs active:scale-95 transition"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`py-2.5 px-3 rounded-2xl font-bold text-xs text-white shadow-sm active:scale-95 transition ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-brand hover:bg-brand-dark'
            }`}
          >
            {isLoading ? 'ဆောင်ရွက်နေဆဲ...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
