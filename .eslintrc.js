module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: "eslint:recommended",
  ignorePatterns: ["plugins/external"],
  parserOptions: {
    ecmaVersion: 13,
    sourceType: "module",
  },
  rules: {
    "no-var": 1,
    "prefer-const": 1,
  },
  globals: {
    L: "readonly",
    $: "readonly",
  },
};
