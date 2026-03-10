import { loadJSON, saveJSON, generateId as _genId } from '../lib/storage';

const STORAGE_KEY = 'vwf_custom_themes';
const STATS_KEY = 'vwf_theme_stats';

function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generateId() {
  return _genId('theme_');
}

function loadThemes() {
  return loadJSON(STORAGE_KEY, []);
}

function saveThemes(themes) {
  saveJSON(STORAGE_KEY, themes);
}

function loadStats() {
  return loadJSON(STATS_KEY, {});
}

function saveStats(stats) {
  saveJSON(STATS_KEY, stats);
}

export function calculateMultiplier(timerSeconds) {
  return Math.max(1.0, Math.min(1.3, 1 + (60 - timerSeconds) / 100));
}

export function createCustomTheme({ name, colorPalette, timerSeconds, multiplier, imageUrls, creatorName }) {
  const clampedTimer = Math.max(30, Math.min(90, timerSeconds ?? 60));
  const autoMultiplier = calculateMultiplier(clampedTimer);
  const finalMultiplier = multiplier != null
    ? Math.max(1.0, Math.min(1.3, multiplier))
    : autoMultiplier;

  const themes = loadThemes();

  let code = generateCode();
  while (themes.some((t) => t.code === code)) {
    code = generateCode();
  }

  const theme = {
    id: generateId(),
    name: name || 'Untitled Theme',
    code,
    colorPalette: colorPalette || 'from-red-500 to-orange-500',
    timerSeconds: clampedTimer,
    multiplier: finalMultiplier,
    imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
    creatorName: creatorName || 'Anonymous',
    createdAt: Date.now(),
    playCount: 0,
  };

  themes.push(theme);
  saveThemes(themes);

  return theme;
}

export function getCustomThemes() {
  return loadThemes();
}

export function getThemeByCode(code) {
  if (!code) return null;
  const themes = loadThemes();
  return themes.find((t) => t.code === code.toUpperCase()) || null;
}

export function deleteCustomTheme(themeId) {
  const themes = loadThemes();
  const filtered = themes.filter((t) => t.id !== themeId);
  saveThemes(filtered);

  const stats = loadStats();
  delete stats[themeId];
  saveStats(stats);
}

export function shareThemeUrl(code) {
  const base = window.location.origin + window.location.pathname;
  return `${base}#theme=${code}`;
}

export function parseThemeFromUrl() {
  const hash = window.location.hash;
  const match = hash.match(/theme=([A-Z]{6})/i);
  return match ? match[1].toUpperCase() : null;
}

export function clearThemeFromUrl() {
  if (window.location.hash.includes('theme=')) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
}

export function getThemeStats(themeId) {
  const stats = loadStats();
  const entry = stats[themeId];
  if (!entry) {
    return { playCount: 0, avgScore: 0, totalRounds: 0 };
  }
  return {
    playCount: entry.playCount || 0,
    avgScore: entry.totalRounds > 0 ? Math.round(entry.totalScore / entry.totalRounds) : 0,
    totalRounds: entry.totalRounds || 0,
  };
}

export function recordThemePlay(themeId, score) {
  const stats = loadStats();
  if (!stats[themeId]) {
    stats[themeId] = { playCount: 0, totalScore: 0, totalRounds: 0 };
  }
  stats[themeId].playCount += 1;
  stats[themeId].totalScore += score || 0;
  stats[themeId].totalRounds += 1;
  saveStats(stats);

  const themes = loadThemes();
  const theme = themes.find((t) => t.id === themeId);
  if (theme) {
    theme.playCount = stats[themeId].playCount;
    saveThemes(themes);
  }
}

export function getFeaturedThemes() {
  const themes = loadThemes();
  return themes
    .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
    .slice(0, 10);
}
