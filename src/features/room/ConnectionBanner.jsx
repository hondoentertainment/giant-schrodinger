import React from 'react';
import { useRoom } from '../../context/RoomContext';
import { t } from '../../lib/i18n';

const SYNC_MESSAGE_KEYS = {
    syncing: 'room.syncing',
    finalizing: 'room.finalizing',
    recovered: 'room.recovered',
    waiting_votes: 'room.waitingVotes',
};

export function ConnectionBanner() {
    const {
        connectionState,
        roomSyncState,
        roomClosureReason,
        joinedMidRound,
        joinPhase,
        attemptReconnect,
        leaveCurrentRoom,
        room,
        votes,
        submissions,
    } = useRoom();

    const scoringMode = room?.scoring_mode || 'ai';
    const isHumanScoring = scoringMode === 'human';
    const roomPhase = room?.status;
    const expectedVotes = Math.max(submissions.length, 0);
    const waitingForVotes = isHumanScoring
        && (roomPhase === 'revealing' || roomPhase === 'results')
        && submissions.length > 0
        && votes.length < expectedVotes;

    const pendingVoterNames = waitingForVotes
        ? submissions
            .map((entry) => entry.player_name)
            .filter((name) => !votes.some((vote) => vote.voter_name === name))
        : [];

    if (roomClosureReason === 'host_left') {
        return (
            <div
                className="w-full py-2.5 px-4 text-sm font-semibold text-center rounded-2xl mb-4 border bg-amber-500/12 border-amber-400/25 text-amber-100"
                role="alert"
                aria-live="assertive"
            >
                {t('room.hostLeft')}{' '}
                <button
                    type="button"
                    onClick={leaveCurrentRoom}
                    className="underline underline-offset-2 min-h-[44px] inline-flex items-center"
                >
                    {t('room.returnToLobby')}
                </button>
            </div>
        );
    }

    const lateJoinBanner = joinedMidRound ? (
        <div
            className="w-full py-2.5 px-4 text-sm font-semibold text-center rounded-2xl mb-4 border bg-indigo-500/12 border-indigo-400/25 text-indigo-100"
            role="status"
            aria-live="polite"
        >
            {joinPhase === 'results' || joinPhase === 'finished'
                ? t('room.joinedAtResults')
                : joinPhase === 'revealing'
                ? t('room.joinedDuringVoting')
                : t('room.joinedMidRound')}
        </div>
    ) : null;

    if (connectionState === 'connected' && roomSyncState === 'idle' && !waitingForVotes) {
        return lateJoinBanner;
    }

    const syncKey = SYNC_MESSAGE_KEYS[roomSyncState] || (waitingForVotes ? SYNC_MESSAGE_KEYS.waiting_votes : null);
    const syncMessage = syncKey ? t(syncKey) : null;

    if (connectionState === 'connected' && syncMessage) {
        const tone = roomSyncState === 'recovered'
            ? 'bg-emerald-500/12 border-emerald-400/25 text-emerald-200'
            : roomSyncState === 'finalizing'
            ? 'bg-purple-500/12 border-purple-400/25 text-purple-200'
            : 'bg-sky-500/12 border-sky-400/25 text-sky-200';

        return (
            <>
                {lateJoinBanner}
                <div className={`w-full py-2.5 px-4 text-sm font-semibold text-center rounded-2xl mb-4 border ${tone}`} role="status" aria-live="polite">
                    {syncMessage}
                    {waitingForVotes && pendingVoterNames.length > 0 && (
                        <span className="block mt-1 font-normal text-xs opacity-90">
                            Still need to vote: {pendingVoterNames.join(', ')} ({votes.length}/{expectedVotes})
                        </span>
                    )}
                </div>
            </>
        );
    }

    const staleVoteNote = waitingForVotes && connectionState !== 'connected' ? (
        <div className="w-full py-2 px-4 text-xs text-center text-amber-100/80 mb-2" role="status">
            {t('room.votesMayBeStale')}
        </div>
    ) : null;

    return (
        <>
            {lateJoinBanner}
            {staleVoteNote}
            <div className={`w-full py-2.5 px-4 text-sm font-semibold text-center rounded-2xl mb-4 ${
                connectionState === 'reconnecting'
                    ? 'bg-amber-500/12 border border-amber-400/25 text-amber-200'
                    : 'bg-red-500/12 border border-red-400/25 text-red-200'
            }`} role="status" aria-live="polite">
                {connectionState === 'reconnecting' ? (
                    <span>{t('room.reconnecting')} <span className="animate-pulse">●</span></span>
                ) : (
                    <span>
                        {t('room.disconnected')}{' '}
                        <button type="button" onClick={() => attemptReconnect()} className="underline underline-offset-2 min-h-[44px] inline-flex items-center">{t('room.retry')}</button>
                        {' or '}
                        <button type="button" onClick={leaveCurrentRoom} className="underline underline-offset-2 min-h-[44px] inline-flex items-center">{t('room.leaveRoom')}</button>
                    </span>
                )}
            </div>
        </>
    );
}
