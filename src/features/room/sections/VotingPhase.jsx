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
            <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 p-1 rounded-3xl backdrop-blur-3xl shadow-2xl w-full">
                <div className="glass-panel rounded-[22px] p-8">
                    <div className="text-center mb-8">
                        <div className="inline-block px-4 py-1 rounded-full bg-purple-500/20 text-sm font-bold tracking-widest text-purple-300 mb-4 border border-purple-500/20">
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
                                            ? 'hover:bg-white/10 hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] cursor-pointer'
                                            : isOwnSubmission
                                            ? 'opacity-50 cursor-not-allowed'
                                            : 'cursor-default'
                                    } ${
                                        entry.voteCount > 0
                                            ? 'bg-purple-500/10 border-purple-500/30'
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
                                            <div className="flex items-center gap-1 text-purple-400">
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
                            onClick={onFinishVoting}
                            className="mt-6 w-full py-3 bg-white/10 text-white font-semibold rounded-full hover:bg-white/20 transition-colors border border-white/20"
                        >
                            End Voting &amp; Show Results
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
