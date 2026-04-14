import React from 'react';
import { ScoreHistoryChart } from '../../analytics/ScoreHistoryChart';
import { useTranslation } from '../../../hooks/useTranslation';

export function SessionCompleteMessage({ sessionId, roundComplete, roundNumber, totalRounds, sessionScore, sessionResults }) {
    const { t } = useTranslation();
    if (!(sessionId && roundComplete && roundNumber === totalRounds)) return null;
    return (
        <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
            <div className="text-2xl mb-1">🎉</div>
            <div className="text-white font-semibold">{t('lobby.sessionCompleteMessage')}</div>
            <div className="text-white/70 text-sm mt-1">
                {t('lobby.averageScore')}: <span className="text-amber-400 font-bold">{(sessionScore / sessionResults.length).toFixed(1)}</span>/10
            </div>
        </div>
    );
}

export function ScoreHistoryPanel({ stats }) {
    if (stats.totalRounds < 5) return null;
    return (
        <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10">
            <ScoreHistoryChart limit={30} />
        </div>
    );
}

export function LobbyFooterActions({
    sessionId,
    roundComplete,
    roundNumber,
    totalRounds,
    endSession,
    showAll,
    setShowAll,
}) {
    const { t } = useTranslation();
    return (
        <>
            <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap gap-4 justify-center">
                {sessionId && (
                    <button
                        onClick={() => {
                            if (roundComplete && roundNumber === totalRounds) {
                                endSession();
                            } else if (window.confirm(t('lobby.endSessionConfirm'))) {
                                endSession();
                            }
                        }}
                        className="text-sm text-white/40 hover:text-white underline min-h-[44px] flex items-center"
                        aria-label="Start new session"
                    >
                        {t('lobby.startNewSession')}
                    </button>
                )}
            </div>
            <button
                onClick={() => { const v = !showAll; setShowAll(v); localStorage.setItem('vwf_show_all_features', v.toString()); }}
                className="mt-4 text-sm text-white/40 hover:text-white/60 underline transition-colors"
            >
                {showAll ? 'Hide Advanced Features' : 'Show All Features'}
            </button>
        </>
    );
}
