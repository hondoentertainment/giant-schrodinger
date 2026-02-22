import React, { useState } from 'react';
import { createChallenge, getChallengeUrl } from '../services/challenge';

export function ChallengeButton({ assets, score, submission, userProfile }) {
    const [status, setStatus] = useState('idle'); // idle, creating, ready, copied
    const [challengeUrl, setChallengeUrl] = useState(null);

    const handleCreateChallenge = async () => {
        setStatus('creating');

        const challengeId = await createChallenge(assets, score, submission, userProfile);

        if (challengeId) {
            const url = getChallengeUrl(challengeId);
            setChallengeUrl(url);
            setStatus('ready');
        } else {
            setStatus('idle');
        }
    };

    const handleShare = async () => {
        if (!challengeUrl) return;

        // Try Web Share API first (mobile)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Venn with Friends Challenge',
                    text: `I scored ${score}/10 on Venn with Friends! Can you beat me? 🧠⚔️`,
                    url: challengeUrl
                });
                return;
            } catch (err) {
                // Fall through to clipboard
            }
        }

        // Fallback: copy to clipboard
        try {
            await navigator.clipboard.writeText(challengeUrl);
            setStatus('copied');
            setTimeout(() => setStatus('ready'), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    if (status === 'idle') {
        return (
            <button
                onClick={handleCreateChallenge}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:scale-105 transition-transform active:scale-95 flex items-center gap-2"
                aria-label="Challenge a friend"
            >
                ⚔️ Challenge Friend
            </button>
        );
    }

    if (status === 'creating') {
        return (
            <button
                disabled
                className="px-6 py-3 bg-orange-500/50 text-white font-bold rounded-xl flex items-center gap-2 cursor-wait"
            >
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
            </button>
        );
    }

    // ready or copied
    return (
        <button
            onClick={handleShare}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:scale-105 transition-transform active:scale-95 flex items-center gap-2"
        >
            {status === 'copied' ? '✓ Link Copied!' : '📤 Share Challenge'}
        </button>
    );
}
