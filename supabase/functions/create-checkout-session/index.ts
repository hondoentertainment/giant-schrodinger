import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import {
  buildCorsHeaders,
  getAllowedOrigins,
  getRateLimitKey,
  isRateLimited,
  jsonResponse,
} from "../_shared/edgeSecurity.ts";
import { getStripeSku } from "../_shared/stripeFulfillment.js";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";

function safeReturnUrl(candidate: string): string {
  const fallback = (Deno.env.get("APP_URL") || "https://giant-schrodinger.vercel.app").replace(/\/$/, "");
  try {
    const url = new URL(candidate);
    const origin = url.origin.replace(/\/$/, "");
    if (getAllowedOrigins().includes(origin)) {
      return `${origin}${url.pathname}`;
    }
  } catch {
    // Fall through to the configured app origin.
  }
  return fallback;
}

function encodeForm(fields: Record<string, string>): string {
  return Object.entries(fields)
    .map(([key, value]) => {
      // Stripe replaces {CHECKOUT_SESSION_ID} only when the braces are not percent-encoded.
      const encoded = encodeURIComponent(value).replace(/%7B/gi, "{").replace(/%7D/gi, "}");
      return `${encodeURIComponent(key)}=${encoded}`;
    })
    .join("&");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }
  if (req.method !== "POST") {
    return jsonResponse(req, { error: "Method not allowed" }, 405);
  }
  if (!STRIPE_SECRET_KEY) {
    return jsonResponse(req, { error: "Purchases unavailable" }, 503);
  }

  const rateKey = getRateLimitKey(req);
  if (isRateLimited(rateKey, 10, 60 * 60 * 1000)) {
    return jsonResponse(req, { error: "Too many checkout attempts. Try again later." }, 429);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const authHeader = req.headers.get("Authorization") || "";
  if (!supabaseUrl || !anonKey || !authHeader.toLowerCase().startsWith("bearer ")) {
    return jsonResponse(req, { error: "Sign in to purchase." }, 401);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  const user = userData?.user;
  if (userError || !user) {
    return jsonResponse(req, { error: "Sign in to purchase." }, 401);
  }

  let body: { sku?: string; returnUrl?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse(req, { error: "Invalid JSON" }, 400);
  }

  const sku = getStripeSku(String(body.sku || ""));
  if (!sku) return jsonResponse(req, { error: "Unknown item." }, 400);

  const returnUrl = safeReturnUrl(String(body.returnUrl || ""));
  const successUrl = `${returnUrl}?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${returnUrl}?checkout=cancel`;

  const form = encodeForm({
    mode: "payment",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": String(sku.unitAmount),
    "line_items[0][price_data][product_data][name]": sku.label,
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: user.id,
    "metadata[user_id]": user.id,
    "metadata[sku]": sku.id,
    "payment_intent_data[metadata][user_id]": user.id,
    "payment_intent_data[metadata][sku]": sku.id,
  });

  const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
  });
  const payload = await stripeResponse.json();
  if (!stripeResponse.ok || !payload?.url) {
    return jsonResponse(req, { error: "Purchases unavailable" }, 502);
  }
  return jsonResponse(req, { url: payload.url, sku: sku.id });
});
