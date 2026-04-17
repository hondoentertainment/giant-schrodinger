import React, { useState } from 'react';
import { upvote, downvote, getVotes, getVoteDirection } from '../../../services/votes';

export function VoteButtons({ collisionId }) {
    const [votes, setVotesState] = useState(() => getVotes(collisionId));
    const [direction, setDirection] = useState(() => getVoteDirection(collisionId));
    const voted = direction !== null;

    const handleUpvote = (e) => {
        e.stopPropagation();
        if (voted) return;
        upvote(collisionId);
        setVotesState(getVotes(collisionId));
        setDirection('up');
    };
    const handleDownvote = (e) => {
        e.stopPropagation();
        if (voted) return;
        downvote(collisionId);
        setVotesState(getVotes(collisionId));
        setDirection('down');
    };

    return (
        <div className="flex items-center gap-2 mt-1">
            <button
                onClick={handleUpvote}
                disabled={voted}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                    direction === 'up' ? 'bg-emerald-500/30 text-emerald-300' : 'bg-white/10 text-white/50 hover:bg-emerald-500/20 hover:text-emerald-300'
                } disabled:cursor-default`}
                aria-label="Upvote"
            >
                ▲ {votes.up}
            </button>
            <button
                onClick={handleDownvote}
                disabled={voted}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                    direction === 'down' ? 'bg-red-500/30 text-red-300' : 'bg-white/10 text-white/50 hover:bg-red-500/20 hover:text-red-300'
                } disabled:cursor-default`}
                aria-label="Downvote"
            >
                ▼ {votes.down}
            </button>
            {votes.score !== 0 && (
                <span className={`text-xs font-bold ${votes.score > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {votes.score > 0 ? '+' : ''}{votes.score}
                </span>
            )}
        </div>
    );
}
