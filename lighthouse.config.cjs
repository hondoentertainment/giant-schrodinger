module.exports = {
  ci: {
    collect: {
      // Serve the Vite preview so the /giant-schrodinger/ base path resolves
      // (staticDistDir alone serves dist at /, which 404s the Pages URL).
      startServerCommand: 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
      startServerReadyPattern: 'Local:',
      url: ['http://127.0.0.1:4173/giant-schrodinger/'],
      numberOfRuns: 3,
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'categories:performance': ['error', { minScore: 0.85 }],
        'categories:accessibility': ['error', { minScore: 0.90 }],
        'categories:best-practices': ['error', { minScore: 0.90 }],
        'first-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 3500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        // Ignore rules that require a real backend or are not meaningful for preview.
        'uses-http2': 'off',
        'unused-javascript': 'off',
        'render-blocking-resources': 'off',
        'uses-long-cache-ttl': 'off',
        'is-on-https': 'off',
        'csp-xss': 'off',
      },
    },
  },
};
