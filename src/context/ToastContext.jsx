import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';

const ToastContext = createContext();

const TOAST_DURATION = 4000;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const idCounter = useRef(0);
    const timersRef = useRef(new Map());

    const removeToast = useCallback((id) => {
        const timerId = timersRef.current.get(id);
        if (timerId !== undefined) {
            clearTimeout(timerId);
            timersRef.current.delete(id);
        }
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback((message, type = 'error') => {
        const id = ++idCounter.current;
        setToasts((prev) => [...prev, { id, message, type }]);
        const timerId = setTimeout(() => {
            timersRef.current.delete(id);
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, TOAST_DURATION);
        timersRef.current.set(id, timerId);
        return id;
    }, []);

    useEffect(() => {
        const timers = timersRef.current;
        return () => {
            timers.forEach((timerId) => clearTimeout(timerId));
            timers.clear();
        };
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
