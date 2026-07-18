// Discord interactions endpoint for /venn challenges.
// Set DISCORD_PUBLIC_KEY as an edge secret for signature verification in production.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const APP_URL = (Deno.env.get('APP_URL') || 'https://giant-schrodinger.vercel.app').replace(/\/$/, '');
const DISCORD_PUBLIC_KEY = Deno.env.get('DISCORD_PUBLIC_KEY') || '';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function verifyDiscordSignature(req: Request, bodyText: string): Promise<boolean> {
  if (!DISCORD_PUBLIC_KEY) {
    // Allow unsigned traffic only when no key is configured (local/dev).
    return true;
  }

  const signature = req.headers.get('X-Signature-Ed25519');
  const timestamp = req.headers.get('X-Signature-Timestamp');
  if (!signature || !timestamp) return false;

  try {
    const encoder = new TextEncoder();
    const keyData = Uint8Array.from(DISCORD_PUBLIC_KEY.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'Ed25519', namedCurve: 'Ed25519' },
      false,
      ['verify'],
    );
    const sig = Uint8Array.from(signature.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
    const message = encoder.encode(timestamp + bodyText);
    return await crypto.subtle.verify('Ed25519', key, sig, message);
  } catch {
    return false;
  }
}

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('OK');
  }

  const bodyText = await req.text();
  const valid = await verifyDiscordSignature(req, bodyText);
  if (!valid) {
    return new Response('invalid request signature', { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return json({ error: 'invalid json' }, 400);
  }

  // Discord PING
  if (body.type === 1) {
    return json({ type: 1 });
  }

  if (body.type === 2) {
    const command = (body.data as { name?: string } | undefined)?.name;
    if (command === 'venn') {
      return json({
        type: 4,
        data: {
          embeds: [{
            title: 'Venn Challenge!',
            description: 'Connect two prompts with one witty phrase — then share your score.',
            color: 0x0a84ff,
            fields: [
              { name: 'How to Play', value: 'Write the clever link between two concepts. AI, Manual, or Friend Judge can score it.' },
              { name: 'Play Now', value: `[Open Venn with Friends](${APP_URL})` },
              { name: 'Daily Venn', value: 'Complete today\'s puzzle for a 1.5× score bonus and streak credit.' },
            ],
          }],
        },
      });
    }
  }

  return new Response('OK');
});
