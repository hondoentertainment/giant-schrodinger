import React from 'react';

export function CoachingTips({ result }) {
    if (!result?.breakdown) return null;
    return (
        <div className="mt-3 space-y-1">
            {result.breakdown.wit < 4 && (
                <p className="text-purple-300 text-xs">Tip: Try wordplay or puns -- clever language boosts wit scores</p>
            )}
            {result.breakdown.originality < 4 && (
                <p className="text-purple-300 text-xs">Tip: Think sideways -- unexpected connections score higher on originality</p>
            )}
            {result.breakdown.logic < 4 && (
                <p className="text-purple-300 text-xs">Tip: Make the connection clearer -- the thread between concepts needs to be obvious</p>
            )}
            {result.breakdown.clarity < 4 && (
                <p className="text-purple-300 text-xs">Tip: Keep it simple -- one sentence, one idea scores better for clarity</p>
            )}
            {(result.score || result.finalScore) >= 8 && (
                <p className="text-green-300 text-xs">Great work! Your connection shows strong creative thinking</p>
            )}
        </div>
    );
}
