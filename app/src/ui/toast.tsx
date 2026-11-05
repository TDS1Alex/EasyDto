import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { Icon, type IconName } from './icons';
import { cx } from './utils';

export type ToastKind = 'success' | 'error' | 'info';

interface ToastMessage {
    kind: ToastKind;
    title: string;
    message?: string;
}

interface ToastItem extends ToastMessage {
    id: number;
}

interface ToastApi {
    push: (toast: ToastMessage) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const kindIcon: Record<ToastKind, IconName> = {
    success: 'circleCheck',
    error: 'alert',
    info: 'info',
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const nextId = useRef(0);

    const push = useCallback((toast: ToastMessage) => {
        const id = ++nextId.current;
        setToasts(current => [...current, { ...toast, id }]);
        const duration = toast.kind === 'error' ? 6500 : 3200;
        window.setTimeout(() => {
            setToasts(current => current.filter(item => item.id !== id));
        }, duration);
    }, []);

    const value = useMemo(() => ({ push }), [push]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="ed-toasts" aria-live="polite" aria-atomic="false">
                {toasts.map(toast => (
                    <div key={toast.id} className={cx('ed-toast', `ed-toast--${toast.kind}`)} role="status">
                        <span className="ed-toast-icon">
                            <Icon name={kindIcon[toast.kind]} size={18} />
                        </span>
                        <div className="ed-toast-body">
                            <strong>{toast.title}</strong>
                            {toast.message && <p>{toast.message}</p>}
                        </div>
                        <button
                            type="button"
                            className="ed-toast-close"
                            aria-label="Закрыть уведомление"
                            onClick={() => setToasts(current => current.filter(item => item.id !== toast.id))}
                        >
                            <Icon name="x" size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast(): ToastApi {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used inside ToastProvider');
    }
    return context;
}
