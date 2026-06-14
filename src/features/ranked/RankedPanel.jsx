import React, { useState, useEffect } from 'react';
import {
  getPlayerRating,
  getRankTier,
  isPlacementComplete,
  getPlacementProgress,
  applyDecayOnLoad,
  applySeasonalReset,
  getSeasonArchive,
  getCurrentSeason,
} from '../../services/ranked';

export function RankedPanel() {
  const [decayInfo, setDecayInfo] = useState(null);
  const [seasonReset, setSeasonReset] = useState(null);
  const [archive, setArchive] = useState([]);
  const [playerData, setPlayerData] = useState(null);

  useEffect(() => {
    // Apply seasonal reset first, then decay
    const resetResult = applySeasonalReset();
    if (resetResult) setSeasonReset(resetResult);

    const decayResult = applyDecayOnLoad();
    if (decayResult) setDecayInfo(decayResult);

    setPlayerData(getPlayerRating());
    setArchive(getSeasonArchive());
  }, []);

  if (!playerData) return null;

  const tier = getRankTier(playerData.rating);
  const season = getCurrentSeason();
  const placement = getPlacementProgress();
  const placementDone = isPlacementComplete();

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center px-4">
      <h2 className="text-2xl font-display font-bold text-white mb-4">Ranked</h2>

      {seasonReset && (
        <div className="w-full p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 mb-4 text-center">
          <div className="text-2xl mb-2">🏆</div>
          <div className="text-purple-300 font-bold">New Season!</div>
          <div className="text-white/60 text-sm">
            Your rating was adjusted: {seasonReset.oldRating} → {seasonReset.newRating}
          </div>
          <div className="text-white/40 text-xs mt-1">Play 5 placement matches to calibrate</div>
        </div>
      )}

      {decayInfo && (
        <div className="w-full p-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-4">
          <div className="text-red-300 text-sm font-semibold">Rating Decay Applied</div>
          <div className="text-white/60 text-xs">
            You lost {decayInfo.decayAmount} rating from {decayInfo.daysSince} days of inactivity
            ({decayInfo.oldRating} → {decayInfo.newRating})
          </div>
        </div>
      )}

      <div className="w-full p-5 rounded-2xl bg-white/5 border border-white/10 mb-4 text-center">
        <div className="text-white/50 text-xs uppercase tracking-wider mb-1">{season.name}</div>
        <div className={`text-3xl font-bold bg-gradient-to-r ${tier.color} bg-clip-text text-transparent`}>
          {tier.name}
        </div>
        <div className="text-4xl font-bold text-white mt-1">{playerData.rating}</div>
        <div className="text-white/40 text-sm mt-1">
          {playerData.wins}W - {playerData.losses}L
        </div>
      </div>

      {!placementDone && (
        <div className="w-full p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 mb-4 text-center">
          <div className="text-yellow-300 text-sm font-semibold">Placement Matches</div>
          <div className="text-white/60 text-xs">
            {placement.completed} / {placement.total} completed
          </div>
        </div>
      )}

      {archive.length > 0 && (
        <div className="w-full mt-4">
          <div className="text-white/50 text-xs uppercase tracking-wider mb-2">Past Seasons</div>
          {archive.map((s, i) => (
            <div key={i} className="flex justify-between text-sm text-white/60 py-1">
              <span>{s.seasonId}</span>
              <span>{s.tier} ({s.finalRating})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
