module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  parserOptions: {
    ecmaVersion: 13,
    sourceType: 'module',
    ecmaFeatures: {
        jsx: true
    }
  },
  overrides: [
    {
      files: ["*.jsx"],
      parser: "@babel/eslint-parser",
    },
  ],
};
