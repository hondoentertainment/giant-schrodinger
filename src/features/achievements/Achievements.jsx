import React, { useState, useMemo } from 'react';
import { getAchievements, getAchievementPoints, getUnlockedAchievements, getAchievementProgress } from '../../services/achievements';
import { Trophy, Lock, Star, Zap, Users, Compass, Flame, Award } from 'lucide-react';
import { GameScreenShell } from '../../components/GameScreenShell';
import { EmptyState } from '../../components/EmptyState';

const CATEGORIES = [
    { id: 'ALL', label: 'All', icon: Trophy },
    { id: 'MASTERY', label: 'Mastery', icon: Star },
    { id: 'SOCIAL', label: 'Social', icon: Users },
    { id: 'EXPLORER', label: 'Explorer', icon: Compass },
    { id: 'STREAK', label: 'Streak', icon: Flame },
    { id: 'RANKED', label: 'Ranked', icon: Award },
];

function AchievementCard({ achievement }) {
    const isUnlocked = !!achievement.unlockedAt;
    const progress = getAchievementProgress(achievement.id);

    return (
        <div
            className={`p-4 rounded-xl border transition-all ${
                isUnlocked
                    ? 'bg-white/5 border-white/15 hover:bg-white/10'
                    : 'bg-white/[0.02] border-white/5 opacity-50 grayscale'
            }`}
        >
            <div className="flex items-start gap-3">
                <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0 ${
                        isUnlocked ? 'bg-white/10' : 'bg-white/5'
                    }`}
                >
                    {isUnlocked ? (
                        achievement.icon
                    ) : (
                        <Lock className="w-4 h-4 text-white/20" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <h3
                            className={`font-bold truncate ${
                                isUnlocked
                                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300'
                                    : 'text-white/30'
                            }`}
                        >
                            {achievement.name}
                        </h3>
                        <span
                            className={`text-xs font-semibold shrink-0 px-2 py-0.5 rounded-full ${
                                isUnlocked
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : 'bg-white/5 text-white/20'
                            }`}
                        >
                            {achievement.points} pts
                        </span>
                    </div>
                    <p className={`text-sm mt-0.5 ${isUnlocked ? 'text-white/50' : 'text-white/20'}`}>
                        {achievement.description}
                    </p>

                    {/* Progress bar for incomplete achievements */}
                    {!isUnlocked && progress.target > 0 && (
                        <div className="mt-2">
                            <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-white/25">
                                    {progress.current}/{progress.target}
                                </span>
                                <span className="text-white/25">{progress.percentage}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: `${progress.percentage}%`,
                                        background: 'linear-gradient(90deg, #0a84ff, #64d2ff)',
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {isUnlocked && (
                        <div className="text-xs text-white/20 mt-1.5">
                            Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export function Achievements({ onBack }) {
    const [activeCategory, setActiveCategory] = useState('ALL');

    const allAchievements = useMemo(() => getAchievements(), []);
    const totalPoints = useMemo(() => getAchievementPoints(), []);
    const unlocked = useMemo(() => getUnlockedAchievements(), []);

    const maxPoints = useMemo(
        () => allAchievements.reduce((sum, a) => sum + a.points, 0),
        [allAchievements]
    );

    const pointsPercentage = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;

    const filteredAchievements = useMemo(() => {
        if (activeCategory === 'ALL') return allAchievements;
        return allAchievements.filter(a => a.category === activeCategory);
    }, [activeCategory, allAchievements]);

    // Achievement of the Day: most recently unlocked
    const spotlightAchievement = useMemo(() => {
        if (unlocked.length === 0) return null;
        return unlocked.reduce((latest, a) =>
            a.unlockedAt > latest.unlockedAt ? a : latest
        );
    }, [unlocked]);

    return (
        <GameScreenShell
            onBack={onBack}
            title="Achievements"
            icon={Trophy}
            backLabel="Back to lobby"
            badge={(
                <div className="text-right">
                    <div className="game-section-label normal-case tracking-normal text-[10px]">Unlocked</div>
                    <div className="text-sm font-bold text-white/70 tabular-nums">
                        {unlocked.length}/{allAchievements.length}
                    </div>
                </div>
            )}
        >
                    <div className="mb-6 p-4 rounded-[22px] bg-amber-500/10 border border-amber-400/20">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-amber-400" />
                                <span className="text-sm font-semibold text-amber-300">
                                    Achievement Points
                                </span>
                            </div>
                            <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-200">
                                {totalPoints}/{maxPoints}
                            </span>
                        </div>
                        <div className="h-2.5 rounded-full bg-black/20 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500"
                                style={{ width: `${pointsPercentage}%` }}
                            />
                        </div>
                        <div className="text-xs text-amber-300/50 mt-1.5 text-right">
                            {pointsPercentage}% complete
                        </div>
                    </div>

                    {/* Achievement of the Day spotlight */}
                    {spotlightAchievement && (
                        <div className="mb-6 p-4 rounded-[22px] game-highlight-banner text-left animate-in fade-in duration-500">
                            <div className="game-section-label mb-2">Spotlight</div>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl">
                                    {spotlightAchievement.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300 text-lg">
                                        {spotlightAchievement.name}
                                    </div>
                                    <div className="text-white/50 text-sm">
                                        {spotlightAchievement.description}
                                    </div>
                                </div>
                                <div className="text-amber-300 font-bold text-sm shrink-0">
                                    +{spotlightAchievement.points} pts
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Category tabs */}
                    <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 -mx-1 px-1" role="tablist" aria-label="Achievement categories">
                        {CATEGORIES.map((cat) => {
                            const Icon = cat.icon;
                            const isActive = activeCategory === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    role="tab"
                                    id={`achievement-tab-${cat.id}`}
                                    aria-selected={isActive}
                                    aria-controls="achievement-panel"
                                    className={`game-segment whitespace-nowrap ${isActive ? 'game-segment-selected' : ''}`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    {cat.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Achievement cards */}
                    <div
                        id="achievement-panel"
                        role="tabpanel"
                        aria-labelledby={`achievement-tab-${activeCategory}`}
                        className="space-y-2 max-h-[420px] overflow-y-auto pr-1"
                    >
                        {filteredAchievements.length > 0 ? (
                            filteredAchievements.map((achievement, idx) => (
                                <div
                                    key={achievement.id}
                                    className="animate-in slide-in-from-bottom-2 duration-500"
                                    style={{ animationDelay: `${idx * 40}ms` }}
                                >
                                    <AchievementCard achievement={achievement} />
                                </div>
                            ))
                        ) : (
                            <EmptyState
                                icon="🎯"
                                title="Nothing here yet"
                                description="Keep playing to unlock achievements in this category."
                            />
                        )}
                    </div>
        </GameScreenShell>
    );
}
