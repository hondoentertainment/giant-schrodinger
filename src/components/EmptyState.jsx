import React from 'react';

export function EmptyState({ icon = '✨', title, description, action, className = '' }) {
    return (
        <div className={`text-center py-12 px-4 rounded-[22px] bg-white/[0.04] border border-white/[0.08] ${className}`.trim()}>
            <div className="text-5xl mb-4" aria-hidden="true">{icon}</div>
            <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
            {description && (
                <p className="text-white/45 text-sm max-w-sm mx-auto mb-4">{description}</p>
            )}
            {action}
        </div>
    );
}
