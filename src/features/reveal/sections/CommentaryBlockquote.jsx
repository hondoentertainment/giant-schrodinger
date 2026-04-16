import React from 'react';

export function CommentaryBlockquote({ commentary, scoringMode }) {
    return (
        <blockquote className="text-xl italic text-white/80 font-serif mb-8 border-l-4 border-purple-500 pl-4 py-2 bg-white/5 rounded-r-xl">
            &ldquo;{commentary}&rdquo;
            <footer className="text-xs text-white/40 not-italic mt-2">
                — {scoringMode === 'human' ? 'Human Judge' : 'Gemini AI Host'}
            </footer>
        </blockquote>
    );
}
