import React, { useState, useMemo } from 'react';
import { getAchievements, getAchievementPoints, getAchievementsByCategory, getUnlockedAchievements, getAchievementProgress } from '../../services/achievements';
import { ArrowLeft, Trophy, Lock, Star, Zap, Users, Compass, Flame, Award } from 'lucide-react';

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
                            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-purple-500/50 to-pink-500/50 transition-all"
                                    style={{ width: `${progress.percentage}%` }}
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
        return getAchievementsByCategory(activeCategory);
    }, [activeCategory, allAchievements]);

    // Achievement of the Day: most recently unlocked
    const spotlightAchievement = useMemo(() => {
        if (unlocked.length === 0) return null;
        return unlocked.reduce((latest, a) =>
            a.unlockedAt > latest.unlockedAt ? a : latest
        );
    }, [unlocked]);

    return (
        <div className="w-full max-w-2xl flex flex-col items-center animate-in fade-in duration-700">
            <div className="bg-gradient-to-br from-purple-900/30 via-indigo-900/40 to-blue-900/30 p-1 rounded-3xl backdrop-blur-3xl shadow-2xl w-full">
                <div className="glass-panel rounded-[22px] p-6">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <button
                            onClick={onBack}
                            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-white/70" />
                        </button>
                        <div className="flex-1">
                            <h2 className="text-2xl font-black text-white flex items-center gap-2">
                                <Trophy className="w-6 h-6 text-amber-400" />
                                Achievements
                            </h2>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-white/40 uppercase tracking-wider">Unlocked</div>
                            <div className="text-sm font-bold text-white/70">
                                {unlocked.length}/{allAchievements.length}
                            </div>
                        </div>
                    </div>

                    {/* Total points progress */}
                    <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20">
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
                        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-purple-500/15 to-pink-500/15 border border-purple-500/25 animate-in fade-in duration-500">
                            <div className="text-white/40 text-xs uppercase tracking-widest mb-2">
                                Achievement of the Day
                            </div>
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
                    <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 -mx-1 px-1">
                        {CATEGORIES.map((cat) => {
                            const Icon = cat.icon;
                            const isActive = activeCategory === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-xs whitespace-nowrap transition-all ${
                                        isActive
                                            ? 'bg-white/15 text-white border border-white/20'
                                            : 'bg-white/5 text-white/40 border border-white/5 hover:bg-white/10 hover:text-white/60'
                                    }`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    {cat.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Achievement cards */}
                    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
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
                            <div className="text-center py-12">
                                <Trophy className="w-12 h-12 text-white/10 mx-auto mb-4" />
                                <p className="text-white/40 text-sm">
                                    No achievements in this category yet.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
