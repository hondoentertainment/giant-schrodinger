import React, { useMemo } from 'react';
import { getPlayerRating, getRankTier, isPlacementComplete, getPlacementProgress, getCurrentSeason, checkDecay } from '../../services/ranked';
import { ArrowLeft, Shield, AlertTriangle } from 'lucide-react';

const TIER_COLORS = {
    Bronze: 'bg-amber-600 text-amber-100',
    Silver: 'bg-gray-400 text-gray-900',
    Gold: 'bg-yellow-400 text-yellow-900',
    Platinum: 'bg-cyan-400 text-cyan-900',
    Diamond: 'bg-blue-500 text-blue-100',
    'Venn Master': 'bg-purple-500 text-purple-100',
};

const TIER_THRESHOLDS = [0, 800, 1200, 1600, 2000, 2400];

const SEASON_REWARDS = [
    { tier: 'Bronze', coins: 100, badge: 'Bronze Finisher' },
    { tier: 'Silver', coins: 250, badge: 'Silver Finisher' },
    { tier: 'Gold', coins: 500, badge: 'Gold Finisher' },
    { tier: 'Platinum', coins: 1000, badge: 'Platinum Finisher' },
    { tier: 'Diamond', coins: 2000, badge: 'Diamond Finisher' },
    { tier: 'Venn Master', coins: 5000, badge: 'Venn Master Finisher' },
];

export default function RankedPanel({ onBack }) {
    const playerRating = useMemo(() => getPlayerRating(), []);
    const placed = useMemo(() => isPlacementComplete(), []);
    const placementProgress = useMemo(() => getPlacementProgress(), []);
    const season = useMemo(() => getCurrentSeason(), []);
    const decayInfo = useMemo(() => checkDecay(), []);
    const tier = useMemo(() => getRankTier(playerRating.rating), [playerRating.rating]);

    // Calculate progress to next tier
    const currentThreshold = TIER_THRESHOLDS[tier.tier] || 0;
    const nextThreshold = TIER_THRESHOLDS[tier.tier + 1] || null;
    const progressPct = nextThreshold
        ? Math.min(100, ((playerRating.rating - currentThreshold) / (nextThreshold - currentThreshold)) * 100)
        : 100;

    // Days until season ends
    const seasonEndDate = new Date(season.endDate);
    const now = new Date();
    const daysUntilEnd = Math.max(0, Math.ceil((seasonEndDate - now) / (1000 * 60 * 60 * 24)));

    const badgeColor = TIER_COLORS[tier.name] || TIER_COLORS.Bronze;

    return (
        <div className="w-full max-w-md space-y-6 glass-panel p-8 rounded-3xl animate-in fade-in zoom-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onBack}
                    className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="Back to Lobby"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
                    <Shield className="w-6 h-6" /> Ranked
                </h2>
            </div>

            {/* Placement in progress */}
            {!placed && (
                <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/25 text-center">
                    <p className="text-white font-semibold mb-2">
                        Play {placementProgress.total - placementProgress.completed} more placement matches to get ranked!
                    </p>
                    <div className="flex gap-2 justify-center">
                        {Array.from({ length: placementProgress.total }).map((_, i) => (
                            <div
                                key={i}
                                className={`w-4 h-4 rounded-full transition-all ${
                                    i < placementProgress.completed
                                        ? 'bg-purple-400 shadow-lg shadow-purple-500/50'
                                        : 'bg-white/20'
                                }`}
                            />
                        ))}
                    </div>
                    <p className="text-white/50 text-xs mt-2">
                        {placementProgress.wins}W - {placementProgress.losses}L
                    </p>
                </div>
            )}

            {/* Current tier and rating */}
            {placed && (
                <div className="text-center space-y-3">
                    <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold ${badgeColor}`}>
                        {tier.name}
                    </span>
                    <div className="text-5xl font-black text-white">{playerRating.rating}</div>
                    <p className="text-white/50 text-sm">Rating</p>

                    {/* Progress bar to next tier */}
                    {nextThreshold ? (
                        <div>
                            <div className="flex justify-between text-xs text-white/40 mb-1">
                                <span>{currentThreshold}</span>
                                <span>{nextThreshold}</span>
                            </div>
                            <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                                <div
                                    className={`h-full rounded-full bg-gradient-to-r ${tier.color} transition-all`}
                                    style={{ width: `${progressPct}%` }}
                                />
                            </div>
                            <p className="text-white/40 text-xs mt-1">
                                {nextThreshold - playerRating.rating} points to next tier
                            </p>
                        </div>
                    ) : (
                        <p className="text-purple-300 text-sm font-semibold">Max tier reached!</p>
                    )}

                    {/* Win/loss record */}
                    <div className="flex gap-4 justify-center text-sm text-white/60">
                        <span>{playerRating.gamesPlayed} games</span>
                        <span className="text-emerald-400">{playerRating.wins}W</span>
                        <span className="text-red-400">{playerRating.losses}L</span>
                        <span>Season best: {playerRating.seasonBest}</span>
                    </div>
                </div>
            )}

            {/* Decay warning */}
            {decayInfo.decayed && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                    <div>
                        <p className="text-red-300 text-sm font-semibold">
                            You lost {decayInfo.ratingLost} rating from inactivity
                        </p>
                        <p className="text-red-300/60 text-xs">
                            {decayInfo.daysSinceLastGame} days since last game
                        </p>
                    </div>
                </div>
            )}

            {/* Season info */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                <p className="text-white font-semibold">{season.name}</p>
                <p className="text-white/50 text-sm">Week {season.weekNumber}</p>
                <p className="text-white/40 text-xs mt-1">
                    Ends in {daysUntilEnd} day{daysUntilEnd !== 1 ? 's' : ''}
                </p>
            </div>

            {/* Season rewards table */}
            <div>
                <h3 className="text-white/70 text-sm font-semibold mb-2 text-center">Season Rewards</h3>
                <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="text-left px-3 py-2 text-white/50 font-medium">Tier</th>
                                <th className="text-right px-3 py-2 text-white/50 font-medium">Coins</th>
                                <th className="text-right px-3 py-2 text-white/50 font-medium">Badge</th>
                            </tr>
                        </thead>
                        <tbody>
                            {SEASON_REWARDS.map((r) => (
                                <tr
                                    key={r.tier}
                                    className={`border-b border-white/5 ${
                                        placed && tier.name === r.tier ? 'bg-white/10' : ''
                                    }`}
                                >
                                    <td className="px-3 py-2">
                                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${TIER_COLORS[r.tier]}`}>
                                            {r.tier}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 text-right text-amber-400">{r.coins}</td>
                                    <td className="px-3 py-2 text-right text-white/70 text-xs">{r.badge}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Back to Lobby */}
            <button
                onClick={onBack}
                className="w-full py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors"
            >
                Back to Lobby
            </button>
        </div>
    );
}
