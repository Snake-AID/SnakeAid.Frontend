'use client';

import React, { createContext, use, useCallback, useEffect, useMemo, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  type?: ToastType;
  durationMs?: number;
}

export interface ToastContextValue {
  showToast: (message: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = use(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [visible, setVisible] = useState(false);

  const showToast = useCallback((message: string, options: ToastOptions = {}) => {
    const type = options.type ?? 'info';
    const durationMs = options.durationMs ?? 3000;

    setToast({ message, type });
    setVisible(true);

    window.setTimeout(() => {
      setVisible(false);
    }, durationMs);
  }, []);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const timeout = window.setTimeout(() => setVisible(false), 3000);
    return () => window.clearTimeout(timeout);
  }, [visible]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext value={value}>
      {children}
      <div className="pointer-events-none fixed top-24 left-1/2 z-99999 flex -translate-x-1/2 items-start justify-center">
        <div
          className={`transform transition-all duration-200 ease-out ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
          }`}
          aria-live="polite"
        >
          {toast && (
            <div
              className={`max-w-sm rounded-xl border px-4 py-3 shadow-lg ring-1 ring-black/10 ${
                toast.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : toast.type === 'error'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : toast.type === 'warning'
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            >
              <p className="text-sm font-semibold">{toast.message}</p>
            </div>
          )}
        </div>
      </div>
    </ToastContext>
  );
}
