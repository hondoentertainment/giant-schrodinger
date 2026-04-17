import React, { useState } from 'react';
import { upvote, downvote, getVoteDirection } from '../../../services/votes';
import { getScoreBand } from '../../../lib/scoreBands';

function CommunityVoteButtons({ entry }) {
    const [votes, setVotes] = useState(entry.votes);
    const [direction, setDirection] = useState(() => getVoteDirection(entry.id));
    const voted = direction !== null;

    const handleUp = (e) => {
        e.stopPropagation();
        if (voted) return;
        upvote(entry.id);
        setVotes((v) => v + 1);
        setDirection('up');
    };
    const handleDown = (e) => {
        e.stopPropagation();
        if (voted) return;
        downvote(entry.id);
        setVotes((v) => v - 1);
        setDirection('down');
    };

    return (
        <div className="flex items-center gap-2 mt-2">
            <button
                onClick={handleUp}
                disabled={voted}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                    direction === 'up' ? 'bg-emerald-500/30 text-emerald-300' : 'bg-white/10 text-white/50 hover:bg-emerald-500/20 hover:text-emerald-300'
                } disabled:cursor-default`}
                aria-label="Upvote"
            >
                &#9650;
            </button>
            <span className={`text-sm font-bold ${votes > 0 ? 'text-emerald-400' : votes < 0 ? 'text-red-400' : 'text-white/50'}`}>
                {votes}
            </span>
            <button
                onClick={handleDown}
                disabled={voted}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                    direction === 'down' ? 'bg-red-500/30 text-red-300' : 'bg-white/10 text-white/50 hover:bg-red-500/20 hover:text-red-300'
                } disabled:cursor-default`}
                aria-label="Downvote"
            >
                &#9660;
            </button>
        </div>
    );
}

export function CommunityCard({ entry }) {
    const band = getScoreBand(entry.score);
    return (
        <div role="listitem" className="group relative rounded-2xl overflow-hidden glass-panel p-5 transition-transform hover:scale-[1.02]">
            <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl" role="img" aria-hidden="true">{entry.avatar}</span>
                <span className="font-bold text-white text-sm">{entry.playerName}</span>
                <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-bold capitalize bg-white/10 text-white/60 border border-white/10">
                    {entry.theme}
                </span>
            </div>
            <blockquote className="text-white/90 italic text-base mb-3 leading-relaxed">
                &ldquo;{entry.submission}&rdquo;
            </blockquote>
            <div className="text-white/40 text-xs mb-3">
                {entry.conceptLeft} &times; {entry.conceptRight}
            </div>
            <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-black text-transparent bg-clip-text bg-gradient-to-r ${band.color}`}>
                    {entry.score}/10
                </span>
                <span className="text-white/40 text-xs">{band.label}</span>
            </div>
            <CommunityVoteButtons entry={entry} />
        </div>
    );
}
