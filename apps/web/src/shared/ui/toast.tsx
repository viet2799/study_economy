'use client';

import * as React from 'react';
import * as RadixToast from '@radix-ui/react-toast';
import { X } from 'lucide-react';

import { cn } from '../lib/cn';
import { registerToastSubscriber, type ToastInput } from './toast-store';

type ToastItem = ToastInput & { id: string };

const ToastContext = React.createContext<{
  toast: (toast: ToastInput) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  React.useEffect(() => {
    registerToastSubscriber((toast) => {
      const id = crypto.randomUUID();
      setToasts((current) => [...current, { ...toast, id }]);
      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== id));
      }, 4000);
    });

    return () => {
      registerToastSubscriber(null);
    };
  }, []);

  const api = {
    toast: (toast: ToastInput) => {
      const id = crypto.randomUUID();
      setToasts((current) => [...current, { ...toast, id }]);
      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== id));
      }, 4000);
    }
  };

  return (
    <ToastContext.Provider value={api}>
      <RadixToast.Provider swipeDirection="right">
        {children}
        {toasts.map((item) => (
          <ToastBubble key={item.id} toast={item} />
        ))}
        <RadixToast.Viewport className="fixed right-4 top-4 z-50 flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-3 outline-none" />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

function ToastBubble({ toast }: { toast: ToastItem }) {
  const [open, setOpen] = React.useState(true);
  const variantClasses = {
    default: 'border-slate-200 bg-white text-slate-950',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-950',
    error: 'border-rose-200 bg-rose-50 text-rose-950'
  }[toast.variant ?? 'default'];

  return (
    <RadixToast.Root
      open={open}
      onOpenChange={setOpen}
      className={cn('rounded-2xl border p-4 shadow-2xl transition-all', variantClasses)}
      duration={4000}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 space-y-1">
          <RadixToast.Title className="text-sm font-semibold">{toast.title}</RadixToast.Title>
          {toast.description ? (
            <RadixToast.Description className="text-sm opacity-80">
              {toast.description}
            </RadixToast.Description>
          ) : null}
        </div>
        <RadixToast.Close className="rounded-full p-1 transition hover:bg-black/5">
          <X className="h-4 w-4" />
        </RadixToast.Close>
      </div>
    </RadixToast.Root>
  );
}
