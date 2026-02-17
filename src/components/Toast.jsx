import React from 'react';
import { useToast } from '../context/ToastContext';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

const ICON_MAP = {
    error: AlertCircle,
    success: CheckCircle,
    info: Info,
    warn: AlertTriangle,
};

const STYLE_MAP = {
    error: 'from-red-500/90 to-red-600/90 border-red-400/30',
    success: 'from-emerald-500/90 to-emerald-600/90 border-emerald-400/30',
    info: 'from-blue-500/90 to-blue-600/90 border-blue-400/30',
    warn: 'from-amber-500/90 to-amber-600/90 border-amber-400/30',
};

export function ToastContainer() {
    const { toasts, removeToast } = useToast();

    if (toasts.length === 0) return null;

    return (
        <div
            className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none"
            role="region"
            aria-label="Notifications"
        >
            {toasts.map((t) => {
                const Icon = ICON_MAP[t.type] || Info;
                const style = STYLE_MAP[t.type] || STYLE_MAP.info;
                return (
                    <div
                        key={t.id}
                        role="status"
                        aria-live="polite"
                        className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border bg-gradient-to-r ${style} backdrop-blur-xl text-white shadow-2xl animate-in slide-in-from-right-8 fade-in duration-300`}
                    >
                        <Icon className="w-5 h-5 mt-0.5 shrink-0" />
                        <p className="text-sm font-medium flex-1">{t.message}</p>
                        <button
                            onClick={() => removeToast(t.id)}
                            className="shrink-0 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                            aria-label="Dismiss notification"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
