// This Edge Function handles server-side scoring to prevent client-side cheating.
// Deploy with: supabase functions deploy score-submission

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

interface ScoreRequest {
  conceptLeft: string;
  conceptRight: string;
  submission: string;
  userId: string;
  difficulty: string;
}

serve(async (req: Request) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const { conceptLeft, conceptRight, submission, userId, difficulty }: ScoreRequest = await req.json();

    // Validate input
    if (!conceptLeft || !conceptRight || !submission) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Rate limit: max 12 submissions per minute per user
    // (Would check against a rate limit table or Redis)

    // Call Gemini API server-side (API key is in Edge Function secrets, not exposed to client)
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

    // Score the submission using Gemini
    // ... (same logic as client-side gemini.js but runs server-side)

    // Store the round result in the database
    // ... (insert into rounds table)

    // Return the verified score
    return new Response(JSON.stringify({
      score: { wit: 0, logic: 0, originality: 0, clarity: 0, finalScore: 0 },
      roundId: 'uuid',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
