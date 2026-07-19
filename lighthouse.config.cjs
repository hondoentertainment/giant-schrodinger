module.exports = {
  ci: {
    collect: {
      // Serve the Vite preview so the /giant-schrodinger/ base path resolves
      // (staticDistDir alone serves dist at /, which 404s the Pages URL).
      startServerCommand: 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
      startServerReadyPattern: '4173',
      url: ['http://127.0.0.1:4173/giant-schrodinger/'],
      numberOfRuns: 3,
    },
    assert: {
      // no-pwa: keep recommended perf/a11y/SEO gates without installability noise.
      preset: 'lighthouse:no-pwa',
      assertions: {
        'categories:performance': ['error', { minScore: 0.85 }],
        'categories:accessibility': ['error', { minScore: 0.90 }],
        'categories:best-practices': ['error', { minScore: 0.90 }],
        'first-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 3500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        // Not meaningful against a local Vite preview / SPA first paint.
        'uses-http2': 'off',
        'unused-javascript': 'off',
        'unused-css-rules': 'off',
        'render-blocking-resources': 'off',
        'uses-long-cache-ttl': 'off',
        'is-on-https': 'off',
        'csp-xss': 'off',
        'total-byte-weight': 'off',
        'valid-source-maps': 'off',
        'bootup-time': 'off',
        'dom-size': 'off',
        'mainthread-work-breakdown': 'off',
        'server-response-time': 'off',
        // Track via product UX work; not a release-blocker for preview CI.
        'tap-targets': 'warn',
      },
    },
  },
};
