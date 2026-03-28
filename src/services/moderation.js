export function flagContent(contentId, reason) {
  const flags = getFlags();
  flags.push({ contentId, reason, flaggedAt: Date.now() });
  localStorage.setItem('venn_content_flags', JSON.stringify(flags));
}

export function getFlags() {
  try { return JSON.parse(localStorage.getItem('venn_content_flags')) || []; } catch { return []; }
}

export function getFlaggedCount() { return getFlags().length; }

export function removeFlag(contentId) {
  const flags = getFlags().filter(f => f.contentId !== contentId);
  localStorage.setItem('venn_content_flags', JSON.stringify(flags));
}

export function clearFlag(contentId) {
  removeFlag(contentId);
}
