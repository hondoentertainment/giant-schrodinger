const buckets = new Map();

export function createRateLimiter(name, { maxRequests = 1, windowMs = 5000 } = {}) {
  return {
    canProceed() {
      const now = Date.now();
      const bucket = buckets.get(name) || { requests: [], };
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
    }
  };
}
