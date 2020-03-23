module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true
  },
  extends: ["standard"],
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly"
  },
  parserOptions: {
    ecmaVersion: 2018
  },
  rules: {
    semi: "off",
    quotes: ["error", "double"],
    "new-cap": "off",
    "space-before-function-paren": "off"
  }
};
