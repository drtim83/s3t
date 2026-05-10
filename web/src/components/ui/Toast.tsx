import React from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useNotifStore, type ToastType } from '../../store';
import { cn } from '../../lib/utils';

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-emerald-400" />,
  error:   <AlertCircle className="w-5 h-5 text-red-400" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-400" />,
  info:    <Info className="w-5 h-5 text-brand-400" />,
};

const borders: Record<ToastType, string> = {
  success: 'border-emerald-500/30',
  error:   'border-red-500/30',
  warning: 'border-amber-500/30',
  info:    'border-brand-500/30',
};

export function ToastContainer() {
  const { toasts, removeToast } = useNotifStore();

  return (
    <div className="fixed bottom-6 right-6 z-[999] flex flex-col gap-3 max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'card flex items-start gap-3 p-4 animate-slide-up border',
            borders[toast.type]
          )}
        >
          <span className="shrink-0 mt-0.5">{icons[toast.type]}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">{toast.title}</p>
            {toast.message && <p className="text-xs text-gray-400 mt-0.5">{toast.message}</p>}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="shrink-0 text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

// Auto-dismiss after 5s
export function useAutoDismissToast() {
  const { toasts, removeToast } = useNotifStore();
  React.useEffect(() => {
    if (toasts.length === 0) return;
    const latest = toasts[toasts.length - 1];
    const timer = setTimeout(() => removeToast(latest.id), 5000);
    return () => clearTimeout(timer);
  }, [toasts, removeToast]);
}
