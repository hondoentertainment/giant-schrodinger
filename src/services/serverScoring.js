import { isBackendEnabled } from '../lib/supabase';
import { logError } from './errorMonitoring';

const SERVER_SCORE_URL = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/score-submission`
  : null;

function getConceptLabel(concept, fallback) {
  if (typeof concept === 'string') return concept;
  return concept?.label || fallback;
}

export async function scoreViaServer(submission, conceptLeft, conceptRight, difficulty = 'normal') {
  if (!SERVER_SCORE_URL || !isBackendEnabled()) return null;

  const leftLabel = getConceptLabel(conceptLeft, 'left concept');
  const rightLabel = getConceptLabel(conceptRight, 'right concept');

  let response;
  try {
    response = await fetch(SERVER_SCORE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        conceptLeft: leftLabel,
        conceptRight: rightLabel,
        submission,
        difficulty,
      }),
    });
  } catch (err) {
    logError({
      message: 'serverScoring.fetch failed: ' + err.message,
      source: 'serverScoring',
    });
    return null;
  }

  if (response.status === 401 || response.status === 403) {
    logError({
      message: `serverScoring.auth ${response.status}`,
      source: 'serverScoring',
    });
    return null;
  }

  if (!response.ok) return null;

  try {
    return await response.json();
  } catch (err) {
    logError({
      message: 'serverScoring.json parse failed: ' + err.message,
      source: 'serverScoring',
    });
    return null;
  }
}
