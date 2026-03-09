/**
 * AI-powered features for the game.
 * Provides difficulty management, AI opponent simulation,
 * connection explanations, trending data, and personal insights.
 */

const STORAGE_KEY = 'vwf_ai_settings';

const DIFFICULTY_CONFIGS = {
  easy: {
    label: 'Easy',
    description: 'Lenient scoring - great for beginners',
    scoringStrictness: 0.7,
    timeBonus: 15,
  },
  normal: {
    label: 'Normal',
    description: 'Standard scoring',
    scoringStrictness: 1.0,
    timeBonus: 0,
  },
  hard: {
    label: 'Hard',
    description: 'Strict scoring - requires true wit',
    scoringStrictness: 1.3,
    timeBonus: -10,
  },
};

/**
 * Returns the current AI difficulty setting from localStorage.
 * Defaults to 'normal' if not set.
 * @returns {'easy'|'normal'|'hard'}
 */
export function getAIDifficulty() {
  try {
    const settings = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (settings && settings.difficulty) {
      return settings.difficulty;
    }
  } catch {
    // ignore parse errors
  }
  return 'normal';
}

/**
 * Saves the AI difficulty preference to localStorage.
 * @param {'easy'|'normal'|'hard'} difficulty
 */
export function setAIDifficulty(difficulty) {
  const valid = ['easy', 'normal', 'hard'];
  if (!valid.includes(difficulty)) {
    return;
  }
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    existing.difficulty = difficulty;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ difficulty }));
  }
}

/**
 * Returns the configuration object for a given difficulty level.
 * @param {'easy'|'normal'|'hard'} difficulty
 * @returns {{ label: string, description: string, scoringStrictness: number, timeBonus: number }}
 */
export function getDifficultyConfig(difficulty) {
  return DIFFICULTY_CONFIGS[difficulty] || DIFFICULTY_CONFIGS.normal;
}

/**
 * Generates a mock AI opponent connection between two concepts.
 * @param {string} leftConcept
 * @param {string} rightConcept
 * @returns {{ connection: string, confidence: number }}
 */
export function generateAIConnection(leftConcept, rightConcept) {
  const templates = [
    `Both ${leftConcept} and ${rightConcept} share a hidden duality`,
    `${leftConcept} transforms into ${rightConcept} through perspective`,
    `The essence of ${leftConcept} mirrors ${rightConcept} in unexpected ways`,
    `${leftConcept} and ${rightConcept} are two sides of the same coin`,
    `Where ${leftConcept} ends, ${rightConcept} begins`,
  ];

  const index = (leftConcept.length + rightConcept.length) % templates.length;
  const connection = templates[index];
  const confidence = 0.6 + ((leftConcept.length * rightConcept.length) % 35) / 100;

  return {
    connection,
    confidence: Math.min(confidence, 0.95),
  };
}

/**
 * Returns a simulated AI opponent score based on difficulty.
 * Easy AI: random 3-7, Normal AI: random 5-8, Hard AI: random 7-10.
 * @param {'easy'|'normal'|'hard'} difficulty
 * @returns {{ score: number, responseTime: number }}
 */
export function getAIOpponentResult(difficulty) {
  const ranges = {
    easy: { min: 3, max: 7 },
    normal: { min: 5, max: 8 },
    hard: { min: 7, max: 10 },
  };

  const range = ranges[difficulty] || ranges.normal;
  const score = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
  const responseTime = 2000 + Math.floor(Math.random() * 3000);

  return { score, responseTime };
}

/**
 * Returns a suggested difficulty based on the player's historical stats.
 * @param {{ averageScore?: number, gamesPlayed?: number, winRate?: number }} playerStats
 * @returns {'easy'|'medium'|'hard'}
 */
export function getSmartPromptDifficulty(playerStats) {
  if (!playerStats || typeof playerStats !== 'object') {
    return 'easy';
  }

  const { averageScore = 0, gamesPlayed = 0, winRate = 0 } = playerStats;

  if (gamesPlayed < 3 || averageScore < 4) {
    return 'easy';
  }

  if (averageScore >= 7 && gamesPlayed >= 10 && winRate >= 0.6) {
    return 'hard';
  }

  return 'medium';
}

/**
 * Returns a template-based explanation of a submitted connection.
 * @param {string} submission - The player's connection text
 * @param {number} score - The score received (1-10)
 * @param {string} leftLabel - The left concept label
 * @param {string} rightLabel - The right concept label
 * @returns {string}
 */
export function getConnectionExplanation(submission, score, leftLabel, rightLabel) {
  if (score >= 9) {
    return `Brilliant! The connection between ${leftLabel} and ${rightLabel} through '${submission}' shows exceptional creativity. This is the kind of lateral thinking that sets great minds apart.`;
  }

  if (score >= 7) {
    return `Solid connection! You found a meaningful link between ${leftLabel} and ${rightLabel}. '${submission}' demonstrates good creative thinking.`;
  }

  if (score >= 5) {
    return `Decent attempt. The connection between ${leftLabel} and ${rightLabel} is there but could be stronger. '${submission}' works, but dig deeper for a more surprising link.`;
  }

  return `This one's a stretch. Try finding a more direct or surprising link between ${leftLabel} and ${rightLabel}. '${submission}' doesn't quite bridge the gap.`;
}

/**
 * Returns mock trending connection styles.
 * @returns {Array<{ style: string, popularity: number, example: string }>}
 */
export function getTrendingConnections() {
  const trends = [
    {
      style: 'Metaphorical Bridges',
      popularity: 87,
      example: 'Linking through shared symbolism',
    },
    {
      style: 'Opposite Attraction',
      popularity: 74,
      example: 'Finding unity in contrasts',
    },
    {
      style: 'Historical Parallels',
      popularity: 65,
      example: 'Drawing on shared historical context',
    },
    {
      style: 'Emotional Resonance',
      popularity: 58,
      example: 'Connecting through shared feelings',
    },
    {
      style: 'Scientific Analogies',
      popularity: 42,
      example: 'Using scientific principles as bridges',
    },
  ];

  return trends;
}

/**
 * Returns personalized insights about the player's patterns.
 * @param {{ totalGames?: number, scores?: number[], bestDay?: string, bestTheme?: string, weeklyScores?: number[] }} stats
 * @param {{ dailyBreakdown?: object, themePerformance?: object }} analytics
 * @returns {string[]}
 */
export function getPersonalInsights(stats, analytics) {
  const insights = [];

  if (!stats || typeof stats !== 'object') {
    return ['Play a few games to unlock personalized insights!'];
  }

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Best day insight
  if (stats.bestDay !== undefined && stats.bestDay !== null) {
    const dayName = typeof stats.bestDay === 'number' ? days[stats.bestDay] : stats.bestDay;
    insights.push(`You're most creative on ${dayName}`);
  } else if (analytics && analytics.dailyBreakdown) {
    const breakdown = analytics.dailyBreakdown;
    let bestDay = null;
    let bestAvg = 0;
    for (const [day, data] of Object.entries(breakdown)) {
      const avg = typeof data === 'object' ? (data.average || 0) : data;
      if (avg > bestAvg) {
        bestAvg = avg;
        bestDay = day;
      }
    }
    if (bestDay) {
      insights.push(`You're most creative on ${bestDay}`);
    }
  }

  // Best theme insight
  if (stats.bestTheme) {
    insights.push(`Your best theme is ${stats.bestTheme}`);
  } else if (analytics && analytics.themePerformance) {
    let bestTheme = null;
    let bestScore = 0;
    for (const [theme, score] of Object.entries(analytics.themePerformance)) {
      const avg = typeof score === 'object' ? (score.average || 0) : score;
      if (avg > bestScore) {
        bestScore = avg;
        bestTheme = theme;
      }
    }
    if (bestTheme) {
      insights.push(`Your best theme is ${bestTheme}`);
    }
  }

  // Weekly improvement insight
  if (stats.weeklyScores && stats.weeklyScores.length >= 2) {
    const recent = stats.weeklyScores[stats.weeklyScores.length - 1];
    const previous = stats.weeklyScores[stats.weeklyScores.length - 2];
    if (previous > 0) {
      const change = Math.round(((recent - previous) / previous) * 100);
      if (change > 0) {
        insights.push(`You've improved ${change}% this week`);
      } else if (change < 0) {
        insights.push(`Your scores dipped ${Math.abs(change)}% this week - time for a comeback!`);
      } else {
        insights.push(`You're holding steady this week - consistency is key!`);
      }
    }
  }

  // Games played milestone
  if (stats.totalGames) {
    if (stats.totalGames >= 100) {
      insights.push('You are a seasoned veteran with over 100 games played!');
    } else if (stats.totalGames >= 50) {
      insights.push('You are building an impressive track record with 50+ games!');
    } else if (stats.totalGames >= 10) {
      insights.push(`You've played ${stats.totalGames} games - keep the streak going!`);
    }
  }

  if (insights.length === 0) {
    insights.push('Play a few more games to unlock personalized insights!');
  }

  return insights;
}

/**
 * Returns today's mock global creativity index, seeded by the current date.
 * The value falls in the range 6.0 - 8.5.
 * @returns {{ score: number, date: string }}
 */
export function getGlobalCreativityIndex() {
  const today = new Date();
  const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Simple seeded pseudo-random based on date characters
  let seed = 0;
  for (let i = 0; i < dateString.length; i++) {
    seed = ((seed << 5) - seed + dateString.charCodeAt(i)) | 0;
  }

  // Normalize to 0-1 range using absolute value and modulo
  const normalized = (Math.abs(seed) % 10000) / 10000;

  // Map to 6.0 - 8.5 range
  const score = 6.0 + normalized * 2.5;

  return {
    score: Math.round(score * 10) / 10,
    date: dateString,
  };
}
