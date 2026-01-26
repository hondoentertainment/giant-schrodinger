import React, { useState } from 'react';

export function ShareButton({ submission, score, fusionUrl }) {
    const [copied, setCopied] = useState(false);

    const shareText = `🎯 I scored ${score}/10 on Venn with Friends!\n\nMy connection: "${submission}"\n\nCan you do better? 🧠✨`;

    const handleShare = async () => {
        // Try Web Share API first (mobile)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Venn with Friends',
                    text: shareText,
                    url: window.location.href
                });
                return;
            } catch (err) {
                // User cancelled or share failed, fall through to copy
            }
        }

        // Fallback: copy to clipboard
        try {
            await navigator.clipboard.writeText(shareText + '\n\n' + window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <button
            onClick={handleShare}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl hover:scale-105 transition-transform active:scale-95 flex items-center gap-2"
            aria-label="Share your score"
        >
            {copied ? '✓ Copied!' : '📤 Share'}
        </button>
    );
}
