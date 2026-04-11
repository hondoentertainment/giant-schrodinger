// send-push Edge Function — Wave 3 scaffold.
//
// STATUS: SKELETON. This function validates its inputs and the environment
// but does NOT yet actually sign and POST to the browser push endpoint.
// It returns 501 Not Implemented on a valid payload so callers can wire the
// happy-path plumbing before the real sender lands.
//
// TODO: implement VAPID-signed POST to `subscription.endpoint`. The canonical
// reference is the `web-push` npm package; in Deno we reimplement its JWT
// signing step with the Web Crypto API (importKey → sign → base64url). The
// outbound request needs:
//   - Authorization: `vapid t=<jwt>, k=<vapid-public-key-base64url>`
//   - TTL header (e.g. 60)
//   - Content-Encoding: aes128gcm (payload encryption) or omit for data-less
// For now this scaffold intentionally returns 501 so the rest of the stack
// (permissions, subscription persistence, UI toggle) can be developed first.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};

type PushSubscriptionLike = {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
};

type SendPushPayload = {
  title?: string;
  body?: string;
  url?: string;
};

type SendPushRequest = {
  subscription?: PushSubscriptionLike;
  payload?: SendPushPayload;
};

function jsonResponse(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
    },
  });
}

function isValidSubscription(sub: unknown): sub is PushSubscriptionLike {
  if (!sub || typeof sub !== "object") return false;
  const s = sub as PushSubscriptionLike;
  return typeof s.endpoint === "string" && s.endpoint.length > 0;
}

function isValidPayload(p: unknown): p is SendPushPayload {
  if (!p || typeof p !== "object") return false;
  const { title, body } = p as SendPushPayload;
  // Require at least a title or body so notifications aren't silently empty.
  return typeof title === "string" || typeof body === "string";
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  let parsed: SendPushRequest;
  try {
    parsed = (await req.json()) as SendPushRequest;
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body" });
  }

  if (!isValidSubscription(parsed.subscription)) {
    return jsonResponse(400, {
      error: "Missing or invalid `subscription.endpoint`.",
    });
  }
  if (!isValidPayload(parsed.payload)) {
    return jsonResponse(400, {
      error: "Missing or invalid `payload` — at minimum `title` or `body` is required.",
    });
  }

  // Gate on VAPID config so local dev without keys doesn't 500.
  const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY");
  if (!vapidPublic || !vapidPrivate) {
    return jsonResponse(501, {
      error: "Push sender not configured. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY via `supabase secrets set`.",
    });
  }

  // TODO: sign a VAPID JWT and POST the payload to parsed.subscription.endpoint.
  // Until that lands, the function intentionally returns 501 so callers can
  // tell the scaffold apart from a real success.
  return jsonResponse(501, {
    error: "send-push is a scaffold. Implement VAPID JWT signing + POST to endpoint before using in production.",
    received: {
      endpoint: parsed.subscription.endpoint,
      title: parsed.payload.title,
      body: parsed.payload.body,
      url: parsed.payload.url,
    },
  });
});
