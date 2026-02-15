export function getScoreBand(score) {
    if (score >= 9) return { label: 'Amazing!', color: 'from-amber-300 to-yellow-500' };
    if (score >= 7) return { label: 'Great', color: 'from-emerald-400 to-teal-500' };
    if (score >= 4) return { label: 'Solid', color: 'from-blue-400 to-indigo-500' };
    return { label: 'Room to grow', color: 'from-slate-400 to-slate-500' };
}
