import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { applyStripeGrant, getStripeSku } from "../_shared/stripeFulfillment.js";

const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function verifyStripeSignature(payload: string, header: string, secret: string): Promise<boolean> {
  const parts = Object.fromEntries(header.split(",").map((part) => {
    const index = part.indexOf("=");
    return [part.slice(0, index), part.slice(index + 1)];
  }));
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${payload}`),
  );
  const expected = [...new Uint8Array(mac)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return timingSafeEqual(expected, signature);
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!WEBHOOK_SECRET) return json({ error: "Purchases unavailable" }, 503);

  const payload = await req.text();
  const signature = req.headers.get("stripe-signature") || "";
  const valid = await verifyStripeSignature(payload, signature, WEBHOOK_SECRET);
  if (!valid) return json({ error: "Invalid signature" }, 400);

  let event: {
    type?: string;
    data?: { object?: Record<string, unknown> };
  };
  try {
    event = JSON.parse(payload);
  } catch {
    return json({ error: "Invalid payload" }, 400);
  }

  if (event.type !== "checkout.session.completed") {
    return json({ received: true, ignored: event.type || "unknown" });
  }

  const session = event.data?.object || {};
  const sessionId = String(session.id || "");
  const skuId = String((session.metadata as { sku?: string } | undefined)?.sku || "");
  const userId = String(
    (session.metadata as { user_id?: string } | undefined)?.user_id
      || session.client_reference_id
      || "",
  );
  const sku = getStripeSku(skuId);
  const amountTotal = Number(session.amount_total);
  const paid = session.payment_status === "paid";

  if (!sessionId || !sku || !userId || !paid || amountTotal !== sku.unitAmount) {
    return json({ received: true, ignored: "not a fulfilled shop payment" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!supabaseUrl || !serviceKey) return json({ error: "Server is missing Supabase credentials" }, 500);

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: row, error: readError } = await admin
    .from("player_progress")
    .select("shop, stripe_entitlements, display_name, avatar")
    .eq("user_id", userId)
    .maybeSingle();
  if (readError) return json({ error: "Could not read progress" }, 500);

  const granted = applyStripeGrant({
    shop: row?.shop || {},
    stripeEntitlements: row?.stripe_entitlements || { battlePass: false, grants: [] },
  }, { sessionId, skuId });

  if (!granted.ok) return json({ error: granted.reason }, 400);
  if (granted.duplicate) return json({ received: true, duplicate: true });

  const { error: writeError } = await admin.rpc("grant_stripe_entitlement", {
    p_user_id: userId,
    p_entitlements: granted.record.stripeEntitlements,
    p_shop: granted.record.shop,
    p_display_name: row?.display_name || "Player",
    p_avatar: row?.avatar || "🎯",
  });
  if (writeError) return json({ error: "Could not grant entitlement" }, 500);

  return json({ received: true, sku: skuId });
});
