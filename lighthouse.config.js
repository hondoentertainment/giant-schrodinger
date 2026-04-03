/* eslint-env node */
module.exports = {
  ci: {
    collect: { staticDistDir: './dist' },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.85 }],
        'categories:accessibility': ['warn', { minScore: 0.90 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 2500 }],
      },
    },
  },
};
