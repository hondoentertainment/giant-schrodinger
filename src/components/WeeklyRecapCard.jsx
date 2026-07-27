import React, { useState } from 'react';
import { Share2, Check, Flame } from 'lucide-react';
import { getWeeklyRecap } from '../services/weeklyRecap';
import { trackEvent } from '../services/analytics';
import { haptic } from '../lib/haptics';

export function WeeklyRecapCard() {
    const [recap] = useState(() => getWeeklyRecap());
    const [shared, setShared] = useState(false);

    if (!recap) return null;

    const handleShare = async () => {
        trackEvent('weekly_recap_share', {
            rounds: recap.roundsPlayed,
            highlights: recap.highlightCount,
        });
        try {
            if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
                await navigator.share({ title: 'My week in Venns', text: recap.shareText });
                haptic('success');
                setShared(true);
                setTimeout(() => setShared(false), 2500);
                return;
            }
        } catch (err) {
            if (err?.name === 'AbortError') return;
        }
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(recap.shareText);
            haptic('success');
            setShared(true);
            setTimeout(() => setShared(false), 2500);
        }
    };

    return (
        <div className="wordle-card p-4 sm:p-5 mb-4" data-testid="weekly-recap-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                    <div className="game-section-label mb-1">Your week in Venns</div>
                    <div className="text-white font-semibold">
                        {recap.roundsPlayed} connection{recap.roundsPlayed === 1 ? '' : 's'}
                        {recap.averageScore > 0 && <span className="text-white/60"> · avg {recap.averageScore.toFixed(1)}/10</span>}
                        {recap.streak > 1 && (
                            <span className="text-amber-300 inline-flex items-center gap-1 ml-2">
                                <Flame className="w-4 h-4" aria-hidden="true" />
                                {recap.streak}-day streak
                            </span>
                        )}
                    </div>
                    {recap.best?.submission && (
                        <p className="text-white/55 text-sm mt-1 truncate">
                            Best: &ldquo;{recap.best.submission}&rdquo; — {recap.best.score}/10
                        </p>
                    )}
                </div>
                <button
                    type="button"
                    onClick={handleShare}
                    className="wordle-button wordle-primary min-h-[44px] shrink-0 flex items-center gap-2"
                >
                    {shared ? <Check className="w-4 h-4" aria-hidden="true" /> : <Share2 className="w-4 h-4" aria-hidden="true" />}
                    {shared ? 'Shared' : 'Share recap'}
                </button>
            </div>
        </div>
    );
}
