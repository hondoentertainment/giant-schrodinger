import { isBackendEnabled } from '../lib/supabase';

const SERVER_SCORE_URL = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/score-submission`
  : null;

export async function scoreViaServer(submission, conceptLeft, conceptRight, difficulty = 'normal') {
  if (!SERVER_SCORE_URL || !isBackendEnabled()) return null;

  const response = await fetch(SERVER_SCORE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ conceptLeft, conceptRight, submission, difficulty }),
  });

  if (!response.ok) return null;
  return response.json();
}
