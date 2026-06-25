import React from 'react';
import { ArrowLeft } from 'lucide-react';

export function GameScreenShell({
    onBack,
    title,
    icon: Icon,
    badge,
    children,
    maxWidth = 'max-w-2xl',
    backLabel = 'Back',
}) {
    return (
        <div className={`w-full ${maxWidth} flex flex-col items-center animate-spring-in mx-auto`}>
            <div className="wordle-card p-6 sm:p-8 w-full">
                {(onBack || title) && (
                    <div className="flex items-center gap-3 mb-6">
                        {onBack && (
                            <button
                                type="button"
                                onClick={onBack}
                                className="p-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.12] border border-white/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                                aria-label={backLabel}
                            >
                                <ArrowLeft className="w-5 h-5 text-white/70" />
                            </button>
                        )}
                        {title && (
                            <div className="flex-1 min-w-0">
                                <h2 className="text-2xl font-display font-bold tracking-tight text-white flex items-center gap-2">
                                    {Icon && <Icon className="w-6 h-6 text-amber-300 shrink-0" aria-hidden="true" />}
                                    {title}
                                </h2>
                            </div>
                        )}
                        {badge}
                    </div>
                )}
                {children}
            </div>
        </div>
    );
}
