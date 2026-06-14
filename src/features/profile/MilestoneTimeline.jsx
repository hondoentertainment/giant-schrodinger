import React, { useMemo } from 'react';
import { getStats } from '../../services/stats';
import { getCollisions } from '../../services/storage';

const MILESTONES = [
  { threshold: 1, field: 'totalRounds', icon: '🎮', label: 'First Round' },
  { threshold: 5, field: 'totalRounds', icon: '⭐', label: '5 Rounds Played' },
  { threshold: 10, field: 'totalRounds', icon: '🔥', label: '10 Rounds Played' },
  { threshold: 25, field: 'totalRounds', icon: '💪', label: '25 Rounds' },
  { threshold: 50, field: 'totalRounds', icon: '🏆', label: '50 Rounds' },
  { threshold: 100, field: 'totalRounds', icon: '👑', label: '100 Rounds' },
  { threshold: 3, field: 'currentStreak', icon: '📅', label: '3-Day Streak' },
  { threshold: 7, field: 'currentStreak', icon: '🗓️', label: '7-Day Streak' },
  { threshold: 14, field: 'maxStreak', icon: '📆', label: '14-Day Streak' },
];

export function MilestoneTimeline() {
  const stats = useMemo(() => getStats(), []);
  const collisions = useMemo(() => getCollisions() || [], []);

  const bestScore = collisions.reduce((best, c) => Math.max(best, c.score || 0), 0);

  const achieved = MILESTONES.filter(m => {
    if (m.field === 'bestScore') return bestScore >= m.threshold;
    return (stats[m.field] || 0) >= m.threshold;
  });

  const nextMilestone = MILESTONES.find(m => {
    if (m.field === 'bestScore') return bestScore < m.threshold;
    return (stats[m.field] || 0) < m.threshold;
  });

  return (
    <div className="w-full max-w-md">
      <h3 className="text-white/70 text-sm font-semibold mb-3">Your Journey</h3>
      <div className="space-y-2">
        {achieved.map((m, i) => (
          <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
            <span className="text-xl">{m.icon}</span>
            <span className="text-white/80 text-sm">{m.label}</span>
            <span className="ml-auto text-green-400 text-xs">✓</span>
          </div>
        ))}
        {nextMilestone && (
          <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-purple-500/20">
            <span className="text-xl opacity-50">{nextMilestone.icon}</span>
            <span className="text-white/50 text-sm">{nextMilestone.label}</span>
            <span className="ml-auto text-purple-400 text-xs">
              {stats[nextMilestone.field] || 0}/{nextMilestone.threshold}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
