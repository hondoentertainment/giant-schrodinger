import React, { useMemo } from 'react';
import { getMilestones, getStats } from '../../services/stats';
import { getCollisions } from '../../services/storage';

export function MilestoneTimeline() {
  const stats = useMemo(() => getStats(), []);
  const collisions = useMemo(() => getCollisions() || [], []);
  const milestones = useMemo(() => getMilestones().map((m) => ({
    ...m,
    field: m.type === 'rounds' ? 'totalRounds' : 'currentStreak',
    icon: m.reward === 'avatar' ? m.rewardId : '🎨',
  })), []);

  const bestScore = collisions.reduce((best, c) => Math.max(best, c.score || 0), 0);

  const achieved = milestones.filter(m => {
    if (m.field === 'bestScore') return bestScore >= m.threshold;
    return (stats[m.field] || 0) >= m.threshold;
  });

  const nextMilestone = milestones.find(m => {
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
