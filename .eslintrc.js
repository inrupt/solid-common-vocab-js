module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    node: true,
    mocha: true,
  },
  plugins: ["prettier", "@typescript-eslint", "license-header"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
  ],
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly",
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module",
  },
  rules: {
    "prettier/prettier": ["error", {
      // To remove "error  Delete `␍`  prettier/prettier" reports on GitHub.
      "endOfLine": "auto"
    }],
    // There's a TypeScript-specific version of this rule;
    // we disable the generic one, because it thinks imported types are unused
    // when they're not:
    "no-unused-vars": "off",
    "license-header/header": [process.env.CI ? "error" : "warn", "./resources/license-header.js"],
  },
};
