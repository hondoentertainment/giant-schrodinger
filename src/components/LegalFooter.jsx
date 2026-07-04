import React from 'react';

export function LegalFooter({ onPrivacy, onTerms }) {
    return (
        <footer className="mt-auto w-full max-w-5xl pt-4 pb-2 text-center text-xs text-white/40">
            <button
                type="button"
                onClick={onPrivacy}
                className="underline underline-offset-2 hover:text-white/70 min-h-[44px] px-2"
            >
                Privacy
            </button>
            <span aria-hidden="true" className="mx-1">·</span>
            <button
                type="button"
                onClick={onTerms}
                className="underline underline-offset-2 hover:text-white/70 min-h-[44px] px-2"
            >
                Terms
            </button>
        </footer>
    );
}
