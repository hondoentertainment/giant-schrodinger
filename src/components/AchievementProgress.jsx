import React from 'react';
import { getNextAchievementProgress } from '../services/achievements';

export function AchievementProgress({ score, stats }) {
  const progress = getNextAchievementProgress(score, stats);
  if (!progress) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs">
      <span className="text-white/50">{progress.icon}</span>
      <span className="text-white/70">{progress.label}</span>
      <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full bg-purple-500 transition-all" style={{ width: `${progress.percent}%` }} />
      </div>
      <span className="text-white/40">{progress.current}/{progress.target}</span>
    </div>
  );
}
