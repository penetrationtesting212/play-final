/**
 * Enterprise-Grade Toast Notification System
 * Provides non-intrusive notifications with various types and positions
 */

import * as React from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  hideToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
  position?: ToastPosition;
  maxToasts?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  position = 'top-right',
  maxToasts = 5,
}) => {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  
  const showToast = React.useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { ...toast, id };
    
    setToasts(prev => {
      const updated = [...prev, newToast];
      return updated.slice(-maxToasts);
    });
    
    // Auto-hide after duration
    if (toast.duration !== 0) {
      setTimeout(() => {
        hideToast(id);
      }, toast.duration || 5000);
    }
  }, [maxToasts]);
  
  const hideToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);
  
  const positionStyles: Record<ToastPosition, string> = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };
  
  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast }}>
      {children}
      <div className={`fixed ${positionStyles[position]} z-[10000] flex flex-col gap-2 pointer-events-none`}>
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onClose={() => hideToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
  const typeStyles: Record<ToastType, { bg: string; icon: React.ReactNode }> = {
    success: {
      bg: 'bg-[var(--color-success)]',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    error: {
      bg: 'bg-[var(--color-error)]',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
    },
    warning: {
      bg: 'bg-[var(--color-warning)]',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    info: {
      bg: 'bg-[var(--color-info)]',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  };
  
  const style = typeStyles[toast.type];
  
  return (
    <div
      className="pointer-events-auto min-w-[300px] max-w-md bg-[var(--color-background-elevated)] rounded-lg shadow-lg border border-[var(--color-border)] overflow-hidden animate-slideInRight"
      role="alert"
    >
      <div className="flex items-start gap-3 p-4">
        <div className={`flex-shrink-0 rounded-full p-1 ${style.bg} text-white`}>
          {style.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--color-text)]">{toast.message}</p>
          {toast.description && (
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{toast.description}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 rounded-md hover:bg-[var(--color-surface-hover)] transition-colors"
          aria-label="Close notification"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};
