const TIPS = {
  round: [
    { id: 'tip_wordplay', text: 'Wordplay and puns boost your Wit score', minRounds: 0 },
    { id: 'tip_metaphor', text: 'Metaphors score high on Originality', minRounds: 3 },
    { id: 'tip_specific', text: 'Specific references beat vague connections', minRounds: 5 },
    { id: 'tip_brief', text: 'Shorter, punchier phrases score better on Clarity', minRounds: 8 },
    { id: 'tip_logic', text: 'Make sure the connection is obvious — Logic matters', minRounds: 10 },
  ],
  reveal: [
    { id: 'tip_share', text: 'Share your score to challenge friends!', minRounds: 1 },
    { id: 'tip_daily', text: 'Daily challenges give 1.5x bonus points', minRounds: 3 },
    { id: 'tip_streak', text: 'Playing daily builds your streak multiplier', minRounds: 5 },
    { id: 'tip_ranked', text: 'Try Ranked mode for competitive play', minRounds: 10 },
    { id: 'tip_battle_pass', text: 'Every round earns Battle Pass XP', minRounds: 7 },
  ],
};

export function getContextualTip(context, totalRounds) {
  const seen = getSeenTips();
  const candidates = (TIPS[context] || [])
    .filter(t => totalRounds >= t.minRounds && !seen.has(t.id));

  if (candidates.length === 0) return null;
  const tip = candidates[Math.floor(Math.random() * candidates.length)];
  return tip;
}

export function markTipSeen(tipId) {
  const seen = getSeenTips();
  seen.add(tipId);
  localStorage.setItem('venn_seen_tips', JSON.stringify([...seen]));
}

function getSeenTips() {
  try {
    return new Set(JSON.parse(localStorage.getItem('venn_seen_tips')) || []);
  } catch { return new Set(); }
}
