import React from 'react';
import { getConnectionExplanation } from '../../../services/aiFeatures';

export function ConnectionExplanation({ result, submission, assets }) {
    if (!result || !assets?.left?.label || !assets?.right?.label) return null;
    return (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
            <div className="text-blue-300 text-xs uppercase tracking-wider font-bold mb-2">Why this score?</div>
            <p className="text-white/70 text-sm leading-relaxed">
                {getConnectionExplanation(submission, result.finalScore || result.score, assets.left.label, assets.right.label)}
            </p>
        </div>
    );
}
