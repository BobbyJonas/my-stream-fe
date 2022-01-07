module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    "@nuxtjs",
    "plugin:@typescript-eslint/recommended",
    "plugin:nuxt/recommended",
    "plugin:prettier/recommended",
  ],
  globals: {
    $nuxt: true,
  },
  parserOptions: {
    ecmaVersion: 12,
    parser: "@typescript-eslint/parser",
    sourceType: "module",
  },
  rules: {
    "prettier/prettier": 1,
  },
};
