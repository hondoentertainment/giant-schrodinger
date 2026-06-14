import React, { useMemo } from 'react';
import { getCollisions } from '../../services/storage';
import { getStats } from '../../services/stats';
import { getSessionMetrics, getEventCount } from '../../services/analytics';
import { getHighlightStats } from '../../services/highlights';
import { getReferralCohorts } from '../../services/referrals';
import { BarChart3 } from 'lucide-react';

export function AnalyticsView({ onBack }) {
  const stats = useMemo(() => getStats(), []);
  const collisions = useMemo(() => getCollisions() || [], []);
  const metrics = useMemo(() => getSessionMetrics(), []);
  const highlightStats = useMemo(() => getHighlightStats(), []);
  const referralCohorts = useMemo(() => getReferralCohorts(), []);

  // Calculate metrics
  const dau = collisions.filter(c => {
    const ts = c.createdAt || new Date(c.timestamp).getTime();
    return Date.now() - ts < 86400000;
  }).length;
  const wau = collisions.filter(c => {
    const ts = c.createdAt || new Date(c.timestamp).getTime();
    return Date.now() - ts < 604800000;
  }).length;
  const shareRate = metrics.totalSessions > 0 ? (metrics.shareRate * 100).toFixed(0) : 0;
  const avgScore = collisions.length
    ? (collisions.reduce((s, c) => s + (c.score || 0), 0) / collisions.length).toFixed(1)
    : 0;

  // Theme breakdown
  const themeStats = {};
  collisions.forEach(c => {
    const t = c.themeId || 'unknown';
    if (!themeStats[t]) themeStats[t] = { count: 0, totalScore: 0 };
    themeStats[t].count++;
    themeStats[t].totalScore += c.score || 0;
  });

  // Funnel: rounds -> scores -> shares
  const totalRounds = stats.totalRounds || 0;
  const totalShares = getEventCount('share_click');
  const funnelSteps = [
    { label: 'Rounds Played', value: totalRounds },
    { label: 'Scored', value: metrics.totalSessions },
    { label: 'Shared', value: totalShares },
  ];
  const funnelMax = Math.max(1, ...funnelSteps.map(s => s.value));

  // Referral cohorts summary
  const cohortEntries = Object.entries(referralCohorts);
  const totalReferrals = cohortEntries.length;
  const d1Count = cohortEntries.filter(([, c]) => c.d1).length;
  const d7Count = cohortEntries.filter(([, c]) => c.d7).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-black text-white p-4 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <button onClick={onBack} className="mb-4 text-white/50 hover:text-white">
          &larr; Back
        </button>
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <BarChart3 size={24} /> Analytics Dashboard
        </h1>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <MetricCard label="Rounds Today" value={dau} />
          <MetricCard label="This Week" value={wau} />
          <MetricCard label="Avg Score" value={avgScore} />
          <MetricCard label="Total Rounds" value={stats.totalRounds} />
        </div>

        {/* Engagement Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <MetricCard label="Share Rate" value={`${shareRate}%`} />
          <MetricCard label="Sessions" value={metrics.totalSessions} />
          <MetricCard label="Challenges Sent" value={metrics.challengesSent} />
          <MetricCard label="Dailies Done" value={metrics.dailyChallengesCompleted} />
        </div>

        {/* Funnel */}
        <h2 className="text-lg font-semibold mb-3">Engagement Funnel</h2>
        <div className="space-y-2 mb-6">
          {funnelSteps.map(step => (
            <div key={step.label} className="p-3 rounded-xl bg-white/5">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white/70">{step.label}</span>
                <span className="text-purple-400 font-bold">{step.value}</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                  style={{ width: `${(step.value / funnelMax) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Theme Performance */}
        <h2 className="text-lg font-semibold mb-3">Performance by Theme</h2>
        <div className="space-y-2 mb-6">
          {Object.entries(themeStats).map(([theme, data]) => (
            <div key={theme} className="flex justify-between p-3 rounded-xl bg-white/5">
              <span className="text-white/70 capitalize">{theme}</span>
              <span className="text-purple-400">
                {(data.totalScore / data.count).toFixed(1)} avg ({data.count} rounds)
              </span>
            </div>
          ))}
          {Object.keys(themeStats).length === 0 && (
            <div className="text-white/30 text-sm p-3">No theme data yet.</div>
          )}
        </div>

        {/* Retention */}
        <h2 className="text-lg font-semibold mb-3">Retention</h2>
        <div className="p-4 rounded-xl bg-white/5 mb-6">
          <div className="text-white/50 text-sm">
            Current Streak: {stats.currentStreak} days
          </div>
          <div className="text-white/50 text-sm">
            Best Streak: {stats.maxStreak} days
          </div>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div>
              <div className="text-white/60 text-xs uppercase">D1 Retention</div>
              <div className={`text-xl font-bold ${metrics.d1Retention ? 'text-emerald-400' : 'text-white/30'}`}>
                {metrics.d1Retention ? 'Returned' : 'Not yet'}
              </div>
            </div>
            <div>
              <div className="text-white/60 text-xs uppercase">D7 Retention</div>
              <div className={`text-xl font-bold ${metrics.d7Retention ? 'text-emerald-400' : 'text-white/30'}`}>
                {metrics.d7Retention ? 'Returned' : 'Not yet'}
              </div>
            </div>
          </div>
        </div>

        {/* Referral Cohorts */}
        <h2 className="text-lg font-semibold mb-3">Referral Cohorts</h2>
        <div className="p-4 rounded-xl bg-white/5 mb-6">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-2xl font-bold text-white">{totalReferrals}</div>
              <div className="text-white/50 text-xs">Total Referrals</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-400">{d1Count}</div>
              <div className="text-white/50 text-xs">D1 Retained</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">{d7Count}</div>
              <div className="text-white/50 text-xs">D7 Retained</div>
            </div>
          </div>
          {cohortEntries.length > 0 && (
            <div className="mt-3 space-y-1">
              {cohortEntries.slice(0, 10).map(([code, data]) => (
                <div key={code} className="flex justify-between text-sm">
                  <span className="text-white/60 font-mono">{code}</span>
                  <span className="text-white/40">
                    {data.rounds} rounds
                    {data.d1 ? ' | D1' : ''}
                    {data.d7 ? ' | D7' : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Highlights */}
        {highlightStats && (
          <>
            <h2 className="text-lg font-semibold mb-3">Highlights</h2>
            <div className="p-4 rounded-xl bg-white/5 mb-6">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-white/60 text-xs uppercase">Total Highlights</div>
                  <div className="text-xl font-bold text-white">{highlightStats.total}</div>
                </div>
                <div>
                  <div className="text-white/60 text-xs uppercase">This Week</div>
                  <div className="text-xl font-bold text-white">{highlightStats.thisWeek}</div>
                </div>
                <div>
                  <div className="text-white/60 text-xs uppercase">Best Score</div>
                  <div className="text-xl font-bold text-amber-400">{highlightStats.bestScore}/10</div>
                </div>
                <div>
                  <div className="text-white/60 text-xs uppercase">Avg Score</div>
                  <div className="text-xl font-bold text-white">{highlightStats.avgScore}</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Viral Loop */}
        <h2 className="text-lg font-semibold mb-3">Viral Loop</h2>
        <div className="p-4 rounded-xl bg-white/5 mb-6 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-white/60 text-sm">Shares</span>
            <span className="text-white font-bold">{totalShares}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/60 text-sm">Challenges Sent</span>
            <span className="text-white font-bold">{metrics.challengesSent}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/60 text-sm">K-Factor (shares/session)</span>
            <span className="text-white font-bold">
              {metrics.totalSessions > 0 ? (totalShares / metrics.totalSessions).toFixed(2) : '0.00'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-white/50 text-xs">{label}</div>
    </div>
  );
}
