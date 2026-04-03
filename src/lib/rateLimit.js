const buckets = new Map();

/**
 * Create a token-bucket rate limiter.
 * @param {string} name - Unique limiter name
 * @param {object} options
 * @param {number} options.maxRequests - Max requests per window (default 1)
 * @param {number} options.windowMs - Window duration in ms (default 5000)
 * @returns {{ canProceed: () => boolean, getTimeUntilNext: () => number, getStatus: () => object, reset: () => void }}
 */
export function createRateLimiter(name, { maxRequests = 1, windowMs = 5000 } = {}) {
    return {
        canProceed() {
            const now = Date.now();
            const bucket = buckets.get(name) || { requests: [] };
            // Remove expired entries
            bucket.requests = bucket.requests.filter(t => now - t < windowMs);
            if (bucket.requests.length >= maxRequests) {
                return false;
            }
            bucket.requests.push(now);
            buckets.set(name, bucket);
            return true;
        },
        getTimeUntilNext() {
            const bucket = buckets.get(name);
            if (!bucket || bucket.requests.length === 0) return 0;
            const oldest = bucket.requests[0];
            return Math.max(0, windowMs - (Date.now() - oldest));
        },
        getStatus() {
            const now = Date.now();
            const bucket = buckets.get(name) || { requests: [] };
            const active = bucket.requests.filter(t => now - t < windowMs);
            return {
                name,
                remaining: Math.max(0, maxRequests - active.length),
                limit: maxRequests,
                windowMs,
                resetIn: active.length > 0 ? windowMs - (now - active[0]) : 0,
            };
        },
        reset() {
            buckets.delete(name);
        },
    };
}

/**
 * Server-side rate limit response handler.
 * Parses standard rate limit headers from API responses.
 * @param {Response} response - Fetch response object
 * @returns {{ limited: boolean, retryAfter: number }}
 */
export function parseRateLimitHeaders(response) {
    const retryAfter = response.headers?.get('retry-after');
    const remaining = response.headers?.get('x-ratelimit-remaining');
    return {
        limited: response.status === 429 || remaining === '0',
        retryAfter: retryAfter ? parseInt(retryAfter, 10) * 1000 : 5000,
    };
}

/**
 * Create a rate limiter specifically for API calls with exponential backoff.
 * @param {string} name - Limiter name
 * @param {object} options
 * @param {number} options.maxPerMinute - Max requests per minute (default 10)
 * @returns {object} Rate limiter with canProceed and backoff support
 */
export function createAPIRateLimiter(name, { maxPerMinute = 10 } = {}) {
    const limiter = createRateLimiter(`api_${name}`, {
        maxRequests: maxPerMinute,
        windowMs: 60000,
    });
    let backoffUntil = 0;

    return {
        canProceed() {
            if (Date.now() < backoffUntil) return false;
            return limiter.canProceed();
        },
        getTimeUntilNext() {
            const backoffRemaining = Math.max(0, backoffUntil - Date.now());
            return Math.max(backoffRemaining, limiter.getTimeUntilNext());
        },
        applyBackoff(retryAfterMs = 5000) {
            backoffUntil = Date.now() + retryAfterMs;
        },
        getStatus() {
            return {
                ...limiter.getStatus(),
                backoffUntil: backoffUntil > Date.now() ? backoffUntil : null,
            };
        },
        reset() {
            backoffUntil = 0;
            limiter.reset();
        },
    };
}
