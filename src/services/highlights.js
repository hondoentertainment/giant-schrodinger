const STORAGE_KEY = 'vwf_highlights';
const MAX_HIGHLIGHTS = 20;
const MIN_SCORE = 8;
const MAX_AGE_DAYS = 90;
const WEEKLY_TOP = 3;

function loadHighlights() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveHighlights(highlights) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(highlights));
}

export function isHighlightWorthy(score) {
  return score >= MIN_SCORE;
}

export function autoSaveHighlight(collision) {
  if (!collision || !isHighlightWorthy(collision.score)) {
    return null;
  }

  const highlight = {
    id: collision.id,
    submission: collision.submission,
    score: collision.score,
    leftLabel: collision.leftLabel,
    rightLabel: collision.rightLabel,
    imageUrl: collision.imageUrl,
    themeId: collision.themeId,
    timestamp: Date.now(),
    playerName: collision.playerName,
  };

  const highlights = loadHighlights();

  const existingIndex = highlights.findIndex((h) => h.id === highlight.id);
  if (existingIndex !== -1) {
    highlights[existingIndex] = highlight;
  } else {
    highlights.push(highlight);
  }

  highlights.sort((a, b) => b.score - a.score);

  const trimmed = highlights.slice(0, MAX_HIGHLIGHTS);
  saveHighlights(trimmed);

  return highlight;
}

export function getHighlights() {
  const highlights = loadHighlights();
  return highlights.sort((a, b) => b.score - a.score);
}

export function getWeeklyHighlights() {
  const now = Date.now();
  const startOfWeek = now - ((new Date().getDay()) * 24 * 60 * 60 * 1000);
  const weekStart = new Date(startOfWeek);
  weekStart.setHours(0, 0, 0, 0);
  const weekStartMs = weekStart.getTime();

  const highlights = loadHighlights();
  return highlights
    .filter((h) => h.timestamp >= weekStartMs)
    .sort((a, b) => b.score - a.score)
    .slice(0, WEEKLY_TOP);
}

export function deleteHighlight(id) {
  const highlights = loadHighlights();
  const filtered = highlights.filter((h) => h.id !== id);
  saveHighlights(filtered);
  return filtered;
}

export function clearOldHighlights() {
  const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  const highlights = loadHighlights();
  const filtered = highlights.filter((h) => h.timestamp >= cutoff);
  saveHighlights(filtered);
  return filtered;
}

export function getHighlightStats() {
  const highlights = loadHighlights();
  const now = Date.now();
  const startOfWeek = now - ((new Date().getDay()) * 24 * 60 * 60 * 1000);
  const weekStart = new Date(startOfWeek);
  weekStart.setHours(0, 0, 0, 0);
  const weekStartMs = weekStart.getTime();

  const thisWeek = highlights.filter((h) => h.timestamp >= weekStartMs).length;
  const total = highlights.length;
  const avgScore = total > 0
    ? Math.round((highlights.reduce((sum, h) => sum + h.score, 0) / total) * 10) / 10
    : 0;
  const bestScore = total > 0
    ? Math.max(...highlights.map((h) => h.score))
    : 0;

  return { total, avgScore, bestScore, thisWeek };
}

export function exportHighlightData(highlight) {
  return {
    id: highlight.id,
    submission: highlight.submission,
    score: highlight.score,
    leftLabel: highlight.leftLabel,
    rightLabel: highlight.rightLabel,
    imageUrl: highlight.imageUrl,
    themeId: highlight.themeId,
    timestamp: highlight.timestamp,
    playerName: highlight.playerName,
  };
}
