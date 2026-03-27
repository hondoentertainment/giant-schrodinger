import React, { useMemo } from 'react';
import { getStats } from '../../services/stats';
import { getCollisions } from '../../services/storage';
import { addCoins } from '../../services/shop';
import { Trophy, Star, CheckCircle } from 'lucide-react';

const STORAGE_KEY = 'vwf_battle_pass';
const WEEK_MASTER_BONUS = 1000;

function getWeekKey() {
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((now - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${weekNum}`;
}

function getPassData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : {};
    const weekKey = getWeekKey();
    if (data.weekKey !== weekKey) {
      return { weekKey, completed: [], weekMasterClaimed: false };
    }
    return data;
  } catch {
    return { weekKey: getWeekKey(), completed: [], weekMasterClaimed: false };
  }
}

function savePassData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // storage full
  }
}

const WEEKLY_CHALLENGES = [
  { id: 'day1', day: 'Day 1', description: 'Play 1 round today', reward: 50, check: (stats) => stats.totalRounds >= 1 },
  { id: 'day2', day: 'Day 2', description: 'Score 6+ on any round', reward: 75, check: (_, collisions) => collisions.some(c => (c.score || 0) >= 6) },
  { id: 'day3', day: 'Day 3', description: 'Play 3 rounds total', reward: 75, check: (stats) => stats.totalRounds >= 3 },
  { id: 'day4', day: 'Day 4', description: 'Score 7+ on any round', reward: 100, check: (_, collisions) => collisions.some(c => (c.score || 0) >= 7) },
  { id: 'day5', day: 'Day 5', description: 'Play 5 rounds total', reward: 100, check: (stats) => stats.totalRounds >= 5 },
  { id: 'day6', day: 'Day 6', description: 'Maintain a 2+ day streak', reward: 125, check: (stats) => stats.currentStreak >= 2 },
  { id: 'day7', day: 'Day 7', description: 'Score 8+ on any round', reward: 150, check: (_, collisions) => collisions.some(c => (c.score || 0) >= 8) },
];

export function SeasonalChallengeBattlePass() {
  const stats = useMemo(() => getStats(), []);
  const collisions = useMemo(() => getCollisions() || [], []);
  const passData = useMemo(() => getPassData(), []);

  const challengeStates = WEEKLY_CHALLENGES.map(challenge => {
    const alreadyCompleted = passData.completed.includes(challenge.id);
    const meetsCondition = challenge.check(stats, collisions);
    return {
      ...challenge,
      completed: alreadyCompleted,
      eligible: !alreadyCompleted && meetsCondition,
    };
  });

  const completedCount = challengeStates.filter(c => c.completed).length;
  const allComplete = completedCount === 7;
  const progressPct = (completedCount / 7) * 100;

  const handleClaim = (challengeId, reward) => {
    const data = getPassData();
    if (data.completed.includes(challengeId)) return;
    data.completed.push(challengeId);
    savePassData(data);
    addCoins(reward, `challenge_${challengeId}`);
    // Force re-render by dispatching storage event
    window.dispatchEvent(new Event('storage'));
  };

  const handleClaimWeekMaster = () => {
    const data = getPassData();
    if (data.weekMasterClaimed) return;
    data.weekMasterClaimed = true;
    savePassData(data);
    addCoins(WEEK_MASTER_BONUS, 'week_master_bonus');
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <div className="w-full p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-5 h-5 text-amber-400" />
        <h3 className="text-white font-bold text-sm">Weekly Challenge Pass</h3>
        <span className="ml-auto text-xs text-white/40">{getWeekKey()}</span>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-white/50 mb-1">
          <span>{completedCount}/7 challenges</span>
          {allComplete && !passData.weekMasterClaimed && (
            <span className="text-amber-400 font-bold">Week Master unlocked!</span>
          )}
        </div>
        <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-amber-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Challenge list */}
      <div className="space-y-2">
        {challengeStates.map(challenge => (
          <div
            key={challenge.id}
            className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
              challenge.completed
                ? 'bg-emerald-500/10 border border-emerald-500/20'
                : challenge.eligible
                ? 'bg-amber-500/10 border border-amber-500/20'
                : 'bg-white/5 border border-white/5'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-white/60 flex-shrink-0">
              {challenge.completed ? (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              ) : (
                challenge.day.replace('Day ', '')
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">{challenge.description}</div>
              <div className="text-white/40 text-xs">{challenge.day}</div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-amber-400 text-xs font-bold">+{challenge.reward}</span>
              {challenge.eligible && !challenge.completed && (
                <button
                  onClick={() => handleClaim(challenge.id, challenge.reward)}
                  className="px-3 py-1 rounded-lg bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 transition-colors"
                >
                  Claim
                </button>
              )}
              {challenge.completed && (
                <span className="text-emerald-400 text-xs">Done</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Week Master bonus */}
      {allComplete && !passData.weekMasterClaimed && (
        <button
          onClick={handleClaimWeekMaster}
          className="mt-3 w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <Star className="w-4 h-4" />
          Claim Week Master Badge + {WEEK_MASTER_BONUS} Coins
        </button>
      )}
      {passData.weekMasterClaimed && (
        <div className="mt-3 text-center text-amber-400 text-xs font-bold flex items-center justify-center gap-1">
          <Star className="w-4 h-4" /> Week Master Achieved!
        </div>
      )}
    </div>
  );
}
