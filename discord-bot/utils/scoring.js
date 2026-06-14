/**
 * Score a player's submission for connecting two concepts.
 *
 * This is a heuristic/mock scorer that evaluates based on:
 * - Word count (longer, more thoughtful answers score higher up to a point)
 * - Mentions of the concepts themselves
 * - Punctuation and rhetorical flair
 * - Overall originality heuristic (variety of words)
 *
 * Returns { score, breakdown: { wit, logic, originality, clarity }, commentary }
 */
export function scoreConnection(submission, leftConcept, rightConcept) {
  const text = submission.trim();
  const lower = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // --- Wit (0-25) ---
  let wit = 0;
  // Reward punctuation flair
  if (text.includes('!')) wit += 4;
  if (text.includes('?')) wit += 3;
  if (text.includes('...')) wit += 3;
  if (text.includes('"') || text.includes("'")) wit += 2;
  if (text.includes('—') || text.includes('-')) wit += 2;
  // Reward moderate length (wit needs space to land)
  if (wordCount >= 5) wit += 3;
  if (wordCount >= 10) wit += 3;
  if (wordCount >= 20) wit += 2;
  // Bonus for wordplay signals
  const witWords = ['like', 'literally', 'basically', 'imagine', 'technically', 'obviously', 'actually'];
  for (const w of witWords) {
    if (lower.includes(w)) { wit += 1; break; }
  }
  wit = Math.min(25, Math.max(0, wit));

  // --- Logic (0-25) ---
  let logic = 0;
  const mentionsLeft = lower.includes(leftConcept.toLowerCase());
  const mentionsRight = lower.includes(rightConcept.toLowerCase());
  if (mentionsLeft) logic += 6;
  if (mentionsRight) logic += 6;
  if (mentionsLeft && mentionsRight) logic += 4; // bonus for referencing both
  // Connective words suggest logical structure
  const connectives = ['because', 'therefore', 'both', 'similarly', 'just like', 'the same way', 'connects', 'overlap', 'shared', 'common'];
  for (const c of connectives) {
    if (lower.includes(c)) logic += 2;
  }
  logic = Math.min(25, Math.max(0, logic));

  // --- Originality (0-25) ---
  let originality = 0;
  const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^a-z]/g, '')).filter(Boolean));
  const uniqueRatio = uniqueWords.size / Math.max(1, wordCount);
  originality += Math.round(uniqueRatio * 12);
  // Longer unique-word sets suggest more creative answers
  if (uniqueWords.size > 8) originality += 3;
  if (uniqueWords.size > 15) originality += 4;
  if (uniqueWords.size > 25) originality += 3;
  // Penalize very short answers
  if (wordCount < 3) originality = Math.max(0, originality - 5);
  originality = Math.min(25, Math.max(0, originality));

  // --- Clarity (0-25) ---
  let clarity = 0;
  // Starts with a capital letter
  if (/^[A-Z]/.test(text)) clarity += 4;
  // Ends with punctuation
  if (/[.!?]$/.test(text)) clarity += 4;
  // Reasonable sentence length
  if (wordCount >= 4 && wordCount <= 50) clarity += 6;
  if (wordCount > 50) clarity += 3; // slightly verbose
  // Contains at least one comma (structured thought)
  if (text.includes(',')) clarity += 3;
  // No ALL CAPS shouting
  if (text === text.toUpperCase() && wordCount > 2) {
    clarity -= 3;
  } else {
    clarity += 3;
  }
  clarity = Math.min(25, Math.max(0, clarity));

  const score = wit + logic + originality + clarity;

  // --- Commentary ---
  let commentary;
  if (score >= 80) {
    commentary = 'Absolutely brilliant connection! The Venn gods smile upon you.';
  } else if (score >= 60) {
    commentary = 'A solid connection — creative and well-reasoned!';
  } else if (score >= 40) {
    commentary = 'Decent overlap found. There is room to dig deeper though.';
  } else if (score >= 20) {
    commentary = 'A bit of a stretch, but we admire the effort.';
  } else {
    commentary = 'The overlap is... elusive. Perhaps try connecting the dots more explicitly?';
  }

  return {
    score,
    breakdown: { wit, logic, originality, clarity },
    commentary,
  };
}
