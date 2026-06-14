module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      url: ['http://localhost/giant-schrodinger/'],
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
        // Ignore rules that require a real backend or are dev-only
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
