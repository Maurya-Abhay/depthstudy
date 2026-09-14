'use client';

import { CheckCircle2, Info, AlertCircle, X } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

type ToastKind = 'success' | 'error' | 'info';
type Toast = { id: number; kind: ToastKind; message: string };
type ToastContextValue = { showToast: (kind: ToastKind, message: string) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

const SUCCESS_MESSAGES: Record<string, string> = {
  '/api/admin/categories': 'Category saved successfully.',
  '/api/admin/courses': 'Course saved successfully.',
  '/api/admin/content': 'Changes saved successfully.',
  '/api/admin/dsa-topics': 'DSA topics saved successfully.',
  '/api/admin/roadmaps': 'Roadmap saved successfully.',
  '/api/admin/users': 'User changes saved successfully.',
  '/api/admin/certificates': 'Certificate changes saved successfully.',
  '/api/admin/backup': 'Backup created successfully.',
  '/api/enrollments': 'Enrollment completed successfully.',
  '/api/progress': 'Progress saved successfully.',
  '/api/notes': 'Note saved successfully.',
  '/api/schedule': 'Schedule updated successfully.',
  '/api/ai/save': 'AI content saved successfully.',
  '/api/certificates': 'Certificate action completed successfully.',
};

function getPath(url: string) {
  try {
    return new URL(url, window.location.origin).pathname;
  } catch {
    return url.split('?')[0];
  }
}

function getSuccessMessage(url: string, payload: { message?: unknown; error?: unknown }) {
  const path = getPath(url);
  if (typeof payload.message === 'string' && payload.message.trim()) return payload.message;
  return SUCCESS_MESSAGES[path] ?? 'Changes saved successfully.';
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (kind: ToastKind, message: string) => {
      const id = Date.now() + Math.random();
      setToasts((current) => [...current.slice(-3), { id, kind, message }]);
      window.setTimeout(() => dismiss(id), 3600);
    },
    [dismiss]
  );

  useEffect(() => {
    const originalFetch = window.fetch.bind(window);
    const mutationMethods = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

    window.fetch = async (input, init) => {
      const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : input.toString();
      const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
      const silent = headers.get('X-Silent-Toast') === '1';
      const isApiMutation = url.includes('/api/') && mutationMethods.has(method) && !silent;
      
      const response = await originalFetch(input, init);

      if (isApiMutation) {
        let payload: { error?: unknown; message?: unknown } = {};
        try {
          payload = await response.clone().json();
        } catch {
          /* non-JSON response */
        }
        if (response.ok) {
          showToast('success', getSuccessMessage(url, payload));
        } else {
          const error =
            typeof payload.error === 'string'
              ? payload.error
              : 'We could not complete that action. Please try again.';
          showToast('error', error);
        }
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Floating Toast Container */}
      <div
        className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.kind === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-2xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-4 ${
              toast.kind === 'success'
                ? 'border-emerald-500/30 bg-[#121824]/95 text-emerald-400'
                : toast.kind === 'error'
                ? 'border-rose-500/30 bg-[#121824]/95 text-rose-400'
                : 'border-indigo-500/30 bg-[#121824]/95 text-indigo-400'
            }`}
          >
            {/* Kind Icon */}
            <div className="shrink-0 pt-0.5">
              {toast.kind === 'success' ? (
                <CheckCircle2 size={18} />
              ) : toast.kind === 'error' ? (
                <AlertCircle size={18} />
              ) : (
                <Info size={18} />
              )}
            </div>

            {/* Message Text */}
            <span className="text-xs font-semibold leading-relaxed text-slate-200 flex-1">
              {toast.message}
            </span>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors p-0.5 rounded-lg"
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}