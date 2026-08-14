import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// Popup de notificação (substitui window.alert): empilha no canto superior
// direito e se fecha sozinho após `duration` ms, sem bloquear a UI.
const ToastContext = createContext(null);

const DEFAULT_DURATION = 5000;

const ICONS = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
};

const ACCENTS = {
    success: 'border-matrix-green text-matrix-green shadow-[4px_4px_0px_0px_rgba(0,255,65,1)]',
    error: 'border-red-500 text-red-500 shadow-[4px_4px_0px_0px_rgba(239,68,68,1)]',
    warning: 'border-matrix-orange text-matrix-orange shadow-[4px_4px_0px_0px_rgba(255,95,31,1)]',
    info: 'border-white text-white shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]',
};

let idCounter = 0;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const timers = useRef({});

    const dismissToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        clearTimeout(timers.current[id]);
        delete timers.current[id];
    }, []);

    // type: 'success' | 'error' | 'warning' | 'info'
    const showToast = useCallback((message, type = 'info', duration = DEFAULT_DURATION) => {
        const id = ++idCounter;
        setToasts((prev) => [...prev, { id, message, type }]);
        timers.current[id] = setTimeout(() => dismissToast(id), duration);
        return id;
    }, [dismissToast]);

    return (
        <ToastContext.Provider value={{ showToast, dismissToast }}>
            {children}
            <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
                {toasts.map((t) => {
                    const Icon = ICONS[t.type] || ICONS.info;
                    return (
                        <div
                            key={t.id}
                            role="alert"
                            className={`pointer-events-auto bg-matrix-gray border-2 p-4 flex items-start gap-3 font-mono animate-in slide-in-from-right-8 fade-in duration-300 ${ACCENTS[t.type] || ACCENTS.info}`}
                        >
                            <Icon className="w-5 h-5 shrink-0 mt-0.5" />
                            <p className="text-xs text-white flex-1 leading-relaxed break-words">{t.message}</p>
                            <button
                                onClick={() => dismissToast(t.id)}
                                className="text-white/40 hover:text-white transition-colors shrink-0"
                                aria-label="Fechar"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast deve ser usado dentro de um <ToastProvider>');
    return ctx;
}
