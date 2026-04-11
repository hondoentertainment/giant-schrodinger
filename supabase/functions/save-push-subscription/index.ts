// save-push-subscription Edge Function — Wave 3 scaffold.
//
// STATUS: SKELETON. Validates input shape and auth environment; does NOT yet
// insert into the `push_subscriptions` table. Returns 200 when a service
// role key is available (simulating a successful upsert) and 501 otherwise.
//
// TODO: perform an actual upsert via the Supabase client on conflict
// (endpoint) updating the subscription blob and touching updated_at. The
// matching migration `20260101001300_create_push_subscriptions.sql` defines
// the target table shape.

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

type SaveRequest = {
  subscription?: PushSubscriptionLike;
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

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  let parsed: SaveRequest;
  try {
    parsed = (await req.json()) as SaveRequest;
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body" });
  }

  if (!isValidSubscription(parsed.subscription)) {
    return jsonResponse(400, {
      error: "Missing or invalid `subscription.endpoint`.",
    });
  }

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceRoleKey) {
    return jsonResponse(501, {
      error: "save-push-subscription is unconfigured. Set SUPABASE_SERVICE_ROLE_KEY via `supabase secrets set` to enable storage.",
    });
  }

  // TODO: upsert into public.push_subscriptions.
  //
  //   const supabase = createClient(
  //     Deno.env.get("SUPABASE_URL")!,
  //     serviceRoleKey,
  //     { auth: { persistSession: false } }
  //   );
  //   const { error } = await supabase
  //     .from("push_subscriptions")
  //     .upsert({
  //       endpoint: parsed.subscription.endpoint,
  //       subscription: parsed.subscription,
  //       user_id: /* decode from Authorization JWT if present */ null,
  //     }, { onConflict: "endpoint" });
  //   if (error) return jsonResponse(500, { error: error.message });

  return jsonResponse(200, {
    ok: true,
    stub: true,
    endpoint: parsed.subscription.endpoint,
    note: "Scaffold only — row not yet persisted. See TODO in index.ts.",
  });
});
