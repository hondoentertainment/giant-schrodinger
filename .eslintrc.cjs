module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  plugins: ["react", "react-hooks", "react-refresh"],
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
  ],
  rules: {
    "react/prop-types": "off",
    "react-refresh/only-export-components": "off",
    "react-hooks/exhaustive-deps": "off",
  },
  overrides: [
    {
      files: ["discord-bot/**/*.js", "*.config.js", "playwright.config.js", "lighthouse.config.js"],
      env: { node: true },
    },
    {
      files: ["scripts/**/*.mjs", "scripts/**/*.js"],
      env: { node: true, es2022: true },
      parserOptions: { ecmaVersion: 2022, sourceType: "module" },
    },
    {
      files: ["public/sw.js"],
      env: { serviceworker: true, browser: true },
      globals: { clients: "readonly" },
    },
  ],
  ignorePatterns: ["dist/"],
};
