import React from 'react';
import { ThumbsUp } from 'lucide-react';
import { ConnectionBanner } from '../ConnectionBanner';
import { LeaveRoomBar } from './SharedRevealHeader';

export function VotingPhase({
    scored,
    playerName,
    hasVoted,
    isHost,
    onVote,
    onFinishVoting,
    onLeave,
}) {
    return (
        <div className="w-full max-w-4xl flex flex-col items-center animate-in fade-in duration-500">
            <ConnectionBanner />
            <LeaveRoomBar onLeave={onLeave} />
            <div className="wordle-card w-full p-8">
                    <div className="text-center mb-8">
                        <div className="inline-block px-4 py-1 rounded-full bg-game-accent/15 text-sm font-bold tracking-widest text-game-accent mb-4 border border-game-accent/20">
                            VOTE FOR THE BEST
                        </div>
                        <h2 className="text-2xl font-display font-bold text-white mb-2">
                            Which connection is the best?
                        </h2>
                        <p className="text-white/40 text-sm">
                            {hasVoted ? 'You\'ve voted! Waiting for results...' : 'Tap the one you think deserves to win (you can\'t vote for yourself)'}
                        </p>
                    </div>

                    <div className="space-y-3">
                        {scored.map((entry) => {
                            const isOwnSubmission = entry.player_name === playerName;
                            const canVote = !hasVoted && !isOwnSubmission;
                            return (
                                <button
                                    key={entry.id}
                                    onClick={() => canVote && onVote(entry.id)}
                                    disabled={!canVote}
                                    className={`w-full text-left rounded-2xl border p-5 transition-all ${
                                        canVote
                                            ? 'hover:bg-white/10 hover:border-game-accent/40 cursor-pointer'
                                            : isOwnSubmission
                                            ? 'opacity-50 cursor-not-allowed'
                                            : 'cursor-default'
                                    } ${
                                        entry.voteCount > 0
                                            ? 'bg-game-accent/10 border-game-accent/30'
                                            : 'bg-white/5 border-white/10'
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-2xl">{entry.avatar}</span>
                                        <div className="flex-1">
                                            <span className="text-white font-bold">{entry.player_name}</span>
                                            {isOwnSubmission && <span className="text-white/30 text-xs ml-2">(you)</span>}
                                            <p className="text-white/70 italic text-lg mt-1">&ldquo;{entry.submission}&rdquo;</p>
                                        </div>
                                        {entry.voteCount > 0 && (
                                            <div className="flex items-center gap-1 text-game-accent">
                                                <ThumbsUp className="w-5 h-5" />
                                                <span className="font-bold">{entry.voteCount}</span>
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {isHost && (
                        <button
                            type="button"
                            onClick={onFinishVoting}
                            className="mt-6 w-full wordle-button wordle-primary"
                        >
                            End Voting &amp; Show Results
                        </button>
                    )}
            </div>
        </div>
    );
}
