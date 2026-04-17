/**
 * Real User Monitoring via the `web-vitals` library.
 *
 * Subscribes to the Core Web Vitals (CLS, LCP, INP, FCP, TTFB) and forwards
 * each reported metric to the analytics pipeline as a `web_vital` event.
 *
 * Instrumentation must never break the app — all subscriptions are wrapped
 * in a try/catch and errors are logged to the console only.
 */
import { onCLS, onLCP, onINP, onFCP, onTTFB } from 'web-vitals';
import { trackEvent } from './analytics';

function handleMetric(metric) {
  trackEvent('web_vital', {
    name: metric.name,          // 'CLS' | 'LCP' | 'INP' | 'FCP' | 'TTFB'
    value: Math.round(metric.value),
    rating: metric.rating,      // 'good' | 'needs-improvement' | 'poor'
    id: metric.id,
    navigationType: metric.navigationType,
  });
}

export function initWebVitals() {
  try {
    onCLS(handleMetric);
    onLCP(handleMetric);
    onINP(handleMetric);
    onFCP(handleMetric);
    onTTFB(handleMetric);
  } catch (err) {
    // Never let instrumentation break the app
    console.warn('web-vitals init failed:', err);
  }
}
