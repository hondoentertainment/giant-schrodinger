const WEEKLY_EVENTS = [
  { id: 'theme-week-ocean', name: 'Ocean Week', description: 'All concepts from the deep blue', themeId: 'ocean', modifier: null },
  { id: 'theme-week-neon', name: 'Neon Nights Week', description: 'City lights and electric dreams', themeId: 'neon', modifier: null },
  { id: 'speed-week', name: 'Speed Week', description: 'Every round is a speed round!', themeId: null, modifier: 'speed' },
  { id: 'double-week', name: 'Double or Nothing Week', description: 'Score 7+ or lose it all', themeId: null, modifier: 'doubleOrNothing' },
  { id: 'nature-week', name: 'Wild Nature Week', description: 'Connect the natural world', themeId: 'nature', modifier: null },
  { id: 'retro-week', name: 'Retro Tech Week', description: 'Blast from the past', themeId: 'retro-tech', modifier: null },
  { id: 'community-challenge', name: 'Community Challenge', description: 'One impossible pair — global leaderboard', themeId: null, modifier: null },
];

export function getCurrentWeeklyEvent() {
  const now = new Date();
  const weekOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000));
  return WEEKLY_EVENTS[weekOfYear % WEEKLY_EVENTS.length];
}

export function getTimeUntilNextWeek() {
  const now = new Date();
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + ((8 - now.getDay()) % 7 || 7));
  nextMonday.setHours(0, 0, 0, 0);
  return nextMonday - now;
}

export function formatWeeklyCountdown(ms) {
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return days > 0 ? `${days}d ${hours}h` : `${hours}h`;
}
