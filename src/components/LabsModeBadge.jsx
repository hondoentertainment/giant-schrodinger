import React from 'react';
import { useAccount } from '../context/AccountContext';
import { LocalPreviewBadge } from './LocalPreviewBadge';

const CLOUD_LAB_MODES = new Set(['ranked', 'shop', 'tournament']);

export function LabsModeBadge({ mode, className = '' }) {
    const account = useAccount();
    if (account.cloudLabs && CLOUD_LAB_MODES.has(mode)) {
        return (
            <span
                className={`inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-200 ${className}`}
                title="Saved to your account. This is your data, not a public global ladder."
            >
                Account
            </span>
        );
    }
    return <LocalPreviewBadge className={className} />;
}
