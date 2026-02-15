import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';

const ToastContext = createContext();

const TOAST_DURATION = 4000;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const idCounter = useRef(0);

    const addToast = useCallback((message, type = 'error') => {
        const id = ++idCounter.current;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, TOAST_DURATION);
        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const toast = useMemo(() => ({
        error: (msg) => addToast(msg, 'error'),
        success: (msg) => addToast(msg, 'success'),
        info: (msg) => addToast(msg, 'info'),
        warn: (msg) => addToast(msg, 'warn'),
    }), [addToast]);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast, toast }}>
            {children}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        // Fallback for components rendered outside provider (shouldn't happen)
        return {
            toast: {
                error: (msg) => console.warn('[Toast]', msg),
                success: (msg) => console.log('[Toast]', msg),
                info: (msg) => console.log('[Toast]', msg),
                warn: (msg) => console.warn('[Toast]', msg),
            },
        };
    }
    return ctx;
}
