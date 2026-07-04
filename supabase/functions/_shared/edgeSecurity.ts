/**
 * Shared production security helpers for Supabase Edge Functions.
 */

const DEFAULT_ORIGINS = [
  "https://giant-schrodinger.vercel.app",
  "https://hondoentertainment.github.io",
  "http://localhost:5173",
  "http://localhost:4173",
];

export function getAllowedOrigins(): string[] {
  const appUrl = (Deno.env.get("APP_URL") || "").replace(/\/$/, "");
  const extras = (Deno.env.get("ALLOWED_ORIGINS") || "")
    .split(",")
    .map((value) => value.trim().replace(/\/$/, ""))
    .filter(Boolean);
  return [...new Set([...DEFAULT_ORIGINS, appUrl, ...extras].filter(Boolean))];
}

export function resolveCorsOrigin(request: Request): string {
  const origin = request.headers.get("origin");
  const allowed = getAllowedOrigins();
  if (origin && allowed.includes(origin.replace(/\/$/, ""))) {
    return origin;
  }
  return allowed[0] || "*";
}

export function buildCorsHeaders(request: Request): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": resolveCorsOrigin(request),
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
    "Vary": "Origin",
  };
}

export function jsonResponse(
  request: Request,
  body: unknown,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...buildCorsHeaders(request),
    },
  });
}

export function getRateLimitKey(request: Request): string {
  const authHeader = request.headers.get("authorization") || "";
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const ip = forwarded.split(",")[0]?.trim() || "anonymous";
  if (authHeader.startsWith("Bearer ") && authHeader.length > 20) {
    return authHeader.slice(0, 96);
  }
  return ip.slice(0, 64) || "anonymous";
}

const rateLimitMap = new Map<string, number[]>();

export function isRateLimited(
  key: string,
  maxRequests: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(key) || [];
  const recent = timestamps.filter((timestamp) => now - timestamp < windowMs);
  if (recent.length >= maxRequests) {
    rateLimitMap.set(key, recent);
    return true;
  }
  recent.push(now);
  rateLimitMap.set(key, recent);
  return false;
}

export function sanitizeText(value: unknown, maxLength: number): string {
  return String(value || "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .trim()
    .slice(0, maxLength);
}

export const LIMITS = {
  submission: 500,
  concept: 120,
  reportReason: 240,
  reportContentId: 120,
} as const;
