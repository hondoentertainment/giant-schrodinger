import React from 'react';
import { ArrowRight, Share2, Users } from 'lucide-react';

export function getSessionPlayCta({ isDailyChallenge, dailyPlayed }) {
    if (!dailyPlayed && !isDailyChallenge) {
        return {
            label: "Play today's pair",
            hint: null,
            startDaily: true,
        };
    }
    return {
        label: 'Play again',
        hint: isDailyChallenge || dailyPlayed ? "Come back for tomorrow's pair" : null,
        startDaily: false,
    };
}

export function SessionNextActions({
    playLabel,
    playHint,
    shareLabel = 'Share best line',
    shareDoneLabel = 'Link copied',
    inviteLabel = 'Invite friends',
    inviteDoneLabel = 'Link copied',
    shareCopied = false,
    inviteCopied = false,
    onPlay,
    onShare,
    onInvite,
    showShare = true,
    showInvite = true,
    singleCta = false,
}) {
    const showShareCta = showShare && typeof onShare === 'function';
    const showInviteCta = !singleCta && showInvite && typeof onInvite === 'function';
    const showPlayCta = !singleCta || !showShareCta;

    return (
        <div className="session-next-stack flex flex-col gap-3" data-testid="session-next-stack">
            {showPlayCta && (
                <div>
                    <button
                        type="button"
                        onClick={onPlay}
                        className="wordle-button wordle-primary w-full text-lg min-h-[52px] flex items-center justify-center gap-2"
                    >
                        <ArrowRight className="w-5 h-5" />
                        {playLabel}
                    </button>
                    {playHint && (
                        <p className="mt-2 text-center text-xs text-white/45">{playHint}</p>
                    )}
                </div>
            )}
            {showShareCta && (
                <button
                    type="button"
                    onClick={onShare}
                    className={`wordle-button w-full min-h-[49px] flex items-center justify-center gap-2 ${singleCta ? 'wordle-primary text-lg' : 'text-white/85'}`}
                    aria-label={shareCopied ? shareDoneLabel : shareLabel}
                >
                    <Share2 className="w-4 h-4" />
                    {shareCopied ? shareDoneLabel : shareLabel}
                </button>
            )}
            {showInviteCta && (
                <button
                    type="button"
                    onClick={onInvite}
                    className="min-h-[44px] text-sm text-white/55 hover:text-white underline flex items-center justify-center gap-1.5"
                    aria-label={inviteCopied ? inviteDoneLabel : 'Invite friends to a room'}
                >
                    <Users className="w-3.5 h-3.5" />
                    {inviteCopied ? inviteDoneLabel : inviteLabel}
                </button>
            )}
        </div>
    );
}
